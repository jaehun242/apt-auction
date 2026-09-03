import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractNaverBuildingName, geocodeItems } from './geocode.mjs'
import { resolveApartmentName, UNKNOWN_APARTMENT_NAME } from './apartment-name.mjs'

const unresolved = (id, address) => ({ id, address, caseNumber: '2008타경25092', apartmentName: UNKNOWN_APARTMENT_NAME, latitude: null, longitude: null })
const response = (buildingName = null) => ({
  ok: true,
  json: async () => ({ addresses: [{ x: '127.003', y: '37.599', roadAddress: '서울특별시 성북구 북악산로1라길 48', addressElements: buildingName ? [{ types: ['BUILDING_NAME'], longName: buildingName }] : [] }] }),
})

afterEach(() => vi.unstubAllGlobals())

describe('NAVER BUILDING_NAME fallback', () => {
  it('extracts BUILDING_NAME from the official response shape', () => {
    expect(extractNaverBuildingName({ addressElements: [{ types: ['BUILDING_NAME'], longName: ' 래미안 원베일리 ' }] })).toBe('래미안 원베일리')
  })

  it('uses NAVER only as a fallback and rejects clearly incompatible names', () => {
    expect(resolveApartmentName({ naverBuildingName: '오륙도 SK뷰' }).name).toBe('오륙도 SK뷰')
    expect(resolveApartmentName({ listName: '롯데캐슬', naverBuildingName: '다른 건물' }).name).toBe('롯데캐슬')
    expect(resolveApartmentName({ previousName: '푸르지오', naverBuildingName: '다른 건물' }).name).toBe('푸르지오')
    expect(resolveApartmentName({ naverBuildingName: '정릉동 주민센터' }).name).toBe(UNKNOWN_APARTMENT_NAME)
    expect(resolveApartmentName({ naverBuildingName: null }).name).toBe(UNKNOWN_APARTMENT_NAME)
  })

  it('requests one time and reuses the result for multiple units at the same address', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(response('정릉아파트'))
    vi.stubGlobal('fetch', fetchSpy)
    const items = [
      unresolved('a', '서울특별시 성북구 정릉동 508-123 1층102호'),
      unresolved('b', '서울특별시 성북구 정릉동 508-123 4층402호'),
    ]
    const cache = Object.fromEntries(items.map((item) => [item.address, { status: 'OK', latitude: 37.5, longitude: 127, roadAddress: null }]))
    const result = await geocodeItems(items, cache, { clientId: 'id', clientSecret: 'secret' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.requested).toBe(1)
    expect(result.items.map((item) => item.geocodeBuildingName)).toEqual(['정릉아파트', '정릉아파트'])
    expect(result.cache[items[1].address].buildingName).toBe('정릉아파트')
  })

  it('requeries an unresolved item with coordinate-only cache', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(response('엘시티'))
    vi.stubGlobal('fetch', fetchSpy)
    const item = unresolved('a', '부산광역시 해운대구 중동 1 1층101호')
    const result = await geocodeItems([item], { [item.address]: { status: 'OK', latitude: 35, longitude: 129 } }, { clientId: 'id', clientSecret: 'secret' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.items[0].geocodeBuildingName).toBe('엘시티')
  })

  it('does not requery a normal court name', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const item = { ...unresolved('a', '부산광역시 남구 용호동 944'), apartmentName: '오륙도 에스케이뷰 아파트' }
    await geocodeItems([item], { [item.address]: { status: 'OK', latitude: 35, longitude: 129 } }, { clientId: 'id', clientSecret: 'secret' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
