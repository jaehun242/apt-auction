import { createHash } from 'node:crypto'
import { analyzeCourtDocuments } from './analysis.mjs'
import { COURT } from './config.mjs'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const compact = (value) => String(value ?? '').replace(/[^0-9A-Za-z가-힣]/g, '').toLowerCase()

function collectCookies(headers) {
  const values = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [headers.get('set-cookie')].filter(Boolean)
  return values.map((value) => value.split(';', 1)[0]).join('; ')
}

async function request(url, options, attempts = 2) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) })
      const text = await response.text()
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 180)}`)
      const payload = JSON.parse(text)
      if (payload?.status !== 200 || !payload?.data) throw new Error(`응답 형식 오류: ${text.slice(0, 180)}`)
      if (payload.data.ipcheck !== true) throw new Error('법원 로봇 탐지 응답으로 문서 수집 중단')
      return payload.data
    } catch (error) {
      lastError = error
      if (attempt < attempts) await sleep(1_000 * attempt)
    }
  }
  throw lastError
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

function headers(cookie) {
  return {
    'user-agent': COURT.userAgent,
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/json;charset=UTF-8',
    origin: COURT.origin,
    referer: `${COURT.origin}${COURT.indexPath}`,
    ...(cookie ? { cookie } : {}),
  }
}

const post = (cookie, path, body) => request(`${COURT.origin}${path}`, {
  method: 'POST', headers: headers(cookie), body: JSON.stringify(body),
})

const fingerprint = (item) => createHash('sha256').update([
  item.courtOfficeCode, item.caseNumber, item.itemNumber, item.auctionDate,
  item.minimumPrice, item.failedCount, item.normalizedStatus,
].join('|')).digest('hex').slice(0, 20)

function matchRowsToItem(rows, item, isOnlyItem) {
  const itemAddress = compact(item.address)
  const apartmentName = compact(item.apartmentName)
  const matched = rows.filter((row) => {
    const rowAddress = compact(row.printSt)
    return (rowAddress && (rowAddress === itemAddress || (apartmentName && rowAddress.includes(apartmentName))))
      || (row.bldNm && itemAddress.includes(compact(row.bldNm)))
  })
  if (matched.length || !isOnlyItem) return matched
  return rows
}

function sanitizeStatus(data, item, isOnlyItem) {
  const possessions = matchRowsToItem(Array.isArray(data.dlt_ordTsRlet) ? data.dlt_ordTsRlet : [], item, isOnlyItem)
    .map((row) => ({ occupancyCode: row.auctnPossRltnCd || null, notes: row.gdsPossCtt || row.rletLstRmk || null }))
  const tenants = matchRowsToItem(Array.isArray(data.dlt_ordTsLserLtn) ? data.dlt_ordTsLserLtn : [], item, isOnlyItem)
    .map((row) => ({
      lesPartCtt: row.lesPartCtt || null,
      lesUsgDts: row.lesUsgDts || null,
      gdsPossCtt: row.gdsPossCtt || null,
      lesDposDts: row.lesDposDts || null,
      mmrntAmtDts: row.mmrntAmtDts || null,
      mvinDtlCtt: row.mvinDtlCtt || null,
      rgstryCrtcpCfmtnCtt: row.rgstryCrtcpCfmtnCtt || null,
      lesDtsRmk: row.lesDtsRmk || null,
    }))
  const manager = data.dma_curstExmnMngInf ?? {}
  return {
    available: Boolean(manager.csNo || possessions.length || tenants.length),
    data: {
      investigationDate: manager.exmnDtDts || null,
      investigationSummary: manager.printRltnDts || manager.lstPossRltnDts || null,
      possessions,
      tenants,
      scope: isOnlyItem || possessions.length || tenants.length ? 'ITEM_MATCHED' : 'CASE_ONLY_UNMATCHED',
    },
  }
}

async function fetchDetail(cookie, item) {
  const data = await post(cookie, '/pgj/pgj15B/selectAuctnCsSrchRslt.on', {
    dma_srchGdsDtlSrch: {
      cortOfcCd: item.courtOfficeCode, csNo: item.caseNumber, dspslGdsSeq: item.itemNumber,
      pgmId: 'PGJ151M01', srchInfo: '',
    },
  })
  const result = data.dma_result
  const info = result?.dspslGdsDxdyInfo
  if (!info) throw new Error('사건 상세 응답에 매각물건정보가 없습니다.')
  return {
    available: true,
    data: {
      internalCaseNumber: String(info.csNo ?? ''),
      sourceVersion: [info.dspslGdsSpcfcEcdocId, info.gdsSpcfcWrtYmd, info.dspslDxdyYmd].filter(Boolean).join(':'),
      firstPriorityReference: info.tprtyRnkHypthcStngDts || null,
      nonExtinguishedRights: info.ndstrcRghCtt || null,
      specialSaleConditions: info.gdsSpcfcRmk || info.dspslGdsRmk || null,
      appraisalStatus: result.aeeWevlMnpntLst?.length ? 'AVAILABLE' : 'UNAVAILABLE',
      detailAvailableFields: Object.keys(info).filter((key) => info[key] != null),
    },
  }
}

async function fetchStatusReport(cookie, item, isOnlyItem) {
  const data = await post(cookie, '/pgj/pgj15B/selectCurstExmndc.on', {
    dma_srchCurstExmn: { cortOfcCd: item.courtOfficeCode, csNo: item.caseNumber, auctnInfOriginDvsCd: '2' },
  })
  return sanitizeStatus(data, item, isOnlyItem)
}

function attach(item, entry) {
  return {
    ...item,
    ...entry.analysis,
    documents: { saleSpecificationUrl: null, statusReportUrl: null, appraisalReportUrl: null, courtUrl: null },
    documentsAvailability: entry.analysis.analysisStatus === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'SESSION_ONLY',
  }
}

export async function enrichWithCourtAnalysis(items, cache = {}, { onProgress = () => {}, maxItems = Infinity } = {}) {
  const nextCache = { schemaVersion: 1, items: { ...(cache.items ?? {}) } }
  const countsByCase = items.reduce((map, item) => map.set(item.caseNumber, (map.get(item.caseNumber) ?? 0) + 1), new Map())
  const output = []
  let session = null
  let fetched = 0
  let reused = 0
  let failed = 0

  for (const item of items) {
    const itemFingerprint = fingerprint(item)
    const cached = nextCache.items[item.id]
    if (cached?.itemFingerprint === itemFingerprint && cached.analysis) {
      output.push(attach(item, cached))
      reused += 1
      continue
    }
    if (fetched >= maxItems) {
      output.push(item)
      continue
    }
    if (!session) session = await createSession()
    const checkedAt = new Date().toISOString()
    let detail = { available: false, error: null }
    let statusReport = { available: false, error: null }
    try { detail = await fetchDetail(session, item) } catch (error) { detail = { available: false, error: String(error?.message ?? error) } }
    await sleep(COURT.requestDelayMs)
    try { statusReport = await fetchStatusReport(session, item, countsByCase.get(item.caseNumber) === 1) } catch (error) { statusReport = { available: false, error: String(error?.message ?? error) } }

    const analysis = analyzeCourtDocuments({ detail, statusReport, checkedAt })
    const entry = {
      itemFingerprint, checkedAt, sourceVersion: detail.data?.sourceVersion ?? null,
      documents: {
        detail: { available: detail.available, error: detail.error ?? null },
        statusReport: { available: statusReport.available, error: statusReport.error ?? null },
        saleSpecification: { available: false, reason: '공식 뷰어 발급 요청 오류로 직접 저장 불가' },
        appraisal: { available: false, directUrlAvailable: false, reason: '직접 URL을 저장하지 않음' },
      },
      analysis,
    }
    if (!detail.available && !statusReport.available && cached?.analysis && cached.analysis.analysisStatus !== 'UNAVAILABLE') {
      output.push(attach(item, cached))
      failed += 1
    } else {
      nextCache.items[item.id] = entry
      output.push(attach(item, entry))
      fetched += 1
      if (analysis.analysisStatus === 'UNAVAILABLE') failed += 1
    }
    onProgress(`원문 분석 ${fetched + reused}/${items.length}: ${item.caseNumber} 물건 ${item.itemNumber}`)
    await sleep(COURT.requestDelayMs)
  }

  return {
    items: output,
    cache: nextCache,
    stats: {
      fetched, reused, failed,
      detailSuccess: Object.values(nextCache.items).filter((entry) => entry.documents?.detail?.available).length,
      statusReportSuccess: Object.values(nextCache.items).filter((entry) => entry.documents?.statusReport?.available).length,
      available: output.filter((item) => item.analysisStatus === 'AVAILABLE').length,
      partial: output.filter((item) => item.analysisStatus === 'PARTIAL').length,
      unavailable: output.filter((item) => !item.analysisStatus || item.analysisStatus === 'UNAVAILABLE').length,
    },
  }
}

