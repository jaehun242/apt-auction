import { APARTMENT_USAGE } from './config.mjs'
import { extractApartmentNameFromListRow, UNKNOWN_APARTMENT_NAME } from './apartment-name.mjs'

const UNKNOWN_RIGHTS = {
  status: 'unavailable', riskLevel: 'unknown', benchmarkRight: null, benchmarkRightDate: null,
  seniorTenant: null, juniorTenant: null, survivingRights: null, assumedAmount: null,
  notes: '법원 원문·등기사항을 직접 확인해야 합니다.',
}
const UNKNOWN_OCCUPANCY = {
  occupant: null, tenantOpposability: null, evictionRisk: 'unknown',
  notes: '현황조사서와 전입세대 열람 등 추가 확인이 필요합니다.',
}
const UNKNOWN_COSTS = {
  managementFeeStatus: 'unknown', managementFeeAmount: null,
  notes: '체납관리비 등 추가 비용은 관리사무소 등에 확인해야 합니다.',
}
const NO_DOCUMENT_LINKS = {
  saleSpecificationUrl: null, statusReportUrl: null, appraisalReportUrl: null, courtUrl: null,
}

const clean = (value) => String(value ?? '').replace(/<br\s*\/?\s*>/gi, ' ').replace(/\s+/g, ' ').trim()
const numberOrNull = (value) => value === '' || value == null || !Number.isFinite(Number(value)) ? null : Number(value)
const isoDate = (value) => /^\d{8}$/.test(String(value ?? ''))
  ? `${String(value).slice(0, 4)}-${String(value).slice(4, 6)}-${String(value).slice(6, 8)}`
  : null

function isExactApartmentRow(row) {
  return String(row.lclsUtilCd) === APARTMENT_USAGE.large
    && String(row.mclsUtilCd) === APARTMENT_USAGE.medium
    && String(row.sclsUtilCd) === APARTMENT_USAGE.small
    && clean(row.dspslUsgNm) === APARTMENT_USAGE.label
}

function chooseRepresentative(rows) {
  return rows.find((row) => String(row.mokGbncd) === '03' && clean(row.buldList))
    ?? rows.find((row) => String(row.mokGbncd) === '03')
    ?? null
}

function parseArea(row) {
  const matches = [...`${row.pjbBuldList ?? ''} ${row.convAddr ?? ''}`.matchAll(/([\d,.]+)\s*㎡/g)]
  return matches.length ? numberOrNull(matches.at(-1)[1].replaceAll(',', '')) : null
}

function parseFloor(row) {
  const match = clean(row.buldList).match(/(?:지하\s*)?(\d+)층/)
  return match ? Number(match[1]) : null
}

function normalizeStatus(row, auctionDate, today) {
  if (Number(row.maeAmt) > 0) return 'SOLD'
  if (String(row.mulJinYn) !== 'Y' || !auctionDate) return 'UNKNOWN'
  if (auctionDate > today) return 'UPCOMING'
  if (auctionDate === today) return 'ACTIVE'
  return 'UNKNOWN'
}

export function normalizeCourtRows(rows, { collectedAt, today }) {
  const groups = new Map()
  const reviewRequired = []
  for (const row of rows) {
    if (!isExactApartmentRow(row)) continue
    const key = `${row.boCd}:${row.saNo}:${row.maemulSer}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }

  const items = []
  for (const [id, groupRows] of groups) {
    const row = chooseRepresentative(groupRows)
    if (!row) {
      reviewRequired.push({ id, reason: '아파트 코드 그룹에 집합건물 대표 행이 없음' })
      continue
    }
    const city = row._requestedCity
    const expectedCode = city === '서울' ? '11' : city === '부산' ? '26' : ''
    const auctionDate = isoDate(row.maeGiil)
    const appraisalPrice = numberOrNull(row.gamevalAmt)
    const minimumPrice = numberOrNull(row.minmaePrice)
    const failedCount = numberOrNull(row.yuchalCnt)
    const caseNumber = clean(row.srnSaNo)
    const court = clean(row.jiwonNm)
    const address = clean(row.printSt)
    if (!expectedCode || String(row.daepyoSidoCd) !== expectedCode || !auctionDate || appraisalPrice === null || minimumPrice === null || failedCount === null || !caseNumber || !court || !address) {
      reviewRequired.push({ id, reason: '필수 필드 또는 요청 지역 일치 검증 실패' })
      continue
    }
    const normalizedStatus = normalizeStatus(row, auctionDate, today)
    items.push({
      id, city, district: clean(row.hjguSigu) || '구 확인 필요',
      apartmentName: extractApartmentNameFromListRow(row) ?? UNKNOWN_APARTMENT_NAME, address, caseNumber, court,
      courtOfficeCode: clean(row.boCd), itemNumber: clean(row.maemulSer), propertyType: '아파트',
      classificationStatus: 'VERIFIED_COURT_CODE', latitude: null, longitude: null, geocodeStatus: 'PENDING',
      buildingUnit: clean(row.buldList) || null, exclusiveAreaM2: parseArea(row), floor: parseFloor(row), totalFloors: null,
      appraisalPrice, minimumPrice, failedCount, auctionDate,
      firstSeenAt: collectedAt, lastSeenAt: collectedAt, failedAt: null, statusUpdatedAt: collectedAt, history: [],
      normalizedStatus,
      sourceStatus: { progressCode: clean(row.jinstatCd), itemStatusCode: clean(row.mulStatcd), progressing: clean(row.mulJinYn) },
      status: ['SOLD', 'CANCELLED', 'WITHDRAWN'].includes(normalizedStatus) ? 'closed' : failedCount > 0 ? 'failed' : 'new',
      recentDealPrice: null, recentDealDate: null,
      rightsAnalysis: { ...UNKNOWN_RIGHTS }, occupancyAnalysis: { ...UNKNOWN_OCCUPANCY }, additionalCosts: { ...UNKNOWN_COSTS },
      documents: { ...NO_DOCUMENT_LINKS }, documentsAvailability: 'UNVERIFIED', isBootstrapItem: false, isSample: false,
      source: { name: '대한민국 법원경매정보', url: 'https://www.courtauction.go.kr/pgj/index.on' },
    })
  }
  return { items, reviewRequired }
}
