export type City = '서울' | '부산'
export type AuctionStatus = 'new' | 'failed' | 'urgent' | 'closed'
export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown'
export type AnalysisStatus = 'draft' | 'reviewed' | 'unavailable'
export type AuctionHistoryType = 'FIRST_SEEN' | 'FAILED' | 'DATE_CHANGED' | 'PRICE_CHANGED'

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
  notes: string | null
}

export interface OccupancyAnalysis {
  occupant: string | null
  tenantOpposability: string | null
  evictionRisk: RiskLevel
  notes: string | null
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
  latitude: number
  longitude: number
  buildingUnit: string | null
  exclusiveAreaM2: number
  floor: number
  totalFloors: number
  appraisalPrice: number
  minimumPrice: number
  failedCount: number
  auctionDate: string
  firstSeenAt: string
  lastSeenAt: string
  failedAt: string | null
  statusUpdatedAt: string
  history: AuctionHistoryEvent[]
  status: AuctionStatus
  recentDealPrice: number | null
  recentDealDate: string | null
  rightsAnalysis: RightsAnalysis
  occupancyAnalysis: OccupancyAnalysis
  additionalCosts: AdditionalCosts
  documents: AuctionDocuments
  isSample: boolean
}

export interface AuctionFilters {
  query: string
  city: 'all' | City
  status: 'all' | AuctionStatus
  failedCount: 'all' | '0' | '1' | '2' | '3+'
  sort: 'auctionDate' | 'minimumPrice' | 'discountRate' | 'failedCount' | 'newest'
}
