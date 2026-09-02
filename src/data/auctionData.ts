import { sampleAuctions } from './sampleAuctions'

// 샘플 데이터의 3회 이상 유찰 필터를 검증하기 위한 변형입니다.
// 실데이터 연결 시 이 파일 대신 API/JSON 데이터 소스로 교체합니다.
export const auctionData = sampleAuctions.map((item) => item.id === 'sample-busan-003'
  ? { ...item, minimumPrice: 363_520_000, failedCount: 3 }
  : item)
