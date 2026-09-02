import { describe, expect, it, vi } from 'vitest'
import { geocodeItems } from './geocode.mjs'

describe('geocode cache', () => {
  it('does not request an address that already has a cached failure result', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const item = { address: '부산광역시 남구 용호동 944', caseNumber: '2025타경684', latitude: null, longitude: null }
    const result = await geocodeItems([item], { [item.address]: { status: 'NOT_FOUND', updatedAt: '2026-09-02T00:00:00.000Z' } }, { clientId: 'id', clientSecret: 'secret' })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.requested).toBe(0)
    expect(result.items[0].geocodeStatus).toBe('CACHED_NOT_FOUND')
    vi.unstubAllGlobals()
  })
})
