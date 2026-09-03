import { enrichWithCourtAnalysis as enrichCore } from './court-documents-core.mjs'

const ANALYSIS_POLICY_VERSION = 2
const POSITIVE_RISK = /(?:매수인(?:이|에게)?\s*(?:인수|부담)|인수(?:할|되는|될)\s*(?:권리|채무|부담)|매각\s*후\s*존속|존속(?:하는|할)\s*권리|유치권\s*(?:신고|주장)|법정지상권\s*(?:성립|가능|여지)|대항력\s*(?:있|가능|인정))/
const NO_RISK_TEXT = /(?:해당\s*없음|해당사항\s*없음|별도\s*기재\s*없음|소멸함|인수되지\s*않)/

function migratePolicy(entry) {
  if (!entry?.analysis || entry.analysisPolicyVersion === ANALYSIS_POLICY_VERSION) return entry
  const analysis = structuredClone(entry.analysis)
  const source = analysis.auctionAnalysisSource
  if (source && analysis.rightsAnalysis?.riskLevel === 'high') {
    const tenants = source.tenants ?? []
    const earlier = tenants.some((tenant) => tenant.comparison === 'BEFORE')
    const raw = [source.nonExtinguishedRights, source.specialSaleConditions].filter(Boolean).join(' ')
    const explicit = POSITIVE_RISK.test(raw) && !NO_RISK_TEXT.test(raw)
    if (!earlier && !explicit) {
      const missingDate = tenants.some((tenant) => !tenant.moveInDate)
      analysis.rightsAnalysis.riskLevel = missingDate ? 'unknown' : tenants.length ? 'medium' : analysis.analysisStatus === 'AVAILABLE' ? 'low' : 'unknown'
      analysis.assumedAmountLabel = analysis.analysisStatus === 'AVAILABLE' ? '추가 인수금액 현재 자료에서 확인되지 않음' : '자동 산정 불가'
      analysis.rightsAnalysis.assumedAmountLabel = analysis.assumedAmountLabel
    }
  }
  return { ...entry, analysisPolicyVersion: ANALYSIS_POLICY_VERSION, analysis }
}

export async function enrichWithCourtAnalysis(items, cache = {}, options = {}) {
  const reusableEntries = Object.entries(cache.items ?? {})
    .filter(([, entry]) => entry?.analysis?.analysisStatus !== 'UNAVAILABLE')
    .map(([id, entry]) => [id, migratePolicy(entry)])
  const result = await enrichCore(items, { ...cache, items: Object.fromEntries(reusableEntries) }, options)
  for (const entry of Object.values(result.cache.items)) entry.analysisPolicyVersion = ANALYSIS_POLICY_VERSION
  return result
}

