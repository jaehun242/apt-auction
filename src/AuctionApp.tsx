import { useEffect, useMemo, useState } from 'react'
import { Building2, CalendarClock, Gavel, Info, Map, Search, SlidersHorizontal, TrendingDown } from 'lucide-react'
import { AuctionCard } from './components/AuctionCard'
import { DetailModal } from './components/DetailModal'
import { InfoTip } from './components/InfoTip'
import { MetricGuideModal } from './components/MetricGuideModal'
import { NaverMap } from './components/NaverMap'
import { SUMMARY_HELP } from './content/helpText'
import { getAuctionData } from './services/auctionService'
import type { AuctionDataMetadata, AuctionFilters, AuctionItem } from './types/auction'
import { formatDate, getAppraisalDiscount, getEffectiveAuctionStatus, getSummaryMetrics } from './utils/auction'
import { matchesAuctionSearch } from './utils/search'

const initialFilters: AuctionFilters = { query: '', city: 'all', status: 'all', failedCount: 'all', sort: 'auctionDate' }

export default function AuctionApp() {
  const [auctions, setAuctions] = useState<AuctionItem[]>([])
  const [metadata, setMetadata] = useState<AuctionDataMetadata | null>(null)
  const [filters, setFilters] = useState(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<AuctionItem | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadAuctions = () => {
    setLoading(true)
    setLoadError('')
    void getAuctionData()
      .then((data) => { setAuctions(data.items); setMetadata(data.metadata) })
      .catch(() => setLoadError('현재 경매 데이터를 불러올 수 없습니다.'))
      .finally(() => setLoading(false))
  }
  useEffect(loadAuctions, [])

  const summary = useMemo(() => getSummaryMetrics(auctions), [auctions])
  const filtered = useMemo(() => {
    const result = auctions.filter((item) => {
      const matchesQuery = matchesAuctionSearch(item, filters.query)
      const matchesCity = filters.city === 'all' || item.city === filters.city
      const matchesStatus = filters.status === 'all' || getEffectiveAuctionStatus(item) === filters.status
      const matchesFailed = filters.failedCount === 'all' || (filters.failedCount === '3+' ? item.failedCount >= 3 : item.failedCount === Number(filters.failedCount))
      return matchesQuery && matchesCity && matchesStatus && matchesFailed
    })
    return result.sort((a, b) => {
      switch (filters.sort) {
        case 'minimumPrice': return a.minimumPrice - b.minimumPrice
        case 'discountRate': return getAppraisalDiscount(b) - getAppraisalDiscount(a)
        case 'failedCount': return b.failedCount - a.failedCount
        case 'newest': return new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime()
        default: return new Date(a.auctionDate).getTime() - new Date(b.auctionDate).getTime()
      }
    })
  }, [auctions, filters])

  useEffect(() => {
    if (selectedId && !filtered.some((item) => item.id === selectedId)) setSelectedId(null)
  }, [filtered, selectedId])

  const selectItem = (id: string) => {
    setSelectedId(id)
    window.setTimeout(() => document.getElementById(`auction-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  const summaryCards = [
    { label: '서울 진행중', value: summary.seoul, icon: Building2, help: SUMMARY_HELP.seoul },
    { label: '부산 진행중', value: summary.busan, icon: Map, help: SUMMARY_HELP.busan },
    { label: '이번 주 신규', value: summary.newThisWeek, icon: Gavel, help: SUMMARY_HELP.newThisWeek },
    { label: '이번 주 유찰', value: summary.failedThisWeek, icon: TrendingDown, help: SUMMARY_HELP.failedThisWeek },
    { label: '7일 이내 입찰', value: summary.upcoming, icon: CalendarClock, help: SUMMARY_HELP.upcoming },
  ]
  const isSample = auctions.length > 0 && auctions.every((item) => item.isSample)
  const dataDate = metadata ? formatDate(metadata.collectedAt) : '확인 중'
  const statusText = isSample ? 'SAMPLE DATA' : metadata?.status === 'DELAYED' ? '수집 지연' : '정상 수집'

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-group"><div className="brand-mark"><Building2 size={22} /></div><div><h1>아파트 경매 지도</h1><p>서울·부산 법원 아파트 경매 한눈에 보기</p></div></div>
        <div className="header-meta"><span>서울·부산</span><span className="meta-divider" /><span>데이터 기준일 <strong>{dataDate}</strong></span><span className="sample-badge">{statusText}</span></div>
      </header>
      <main>
        <section className="notice" aria-label="데이터 안내"><strong>{isSample ? '개발용 샘플 데이터입니다.' : '대한민국 법원경매정보 공개 조회 결과입니다.'}</strong><span>{metadata?.status === 'DELAYED' ? '마지막 정상 수집 이후 36시간이 지났습니다. 원문 최신 상태를 확인해 주세요.' : '권리·점유·체납관리비는 자동 분석하지 않으며 실제 입찰 전 법원 원문과 등기사항을 확인해야 합니다.'}</span></section>

        <div className="summary-heading"><span>경매 현황 <small>Asia/Seoul 기준</small></span><button type="button" onClick={() => setGuideOpen(true)}>지표 설명 <Info size={13} /></button></div>
        <section className="summary-grid" aria-label="경매 현황 요약">{summaryCards.map(({ label, value, icon: Icon, help }) => <article className="summary-card" key={label}><div className="summary-icon"><Icon size={18} /></div><div><span className="summary-label">{label}<InfoTip label={label} wide>{help}</InfoTip></span><strong>{value}<small>건</small></strong></div></article>)}</section>

        <section className="filter-panel" aria-label="검색 및 필터">
          <label className="search-box"><Search size={18} /><input aria-label="경매 물건 검색" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="아파트명, 주소, 사건번호 검색" /></label>
          <label><span>지역</span><select value={filters.city} onChange={(event) => setFilters({ ...filters, city: event.target.value as AuctionFilters['city'] })}><option value="all">전체</option><option value="서울">서울</option><option value="부산">부산</option></select></label>
          <label><span>상태</span><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as AuctionFilters['status'] })}><option value="all">전체</option><option value="new">신건</option><option value="failed">유찰</option><option value="urgent">입찰임박</option><option value="closed">종료</option></select></label>
          <label><span>유찰 횟수</span><select value={filters.failedCount} onChange={(event) => setFilters({ ...filters, failedCount: event.target.value as AuctionFilters['failedCount'] })}><option value="all">전체</option><option value="0">0회</option><option value="1">1회</option><option value="2">2회</option><option value="3+">3회 이상</option></select></label>
          <label><span>정렬</span><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value as AuctionFilters['sort'] })}><option value="auctionDate">입찰일 빠른순</option><option value="minimumPrice">최저가 낮은순</option><option value="discountRate">감정가 대비 할인율 높은순</option><option value="failedCount">유찰 많은순</option><option value="newest">신규순</option></select></label>
        </section>
        <div className="results-heading"><div><h2>경매 물건</h2><p>조건에 맞는 <strong>{filtered.length}건</strong>의 법원 경매 물건</p></div><button type="button" onClick={() => setFilters(initialFilters)}><SlidersHorizontal size={13} /> 필터 초기화</button></div>
        {loading ? <div className="data-state"><span className="state-loader" /><strong>법원 경매 데이터를 불러오는 중입니다</strong></div> : loadError ? <div className="data-state error"><strong>{loadError}</strong><button type="button" onClick={loadAuctions}>다시 시도</button></div> : (
          <section className="workspace">
            <div className="auction-list" aria-label="경매 물건 목록">{filtered.length ? filtered.map((item) => <AuctionCard key={item.id} item={item} selected={selectedId === item.id} onSelect={selectItem} onOpenDetail={setDetailItem} />) : <div className="empty-state"><Search size={22} /><strong>조건에 맞는 물건이 없습니다</strong><span>검색어나 필터 조건을 바꿔 보세요.</span><button type="button" onClick={() => setFilters(initialFilters)}>전체 물건 보기</button></div>}</div>
            <div className="map-column"><NaverMap items={filtered} city={filters.city} selectedId={selectedId} onSelect={selectItem} onOpenDetail={setDetailItem} /></div>
          </section>
        )}
        <footer className="site-footer"><strong>아파트 경매 지도</strong><span>법원 공개 조회 결과를 자동 수집한 정보입니다. 실제 입찰 전 법원 원문, 등기사항, 현황조사서 및 전문가 검토가 필요합니다.</span></footer>
      </main>
      {detailItem && <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
      {guideOpen && <MetricGuideModal onClose={() => setGuideOpen(false)} />}
    </div>
  )
}
