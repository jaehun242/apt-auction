import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { analyzeCourtDocuments } from './analysis.mjs'
import { enrichWithCourtAnalysis } from './court-documents.mjs'

describe('자료 부족과 문서 캐시', () => {
  it('폐문부재 조사 결과는 명도 확인 필요 및 자동 산정 불가로 처리한다', () => {
    const result = analyzeCourtDocuments({
      checkedAt: '2026-09-03T00:00:00.000Z',
      detail: { available: true, data: { firstPriorityReference: '2021. 05. 17. 근저당권' } },
      statusReport: { available: true, data: { possessions: [{ occupancyCode: '01', notes: '현장 방문시 폐문부재' }], tenants: [], investigationSummary: '폐문부재' } },
    })
    expect(result.analysisStatus).toBe('PARTIAL')
    expect(result.occupancyAnalysis.evictionRisk).toBe('unknown')
    expect(result.assumedAmountLabel).toBe('자동 산정 불가')
  })

  it('변경 지문이 같은 정상 분석은 네트워크 없이 재사용한다', async () => {
    const item = {
      id: 'B000000:20250130000001:1', courtOfficeCode: 'B000000', caseNumber: '2025타경1', itemNumber: '1',
      auctionDate: '2026-09-10', minimumPrice: 100, failedCount: 0, normalizedStatus: 'UPCOMING',
      documents: {}, rightsAnalysis: {}, occupancyAnalysis: {},
    }
    const itemFingerprint = createHash('sha256').update('B000000|2025타경1|1|2026-09-10|100|0|UPCOMING').digest('hex').slice(0, 20)
    const analysis = { analysisStatus: 'AVAILABLE', analysisConfidence: 'MEDIUM', rightsAnalysis: {}, occupancyAnalysis: {} }
    const cache = { schemaVersion: 1, items: { [item.id]: { itemFingerprint, analysis, documents: {} } } }
    const result = await enrichWithCourtAnalysis([item], cache)
    expect(result.stats.reused).toBe(1)
    expect(result.stats.fetched).toBe(0)
  })
})

