import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { RISK_HELP, TERM_HELP } from '../content/helpText'
import type { AuctionItem } from '../types/auction'
import { formatDate, formatDday, formatKoreanCurrency, getAppraisalDiscount, getEffectiveAuctionStatus, getPriceRatio, getRecentDealDiscount, riskLabel, statusLabel } from '../utils/auction'
import { InfoTip } from './InfoTip'

interface AuctionCardProps {
  item: AuctionItem
  selected: boolean
  onSelect: (id: string) => void
  onOpenDetail: (item: AuctionItem) => void
}

const confidenceLabel = (value: AuctionItem['analysisConfidence']) => ({ HIGH: '자료 충분', MEDIUM: '일부 확인 필요', LOW: '자료 부족', UNAVAILABLE: '확인 필요' }[value ?? 'UNAVAILABLE'])

export function AuctionCard({ item, selected, onSelect, onOpenDetail }: AuctionCardProps) {
  const recentDiscount = getRecentDealDiscount(item)
  const effectiveStatus = getEffectiveAuctionStatus(item)
  const hasAnalysis = item.analysisStatus === 'AVAILABLE' || item.analysisStatus === 'PARTIAL'
  const assumedLabel = item.assumedAmountLabel ?? item.rightsAnalysis.assumedAmountLabel
    ?? (item.rightsAnalysis.assumedAmount === null ? '확인 필요' : formatKoreanCurrency(item.rightsAnalysis.assumedAmount))
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(item.id) }
  }

  return (
    <article id={`auction-${item.id}`} className={`auction-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(item.id)} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-pressed={selected}>
      <div className="card-topline">
        <span className={`status status-${effectiveStatus}`}>{statusLabel(effectiveStatus)}</span>
        {effectiveStatus === 'urgent' && <InfoTip label="입찰임박">{TERM_HELP.urgent}</InfoTip>}
        <span><MapPin size={11} /> {item.city} · {item.district}</span>
        {item.isSample && <span className="sample-mini">SAMPLE</span>}
      </div>
      <h3>{item.apartmentName}</h3>
      <p className="address">{item.address}</p>
      <div className="property-meta"><span>{item.caseNumber}</span><span>{item.court}</span><span>전용 {item.exclusiveAreaM2 === null ? '확인 필요' : `${item.exclusiveAreaM2}㎡`}</span><span>{item.floor === null ? '층 확인 필요' : `${item.floor}층`}{item.totalFloors === null ? '' : ` / 총 ${item.totalFloors}층`}</span></div>

      <div className="price-row">
        <div><span className="term-label">감정가<InfoTip label="감정가">{TERM_HELP.appraisal}</InfoTip></span><strong>{formatKoreanCurrency(item.appraisalPrice)}</strong></div>
        <div><span className="term-label">최저매각가격<InfoTip label="최저매각가격">{TERM_HELP.minimum}</InfoTip></span><strong>{formatKoreanCurrency(item.minimumPrice)}</strong></div>
        <div className="discount"><span className="term-label">감정가 대비<InfoTip label="감정가 대비">{TERM_HELP.appraisalRatio}</InfoTip></span><strong>{getPriceRatio(item).toFixed(0)}% <em>({getAppraisalDiscount(item).toFixed(0)}%↓)</em></strong></div>
      </div>

      <div className="market-row">
        <div><span>최근 실거래가</span><strong>{formatKoreanCurrency(item.recentDealPrice)}</strong><small>{item.recentDealDate ? `${formatDate(item.recentDealDate)} 기준` : '연동되지 않음'}</small></div>
        <div><span className="term-label">실거래 대비 최저가<InfoTip label="실거래 대비 최저가" wide>{TERM_HELP.dealDiscount}</InfoTip></span><strong>{recentDiscount === null ? '확인 필요' : `${recentDiscount.toFixed(1)}% 낮음`}</strong></div>
      </div>

      <div className="analysis-strip" aria-label="분석 정보">
        <span className="auto-badge">{hasAnalysis ? '1차 자동분석' : '분석 미제공'}{hasAnalysis && <InfoTip label="1차 자동분석 안내" wide>법원 공개 문서를 이용한 참고용 자동분석입니다. 등기부 및 최신 원문 확인 전에는 확정판단으로 사용할 수 없습니다.</InfoTip>}</span>
        <span><span className="term-label">권리<InfoTip label="권리 분석" wide>{TERM_HELP.rights} {RISK_HELP}</InfoTip></span> <i className={`risk-dot risk-${item.rightsAnalysis.riskLevel}`} /> <strong>{riskLabel(item.rightsAnalysis.riskLevel)}</strong></span>
        <span><span className="term-label">명도<InfoTip label="명도 분석" wide>{TERM_HELP.eviction} {RISK_HELP}</InfoTip></span> <i className={`risk-dot risk-${item.occupancyAnalysis.evictionRisk}`} /> <strong>{riskLabel(item.occupancyAnalysis.evictionRisk)}</strong></span>
        <span><span className="term-label">인수<InfoTip label="인수예상" wide>{TERM_HELP.assumed}</InfoTip></span> <strong>{assumedLabel}</strong></span>
        {hasAnalysis && <small className="analysis-confidence">{confidenceLabel(item.analysisConfidence)}</small>}
      </div>
      {hasAnalysis && item.analysisReasons?.length ? <details className="analysis-reasons" onClick={(event) => event.stopPropagation()}><summary>분석 근거 보기</summary><ul>{item.analysisReasons.slice(0, 5).map((reason) => <li key={reason}>{reason}</li>)}</ul></details> : null}

      <div className="card-footer">
        <span>유찰 <strong>{item.failedCount}회</strong></span><span><CalendarDays size={12} /> 입찰 {formatDate(item.auctionDate)}</span><b>{formatDday(item.auctionDate)}</b>
        <button type="button" onClick={(event) => { event.stopPropagation(); onOpenDetail(item) }}>상세보기 <ArrowRight size={13} /></button>
      </div>
    </article>
  )
}
