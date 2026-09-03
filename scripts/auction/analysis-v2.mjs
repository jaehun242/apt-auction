const UNKNOWN = /(?:미상|불명|확인\s*필요|알\s*수\s*없|폐문|부재)/
const DANGER = /(?:인수|존속|유치권|가처분|법정지상권|대항력|특별매각조건)/
const clean = (value) => String(value ?? '').replace(/<br\s*\/?\s*>/gi, ' ').replace(/\s+/g, ' ').trim()
const usable = (value) => { const text = clean(value); return text && !UNKNOWN.test(text) ? text : null }

export function parseCourtDate(value) {
  const match = clean(value).match(/((?:19|20)\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})/)
  return match ? `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}` : null
}

const OCCUPANCY = {
  '01': '소유자 점유', '02': '임차인 점유', '03': '제3자 점유', '04': '소유자·임차인·제3자 점유',
  '05': '소유자·임차인 점유', '06': '임차인·제3자 점유', '07': '소유자·제3자 점유', '09': '점유관계 불명',
  '10': '기타 점유', '11': '소유자·임차인·기타 점유', '12': '소유자·기타 점유', '13': '임차인·기타 점유',
}

const compare = (moveIn, benchmark) => !moveIn || !benchmark ? 'UNKNOWN' : moveIn < benchmark ? 'BEFORE' : moveIn > benchmark ? 'AFTER' : 'SAME_DAY'
const tenantsFrom = (rows, benchmark) => rows.map((row) => {
  const moveInDate = parseCourtDate(row.mvinDtlCtt)
  return {
    role: '임차인 또는 점유관계인', occupancyPart: usable(row.lesPartCtt), use: usable(row.lesUsgDts),
    occupancyPeriod: usable(row.gdsPossCtt), deposit: usable(row.lesDposDts), monthlyRent: usable(row.mmrntAmtDts),
    moveInDate, fixedDate: parseCourtDate(row.rgstryCrtcpCfmtnCtt), distributionRequest: '확인 필요',
    comparison: compare(moveInDate, benchmark),
  }
})

function unavailable(message) {
  return {
    analysisStatus: 'UNAVAILABLE', analysisConfidence: 'UNAVAILABLE', analysisReasons: [message], assumedAmountLabel: '자동 산정 불가',
    rightsAnalysis: { status: 'unavailable', riskLevel: 'unknown', benchmarkRight: null, benchmarkRightDate: null, seniorTenant: null, juniorTenant: null, survivingRights: null, assumedAmount: null, notes: message, reasons: [message], confidence: 'UNAVAILABLE', assumedAmountLabel: '자동 산정 불가' },
    occupancyAnalysis: { occupant: null, tenantOpposability: null, evictionRisk: 'unknown', notes: message, reasons: [message], confidence: 'UNAVAILABLE' },
    auctionAnalysisSource: null,
  }
}

export function analyzeCourtDocuments({ detail, statusReport, checkedAt }) {
  if (!detail?.available && !statusReport?.available) return unavailable('법원 상세정보와 현황조사 자료를 확보하지 못했습니다.')
  const d = detail?.data ?? {}
  const s = statusReport?.data ?? {}
  const benchmarkReference = usable(d.firstPriorityReference)
  const benchmarkDate = parseCourtDate(benchmarkReference)
  const nonExtinguishedRights = usable(d.nonExtinguishedRights)
  const specialConditions = usable(d.specialSaleConditions)
  const possessions = Array.isArray(s.possessions) ? s.possessions : []
  const occupancyCode = possessions.find((row) => row.occupancyCode)?.occupancyCode ?? null
  const occupancySummary = OCCUPANCY[occupancyCode] ?? null
  const investigationText = clean([s.investigationSummary, ...possessions.map((row) => row.notes)].filter(Boolean).join(' '))
  const tenants = tenantsFrom(Array.isArray(s.tenants) ? s.tenants : [], benchmarkDate)
  const earlier = tenants.some((tenant) => tenant.comparison === 'BEFORE')
  const later = tenants.some((tenant) => tenant.comparison === 'AFTER' || tenant.comparison === 'SAME_DAY')
  const dateMissing = tenants.some((tenant) => !tenant.moveInDate)
  const danger = DANGER.test(clean([nonExtinguishedRights, specialConditions].filter(Boolean).join(' ')))
  const occupancyUnknown = !statusReport?.available || !occupancySummary || occupancyCode === '09' || UNKNOWN.test(investigationText)

  const reasons = [benchmarkDate ? `최선순위 설정일자 ${benchmarkDate} 확인` : '최선순위 설정일자 확인 필요']
  if (tenants.length) {
    reasons.push(`현황조사 임차인·점유관계인 ${tenants.length}명 확인`)
    const dated = tenants.find((tenant) => tenant.moveInDate)
    if (dated) reasons.push(`임차인 전입일 ${dated.moveInDate} 확인`)
  } else if (statusReport?.available) reasons.push('현황조사 임차인 명세에 별도 기재 없음')
  if (earlier) reasons.push('최선순위 설정일자 이전 전입 기재 발견')
  else if (later) reasons.push('최선순위 설정일자 이후 또는 같은 날 전입 기재')
  if (nonExtinguishedRights) reasons.push('매각 후 존속권리 관련 기재 있음')
  else if (detail?.available) reasons.push('상세정보에 매각 후 존속권리 관련 별도 기재 없음')
  if (specialConditions) reasons.push('특별매각조건 또는 물건 비고 기재 있음')

  const rightsRisk = earlier || danger ? 'high' : !benchmarkDate || !statusReport?.available || dateMissing ? 'unknown' : tenants.length ? 'medium' : occupancyUnknown ? 'unknown' : 'low'
  const evictionRisk = earlier || (danger && tenants.length) ? 'high' : occupancyUnknown ? 'unknown' : tenants.length || occupancyCode !== '01' ? 'medium' : 'low'
  const complete = Boolean(detail?.available && statusReport?.available && benchmarkDate && !occupancyUnknown && !dateMissing)
  const analysisStatus = complete ? 'AVAILABLE' : 'PARTIAL'
  const confidence = complete ? 'MEDIUM' : 'LOW'
  const assumedAmountLabel = earlier || (danger && tenants.length)
    ? '임차보증금 인수 가능성 있음 — 추가 확인 필요'
    : complete && !danger ? '추가 인수금액 현재 자료에서 확인되지 않음' : '자동 산정 불가'
  const firstEarlier = tenants.find((tenant) => tenant.comparison === 'BEFORE')
  const firstLater = tenants.find((tenant) => tenant.comparison === 'AFTER' || tenant.comparison === 'SAME_DAY')
  const reasonList = reasons.slice(0, 5)

  return {
    analysisStatus, analysisConfidence: confidence, analysisReasons: reasonList, assumedAmountLabel,
    rightsAnalysis: {
      status: 'reviewed', riskLevel: rightsRisk, benchmarkRight: benchmarkReference ? '최선순위 설정일자 참고정보' : null, benchmarkRightDate: benchmarkDate,
      seniorTenant: firstEarlier ? '최선순위 설정일자 이전 전입 기재 — 대항력/인수 가능성 추가 확인 필요' : null,
      juniorTenant: firstLater ? '최선순위 설정일자 이후 또는 같은 날 전입 기재' : null,
      survivingRights: nonExtinguishedRights ?? (detail?.available ? '현재 확보한 법원 상세정보에 별도 기재 없음' : null), assumedAmount: null,
      notes: rightsRisk === 'low' ? '현재 확보한 법원 자료에서 주요 인수 위험요소가 발견되지 않음' : '등기부 및 최신 법원 원문 추가 확인 필요',
      reasons: reasonList, confidence, assumedAmountLabel,
    },
    occupancyAnalysis: {
      occupant: occupancySummary, tenantOpposability: earlier ? '가능성 있음 — 추가 확인 필요' : tenants.length ? '전입일 비교 결과 추가 확인 필요' : '현재 자료에 별도 임차인 기재 없음',
      evictionRisk, notes: occupancyUnknown ? '현황조사 자료만으로 점유관계를 확정할 수 없습니다.' : '현황조사서 기반 1차 참고정보입니다.',
      reasons: reasonList.filter((reason) => /현황조사|전입/.test(reason)), confidence,
    },
    auctionAnalysisSource: {
      checkedAt,
      sources: { detail: detail?.available ? 'AVAILABLE' : 'UNAVAILABLE', statusReport: statusReport?.available ? 'AVAILABLE' : 'UNAVAILABLE', saleSpecification: 'UNAVAILABLE', appraisalReport: d.appraisalStatus ?? 'UNAVAILABLE' },
      benchmarkReference, benchmarkDate, nonExtinguishedRights, specialSaleConditions: specialConditions,
      occupancySummary, investigationStatus: occupancyUnknown ? '확인 필요' : '확인됨', tenants,
    },
  }
}

