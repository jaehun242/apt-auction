import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { RISK_HELP, TERM_HELP } from '../content/helpText'
import type { AuctionItem } from '../types/auction'
import {
  formatDate,
  formatDday,
  formatKoreanCurrency,
  getAppraisalDiscount,
  getEffectiveAuctionStatus,
  getPriceRatio,
  getRecentDealDiscount,
  riskLabel,
  statusLabel,
} from '../utils/auction'
import { InfoTip } from './InfoTip'

interface AuctionCardProps {
  item: AuctionItem
  selected: boolean
  onSelect: (id: string) => void
  onOpenDetail: (item: AuctionItem) => void
}

export function AuctionCard({ item, selected, onSelect, onOpenDetail }: AuctionCardProps) {
  const recentDiscount = getRecentDealDiscount(item)
  const effectiveStatus = getEffectiveAuctionStatus(item)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(item.id)
    }
  }

  return (
    <article id={`auction-${item.id}`} className={`auction-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(item.id)} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-pressed={selected}>
      <div className="card-topline">
        <span className={`status status-${effectiveStatus}`}>{statusLabel(effectiveStatus)}</span>
        {effectiveStatus === 'urgent' && <InfoTip label="입찰임박">{TERM_HELP.urgent}</InfoTip>}
        <span><MapPin size={11} /> {item.city} · {item.district}</span>
        <span className="sample-mini">SAMPLE</span>
      </div>
      <h3>{item.apartmentName}</h3>
      <p className="address">{item.address}</p>
      <div className="property-meta"><span>{item.caseNumber}</span><span>{item.court}</span><span>전용 {item.exclusiveAreaM2}㎡</span><span>{item.floor}층 / 총 {item.totalFloors}층</span></div>

      <div className="price-row">
        <div><span className="term-label">감정가<InfoTip label="감정가">{TERM_HELP.appraisal}</InfoTip></span><strong>{formatKoreanCurrency(item.appraisalPrice)}</strong></div>
        <div><span className="term-label">최저매각가격<InfoTip label="최저매각가격">{TERM_HELP.minimum}</InfoTip></span><strong>{formatKoreanCurrency(item.minimumPrice)}</strong></div>
        <div className="discount"><span className="term-label">감정가 대비<InfoTip label="감정가 대비">{TERM_HELP.appraisalRatio}</InfoTip></span><strong>{getPriceRatio(item).toFixed(0)}% <em>({getAppraisalDiscount(item).toFixed(0)}%↓)</em></strong></div>
      </div>

      <div className="market-row">
        <div><span>최근 실거래가</span><strong>{formatKoreanCurrency(item.recentDealPrice)}</strong><small>{item.recentDealDate ? `${formatDate(item.recentDealDate)} 기준` : '실데이터 연결 후 제공'}</small></div>
        <div><span className="term-label">실거래 대비 최저가<InfoTip label="실거래 대비 최저가" wide>{TERM_HELP.dealDiscount}</InfoTip></span><strong>{recentDiscount === null ? '확인 필요' : `${recentDiscount.toFixed(1)}% 낮음`}</strong></div>
      </div>

      <div className="analysis-strip" aria-label="자동 분석 요약">
        <span className="auto-badge">자동분석</span>
        <span><span className="term-label">권리<InfoTip label="권리 자동분석" wide>{TERM_HELP.rights} {RISK_HELP}</InfoTip></span> <i className={`risk-dot risk-${item.rightsAnalysis.riskLevel}`} /> <strong>{riskLabel(item.rightsAnalysis.riskLevel)}</strong></span>
        <span><span className="term-label">명도<InfoTip label="명도 자동분석" wide>{TERM_HELP.eviction} {RISK_HELP}</InfoTip></span> <i className={`risk-dot risk-${item.occupancyAnalysis.evictionRisk}`} /> <strong>{riskLabel(item.occupancyAnalysis.evictionRisk)}</strong></span>
        <span><span className="term-label">인수예상<InfoTip label="인수예상" wide>{TERM_HELP.assumed}</InfoTip></span> <strong>{item.rightsAnalysis.assumedAmount === null ? '추가 확인 필요' : formatKoreanCurrency(item.rightsAnalysis.assumedAmount)}</strong></span>
      </div>

      <div className="card-footer">
        <span>유찰 <strong>{item.failedCount}회</strong></span>
        <span><CalendarDays size={12} /> 입찰 {formatDate(item.auctionDate)}</span>
        <b>{formatDday(item.auctionDate)}</b>
        <button type="button" onClick={(event) => { event.stopPropagation(); onOpenDetail(item) }}>상세보기 <ArrowRight size={13} /></button>
      </div>
    </article>
  )
}
