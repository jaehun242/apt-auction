import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import type { AuctionItem } from '../types/auction'
import {
  formatDate,
  formatDday,
  formatKoreanCurrency,
  getAppraisalDiscount,
  getPriceRatio,
  getRecentDealDiscount,
  riskLabel,
  statusLabel,
} from '../utils/auction'

interface AuctionCardProps {
  item: AuctionItem
  selected: boolean
  onSelect: (id: string) => void
  onOpenDetail: (item: AuctionItem) => void
}

export function AuctionCard({ item, selected, onSelect, onOpenDetail }: AuctionCardProps) {
  const recentDiscount = getRecentDealDiscount(item)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(item.id)
    }
  }

  return (
    <article
      id={`auction-${item.id}`}
      className={`auction-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(item.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
    >
      <div className="card-topline">
        <span className={`status status-${item.status}`}>{statusLabel(item.status)}</span>
        <span><MapPin size={11} /> {item.city} · {item.district}</span>
        <span className="sample-mini">SAMPLE</span>
      </div>
      <h3>{item.apartmentName}</h3>
      <p className="address">{item.address}</p>
      <div className="property-meta">
        <span>{item.caseNumber}</span><span>{item.court}</span>
        <span>전용 {item.exclusiveAreaM2}㎡</span><span>{item.floor}층 / 총 {item.totalFloors}층</span>
      </div>

      <div className="price-row">
        <div><span>감정가</span><strong>{formatKoreanCurrency(item.appraisalPrice)}</strong></div>
        <div><span>최저매각가격</span><strong>{formatKoreanCurrency(item.minimumPrice)}</strong></div>
        <div className="discount"><span>감정가 대비</span><strong>{getPriceRatio(item).toFixed(0)}% <em>({getAppraisalDiscount(item).toFixed(0)}%↓)</em></strong></div>
      </div>

      <div className="market-row">
        <div><span>최근 실거래가</span><strong>{formatKoreanCurrency(item.recentDealPrice)}</strong><small>{item.recentDealDate ? `${formatDate(item.recentDealDate)} 기준` : '실데이터 연결 후 제공'}</small></div>
        <div><span>실거래 대비 최저가</span><strong>{recentDiscount === null ? '확인 필요' : `${recentDiscount.toFixed(1)}% 낮음`}</strong></div>
      </div>

      <div className="analysis-strip" aria-label="자동 분석 요약">
        <span className="auto-badge">자동분석</span>
        <span>권리 <i className={`risk-dot risk-${item.rightsAnalysis.riskLevel}`} /> <strong>{riskLabel(item.rightsAnalysis.riskLevel)}</strong></span>
        <span>명도 <i className={`risk-dot risk-${item.occupancyAnalysis.evictionRisk}`} /> <strong>{riskLabel(item.occupancyAnalysis.evictionRisk)}</strong></span>
        <span>인수예상 <strong>{item.rightsAnalysis.assumedAmount === null ? '추가 확인 필요' : formatKoreanCurrency(item.rightsAnalysis.assumedAmount)}</strong></span>
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
