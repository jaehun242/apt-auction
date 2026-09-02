import { APARTMENT_USAGE, COURT, REGIONS, SOURCE_WINDOW_DAYS } from './config.mjs'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const compactDate = (value) => value.replaceAll('-', '')

function seoulDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}

function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

function collectCookies(headers) {
  const values = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : [headers.get('set-cookie')].filter(Boolean)
  return values.map((value) => value.split(';', 1)[0]).join('; ')
}

async function fetchWithRetry(url, options, attempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) })
      if (response.ok) return response
      const body = await response.text()
      const error = new Error(`법원 응답 오류: HTTP ${response.status} ${body.slice(0, 200)}`)
      if (response.status !== 429 && response.status < 500) throw error
      lastError = error
    } catch (error) {
      lastError = error
    }
    if (attempt < attempts) await sleep(1_000 * attempt)
  }
  throw lastError
}

async function createSession() {
  const response = await fetchWithRetry(`${COURT.origin}${COURT.indexPath}`, {
    headers: { 'user-agent': COURT.userAgent, accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
  })
  return collectCookies(response.headers)
}

function searchBody(regionCode, startDate, endDate, pageNo, totalYn) {
  return {
    dma_pageInfo: {
      pageNo, pageSize: COURT.pageSize, bfPageNo: pageNo > 1 ? pageNo - 1 : '',
      startRowNo: '', totalCnt: '', totalYn, groupTotalCount: '',
    },
    dma_srchGdsDtlSrchInfo: {
      menuNm: '물건상세검색', lafjOrderBy: '', pgmId: 'PGJ151M01', bidDvsCd: '', statNum: 1,
      cortOfcCd: '', jdbnCd: '', cortStDvs: '2', csNo: '', mvprpCsNo: '',
      aeeEvlAmtMin: '', aeeEvlAmtMax: '', lwsDspslPrcMin: '', lwsDspslPrcMax: '',
      mvprpRletDvsCd: '00031R', notifyLoc: 'off', rprsAdongSdCd: regionCode,
      rprsAdongSggCd: '', rprsAdongEmdCd: '', rdnmSdCd: '', rdnmSggCd: '', consonant: '', rdnmNo: '',
      mvprpDspslPlcAdongSdCd: '', mvprpDspslPlcAdongSggCd: '', mvprpDspslPlcAdongEmdCd: '',
      rdDspslPlcAdongSdCd: '', rdDspslPlcAdongSggCd: '', rdDspslPlcConsonant: '', rdDspslPlcAdongEmdCd: '',
      lclDspslGdsLstUsgCd: APARTMENT_USAGE.large,
      mclDspslGdsLstUsgCd: APARTMENT_USAGE.medium,
      sclDspslGdsLstUsgCd: APARTMENT_USAGE.small,
      lwsDspslPrcRateMin: '', lwsDspslPrcRateMax: '', objctArDtsMin: '', objctArDtsMax: '',
      flbdNcntMin: '', flbdNcntMax: '', maeMokmulNm: '', mvprpArtclKnd: '', mvrpDspslPlcTyp: '',
      cortAuctnSrchCondCd: '0004601', bidBgngYmd: compactDate(startDate), bidEndYmd: compactDate(endDate),
      rletDspslSpcCondCd: '', dspslDxdyYmd: '',
    },
  }
}

async function requestPage(cookie, region, startDate, endDate, pageNo) {
  const response = await fetchWithRetry(`${COURT.origin}${COURT.searchPath}`, {
    method: 'POST',
    headers: {
      'user-agent': COURT.userAgent, accept: 'application/json, text/plain, */*',
      'content-type': 'application/json;charset=UTF-8', origin: COURT.origin,
      referer: `${COURT.origin}${COURT.indexPath}`, ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(searchBody(region.courtCode, startDate, endDate, pageNo, pageNo === 1 ? 'Y' : 'N')),
  })
  const payload = await response.json()
  if (payload?.status !== 200 || !payload?.data || !Array.isArray(payload.data.dlt_srchResult)) {
    throw new Error(`법원 검색 응답 형식이 변경되었습니다: ${JSON.stringify(payload).slice(0, 300)}`)
  }
  if (payload.data.ipcheck !== true) {
    throw new Error('법원 사이트 로봇 탐지로 수집이 중단되었습니다. 우회하지 않고 기존 데이터를 유지합니다.')
  }
  return payload.data
}

export async function collectCourtRows({ onProgress = () => {} } = {}) {
  const startDate = seoulDateKey()
  const endDate = addDays(startDate, SOURCE_WINDOW_DAYS)
  const cookie = await createSession()
  const rows = []
  const regionStats = {}

  for (const region of REGIONS) {
    const first = await requestPage(cookie, region, startDate, endDate, 1)
    const totalRows = Number(first.dma_pageInfo?.totalCnt ?? first.dlt_srchResult.length)
    const totalPages = Math.max(1, Math.ceil(totalRows / COURT.pageSize))
    if (totalPages > COURT.maxPagesPerRegion) {
      throw new Error(`${region.city} 결과 페이지가 안전 한도(${COURT.maxPagesPerRegion})를 초과했습니다.`)
    }
    const regionRows = [...first.dlt_srchResult]
    onProgress(`${region.city} 1/${totalPages} 페이지 수집`)
    for (let pageNo = 2; pageNo <= totalPages; pageNo += 1) {
      await sleep(COURT.requestDelayMs)
      const page = await requestPage(cookie, region, startDate, endDate, pageNo)
      regionRows.push(...page.dlt_srchResult)
      onProgress(`${region.city} ${pageNo}/${totalPages} 페이지 수집`)
    }
    rows.push(...regionRows.map((row) => ({ ...row, _requestedCity: region.city })))
    regionStats[region.city] = { reportedRows: totalRows, fetchedRows: regionRows.length }
    await sleep(COURT.requestDelayMs)
  }
  return { rows, startDate, endDate, regionStats }
}
