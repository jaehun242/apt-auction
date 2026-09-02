import type { AuctionItem, RiskLevel } from '../types/auction'

const DAY_MS = 24 * 60 * 60 * 1000

export function formatKoreanCurrency(value: number | null): string {
  if (value === null) return '확인 필요'
  if (value === 0) return '0원'
  const eok = Math.floor(value / 100_000_000)
  const man = Math.floor((value % 100_000_000) / 10_000)
  const won = value % 10_000
  const parts: string[] = []
  if (eok) parts.push(`${eok.toLocaleString('ko-KR')}억`)
  if (man) parts.push(`${man.toLocaleString('ko-KR')}만원`)
  if (won) parts.push(`${won.toLocaleString('ko-KR')}원`)
  return parts.join(' ')
}

export const getPriceRatio = (item: AuctionItem) => item.appraisalPrice ? (item.minimumPrice / item.appraisalPrice) * 100 : 0
export const getAppraisalDiscount = (item: AuctionItem) => 100 - getPriceRatio(item)

export function getRecentDealDiscount(item: AuctionItem): number | null {
  if (!item.recentDealPrice) return null
  return ((item.recentDealPrice - item.minimumPrice) / item.recentDealPrice) * 100
}

export function getDaysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / DAY_MS)
}

export function formatDday(date: string): string {
  const days = getDaysUntil(date)
  if (days === 0) return 'D-DAY'
  if (days > 0) return `D-${days}`
  return `D+${Math.abs(days)}`
}

export function isWithinPastDays(date: string | null, days: number): boolean {
  if (!date) return false
  const value = new Date(`${date}T00:00:00`).getTime()
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  return value <= now.getTime() && value >= now.getTime() - days * DAY_MS
}

export function formatDate(date: string | null): string {
  if (!date) return '확인 필요'
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(`${date}T00:00:00`))
}

export const riskLabel = (risk: RiskLevel) => ({ low: '낮음', medium: '보통', high: '높음', unknown: '확인 필요' })[risk]
export const statusLabel = (status: AuctionItem['status']) => ({ new: '신건', failed: '유찰', urgent: '입찰임박' })[status]
