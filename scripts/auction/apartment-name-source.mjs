import { createHash } from 'node:crypto'
import { COURT } from './config.mjs'
import { isUsableApartmentName, resolveApartmentName, UNKNOWN_APARTMENT_NAME } from './apartment-name.mjs'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const fingerprint = (item) => createHash('sha256').update([
  item.courtOfficeCode, item.caseNumber, item.itemNumber, item.address,
].join('|')).digest('hex').slice(0, 20)

function collectCookies(headers) {
  const values = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [headers.get('set-cookie')].filter(Boolean)
  return values.map((value) => value.split(';', 1)[0]).join('; ')
}

async function createSession() {
  const response = await fetch(`${COURT.origin}${COURT.indexPath}`, {
    headers: { 'user-agent': COURT.userAgent, accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow', signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`법원 세션 생성 실패: HTTP ${response.status}`)
  await response.text()
  return collectCookies(response.headers)
}

async function fetchDetail(cookie, item) {
  const response = await fetch(`${COURT.origin}/pgj/pgj15B/selectAuctnCsSrchRslt.on`, {
    method: 'POST', signal: AbortSignal.timeout(30_000),
    headers: {
      'user-agent': COURT.userAgent, accept: 'application/json, text/plain, */*',
      'content-type': 'application/json;charset=UTF-8', origin: COURT.origin,
      referer: `${COURT.origin}${COURT.indexPath}`, ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ dma_srchGdsDtlSrch: {
      cortOfcCd: item.courtOfficeCode, csNo: item.caseNumber, dspslGdsSeq: item.itemNumber,
      pgmId: 'PGJ151M01', srchInfo: '',
    } }),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 180)}`)
  const payload = JSON.parse(text)
  if (payload?.status !== 200 || !payload?.data?.dma_result) throw new Error(`상세 응답 형식 오류: ${text.slice(0, 180)}`)
  if (payload.data.ipcheck !== true) throw new Error('법원 로봇 탐지 응답으로 아파트명 수집 중단')
  return payload.data.dma_result
}

export async function restoreApartmentNames(items, previousState, cache = {}, { onProgress = () => {} } = {}) {
  const nextCache = { schemaVersion: cache.schemaVersion ?? 1, items: { ...(cache.items ?? {}) } }
  const output = []
  let session = null
  let fetched = 0
  let reused = 0
  let failed = 0
  const initialGeneric = items.filter((item) => !isUsableApartmentName(item.apartmentName)).length

  for (const item of items) {
    if (isUsableApartmentName(item.apartmentName)) {
      output.push(item)
      continue
    }
    const itemFingerprint = fingerprint(item)
    const cached = nextCache.items[item.id]
    const previousName = previousState.items?.[item.id]?.apartmentName
    if (cached?.apartmentNameFingerprint === itemFingerprint && cached.apartmentName) {
      const resolved = resolveApartmentName({ detail: null, previousName: cached.apartmentName, address: item.address })
      output.push({ ...item, apartmentName: resolved.name })
      reused += 1
      continue
    }
    if (isUsableApartmentName(previousName)) {
      const resolved = resolveApartmentName({ previousName, address: item.address })
      nextCache.items[item.id] = {
        ...(cached ?? {}), apartmentNameFingerprint: itemFingerprint,
        apartmentName: resolved.name, apartmentNameSource: resolved.source,
        apartmentNameCheckedAt: new Date().toISOString(),
      }
      output.push({ ...item, apartmentName: resolved.name })
      reused += 1
      continue
    }
    try {
      if (!session) session = await createSession()
      const detail = await fetchDetail(session, item)
      const resolved = resolveApartmentName({ detail, previousName, address: item.address })
      nextCache.items[item.id] = {
        ...(cached ?? {}), apartmentNameFingerprint: itemFingerprint,
        apartmentName: resolved.name, apartmentNameSource: resolved.source,
        apartmentNameCheckedAt: new Date().toISOString(),
      }
      output.push({ ...item, apartmentName: resolved.name })
      fetched += 1
    } catch (error) {
      const resolved = resolveApartmentName({ previousName, address: item.address })
      output.push({ ...item, apartmentName: resolved.name })
      failed += 1
      onProgress(`아파트명 복원 실패: ${item.caseNumber} 물건 ${item.itemNumber} - ${String(error?.message ?? error)}`)
    }
    onProgress(`아파트명 복원 ${fetched + reused + failed}/${initialGeneric}: ${item.caseNumber} 물건 ${item.itemNumber}`)
    await sleep(COURT.requestDelayMs)
  }

  return {
    items: output,
    cache: nextCache,
    stats: {
      initialGeneric, fetched, reused, failed,
      recovered: output.filter((item) => isUsableApartmentName(item.apartmentName)).length
        - items.filter((item) => isUsableApartmentName(item.apartmentName)).length,
      unresolved: output.filter((item) => item.apartmentName === UNKNOWN_APARTMENT_NAME).length,
    },
  }
}
