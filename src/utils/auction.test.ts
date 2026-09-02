import { describe, expect, it } from 'vitest'
import type { AuctionItem } from '../types/auction'
import {
  formatDday,
  getEffectiveAuctionStatus,
  getSeoulDateKey,
  getSeoulWeekBounds,
  getSummaryMetrics,
  isInCurrentSeoulWeekToNow,
  isUpcomingWithinDays,
} from './auction'

const now = new Date('2026-09-01T15:30:00Z') // 2026-09-02 00:30 Asia/Seoul

function makeItem(id: string, overrides: Partial<AuctionItem> = {}): AuctionItem {
  return {
    id, city: '서울', district: '테스트구', apartmentName: '테스트 샘플아파트', address: '샘플 주소',
    caseNumber: `SAMPLE-${id}`, court: '샘플 법원', latitude: 37.5, longitude: 127,
    buildingUnit: null, exclusiveAreaM2: 84, floor: 10, totalFloors: 20,
    appraisalPrice: 1_000_000_000, minimumPrice: 800_000_000, failedCount: 0,
    auctionDate: '2026-09-10', firstSeenAt: '2026-08-20', lastSeenAt: '2026-09-02',
    failedAt: null, statusUpdatedAt: '2026-08-20', history: [], status: 'new',
    recentDealPrice: null, recentDealDate: null,
    rightsAnalysis: { status: 'unavailable', riskLevel: 'unknown', benchmarkRight: null, benchmarkRightDate: null, seniorTenant: null, juniorTenant: null, survivingRights: null, assumedAmount: null, notes: null },
    occupancyAnalysis: { occupant: null, tenantOpposability: null, evictionRisk: 'unknown', notes: null },
    additionalCosts: { managementFeeStatus: 'unknown', managementFeeAmount: null, notes: null },
    documents: { saleSpecificationUrl: null, statusReportUrl: null, appraisalReportUrl: null, courtUrl: null },
    isSample: true,
    ...overrides,
  }
}

describe('Asia/Seoul 날짜 계산', () => {
  it('사용자 로컬 타임존과 무관하게 한국 날짜와 월요일 기준 주간 범위를 구한다', () => {
    expect(getSeoulDateKey(now)).toBe('2026-09-02')
    expect(getSeoulWeekBounds(now)).toEqual({ start: '2026-08-31', end: '2026-09-06', today: '2026-09-02' })
    expect(isInCurrentSeoulWeekToNow('2026-08-31', now)).toBe(true)
    expect(isInCurrentSeoulWeekToNow('2026-08-30', now)).toBe(false)
  })

  it('오늘, D-1, D-7, D-8과 지난 입찰일을 정확히 구분한다', () => {
    expect(formatDday('2026-09-02', now)).toBe('D-Day')
    expect(formatDday('2026-09-03', now)).toBe('D-1')
    expect(formatDday('2026-09-09', now)).toBe('D-7')
    expect(isUpcomingWithinDays('2026-09-09', 7, now)).toBe(true)
    expect(isUpcomingWithinDays('2026-09-10', 7, now)).toBe(false)
    expect(formatDday('2026-09-01', now)).toBe('D+1')
  })
})

describe('경매 요약 지표', () => {
  it('진행중, 이번 주 신규·유찰, 7일 이내 입찰을 이벤트 날짜로 계산한다', () => {
    const items = [
      makeItem('today', { auctionDate: '2026-09-02', firstSeenAt: '2026-08-31', failedAt: '2026-09-01', failedCount: 1 }),
      makeItem('tomorrow', { auctionDate: '2026-09-03', firstSeenAt: '2026-08-20', failedAt: '2026-08-20', failedCount: 2 }),
      makeItem('d7', { city: '부산', auctionDate: '2026-09-09', firstSeenAt: '2026-09-02' }),
      makeItem('d8', { city: '부산', auctionDate: '2026-09-10', failedAt: '2026-08-31', failedCount: 1, status: 'failed' }),
      makeItem('past', { auctionDate: '2026-09-01', status: 'closed', firstSeenAt: '2026-08-15', failedAt: '2026-08-20', failedCount: 1 }),
    ]
    expect(getSummaryMetrics(items, now)).toEqual({ seoul: 2, busan: 2, newThisWeek: 2, failedThisWeek: 2, upcoming: 3 })
  })

  it('D-8은 입찰임박이 아니고 지난 물건은 종료로 표시한다', () => {
    expect(getEffectiveAuctionStatus(makeItem('d8', { auctionDate: '2026-09-10', status: 'failed' }), now)).toBe('failed')
    expect(getEffectiveAuctionStatus(makeItem('past', { auctionDate: '2026-09-01', status: 'urgent' }), now)).toBe('closed')
  })
})
