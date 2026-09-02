import { describe, expect, it } from 'vitest'
import { buildDateWindows } from './court-source.mjs'
import { mergeWithState } from './diff.mjs'
import { normalizeCourtRows } from './normalize.mjs'

const courtRow = (caseNumber, internalNumber, itemNumber, apartmentName = '오륙도 에스케이뷰 아파트') => ({
  _requestedCity: '부산', boCd: 'B000412', saNo: internalNumber, maemulSer: String(itemNumber), mokGbncd: '03',
  lclsUtilCd: '20000', mclsUtilCd: '20100', sclsUtilCd: '20104', dspslUsgNm: '아파트', daepyoSidoCd: '26',
  maeGiil: caseNumber === '2025타경684' ? '20260921' : '20260907', gamevalAmt: '1000000000', minmaePrice: '800000000',
  yuchalCnt: '1', srnSaNo: caseNumber, jiwonNm: '부산동부지원',
  printSt: `부산광역시 남구 용호동 944 ${apartmentName} ${itemNumber}층${itemNumber}호`, hjguSigu: '남구',
  buldNm: apartmentName, buldList: `${itemNumber}층${itemNumber}호`, pjbBuldList: '84.9㎡', mulJinYn: 'Y', jinstatCd: '0002100001', mulStatcd: '01', maeAmt: '0',
})

describe('segmented collection', () => {
  it('covers the 2026-09-21 auction beyond the old 14-day horizon using non-overlapping court-safe windows', () => {
    const windows = buildDateWindows('2026-09-02', 90, 14)
    expect(windows.some(({ from, to }) => from <= '2026-09-21' && to >= '2026-09-21')).toBe(true)
    expect(windows.every(({ from, to }) => (new Date(to) - new Date(from)) / 86_400_000 <= 13)).toBe(true)
    expect(windows.slice(1).every((window, index) => window.from > windows[index].to)).toBe(true)
  })

  it('keeps all five reference cases and separate item numbers', () => {
    const rows = [
      courtRow('2025타경684', '20250130000684', 1), courtRow('2025타경5600', '20250130005600', 1),
      courtRow('2025타경5635', '20250130005635', 1), courtRow('2025타경5652', '20250130005652', 1),
      courtRow('2025타경5652', '20250130005652', 2, '엘지메트로시티'), courtRow('2025타경5775', '20250130005775', 1),
    ]
    const result = normalizeCourtRows(rows, { collectedAt: '2026-09-02T00:00:00.000Z', today: '2026-09-02' })
    expect(new Set(result.items.map((item) => item.caseNumber))).toEqual(new Set(['2025타경684', '2025타경5600', '2025타경5635', '2025타경5652', '2025타경5775']))
    expect(result.items.filter((item) => item.caseNumber === '2025타경5652').map((item) => item.itemNumber).sort()).toEqual(['1', '2'])
  })

  it('marks newly discovered items as backfill when the collection policy expands', () => {
    const item = normalizeCourtRows([courtRow('2025타경684', '20250130000684', 1)], { collectedAt: '2026-09-02T00:00:00.000Z', today: '2026-09-02' }).items[0]
    const previous = { schemaVersion: 1, collectionPolicyVersion: 1, lastSuccessfulCollectedAt: '2026-09-01T00:00:00.000Z', items: {} }
    const merged = mergeWithState([item], previous, '2026-09-02T00:00:00.000Z', { collectionPolicyVersion: 2 })
    expect(merged.isBackfill).toBe(true)
    expect(merged.items[0].isBootstrapItem).toBe(true)
    expect(merged.items[0].history[0].newValue).toContain('backfill')
  })
})
