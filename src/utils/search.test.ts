import { describe, expect, it } from 'vitest'
import { matchesAuctionSearch, normalizeSearchText } from './search'

const items = ['684', '5600', '5635', '5652', '5775'].map((number) => ({
  apartmentName: '오륙도 에스케이뷰 아파트',
  address: `부산광역시 남구 용호동 944 오륙도 에스케이뷰 아파트 ${number}호`,
  caseNumber: `2025타경${number}`,
}))

describe('auction search normalization', () => {
  it.each(['오륙도 SK뷰', '오륙도sk뷰', '오륙도 에스케이뷰', '오륙도에스케이뷰아파트'])('%s finds every Oryukdo SK View item', (query) => {
    expect(items.filter((item) => matchesAuctionSearch(item, query))).toHaveLength(5)
  })

  it.each(['2025타경5600', '2025 타경 5600'])('%s finds the case number', (query) => {
    expect(items.filter((item) => matchesAuctionSearch(item, query)).map((item) => item.caseNumber)).toEqual(['2025타경5600'])
  })

  it('normalizes LG and punctuation aliases without changing stored names', () => {
    expect(normalizeSearchText('LG-메트로 시티 아파트')).toBe(normalizeSearchText('엘지 메트로시티'))
  })
})
