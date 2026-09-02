import { collectCourtRows } from './court-source.mjs'
import { assertSafeReplacement, mergeWithState } from './diff.mjs'
import { geocodeItems } from './geocode.mjs'
import { readJson, writeJsonAtomic } from './io.mjs'
import { normalizeCourtRows } from './normalize.mjs'
import { COLLECTION_POLICY_VERSION, COURT, DROP_GUARD_RATIO, PATHS } from './config.mjs'

const progress = (message) => console.log(`[auction] ${message}`)
const collectedAt = new Date().toISOString()
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const geocodingAllowed = process.env.GITHUB_ACTIONS === 'true'

try {
  const previousState = await readJson(PATHS.state, { schemaVersion: 1, collectionPolicyVersion: null, lastSuccessfulCollectedAt: null, items: {} })
  const geocodeCache = await readJson(PATHS.geocodeCache, {})
  const source = await collectCourtRows({ onProgress: progress })
  const normalized = normalizeCourtRows(source.rows, { collectedAt, today })
  const previousActiveCount = Object.values(previousState.items ?? {}).filter((item) => !item.removedAt).length
  assertSafeReplacement(previousActiveCount, normalized.items.length, DROP_GUARD_RATIO)

  const geocoded = await geocodeItems(normalized.items, geocodeCache, {
    clientId: geocodingAllowed ? process.env.NAVER_MAP_CLIENT_ID?.trim() : '',
    clientSecret: geocodingAllowed ? process.env.NAVER_MAP_CLIENT_SECRET?.trim() : '',
    onProgress: progress,
  })
  const merged = mergeWithState(geocoded.items, previousState, collectedAt, { collectionPolicyVersion: COLLECTION_POLICY_VERSION })
  const items = merged.items.sort((a, b) => a.auctionDate.localeCompare(b.auctionDate) || a.id.localeCompare(b.id))
  const metadata = {
    collectedAt,
    source: { name: '대한민국 법원경매정보', url: COURT.sourceUrl },
    status: 'NORMAL', total: items.length,
    seoul: items.filter((item) => item.city === '서울').length,
    busan: items.filter((item) => item.city === '부산').length,
    sourceWindow: { from: source.startDate, to: source.endDate },
    sourceSegments: source.windows,
    collectionPolicyVersion: COLLECTION_POLICY_VERSION,
    geocoding: { runnerOnly: true, enabled: geocoded.enabled, located: items.filter((item) => item.latitude != null && item.longitude != null).length, requested: geocoded.requested, failed: geocoded.failed },
    bootstrap: merged.isBootstrap,
    backfill: merged.isBackfill,
    reviewRequiredCount: normalized.reviewRequired.length,
  }
  await writeJsonAtomic(PATHS.publicData, { schemaVersion: 1, metadata, items })
  await writeJsonAtomic(PATHS.state, merged.state)
  await writeJsonAtomic(PATHS.geocodeCache, geocoded.cache)
  progress(`완료: 총 ${metadata.total}건 (서울 ${metadata.seoul}, 부산 ${metadata.busan}), 좌표 ${metadata.geocoding.located}건`)
  if (normalized.reviewRequired.length) progress(`검토 제외 ${normalized.reviewRequired.length}건`)
} catch (error) {
  console.error(`[auction] 실패: ${error instanceof Error ? error.stack ?? error.message : error}`)
  process.exitCode = 1
}
