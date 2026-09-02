export const COURT = {
  origin: 'https://www.courtauction.go.kr',
  indexPath: '/pgj/index.on',
  searchPath: '/pgj/pgjsearch/searchControllerMain.on',
  sourceUrl: 'https://www.courtauction.go.kr/pgj/index.on',
  pageSize: 50,
  maxPagesPerWindow: 20,
  requestDelayMs: 450,
  userAgent: 'Mozilla/5.0 (compatible; apt-auction/1.0; +https://github.com/jaehun242/apt-auction)',
}

export const REGIONS = [
  { city: '서울', courtCode: '11' },
  { city: '부산', courtCode: '26' },
]

export const APARTMENT_USAGE = { large: '20000', medium: '20100', small: '20104', label: '아파트' }
export const PATHS = {
  publicData: 'public/data/auctions.json',
  state: 'data/auction-state.json',
  geocodeCache: 'data/geocode-cache.json',
}
export const SOURCE_HORIZON_DAYS = 90
export const SOURCE_SEGMENT_DAYS = 14
export const COLLECTION_POLICY_VERSION = 2
export const DROP_GUARD_RATIO = 0.5
