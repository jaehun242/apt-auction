import { describe, expect, it } from 'vitest'
import { matchesAuctionSearch } from './search'

const item = {
  apartmentName: '아파트명 확인 필요',
  address: '서울특별시 성북구 정릉동 508-123 1층102호',
  caseNumber: '2008타경25092',
}

describe('unknown apartment name search', () => {
  it('still searches by address and case number', () => {
    expect(matchesAuctionSearch(item, '정릉동 508-123')).toBe(true)
    expect(matchesAuctionSearch(item, '2008 타경 25092')).toBe(true)
  })
})
