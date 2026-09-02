import { AlertCircle, KeyRound, LoaderCircle, Map as MapIcon, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AuctionItem, City } from '../types/auction'
import { formatDate, formatKoreanCurrency, statusLabel } from '../utils/auction'

interface NaverMapProps {
  items: AuctionItem[]
  city: 'all' | City
  selectedId: string | null
  onSelect: (id: string) => void
  onOpenDetail: (item: AuctionItem) => void
}

let scriptPromise: Promise<void> | null = null

function loadNaverMap(clientId: string): Promise<void> {
  if (window.naver?.maps) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('naver-map-script') as HTMLScriptElement | null
    window.navermap_authFailure = () => {
      scriptPromise = null
      reject(new Error('네이버 지도 인증에 실패했습니다.'))
    }

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('네이버 지도 스크립트를 불러오지 못했습니다.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'naver-map-script'
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`
    script.async = true
    script.onload = () => window.naver?.maps ? resolve() : reject(new Error('네이버 지도 초기화에 실패했습니다.'))
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('네이버 지도 스크립트를 불러오지 못했습니다.'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

const markerColors = { new: '#2878b8', failed: '#d27a2c', urgent: '#c94b4b' }

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!)
}

function infoWindowContent(item: AuctionItem) {
  return `<div class="naver-info">
    <div class="naver-info__top"><span>${escapeHtml(statusLabel(item.status))}</span><small>샘플 데이터</small></div>
    <strong>${escapeHtml(item.apartmentName)}</strong>
    <p>${escapeHtml(item.city)} · ${escapeHtml(item.district)}</p>
    <dl><div><dt>감정가</dt><dd>${escapeHtml(formatKoreanCurrency(item.appraisalPrice))}</dd></div><div><dt>최저가</dt><dd>${escapeHtml(formatKoreanCurrency(item.minimumPrice))}</dd></div><div><dt>유찰</dt><dd>${item.failedCount}회</dd></div><div><dt>입찰일</dt><dd>${escapeHtml(formatDate(item.auctionDate))}</dd></div></dl>
    <button type="button" data-auction-detail="${escapeHtml(item.id)}">상세보기</button>
  </div>`
}

export function NaverMap({ items, city, selectedId, onSelect, onOpenDetail }: NaverMapProps) {
  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID?.trim()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const infoWindowRef = useRef<any>(null)
  const itemsRef = useRef(items)
  const onSelectRef = useRef(onSelect)
  const onOpenDetailRef = useRef(onOpenDetail)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  itemsRef.current = items
  onSelectRef.current = onSelect
  onOpenDetailRef.current = onOpenDetail

  useEffect(() => {
    if (!clientId || !containerRef.current) return
    let active = true
    setState('loading')
    setError('')
    loadNaverMap(clientId).then(() => {
      if (!active || !containerRef.current || !window.naver?.maps) return
      const maps = window.naver.maps
      if (!mapRef.current) {
        mapRef.current = new maps.Map(containerRef.current, {
          center: new maps.LatLng(36.36, 127.8),
          zoom: 7,
          minZoom: 6,
          zoomControl: true,
          zoomControlOptions: { position: maps.Position.TOP_RIGHT },
          scaleControl: false,
          logoControlOptions: { position: maps.Position.BOTTOM_LEFT },
        })
      }
      setState('ready')
    }).catch((reason: unknown) => {
      if (!active) return
      setError(reason instanceof Error ? reason.message : '네이버 지도를 불러오지 못했습니다.')
      setState('error')
    })
    return () => { active = false }
  }, [clientId, retryToken])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-auction-detail]')
      if (!button) return
      const item = itemsRef.current.find((candidate) => candidate.id === button.dataset.auctionDetail)
      if (item) onOpenDetailRef.current(item)
    }
    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    if (state !== 'ready' || !mapRef.current || !window.naver?.maps) return
    const maps = window.naver.maps
    const map = mapRef.current

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current.clear()
    infoWindowRef.current?.close()

    items.forEach((item) => {
      const selected = item.id === selectedId
      const position = new maps.LatLng(item.latitude, item.longitude)
      const marker = new maps.Marker({
        position,
        map,
        title: item.apartmentName,
        icon: {
          content: `<div class="auction-marker ${selected ? 'is-selected' : ''}" style="--marker-color:${markerColors[item.status]}"><span>${item.failedCount ? `${item.failedCount}회` : '신건'}</span></div>`,
          anchor: new maps.Point(28, 40),
        },
        zIndex: selected ? 200 : 100,
      })
      maps.Event.addListener(marker, 'click', () => {
        const infoWindow = new maps.InfoWindow({ content: infoWindowContent(item), borderWidth: 0, backgroundColor: 'transparent', disableAnchor: true, pixelOffset: new maps.Point(0, -42) })
        infoWindowRef.current?.close()
        infoWindow.open(map, marker)
        infoWindowRef.current = infoWindow
        onSelectRef.current(item.id)
      })
      markersRef.current.set(item.id, marker)
    })

    if (selectedId) {
      const item = items.find((candidate) => candidate.id === selectedId)
      const marker = markersRef.current.get(selectedId)
      if (item && marker) {
        map.panTo(new maps.LatLng(item.latitude, item.longitude))
        const infoWindow = new maps.InfoWindow({ content: infoWindowContent(item), borderWidth: 0, backgroundColor: 'transparent', disableAnchor: true, pixelOffset: new maps.Point(0, -42) })
        infoWindow.open(map, marker)
        infoWindowRef.current = infoWindow
        return
      }
    }

    if (city === '서울') {
      map.morph(new maps.LatLng(37.5665, 126.978), 11)
    } else if (city === '부산') {
      map.morph(new maps.LatLng(35.1796, 129.0756), 11)
    } else if (items.length === 1) {
      map.morph(new maps.LatLng(items[0].latitude, items[0].longitude), 14)
    } else if (items.length > 1) {
      const bounds = new maps.LatLngBounds()
      items.forEach((item) => bounds.extend(new maps.LatLng(item.latitude, item.longitude)))
      map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 })
    }
  }, [items, city, selectedId, state])

  if (!clientId) {
    return <div className="map-fallback"><div className="map-fallback__icon"><KeyRound size={24} /></div><strong>네이버 지도 API 키가 설정되지 않았습니다.</strong><span>다른 검색·필터·상세보기 기능은 정상적으로 사용할 수 있습니다.</span><small>로컬에서는 VITE_NAVER_MAP_CLIENT_ID 환경변수를 설정해 주세요.</small></div>
  }

  return (
    <div className="map-frame">
      <div ref={containerRef} className="naver-map" aria-label="필터된 아파트 경매 지도" />
      {state === 'loading' && <div className="map-overlay"><LoaderCircle className="spin" size={24} /><strong>네이버 지도를 불러오는 중입니다</strong></div>}
      {state === 'error' && <div className="map-overlay error"><AlertCircle size={25} /><strong>지도를 표시할 수 없습니다</strong><span>{error}</span><button type="button" onClick={() => setRetryToken((value) => value + 1)}><RefreshCw size={14} /> 다시 시도</button></div>}
      {state === 'ready' && items.length === 0 && <div className="map-empty"><MapIcon size={20} /> 지도에 표시할 물건이 없습니다.</div>}
      <div className="map-legend"><span><i style={{ background: markerColors.new }} />신건</span><span><i style={{ background: markerColors.failed }} />유찰</span><span><i style={{ background: markerColors.urgent }} />입찰임박</span></div>
    </div>
  )
}
