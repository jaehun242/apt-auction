import { restoreApartmentNames } from './apartment-name-source.mjs'
import { PATHS } from './config.mjs'
import { geocodeItems } from './geocode.mjs'
import { readJson, writeJsonAtomic } from './io.mjs'

const progress = (message) => console.log(`[auction-name] ${message}`)
const clientId = process.env.NAVER_MAP_CLIENT_ID?.trim()
const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET?.trim()

if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('아파트명 NAVER 보강은 GitHub Actions에서만 실행합니다.')
if (!clientId || !clientSecret) throw new Error('NAVER Geocoding 인증값이 없습니다.')

const publicData = await readJson(PATHS.publicData, { schemaVersion: 1, metadata: {}, items: [] })
const previousState = await readJson(PATHS.state, { schemaVersion: 1, items: {} })
const geocodeCache = await readJson(PATHS.geocodeCache, {})
const documentCache = await readJson(PATHS.documentCache, { schemaVersion: 1, items: {} })

const geocoded = await geocodeItems(publicData.items, geocodeCache, {
  clientId, clientSecret, previousItems: previousState.items, onProgress: progress,
})
const named = await restoreApartmentNames(geocoded.items, previousState, documentCache, { onProgress: progress })
const namesById = new Map(named.items.map((item) => [item.id, item.apartmentName]))
const stateItems = Object.fromEntries(Object.entries(previousState.items ?? {}).map(([id, item]) => [
  id, namesById.has(id) ? { ...item, apartmentName: namesById.get(id) } : item,
]))
const enrichedAt = new Date().toISOString()
const metadata = {
  ...publicData.metadata,
  apartmentNameEnrichedAt: enrichedAt,
  geocoding: {
    ...(publicData.metadata?.geocoding ?? {}),
    nameFallbackRequested: geocoded.requested,
    nameFallbackFailed: geocoded.failed,
  },
  apartmentNames: named.stats,
}

await writeJsonAtomic(PATHS.publicData, { ...publicData, metadata, items: named.items })
await writeJsonAtomic(PATHS.state, { ...previousState, items: stateItems })
await writeJsonAtomic(PATHS.geocodeCache, geocoded.cache)
await writeJsonAtomic(PATHS.documentCache, named.cache)
progress(`완료: NAVER API ${geocoded.requested}회, BUILDING_NAME 복원 ${named.stats.naverRecovered}건, 확인 필요 ${named.stats.unresolved}건`)
