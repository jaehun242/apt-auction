import { describe, expect, it } from 'vitest'
import { assertSafeReplacement, mergeWithState } from './diff.mjs'
import { normalizeCourtRows } from './normalize.mjs'

const raw = {
  _requestedCity: '서울', boCd: 'B1', saNo: '20260130000001', maemulSer: '1', mokGbncd: '03',
  lclsUtilCd: '20000', mclsUtilCd: '20100', sclsUtilCd: '20104', dspslUsgNm: '아파트',
  daepyoSidoCd: '11', maeGiil: '20260910', gamevalAmt: '500000000', minmaePrice: '400000000', yuchalCnt: '1',
  srnSaNo: '2026타경1', jiwonNm: '서울중앙지방법원', printSt: '서울특별시 강남구 테스트로 1 3층301호',
  hjguSigu: '강남구', buldNm: '테스트아파트', buldList: '3층301호', pjbBuldList: '84.12㎡',
  mulJinYn: 'Y', jinstatCd: 'A', mulStatcd: '01', maeAmt: '0',
}

describe('auction collection pipeline', () => {
  it('keeps only exact apartment groups and normalizes required fields', () => {
    const result = normalizeCourtRows([raw, { ...raw, maemulSer: '2', sclsUtilCd: '20103' }], { collectedAt: '2026-09-02T00:00:00.000Z', today: '2026-09-02' })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ city: '서울', caseNumber: '2026타경1', propertyType: '아파트', exclusiveAreaM2: 84.12, normalizedStatus: 'UPCOMING' })
  })
  it('marks bootstrap items and only records failure on a later transition', () => {
    const item = normalizeCourtRows([raw], { collectedAt: '2026-09-02T00:00:00.000Z', today: '2026-09-02' }).items[0]
    const first = mergeWithState([item], { schemaVersion: 1, lastSuccessfulCollectedAt: null, items: {} }, '2026-09-02T00:00:00.000Z')
    expect(first.items[0].isBootstrapItem).toBe(true)
    expect(first.items[0].failedAt).toBeNull()
    const changed = mergeWithState([{ ...item, failedCount: 2 }], first.state, '2026-09-03T00:00:00.000Z')
    expect(changed.items[0].failedAt).toBe('2026-09-03T00:00:00.000Z')
    expect(changed.items[0].history.at(-1).type).toBe('FAILED')
  })
  it('blocks zero and drops of 50 percent or more', () => {
    expect(() => assertSafeReplacement(10, 0)).toThrow()
    expect(() => assertSafeReplacement(10, 4)).toThrow()
    expect(() => assertSafeReplacement(10, 5)).toThrow()
    expect(() => assertSafeReplacement(10, 6)).not.toThrow()
  })
})
