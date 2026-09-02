import { describe, expect, it } from 'vitest'
import { getDaysUntil, getSummaryMetrics, isInCurrentSeoulWeekToNow } from '../utils/auction'
import { sampleAuctions } from './sampleAuctions'

const byId = (id: string) => sampleAuctions.find((item) => item.id === id)!

describe('대시보드 샘플 데이터 시나리오', () => {
  it('이번 주 신규와 이번 주 유찰을 현재 횟수가 아닌 이벤트 날짜로 구분한다', () => {
    expect(isInCurrentSeoulWeekToNow(byId('sample-seoul-001').firstSeenAt)).toBe(true)
    expect(isInCurrentSeoulWeekToNow(byId('sample-seoul-002').firstSeenAt)).toBe(false)
    expect(isInCurrentSeoulWeekToNow(byId('sample-seoul-002').failedAt)).toBe(true)
    expect(byId('sample-seoul-004').failedCount).toBeGreaterThan(0)
    expect(isInCurrentSeoulWeekToNow(byId('sample-seoul-004').failedAt)).toBe(false)
  })

  it('오늘, D-1, D-7, D-8과 이미 지난 물건을 포함한다', () => {
    expect(getDaysUntil(byId('sample-seoul-001').auctionDate)).toBe(0)
    expect(getDaysUntil(byId('sample-seoul-004').auctionDate)).toBe(1)
    expect(getDaysUntil(byId('sample-busan-001').auctionDate)).toBe(7)
    expect(getDaysUntil(byId('sample-busan-004').auctionDate)).toBe(8)
    expect(getDaysUntil(byId('sample-seoul-005').auctionDate)).toBe(-2)
  })

  it('화면에 표시할 요약 숫자를 정의대로 계산한다', () => {
    expect(getSummaryMetrics(sampleAuctions)).toEqual({
      seoul: 4,
      busan: 4,
      newThisWeek: 4,
      failedThisWeek: 4,
      upcoming: 3,
    })
  })
})
