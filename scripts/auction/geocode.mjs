const ENDPOINT = 'https://maps.apigw.ntruss.com/map-geocode/v2/geocode'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const cacheKey = (address) => address.replace(/\s+/g, ' ').trim()

export async function geocodeItems(items, cache, { clientId, clientSecret, onProgress = () => {} }) {
  const nextCache = { ...cache }
  const enabled = Boolean(clientId && clientSecret)
  let requested = 0
  let failed = 0
  const output = []

  for (const item of items) {
    const key = cacheKey(item.address)
    const cached = nextCache[key]
    if (cached) {
      if (cached.latitude != null && cached.longitude != null) {
        output.push({ ...item, latitude: cached.latitude, longitude: cached.longitude, geocodeStatus: 'CACHED' })
      } else {
        output.push({ ...item, geocodeStatus: `CACHED_${cached.status ?? 'FAILED'}` })
      }
      continue
    }
    if (!enabled) {
      output.push({ ...item, geocodeStatus: 'UNAVAILABLE_NO_CREDENTIALS' })
      continue
    }
    if (requested > 0) await sleep(120)
    requested += 1
    try {
      const url = new URL(ENDPOINT)
      url.searchParams.set('query', item.address)
      const response = await fetch(url, {
        headers: { 'x-ncp-apigw-api-key-id': clientId, 'x-ncp-apigw-api-key': clientSecret, accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json()
      const result = payload.addresses?.[0]
      if (!result) {
        failed += 1
        nextCache[key] = { status: 'NOT_FOUND', updatedAt: new Date().toISOString() }
        output.push({ ...item, geocodeStatus: 'NOT_FOUND' })
      } else {
        const latitude = Number(result.y)
        const longitude = Number(result.x)
        nextCache[key] = { status: 'OK', latitude, longitude, roadAddress: result.roadAddress || null, updatedAt: new Date().toISOString() }
        output.push({ ...item, latitude, longitude, geocodeStatus: 'OK' })
      }
    } catch (error) {
      failed += 1
      nextCache[key] = { status: 'FAILED', updatedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) }
      onProgress(`지오코딩 실패(물건 보존): ${item.caseNumber} ${error instanceof Error ? error.message : error}`)
      output.push({ ...item, geocodeStatus: 'FAILED' })
    }
  }
  return { items: output, cache: nextCache, enabled, requested, failed }
}
