import { describe, expect, it } from 'vitest'
import type { AuctionItem } from '../types/auction'
import { getSummaryMetrics } from './auction'

function item(id: string, isBootstrapItem: boolean): AuctionItem {
  return {
    id, city: '서울', district: '강남구', apartmentName: '테스트', address: '서울특별시 강남구',
    caseNumber: id, court: '서울중앙지방법원', latitude: null, longitude: null, buildingUnit: null,
    exclusiveAreaM2: null, floor: null, totalFloors: null, appraisalPrice: 100, minimumPrice: 80,
    failedCount: 0, auctionDate: '2026-09-04', firstSeenAt: '2026-09-02T00:00:00.000Z',
    lastSeenAt: '2026-09-02T00:00:00.000Z', failedAt: null, statusUpdatedAt: '2026-09-02T00:00:00.000Z',
    history: [], status: 'new', recentDealPrice: null, recentDealDate: null,
    rightsAnalysis: { status: 'unavailable', riskLevel: 'unknown', benchmarkRight: null, benchmarkRightDate: null, seniorTenant: null, juniorTenant: null, survivingRights: null, assumedAmount: null, notes: null },
    occupancyAnalysis: { occupant: null, tenantOpposability: null, evictionRisk: 'unknown', notes: null },
    additionalCosts: { managementFeeStatus: 'unknown', managementFeeAmount: null, notes: null },
    documents: { saleSpecificationUrl: null, statusReportUrl: null, appraisalReportUrl: null, courtUrl: null },
    isBootstrapItem, isSample: false,
  }
}

describe('bootstrap summary metric', () => {
  it('excludes initial imports from this week new', () => {
    const now = new Date('2026-09-02T03:00:00.000Z')
    expect(getSummaryMetrics([item('bootstrap', true), item('new', false)], now).newThisWeek).toBe(1)
  })
})
