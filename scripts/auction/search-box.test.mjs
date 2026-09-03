import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const app = readFileSync(new URL('../../src/AuctionApp.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../../src/search-box.css', import.meta.url), 'utf8')

describe('검색창 DOM/CSS 계약', () => {
  it('아이콘과 input을 하나의 search-box 안에 둔다', () => expect(app).toMatch(/<label className="search-box"><Search[^>]*\/><input/))
  it('부모가 완전한 44px 박스와 focus-within 테두리를 소유한다', () => {
    expect(css).toMatch(/\.filter-panel \.search-box\s*\{[^}]*height:\s*44px;/s)
    expect(css).toMatch(/width:\s*100%;/)
    expect(css).toMatch(/padding:\s*0 13px;/)
    expect(css).toMatch(/overflow:\s*hidden;/)
    expect(css).toMatch(/\.search-box:focus-within/)
  })
  it('input은 부모 테두리를 덮지 않는 투명 flex 자식이다', () => {
    const rule = css.match(/\.filter-panel \.search-box input\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(rule).toMatch(/flex:\s*1 1 auto;/)
    expect(rule).toMatch(/min-width:\s*0;/)
    expect(rule).toMatch(/width:\s*auto;/)
    expect(rule).toMatch(/height:\s*100%;/)
    expect(rule).toMatch(/background:\s*transparent;/)
    expect(rule).toMatch(/border:\s*0;/)
  })
})

