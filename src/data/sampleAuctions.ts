import type { AuctionItem } from '../types/auction'

const dateFromToday = (days: number) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const unavailableDocuments = {
  saleSpecificationUrl: null,
  statusReportUrl: null,
  appraisalReportUrl: null,
  courtUrl: null,
}

export const sampleAuctions: AuctionItem[] = [
  {
    id: 'sample-seoul-001', city: '서울', district: '서초구', apartmentName: '서초 샘플아파트',
    address: '서울특별시 서초구 반포동 샘플로 101', caseNumber: 'SAMPLE-SEOUL-001', court: '서울중앙지방법원 (샘플)',
    latitude: 37.5048, longitude: 127.0049, buildingUnit: '101동 1203호', exclusiveAreaM2: 84.96, floor: 12, totalFloors: 25,
    appraisalPrice: 2_800_000_000, minimumPrice: 2_240_000_000, failedCount: 1, auctionDate: dateFromToday(3), firstSeenAt: dateFromToday(-2), lastFailedAt: dateFromToday(-1), status: 'urgent',
    recentDealPrice: 2_650_000_000, recentDealDate: dateFromToday(-50),
    rightsAnalysis: { status: 'draft', riskLevel: 'low', benchmarkRight: '근저당권 추정', benchmarkRightDate: null, seniorTenant: '현재 데이터에서 발견되지 않음', juniorTenant: null, survivingRights: '현재 데이터에서 발견되지 않음', assumedAmount: null, notes: '등기사항 및 매각물건명세서 확인 필요' },
    occupancyAnalysis: { occupant: '소유자 점유 추정', tenantOpposability: '확인 필요', evictionRisk: 'medium', notes: '현황조사서 연결 후 재분석 필요' },
    additionalCosts: { managementFeeStatus: 'unknown', managementFeeAmount: null, notes: '체납관리비 확인 필요' }, documents: unavailableDocuments, isSample: true,
  },
  {
    id: 'sample-seoul-002', city: '서울', district: '송파구', apartmentName: '잠실 샘플리버뷰',
    address: '서울특별시 송파구 잠실동 샘플대로 22', caseNumber: 'SAMPLE-SEOUL-002', court: '서울동부지방법원 (샘플)',
    latitude: 37.5147, longitude: 127.1036, buildingUnit: '204동 805호', exclusiveAreaM2: 59.88, floor: 8, totalFloors: 20,
    appraisalPrice: 1_850_000_000, minimumPrice: 1_184_000_000, failedCount: 2, auctionDate: dateFromToday(12), firstSeenAt: dateFromToday(-21), lastFailedAt: dateFromToday(-3), status: 'failed',
    recentDealPrice: 1_720_000_000, recentDealDate: dateFromToday(-85),
    rightsAnalysis: { status: 'draft', riskLevel: 'medium', benchmarkRight: '확인 필요', benchmarkRightDate: null, seniorTenant: '확인 필요', juniorTenant: '확인 필요', survivingRights: '확인 필요', assumedAmount: null, notes: '임차인 현황 원문 대조 필요' },
    occupancyAnalysis: { occupant: '임차인 추정', tenantOpposability: '확인 필요', evictionRisk: 'high', notes: '전입세대 열람 필요' },
    additionalCosts: { managementFeeStatus: 'estimated', managementFeeAmount: 3_200_000, notes: '샘플 추정치이며 관리사무소 확인 필요' }, documents: unavailableDocuments, isSample: true,
  },
  {
    id: 'sample-seoul-003', city: '서울', district: '마포구', apartmentName: '마포 샘플센트럴',
    address: '서울특별시 마포구 아현동 샘플길 45', caseNumber: 'SAMPLE-SEOUL-003', court: '서울서부지방법원 (샘플)',
    latitude: 37.5548, longitude: 126.9565, buildingUnit: '103동 1702호', exclusiveAreaM2: 84.72, floor: 17, totalFloors: 22,
    appraisalPrice: 1_620_000_000, minimumPrice: 1_620_000_000, failedCount: 0, auctionDate: dateFromToday(18), firstSeenAt: dateFromToday(-1), lastFailedAt: null, status: 'new',
    recentDealPrice: 1_580_000_000, recentDealDate: dateFromToday(-32),
    rightsAnalysis: { status: 'unavailable', riskLevel: 'unknown', benchmarkRight: null, benchmarkRightDate: null, seniorTenant: null, juniorTenant: null, survivingRights: null, assumedAmount: null, notes: '실데이터 연결 후 분석' },
    occupancyAnalysis: { occupant: null, tenantOpposability: null, evictionRisk: 'unknown', notes: '확인 필요' },
    additionalCosts: { managementFeeStatus: 'unknown', managementFeeAmount: null, notes: '확인 필요' }, documents: unavailableDocuments, isSample: true,
  },
  {
    id: 'sample-seoul-004', city: '서울', district: '노원구', apartmentName: '노원 샘플그린타운',
    address: '서울특별시 노원구 상계동 샘플로 330', caseNumber: 'SAMPLE-SEOUL-004', court: '서울북부지방법원 (샘플)',
    latitude: 37.6553, longitude: 127.0611, buildingUnit: '307동 404호', exclusiveAreaM2: 49.5, floor: 4, totalFloors: 15,
    appraisalPrice: 620_000_000, minimumPrice: 396_800_000, failedCount: 2, auctionDate: dateFromToday(6), firstSeenAt: dateFromToday(-30), lastFailedAt: dateFromToday(-5), status: 'urgent',
    recentDealPrice: 575_000_000, recentDealDate: dateFromToday(-120),
    rightsAnalysis: { status: 'draft', riskLevel: 'low', benchmarkRight: '근저당권 추정', benchmarkRightDate: null, seniorTenant: '현재 데이터에서 발견되지 않음', juniorTenant: '확인 필요', survivingRights: '현재 데이터에서 발견되지 않음', assumedAmount: null, notes: '원문 확인 필요' },
    occupancyAnalysis: { occupant: '소유자 점유 추정', tenantOpposability: '해당 없음 추정', evictionRisk: 'low', notes: '현황조사서 확인 필요' },
    additionalCosts: { managementFeeStatus: 'unknown', managementFeeAmount: null, notes: '관리사무소 확인 필요' }, documents: unavailableDocuments, isSample: true,
  },
  {
    id: 'sample-seoul-005', city: '서울', district: '강서구', apartmentName: '마곡 샘플포레스트',
    address: '서울특별시 강서구 마곡동 샘플중앙로 18', caseNumber: 'SAMPLE-SEOUL-005', court: '서울남부지방법원 (샘플)',
    latitude: 37.5664, longitude: 126.8269, buildingUnit: '502동 1101호', exclusiveAreaM2: 74.91, floor: 11, totalFloors: 18,
    appraisalPrice: 1_080_000_000, minimumPrice: 864_000_000, failedCount: 1, auctionDate: dateFromToday(25), firstSeenAt: dateFromToday(-15), lastFailedAt: dateFromToday(-8), status: 'failed',
    recentDealPrice: null, recentDealDate: null,
    rightsAnalysis: { status: 'unavailable', riskLevel: 'unknown', benchmarkRight: null, benchmarkRightDate: null, seniorTenant: null, juniorTenant: null, survivingRights: null, assumedAmount: null, notes: '확인 필요' },
    occupancyAnalysis: { occupant: null, tenantOpposability: null, evictionRisk: 'unknown', notes: '확인 필요' },
    additionalCosts: { managementFeeStatus: 'unknown', managementFeeAmount: null, notes: '확인 필요' }, documents: unavailableDocuments, isSample: true,
  },
  {
    id: 'sample-busan-001', city: '부산', district: '해운대구', apartmentName: '해운대 샘플오션',
    address: '부산광역시 해운대구 우동 샘플해변로 77', caseNumber: 'SAMPLE-BUSAN-001', court: '부산지방법원 동부지원 (샘플)',
    latitude: 35.1612, longitude: 129.1622, buildingUnit: '110동 2304호', exclusiveAreaM2: 84.98, floor: 23, totalFloors: 32,
    appraisalPrice: 1_350_000_000, minimumPrice: 864_000_000, failedCount: 2, auctionDate: dateFromToday(4), firstSeenAt: dateFromToday(-24), lastFailedAt: dateFromToday(-2), status: 'urgent',
    recentDealPrice: 1_210_000_000, recentDealDate: dateFromToday(-66),
    rightsAnalysis: { status: 'draft', riskLevel: 'medium', benchmarkRight: '근저당권 추정', benchmarkRightDate: null, seniorTenant: '확인 필요', juniorTenant: '확인 필요', survivingRights: '확인 필요', assumedAmount: null, notes: '배당요구 종기 및 원문 확인 필요' },
    occupancyAnalysis: { occupant: '임차인 추정', tenantOpposability: '확인 필요', evictionRisk: 'medium', notes: '점유 관계 추가 확인 필요' },
    additionalCosts: { managementFeeStatus: 'unknown', managementFeeAmount: null, notes: '확인 필요' }, documents: unavailableDocuments, isSample: true,
  },
  {
    id: 'sample-busan-002', city: '부산', district: '수영구', apartmentName: '광안 샘플브릿지',
    address: '부산광역시 수영구 광안동 샘플광안로 90', caseNumber: 'SAMPLE-BUSAN-002', court: '부산지방법원 동부지원 (샘플)',
    latitude: 35.1532, longitude: 129.1187, buildingUnit: '202동 903호', exclusiveAreaM2: 59.97, floor: 9, totalFloors: 24,
    appraisalPrice: 820_000_000, minimumPrice: 820_000_000, failedCount: 0, auctionDate: dateFromToday(15), firstSeenAt: dateFromToday(-3), lastFailedAt: null, status: 'new',
    recentDealPrice: 790_000_000, recentDealDate: dateFromToday(-43),
    rightsAnalysis: { status: 'unavailable', riskLevel: 'unknown', benchmarkRight: null, benchmarkRightDate: null, seniorTenant: null, juniorTenant: null, survivingRights: null, assumedAmount: null, notes: '실데이터 연결 후 분석' },
    occupancyAnalysis: { occupant: null, tenantOpposability: null, evictionRisk: 'unknown', notes: '확인 필요' },
    additionalCosts: { managementFeeStatus: 'unknown', managementFeeAmount: null, notes: '확인 필요' }, documents: unavailableDocuments, isSample: true,
  },
  {
    id: 'sample-busan-003', city: '부산', district: '동래구', apartmentName: '동래 샘플파크',
    address: '부산광역시 동래구 온천동 샘플온천로 14', caseNumber: 'SAMPLE-BUSAN-003', court: '부산지방법원 (샘플)',
    latitude: 35.2048, longitude: 129.0838, buildingUnit: '104동 602호', exclusiveAreaM2: 84.64, floor: 6, totalFloors: 19,
    appraisalPrice: 710_000_000, minimumPrice: 454_400_000, failedCount: 2, auctionDate: dateFromToday(22), firstSeenAt: dateFromToday(-35), lastFailedAt: dateFromToday(-10), status: 'failed',
    recentDealPrice: 685_000_000, recentDealDate: dateFromToday(-91),
    rightsAnalysis: { status: 'draft', riskLevel: 'high', benchmarkRight: '확인 필요', benchmarkRightDate: null, seniorTenant: '선순위 가능성 추가 확인 필요', juniorTenant: null, survivingRights: '확인 필요', assumedAmount: null, notes: '대항력 및 배당요구 여부 검토 필요' },
    occupancyAnalysis: { occupant: '임차인 추정', tenantOpposability: '가능성 있음 — 확인 필요', evictionRisk: 'high', notes: '명도 협의 가능성 확인 필요' },
    additionalCosts: { managementFeeStatus: 'estimated', managementFeeAmount: 4_800_000, notes: '샘플 추정치' }, documents: unavailableDocuments, isSample: true,
  },
  {
    id: 'sample-busan-004', city: '부산', district: '남구', apartmentName: '용호 샘플힐스',
    address: '부산광역시 남구 용호동 샘플분포로 31', caseNumber: 'SAMPLE-BUSAN-004', court: '부산지방법원 동부지원 (샘플)',
    latitude: 35.1186, longitude: 129.1128, buildingUnit: '401동 1401호', exclusiveAreaM2: 101.92, floor: 14, totalFloors: 28,
    appraisalPrice: 1_120_000_000, minimumPrice: 896_000_000, failedCount: 1, auctionDate: dateFromToday(9), firstSeenAt: dateFromToday(-5), lastFailedAt: dateFromToday(-4), status: 'failed',
    recentDealPrice: 1_035_000_000, recentDealDate: dateFromToday(-58),
    rightsAnalysis: { status: 'draft', riskLevel: 'low', benchmarkRight: '근저당권 추정', benchmarkRightDate: null, seniorTenant: '현재 데이터에서 발견되지 않음', juniorTenant: '확인 필요', survivingRights: '현재 데이터에서 발견되지 않음', assumedAmount: null, notes: '원문 확인 필요' },
    occupancyAnalysis: { occupant: '소유자 점유 추정', tenantOpposability: '해당 없음 추정', evictionRisk: 'low', notes: '확인 필요' },
    additionalCosts: { managementFeeStatus: 'unknown', managementFeeAmount: null, notes: '확인 필요' }, documents: unavailableDocuments, isSample: true,
  },
]
