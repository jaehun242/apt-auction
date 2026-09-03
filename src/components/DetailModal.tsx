import { AlertTriangle, FileText, ShieldCheck, X } from 'lucide-react'
import { useEffect } from 'react'
import type { AuctionItem } from '../types/auction'
import { formatDate, formatKoreanCurrency, getPriceRatio, getRecentDealDiscount, riskLabel } from '../utils/auction'

interface DetailModalProps { item: AuctionItem; onClose: () => void }
const valueOrCheck = (value: string | null | undefined) => value ?? '확인 필요'
const confidenceLabel = (value: AuctionItem['analysisConfidence']) => ({ HIGH: '자료 충분', MEDIUM: '일부 확인 필요', LOW: '자료 부족', UNAVAILABLE: '확인 필요' }[value ?? 'UNAVAILABLE'])
const comparisonLabel = (value?: string): string => ({ BEFORE: '최선순위 설정일자 이전 — 대항력/인수 가능성 추가 확인 필요', AFTER: '최선순위 설정일자 이후', SAME_DAY: '최선순위 설정일자와 같은 날 — 추가 확인 필요', UNKNOWN: '확인 필요' }[value ?? 'UNKNOWN'] ?? '확인 필요')

export function DetailModal({ item, onClose }: DetailModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = '' }
  }, [onClose])

  const source = item.auctionAnalysisSource
  const tenant = source?.tenants[0]
  const hasAnalysis = item.analysisStatus === 'AVAILABLE' || item.analysisStatus === 'PARTIAL'
  const assumedLabel = item.assumedAmountLabel ?? item.rightsAnalysis.assumedAmountLabel ?? '자동 산정 불가'
  const sourceLabels = [
    ['매각물건명세서', source?.sources.saleSpecification], ['현황조사서', source?.sources.statusReport],
    ['감정평가서', source?.sources.appraisalReport], ['사건·물건 상세정보', source?.sources.detail],
  ] as const
  const recentDiscount = getRecentDealDiscount(item)

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <header className="detail-header"><div><div className="detail-kicker"><span className="sample-badge">{hasAnalysis ? '1차 자동분석' : item.isSample ? '샘플 데이터' : '법원 공개 데이터'}</span><span>{item.city} · {item.district}</span></div><h2 id="detail-title">{item.apartmentName}</h2><p>{item.address}</p></div><button className="close-button" type="button" onClick={onClose} aria-label="상세 창 닫기"><X size={20} /></button></header>
      <div className="detail-warning"><AlertTriangle size={17} /><span>{hasAnalysis ? '법원 공개자료에서 실제 확보한 항목만 이용한 참고용 1차 분석입니다.' : '권리·점유 분석에 필요한 법원 자료를 충분히 확보하지 못해 확인이 필요합니다.'}</span></div>
      <div className="detail-content">
        <DetailSection title="기본정보" kind="fact"><DataGrid rows={[
          ['아파트명', item.apartmentName], ['주소', item.address], ['사건번호', item.caseNumber], ['물건번호', item.itemNumber ?? '확인 필요'], ['관할법원', item.court],
          ['동/층', item.buildingUnit ?? (item.floor === null ? '확인 필요' : `${item.floor}층`)], ['전용면적', item.exclusiveAreaM2 === null ? '확인 필요' : `${item.exclusiveAreaM2}㎡`],
          ['감정가', formatKoreanCurrency(item.appraisalPrice)], ['최저매각가격', formatKoreanCurrency(item.minimumPrice)], ['유찰횟수', `${item.failedCount}회`], ['입찰일', formatDate(item.auctionDate)],
        ]} /></DetailSection>
        <DetailSection title="가격정보" kind="fact"><div className="price-analysis-cards"><AnalysisPrice label="감정가" value={formatKoreanCurrency(item.appraisalPrice)} /><AnalysisPrice label="최저가" value={formatKoreanCurrency(item.minimumPrice)} highlight /><AnalysisPrice label="감정가 대비" value={`${getPriceRatio(item).toFixed(1)}%`} /><AnalysisPrice label="최근 실거래가" value={formatKoreanCurrency(item.recentDealPrice)} sub={item.recentDealDate ? formatDate(item.recentDealDate) : '연동되지 않음'} /><AnalysisPrice label="실거래 대비 할인율" value={recentDiscount === null ? '확인 필요' : `${recentDiscount.toFixed(1)}%`} /></div></DetailSection>
        <DetailSection title="법원 원문 정보" kind="fact"><div className="document-grid">{sourceLabels.map(([label, status]) => <button key={label} type="button" disabled><FileText size={17} /><span>{label}<small>{status === 'AVAILABLE' || status === 'SESSION_ONLY' ? '세션 기반 데이터 확보 · 직접 링크 미제공' : '확인할 수 없음'}</small></span></button>)}</div></DetailSection>
        <DetailSection title="자동 권리분석" kind="analysis" analyzed={hasAnalysis}><DataGrid rows={[
          ['분석 상태', hasAnalysis ? '1차 자동분석' : '분석 미제공'], ['분석 신뢰도', confidenceLabel(item.analysisConfidence)],
          ['최선순위 설정일자', formatDate(source?.benchmarkDate ?? item.rightsAnalysis.benchmarkRightDate)], ['출처', source?.sources.detail === 'AVAILABLE' ? '법원 사건·물건 상세정보' : '확인 필요'],
          ['점유 형태', valueOrCheck(source?.occupancySummary ?? item.occupancyAnalysis.occupant)], ['임차인·점유관계인', source ? `${source.tenants.length}명` : '확인 필요'],
          ['임차인 전입', formatDate(tenant?.moveInDate ?? null)], ['확정일', formatDate(tenant?.fixedDate ?? null)], ['임차보증금', valueOrCheck(tenant?.deposit)], ['월세', valueOrCheck(tenant?.monthlyRent)],
          ['배당요구', valueOrCheck(tenant?.distributionRequest)], ['전입 비교', comparisonLabel(tenant?.comparison)], ['점유조사 결과', valueOrCheck(source?.investigationStatus)],
          ['매각 후 존속권리', valueOrCheck(item.rightsAnalysis.survivingRights)], ['권리위험', riskLabel(item.rightsAnalysis.riskLevel)], ['명도위험', riskLabel(item.occupancyAnalysis.evictionRisk)], ['인수예상', assumedLabel],
        ]} />
          {item.analysisReasons?.length ? <div className="detail-reasons"><strong>분석 근거</strong><ul>{item.analysisReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div> : null}
          <p className="analysis-disclaimer"><ShieldCheck size={15} /><span>법원 공개자료 기반의 참고용 1차 자동분석입니다.<br />실제 입찰 전 등기사항전부증명서, 매각물건명세서, 현황조사서 및 최신 사건기록을 직접 확인해야 합니다.</span></p>
        </DetailSection>
        <DetailSection title="추가비용" kind="analysis"><DataGrid rows={[["체납관리비", '자동 산정하지 않음'], ['인수예상', assumedLabel], ['기타 추가확인사항', valueOrCheck(item.additionalCosts.notes)]]} /></DetailSection>
      </div>
    </section>
  </div>
}

function DetailSection({ title, kind, analyzed = false, children }: { title: string; kind: 'fact' | 'analysis'; analyzed?: boolean; children: React.ReactNode }) { return <section className="detail-section"><div className="section-title"><h3>{title}</h3><span className={`section-kind ${kind}`}>{kind === 'fact' ? '법원 공개 / 사실 데이터' : analyzed ? '1차 자동분석' : '확인 필요'}</span></div>{children}</section> }
function DataGrid({ rows }: { rows: [string, string][] }) { return <dl className="data-grid">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> }
function AnalysisPrice({ label, value, sub, highlight = false }: { label: string; value: string; sub?: string; highlight?: boolean }) { return <div className={highlight ? 'highlight' : ''}><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div> }
