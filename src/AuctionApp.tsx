import { useEffect, useMemo, useState } from 'react'
import { Building2, CalendarClock, Gavel, Map, Search, SlidersHorizontal, TrendingDown } from 'lucide-react'
import { AuctionCard } from './components/AuctionCard'
import { DetailModal } from './components/DetailModal'
import { NaverMap } from './components/NaverMap'
import { getAuctions } from './services/auctionService'
import type { AuctionFilters, AuctionItem } from './types/auction'
import { getAppraisalDiscount, getDaysUntil, isWithinPastDays } from './utils/auction'

const initialFilters: AuctionFilters = { query: '', city: 'all', status: 'all', failedCount: 'all', sort: 'auctionDate' }

export default function AuctionApp() {
  const [auctions, setAuctions] = useState<AuctionItem[]>([])
  const [filters, setFilters] = useState(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<AuctionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadAuctions = () => {
    setLoading(true)
    setLoadError('')
    void getAuctions().then(setAuctions).catch(() => setLoadError('경매 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')).finally(() => setLoading(false))
  }
  useEffect(loadAuctions, [])

  const summary = useMemo(() => ({
    seoul: auctions.filter((item) => item.city === '서울').length,
    busan: auctions.filter((item) => item.city === '부산').length,
    newThisWeek: auctions.filter((item) => isWithinPastDays(item.firstSeenAt, 7)).length,
    failedThisWeek: auctions.filter((item) => isWithinPastDays(item.lastFailedAt, 7)).length,
    upcoming: auctions.filter((item) => getDaysUntil(item.auctionDate) >= 0 && getDaysUntil(item.auctionDate) <= 7).length,
  }), [auctions])

  const filtered = useMemo(() => {
    const result = auctions.filter((item) => {
      const query = filters.query.trim().toLowerCase()
      const matchesQuery = !query || [item.apartmentName, item.address, item.caseNumber].some((value) => value.toLowerCase().includes(query))
      const matchesCity = filters.city === 'all' || item.city === filters.city
      const matchesStatus = filters.status === 'all' || item.status === filters.status
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
    { label: '서울 진행중', value: summary.seoul, icon: Building2 },
    { label: '부산 진행중', value: summary.busan, icon: Map },
    { label: '이번 주 신규', value: summary.newThisWeek, icon: Gavel },
    { label: '이번 주 유찰', value: summary.failedThisWeek, icon: TrendingDown },
    { label: '7일 이내 입찰', value: summary.upcoming, icon: CalendarClock },
  ]
  const dataDate = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-group"><div className="brand-mark"><Building2 size={22} /></div><div><h1>아파트 경매 지도</h1><p>서울·부산 법원 아파트 경매 한눈에 보기</p></div></div>
        <div className="header-meta"><span>서울·부산</span><span className="meta-divider" /><span>데이터 기준일 <strong>{dataDate}</strong></span><span className="sample-badge">샘플 데이터</span></div>
      </header>
      <main>
        <section className="notice" aria-label="샘플 데이터 안내"><strong>현재 화면은 기능 확인용 샘플 데이터입니다.</strong><span>실제 법원 경매 물건·사건번호·권리관계 정보가 아니며 투자 판단에 사용할 수 없습니다.</span></section>
        <section className="summary-grid" aria-label="경매 현황 요약">
          {summaryCards.map(({ label, value, icon: Icon }) => <article className="summary-card" key={label}><div className="summary-icon"><Icon size={18} /></div><div><span>{label}</span><strong>{value}<small>건</small></strong></div></article>)}
        </section>
        <section className="filter-panel" aria-label="검색 및 필터">
          <label className="search-box"><Search size={18} /><input aria-label="경매 물건 검색" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="아파트명, 주소, 사건번호 검색" /></label>
          <label><span>지역</span><select value={filters.city} onChange={(event) => setFilters({ ...filters, city: event.target.value as AuctionFilters['city'] })}><option value="all">전체</option><option value="서울">서울</option><option value="부산">부산</option></select></label>
          <label><span>상태</span><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as AuctionFilters['status'] })}><option value="all">전체</option><option value="new">신건</option><option value="failed">유찰</option><option value="urgent">입찰임박</option></select></label>
          <label><span>유찰 횟수</span><select value={filters.failedCount} onChange={(event) => setFilters({ ...filters, failedCount: event.target.value as AuctionFilters['failedCount'] })}><option value="all">전체</option><option value="0">0회</option><option value="1">1회</option><option value="2">2회</option><option value="3+">3회 이상</option></select></label>
          <label><span>정렬</span><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value as AuctionFilters['sort'] })}><option value="auctionDate">입찰일 빠른순</option><option value="minimumPrice">최저가 낮은순</option><option value="discountRate">감정가 대비 할인율 높은순</option><option value="failedCount">유찰 많은순</option><option value="newest">신규순</option></select></label>
        </section>
        <div className="results-heading"><div><h2>경매 물건</h2><p>조건에 맞는 <strong>{filtered.length}건</strong>의 샘플 물건</p></div><button type="button" onClick={() => setFilters(initialFilters)}><SlidersHorizontal size={13} /> 필터 초기화</button></div>
        {loading ? <div className="data-state"><span className="state-loader" /><strong>샘플 경매 데이터를 불러오는 중입니다</strong></div> : loadError ? <div className="data-state error"><strong>{loadError}</strong><button type="button" onClick={loadAuctions}>다시 시도</button></div> : (
          <section className="workspace">
            <div className="auction-list" aria-label="경매 물건 목록">
              {filtered.length ? filtered.map((item) => <AuctionCard key={item.id} item={item} selected={selectedId === item.id} onSelect={selectItem} onOpenDetail={setDetailItem} />) : <div className="empty-state"><Search size={22} /><strong>조건에 맞는 물건이 없습니다</strong><span>검색어나 필터 조건을 바꿔 보세요.</span><button type="button" onClick={() => setFilters(initialFilters)}>전체 물건 보기</button></div>}
            </div>
            <div className="map-column"><NaverMap items={filtered} city={filters.city} selectedId={selectedId} onSelect={selectItem} onOpenDetail={setDetailItem} /></div>
          </section>
        )}
        <footer className="site-footer"><strong>아파트 경매 지도 · 1차 샘플</strong><span>표시된 자료와 자동분석은 모두 데모용입니다. 실제 입찰 전 법원 원문, 등기사항, 현황조사서 및 전문가 검토가 필요합니다.</span></footer>
      </main>
      {detailItem && <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  )
}
