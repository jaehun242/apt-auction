import { describe, expect, it } from 'vitest'
import {
  extractApartmentNameFromAddress,
  extractApartmentNameFromDetail,
  extractApartmentNameFromListRow,
  resolveApartmentName,
  UNKNOWN_APARTMENT_NAME,
} from './apartment-name.mjs'
import { mergeWithState } from './diff.mjs'

describe('apartment name restoration', () => {
  it('uses a normal buldNm unchanged', () => {
    expect(extractApartmentNameFromListRow({ buldNm: '오륙도 에스케이뷰 아파트' })).toBe('오륙도 에스케이뷰 아파트')
  })

  it('uses an explicit building name from the real detail field', () => {
    const detail = { dspslGdsDxdyInfo: { gdsSpcfcRmk: '부동산의 공부상 표시에는 건물명칭이 없으나 현장에는 \'아남하이츠4\'로 명칭이 표기되어 있음.' } }
    expect(extractApartmentNameFromDetail(detail)).toEqual({ name: '아남하이츠4', field: 'dspslGdsDxdyInfo.gdsSpcfcRmk' })
  })

  it('preserves a previous normal name when the new name is missing', () => {
    expect(resolveApartmentName({ previousName: '래미안퍼스티지', address: '서울특별시 성북구 정릉동 1-2 1층102호' })).toEqual({ name: '래미안퍼스티지', source: 'previousState' })
  })

  it('uses the explicit reference-address apartment name', () => {
    const detail = { gdsDspslObjctLst: [{ rdnmRefcAddr: '(개금동,고원아파트)' }] }
    expect(resolveApartmentName({ detail })).toEqual({ name: '고원아파트', source: 'gdsDspslObjctLst[].rdnmRefcAddr' })
    expect(extractApartmentNameFromAddress('부산광역시 부산진구 엄광로 61 (개금동,고원아파트)')).toBe('고원아파트')
  })

  it('returns the explicit unknown label when no source has a name', () => {
    expect(resolveApartmentName({ address: '서울특별시 성북구 정릉동 508-123 1층102호' }).name).toBe(UNKNOWN_APARTMENT_NAME)
  })

  it('does not overwrite a previous good name with a generic value', () => {
    const base = {
      id: 'court:case:1', apartmentName: '아파트 경매물건', failedCount: 0, auctionDate: '2026-09-10',
      minimumPrice: 100, normalizedStatus: 'UPCOMING', firstSeenAt: '2026-08-01T00:00:00.000Z',
      statusUpdatedAt: '2026-08-01T00:00:00.000Z', history: [],
    }
    const previous = { lastSuccessfulCollectedAt: '2026-09-01T00:00:00.000Z', collectionPolicyVersion: 2, items: { [base.id]: { ...base, apartmentName: '롯데캐슬' } } }
    const merged = mergeWithState([base], previous, '2026-09-03T00:00:00.000Z', { collectionPolicyVersion: 2 })
    expect(merged.items[0].apartmentName).toBe('롯데캐슬')
  })
})
