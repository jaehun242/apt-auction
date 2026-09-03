import { isUsableApartmentName } from './apartment-name.mjs'

const ENDPOINT = 'https://maps.apigw.ntruss.com/map-geocode/v2/geocode'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const cacheKey = (address) => address.replace(/\s+/g, ' ').trim()
export const buildingAddressKey = (address) => cacheKey(address)
  .replace(/,?\s+(?:제?\d+\s*동\s+)?(?:지하\s*)?제?\d+\s*층(?:\s*제?\d+(?:-\d+)?\s*호)?.*$/, '')
  .trim()

export function extractNaverBuildingName(result) {
  const element = result?.addressElements?.find((candidate) => candidate?.types?.includes('BUILDING_NAME'))
  return element?.longName?.trim() || null
}

const hasBuildingNameField = (entry) => entry != null && Object.prototype.hasOwnProperty.call(entry, 'buildingName')

function attachGeocode(item, entry, statusPrefix = 'CACHED') {
  const geocodeBuildingName = entry?.buildingName?.trim() || null
  if (entry?.latitude != null && entry?.longitude != null) {
    return { ...item, latitude: entry.latitude, longitude: entry.longitude, geocodeStatus: statusPrefix, geocodeBuildingName }
  }
  return { ...item, geocodeStatus: `${statusPrefix}_${entry?.status ?? 'FAILED'}`, geocodeBuildingName }
}

export async function geocodeItems(items, cache, { clientId, clientSecret, previousItems = {}, onProgress = () => {} }) {
  const nextCache = { ...cache }
  const enabled = Boolean(clientId && clientSecret)
  const buildingResults = new Map()
  for (const [address, entry] of Object.entries(nextCache)) {
    if (!hasBuildingNameField(entry)) continue
    const key = buildingAddressKey(address)
    const current = buildingResults.get(key)
    if (!current || (!current.buildingName && entry.buildingName)) buildingResults.set(key, entry)
  }
  let requested = 0
  let failed = 0
  const output = []

  for (const item of items) {
    const key = cacheKey(item.address)
    const baseKey = buildingAddressKey(item.address)
    const cached = nextCache[key]
    const previousName = previousItems[item.id]?.apartmentName
    const needsBuildingName = Object.prototype.hasOwnProperty.call(item, 'apartmentName')
      && !isUsableApartmentName(item.apartmentName)
      && !isUsableApartmentName(previousName)

    if (cached && (!needsBuildingName || hasBuildingNameField(cached))) {
      output.push(attachGeocode(item, cached))
      continue
    }
    if (needsBuildingName && buildingResults.has(baseKey)) {
      const shared = buildingResults.get(baseKey)
      const updated = { ...(shared ?? {}), ...(cached ?? {}), buildingName: shared?.buildingName ?? null }
      nextCache[key] = updated
      output.push(attachGeocode(item, updated))
      continue
    }
    if (cached && !enabled) {
      output.push(attachGeocode(item, cached))
      continue
    }
    if (!enabled) {
      output.push({ ...item, geocodeStatus: 'UNAVAILABLE_NO_CREDENTIALS', geocodeBuildingName: null })
      continue
    }
    if (requested > 0) await sleep(120)
    requested += 1
    try {
      const url = new URL(ENDPOINT)
      url.searchParams.set('query', needsBuildingName ? baseKey : item.address)
      const response = await fetch(url, {
        headers: { 'x-ncp-apigw-api-key-id': clientId, 'x-ncp-apigw-api-key': clientSecret, accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json()
      const result = payload.addresses?.[0]
      if (!result) {
        failed += 1
        const updated = cached
          ? { ...cached, buildingName: null, updatedAt: new Date().toISOString() }
          : { status: 'NOT_FOUND', buildingName: null, updatedAt: new Date().toISOString() }
        nextCache[key] = updated
        if (needsBuildingName) buildingResults.set(baseKey, updated)
        output.push(attachGeocode(item, updated, cached ? 'CACHED' : 'NOT_FOUND'))
      } else {
        const latitude = Number(result.y)
        const longitude = Number(result.x)
        const buildingName = extractNaverBuildingName(result)
        const updated = { status: 'OK', latitude, longitude, roadAddress: result.roadAddress || null, buildingName, updatedAt: new Date().toISOString() }
        nextCache[key] = updated
        if (needsBuildingName) buildingResults.set(baseKey, updated)
        output.push(attachGeocode(item, updated, 'OK'))
      }
    } catch (error) {
      failed += 1
      const updated = cached
        ? { ...cached, buildingName: null, updatedAt: new Date().toISOString(), buildingNameError: error instanceof Error ? error.message : String(error) }
        : { status: 'FAILED', buildingName: null, updatedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) }
      nextCache[key] = updated
      if (needsBuildingName) buildingResults.set(baseKey, updated)
      onProgress(`지오코딩 실패(물건 보존): ${item.caseNumber} ${error instanceof Error ? error.message : error}`)
      output.push(attachGeocode(item, updated, 'FAILED'))
    }
  }
  return { items: output, cache: nextCache, enabled, requested, failed }
}
