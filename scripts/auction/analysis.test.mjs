import { describe, expect, it } from 'vitest'
import { analyzeCourtDocuments } from './analysis.mjs'

const checkedAt = '2026-09-02T00:00:00.000Z'
const detail = (overrides = {}) => ({
  available: true,
  data: {
    firstPriorityReference: '2021. 05. 17. 근저당권',
    nonExtinguishedRights: null,
    specialSaleConditions: null,
    ...overrides,
  },
})
const statusReport = ({ occupancyCode = '02', tenants = [], summary = null } = {}) => ({
  available: true,
  data: { possessions: [{ occupancyCode, notes: summary }], tenants, investigationSummary: summary },
})
const tenant = (moveIn = '2023.08.10.', overrides = {}) => ({
  mvinDtlCtt: moveIn,
  rgstryCrtcpCfmtnCtt: '2023.08.11.',
  lesDposDts: '금 100,000,000원',
  mmrntAmtDts: null,
  ...overrides,
})

describe('법원 원문 기반 보수적 1차 분석', () => {
  it('최선순위 설정일 이후 전입은 사실 중심으로 표시한다', () => {
    const result = analyzeCourtDocuments({ detail: detail(), statusReport: statusReport({ tenants: [tenant()] }), checkedAt })
    expect(result.rightsAnalysis.juniorTenant).toContain('이후')
    expect(result.rightsAnalysis.riskLevel).toBe('medium')
    expect(result.rightsAnalysis.assumedAmount).toBeNull()
  })

  it('최선순위 설정일 이전 전입은 추가 확인이 필요한 높은 신호로 처리한다', () => {
    const result = analyzeCourtDocuments({ detail: detail(), statusReport: statusReport({ tenants: [tenant('2020.04.11.')] }), checkedAt })
    expect(result.rightsAnalysis.seniorTenant).toContain('추가 확인 필요')
    expect(result.rightsAnalysis.riskLevel).toBe('high')
    expect(result.assumedAmountLabel).toContain('인수 가능성')
  })

  it('소유자 점유이고 별도 임차인 기재가 없으면 낮음 후보가 된다', () => {
    const result = analyzeCourtDocuments({ detail: detail(), statusReport: statusReport({ occupancyCode: '01' }), checkedAt })
    expect(result.occupancyAnalysis.occupant).toBe('소유자 점유')
    expect(result.occupancyAnalysis.evictionRisk).toBe('low')
  })

  it('임차인 핵심 날짜가 없으면 확인 필요로 낮춘다', () => {
    const result = analyzeCourtDocuments({ detail: detail(), statusReport: statusReport({ tenants: [tenant('미상')] }), checkedAt })
    expect(result.analysisStatus).toBe('PARTIAL')
    expect(result.rightsAnalysis.riskLevel).toBe('unknown')
    expect(result.assumedAmountLabel).toBe('자동 산정 불가')
  })

  it('존속권리 특이사항은 높은 위험 신호로만 표시하고 확정하지 않는다', () => {
    const result = analyzeCourtDocuments({ detail: detail({ nonExtinguishedRights: '매수인이 인수할 권리 기재 있음' }), statusReport: statusReport({ occupancyCode: '01' }), checkedAt })
    expect(result.rightsAnalysis.riskLevel).toBe('high')
    expect(result.rightsAnalysis.survivingRights).toContain('인수')
  })

  it('문서 수집 실패는 분석 불가이며 확인 필요 값을 유지한다', () => {
    const result = analyzeCourtDocuments({ detail: { available: false }, statusReport: { available: false }, checkedAt })
    expect(result.analysisStatus).toBe('UNAVAILABLE')
    expect(result.rightsAnalysis.riskLevel).toBe('unknown')
  })

  it('모든 경우에 인수금액 0원을 만들지 않는다', () => {
    const fixtures = [
      analyzeCourtDocuments({ detail: detail(), statusReport: statusReport({ occupancyCode: '01' }), checkedAt }),
      analyzeCourtDocuments({ detail: detail(), statusReport: statusReport({ tenants: [tenant('2020.04.11.')] }), checkedAt }),
      analyzeCourtDocuments({ detail: { available: false }, statusReport: { available: false }, checkedAt }),
    ]
    for (const result of fixtures) {
      expect(result.rightsAnalysis.assumedAmount).toBeNull()
      expect(result.assumedAmountLabel).not.toContain('0원')
    }
  })
})

