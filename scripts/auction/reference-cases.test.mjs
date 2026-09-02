import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { matchesAuctionSearch } from '../../src/utils/search.ts'

const data = JSON.parse(readFileSync(new URL('../../public/data/auctions.json', import.meta.url), 'utf8'))
const referenceCases = ['2025타경684', '2025타경5600', '2025타경5635', '2025타경5652', '2025타경5775']
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

describe('current Oryukdo SK View collection completeness', () => {
  it.runIf(today <= '2026-09-21')('contains all five court-verified active reference cases', () => {
    expect(new Set(data.items.filter((item) => referenceCases.includes(item.caseNumber)).map((item) => item.caseNumber))).toEqual(new Set(referenceCases))
  })

  it.runIf(today <= '2026-09-21')('returns five Oryukdo SK View cards for the common alias', () => {
    const matches = data.items.filter((item) => matchesAuctionSearch(item, '오륙도 SK뷰'))
    expect(matches).toHaveLength(5)
    expect(new Set(matches.map((item) => item.caseNumber))).toEqual(new Set(referenceCases))
  })

  it.runIf(today <= '2026-09-21')('keeps separate item numbers within the same case', () => {
    expect(data.items.filter((item) => item.caseNumber === '2025타경5652').map((item) => item.itemNumber).sort()).toEqual(['1', '2'])
  })
})
