export const UNKNOWN_APARTMENT_NAME = '아파트명 확인 필요'

const GENERIC_NAMES = new Set(['', '아파트 경매물건', UNKNOWN_APARTMENT_NAME])
const BUILDING_MARKER = /(아파트|빌라|맨션|하이츠|팰리스|타운|캐슬|시티|파크|뷰|자이|래미안|푸르지오|아이파크|힐스테이트|더샵|센트럴)/i
const INVALID_NAVER_BUILDING = /(행정복지센터|주민센터|학교|유치원|학원|상가|시장|마트|병원|의원|교회|성당|사찰|파출소|경찰서|소방서|주차장)/

export const cleanApartmentName = (value) => String(value ?? '')
  .replace(/<br\s*\/?\s*>/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()

export function isUsableApartmentName(value) {
  const name = cleanApartmentName(value)
  return !GENERIC_NAMES.has(name)
    && name.length >= 2
    && name.length <= 60
    && !/^(아파트|공동주택|집합건물|주상복합아파트)$/.test(name)
}

export function isUsableNaverBuildingName(value) {
  const name = cleanApartmentName(value)
  return isUsableApartmentName(name) && !INVALID_NAVER_BUILDING.test(name)
}

function decodeCourtText(value) {
  let text = cleanApartmentName(value)
  for (let pass = 0; pass < 2; pass += 1) {
    text = text
      .replace(/&amp;/gi, '&')
      .replace(/&apos;|&#39;/gi, "'")
      .replace(/&quot;|&#34;/gi, '"')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
  }
  return text
}

function normalizeCandidate(value) {
  return decodeCourtText(value)
    .replace(/^[\s'"‘’“”()]+|[\s'"‘’“”().,]+$/g, '')
    .replace(/\s+(?:제?\d+\s*(?:동|층|호).*)$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isExplicitCandidate(value) {
  const name = normalizeCandidate(value)
  return isUsableApartmentName(name)
    && !/(소재|인근|위치|이용중|건부지|용도|주위환경|명칭이 없)/.test(name)
}

function extractReferenceAddress(value) {
  const text = decodeCourtText(value)
  for (const match of text.matchAll(/\(([^()]{2,60})\)/g)) {
    const candidate = normalizeCandidate(match[1].split(',').at(-1))
    if (BUILDING_MARKER.test(candidate) && isExplicitCandidate(candidate)) return candidate
  }
  return null
}

function extractExplicitName(value) {
  const text = decodeCourtText(value)
  const quotedPatterns = [
    /현장에는\s*['"‘’“”]([^'"‘’“”]{2,60})['"‘’“”]로\s*명칭/,
    /현칭(?:은|이)?\s*['"‘’“”]([^'"‘’“”]{2,60})['"‘’“”]/,
  ]
  for (const pattern of quotedPatterns) {
    const candidate = normalizeCandidate(text.match(pattern)?.[1])
    if (isExplicitCandidate(candidate)) return candidate
  }
  const unquoted = text.match(/현칭(?:은|이)?\s*([0-9A-Za-z가-힣][0-9A-Za-z가-힣\s-]{1,50}?)(?=\s*(?:제?\d+\s*층|\d+\s*호|임(?:\.|\[|$)|로서|단위세대))/)
  const candidate = normalizeCandidate(unquoted?.[1])
  if (isExplicitCandidate(candidate)) return candidate
  return extractReferenceAddress(text)
}

export function extractApartmentNameFromListRow(row) {
  const candidate = cleanApartmentName(row?.buldNm)
  return isUsableApartmentName(candidate) ? candidate : null
}

export function extractApartmentNameFromDetail(detail) {
  const result = detail?.dma_result ?? detail ?? {}
  const objectRows = Array.isArray(result.gdsDspslObjctLst) ? result.gdsDspslObjctLst : []
  for (const row of objectRows) {
    const candidate = extractReferenceAddress(row?.rdnmRefcAddr)
    if (candidate) return { name: candidate, field: 'gdsDspslObjctLst[].rdnmRefcAddr' }
  }
  const info = result.dspslGdsDxdyInfo ?? {}
  for (const field of ['gdsSpcfcRmk', 'dspslGdsRmk']) {
    const candidate = extractExplicitName(info[field])
    if (candidate) return { name: candidate, field: `dspslGdsDxdyInfo.${field}` }
  }
  const appraisalRows = Array.isArray(result.aeeWevlMnpntLst) ? result.aeeWevlMnpntLst : []
  for (const row of appraisalRows) {
    const candidate = extractExplicitName(row?.aeeWevlMnpntCtt)
    if (candidate) return { name: candidate, field: 'aeeWevlMnpntLst[].aeeWevlMnpntCtt' }
  }
  return null
}

export function extractApartmentNameFromAddress(address) {
  const reference = extractReferenceAddress(address)
  if (reference) return reference
  const text = decodeCourtText(address)
  const match = text.match(/\d+(?:-\d+)?[,\s]+([0-9A-Za-z가-힣][0-9A-Za-z가-힣\s-]{1,50}?)(?=\s+제?\d+\s*(?:동|층|호))/)
  const candidate = normalizeCandidate(match?.[1])
  return BUILDING_MARKER.test(candidate) && isExplicitCandidate(candidate) ? candidate : null
}

export function resolveApartmentName({ listName, detail, previousName, naverBuildingName, address }) {
  const fromList = cleanApartmentName(listName)
  if (isUsableApartmentName(fromList)) return { name: fromList, source: 'buldNm' }
  const fromDetail = extractApartmentNameFromDetail(detail)
  if (fromDetail) return { name: fromDetail.name, source: fromDetail.field }
  const previous = cleanApartmentName(previousName)
  if (isUsableApartmentName(previous)) return { name: previous, source: 'previousState' }
  const naver = cleanApartmentName(naverBuildingName)
  if (isUsableNaverBuildingName(naver)) return { name: naver, source: 'NAVER_GEOCODING_BUILDING_NAME' }
  const fromAddress = extractApartmentNameFromAddress(address)
  if (fromAddress) return { name: fromAddress, source: 'address' }
  return { name: UNKNOWN_APARTMENT_NAME, source: 'unavailable' }
}
