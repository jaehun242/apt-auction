import { describe, expect, it } from 'vitest'
import { analyzeCourtDocuments } from './analysis.mjs'

describe('특이사항 문구의 보수적 판정', () => {
  it('인수되지 않는다는 부정 문구를 고위험으로 오인하지 않는다', () => {
    const result = analyzeCourtDocuments({
      checkedAt: '2026-09-03T00:00:00.000Z',
      detail: { available: true, data: { firstPriorityReference: '2021. 05. 17. 근저당권', specialSaleConditions: '해당 권리는 매수인에게 인수되지 않음' } },
      statusReport: { available: true, data: { possessions: [{ occupancyCode: '01', notes: null }], tenants: [], investigationSummary: null } },
    })
    expect(result.rightsAnalysis.riskLevel).toBe('low')
  })
})

