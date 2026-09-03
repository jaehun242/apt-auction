import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const card = readFileSync(new URL('../../src/components/AuctionCard.tsx', import.meta.url), 'utf8')
const detail = readFileSync(new URL('../../src/components/DetailModal.tsx', import.meta.url), 'utf8')

describe('1차 자동분석 UI 계약', () => {
  it('카드는 분석 가능 여부에 따라 배지를 구분하고 근거를 제공한다', () => {
    expect(card).toContain("'1차 자동분석' : '분석 미제공'")
    expect(card).toContain('분석 근거 보기')
    expect(card).toContain('확정판단으로 사용할 수 없습니다')
  })

  it('상세화면은 실제 구조화 필드와 필수 면책문구를 표시한다', () => {
    for (const label of ['최선순위 설정일자', '점유 형태', '임차인 전입', '확정일', '임차보증금', '배당요구', '점유조사 결과', '권리위험', '명도위험', '인수예상', '분석 근거']) expect(detail).toContain(label)
    expect(detail).toContain('실제 입찰 전 등기사항전부증명서, 매각물건명세서, 현황조사서 및 최신 사건기록을 직접 확인해야 합니다.')
  })

  it('문서 직접 URL과 0원 확정 표현을 만들지 않는다', () => {
    expect(card).not.toContain('인수금액 0원')
    expect(detail).not.toContain('선순위 임차인 확정')
  })
})

