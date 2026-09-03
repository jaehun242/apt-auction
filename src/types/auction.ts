export type City = '서울' | '부산'
export type AuctionStatus = 'new' | 'failed' | 'urgent' | 'closed'
export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown'
export type AnalysisStatus = 'draft' | 'reviewed' | 'unavailable'
export type AnalysisAvailability = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE'
export type AnalysisConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE'
export type AuctionHistoryType = 'FIRST_SEEN' | 'FAILED' | 'AUCTION_DATE_CHANGED' | 'MINIMUM_PRICE_CHANGED' | 'STATUS_CHANGED' | 'REMOVED'
export type NormalizedAuctionStatus = 'ACTIVE' | 'UPCOMING' | 'FAILED' | 'SOLD' | 'CHANGED' | 'CANCELLED' | 'WITHDRAWN' | 'UNKNOWN'

export interface AuctionHistoryEvent {
  date: string
  type: AuctionHistoryType
  previousValue: string | number | null
  newValue: string | number | null
}

export interface RightsAnalysis {
  status: AnalysisStatus
  riskLevel: RiskLevel
  benchmarkRight: string | null
  benchmarkRightDate: string | null
  seniorTenant: string | null
  juniorTenant: string | null
  survivingRights: string | null
  assumedAmount: number | null
  assumedAmountLabel?: string
  notes: string | null
  reasons?: string[]
  confidence?: AnalysisConfidence
}

export interface OccupancyAnalysis {
  occupant: string | null
  tenantOpposability: string | null
  evictionRisk: RiskLevel
  notes: string | null
  reasons?: string[]
  confidence?: AnalysisConfidence
}

export interface AnalysisTenant {
  role: string
  occupancyPart: string | null
  use: string | null
  occupancyPeriod: string | null
  deposit: string | null
  monthlyRent: string | null
  moveInDate: string | null
  fixedDate: string | null
  distributionRequest: string
  comparison: 'BEFORE' | 'AFTER' | 'SAME_DAY' | 'UNKNOWN'
}

export interface AuctionAnalysisSource {
  checkedAt: string
  sources: {
    detail: 'AVAILABLE' | 'UNAVAILABLE'
    statusReport: 'AVAILABLE' | 'UNAVAILABLE'
    saleSpecification: 'AVAILABLE' | 'UNAVAILABLE'
    appraisalReport: 'AVAILABLE' | 'SESSION_ONLY' | 'UNAVAILABLE'
  }
  benchmarkReference: string | null
  benchmarkDate: string | null
  nonExtinguishedRights: string | null
  specialSaleConditions: string | null
  occupancySummary: string | null
  investigationStatus: string
  tenants: AnalysisTenant[]
}

export interface AdditionalCosts {
  managementFeeStatus: 'confirmed' | 'estimated' | 'unknown'
  managementFeeAmount: number | null
  notes: string | null
}

export interface AuctionDocuments {
  saleSpecificationUrl: string | null
  statusReportUrl: string | null
  appraisalReportUrl: string | null
  courtUrl: string | null
}

export interface AuctionItem {
  id: string
  city: City
  district: string
  apartmentName: string
  address: string
  caseNumber: string
  court: string
  courtOfficeCode?: string
  itemNumber?: string
  latitude: number | null
  longitude: number | null
  buildingUnit: string | null
  exclusiveAreaM2: number | null
  floor: number | null
  totalFloors: number | null
  appraisalPrice: number
  minimumPrice: number
  failedCount: number
  auctionDate: string
  firstSeenAt: string
  lastSeenAt: string
  failedAt: string | null
  statusUpdatedAt: string
  history: AuctionHistoryEvent[]
  normalizedStatus?: NormalizedAuctionStatus
  status: AuctionStatus
  recentDealPrice: number | null
  recentDealDate: string | null
  analysisStatus?: AnalysisAvailability
  analysisConfidence?: AnalysisConfidence
  analysisReasons?: string[]
  assumedAmountLabel?: string
  auctionAnalysisSource?: AuctionAnalysisSource | null
  rightsAnalysis: RightsAnalysis
  occupancyAnalysis: OccupancyAnalysis
  additionalCosts: AdditionalCosts
  documents: AuctionDocuments
  documentsAvailability?: string
  isBootstrapItem?: boolean
  isSample: boolean
}

export interface AuctionDataMetadata {
  collectedAt: string
  source: { name: string; url: string }
  status: 'NORMAL' | 'DELAYED' | 'FAILURE'
  total: number
  seoul: number
  busan: number
  geocoding?: { enabled: boolean; located: number; requested: number; failed: number }
  documentAnalysis?: { fetched: number; reused: number; failed: number; available: number; partial: number; unavailable: number }
  bootstrap?: boolean
}

export interface AuctionDataFile {
  schemaVersion: number
  metadata: AuctionDataMetadata
  items: AuctionItem[]
}

export interface AuctionFilters {
  query: string
  city: 'all' | City
  status: 'all' | AuctionStatus
  failedCount: 'all' | '0' | '1' | '2' | '3+'
  sort: 'auctionDate' | 'minimumPrice' | 'discountRate' | 'failedCount' | 'newest'
}
