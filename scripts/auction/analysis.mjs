import { analyzeCourtDocuments as baseAnalyze, parseCourtDate } from './analysis-v2.mjs'

const POSITIVE_RISK = /(?:매수인(?:이|에게)?\s*(?:인수|부담)|인수(?:할|되는|될)\s*(?:권리|채무|부담)|매각\s*후\s*존속|존속(?:하는|할)\s*권리|유치권\s*(?:신고|주장)|법정지상권\s*(?:성립|가능|여지)|대항력\s*(?:있|가능|인정))/
const NO_RISK_TEXT = /(?:해당\s*없음|해당사항\s*없음|별도\s*기재\s*없음|소멸함|인수되지\s*않)/

export function analyzeCourtDocuments(input) {
  const result = baseAnalyze(input)
  if (!result.auctionAnalysisSource || result.rightsAnalysis.riskLevel !== 'high') return result
  const tenants = result.auctionAnalysisSource.tenants
  const earlierTenant = tenants.some((tenant) => tenant.comparison === 'BEFORE')
  const rawRiskText = [input.detail?.data?.nonExtinguishedRights, input.detail?.data?.specialSaleConditions].filter(Boolean).join(' ')
  const explicitPositiveRisk = POSITIVE_RISK.test(rawRiskText) && !NO_RISK_TEXT.test(rawRiskText)
  if (earlierTenant || explicitPositiveRisk) return result

  const missingTenantDate = tenants.some((tenant) => !tenant.moveInDate)
  result.rightsAnalysis.riskLevel = missingTenantDate ? 'unknown' : tenants.length ? 'medium' : result.analysisStatus === 'AVAILABLE' ? 'low' : 'unknown'
  result.assumedAmountLabel = result.analysisStatus === 'AVAILABLE' ? '추가 인수금액 현재 자료에서 확인되지 않음' : '자동 산정 불가'
  result.rightsAnalysis.assumedAmountLabel = result.assumedAmountLabel
  return result
}

export { parseCourtDate }

