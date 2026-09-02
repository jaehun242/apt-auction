import type { AuctionItem, AuctionStatus, RiskLevel } from '../types/auction'

const DAY_MS = 24 * 60 * 60 * 1000
export const SEOUL_TIME_ZONE = 'Asia/Seoul'

function dateKeyToDayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
}

function dayNumberToDateKey(dayNumber: number): string {
  return new Date(dayNumber * DAY_MS).toISOString().slice(0, 10)
}

export function getSeoulDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

export function normalizeToSeoulDateKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return getSeoulDateKey(new Date(value))
}

export function getSeoulWeekBounds(now: Date = new Date()) {
  const todayKey = getSeoulDateKey(now)
  const todayNumber = dateKeyToDayNumber(todayKey)
  const weekday = new Date(todayNumber * DAY_MS).getUTCDay()
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1
  const startNumber = todayNumber - daysSinceMonday
  return {
    start: dayNumberToDateKey(startNumber),
    end: dayNumberToDateKey(startNumber + 6),
    today: todayKey,
  }
}

export function isInCurrentSeoulWeekToNow(value: string | null, now: Date = new Date()): boolean {
  if (!value) return false
  const { start, today } = getSeoulWeekBounds(now)
  const dateKey = normalizeToSeoulDateKey(value)
  return dateKey >= start && dateKey <= today
}

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

export function getDaysUntil(date: string, now: Date = new Date()): number {
  return dateKeyToDayNumber(normalizeToSeoulDateKey(date)) - dateKeyToDayNumber(getSeoulDateKey(now))
}

export function formatDday(date: string, now: Date = new Date()): string {
  const days = getDaysUntil(date, now)
  if (days === 0) return 'D-Day'
  if (days > 0) return `D-${days}`
  return `D+${Math.abs(days)}`
}

export function isUpcomingWithinDays(date: string, days: number, now: Date = new Date()): boolean {
  const remaining = getDaysUntil(date, now)
  return remaining >= 0 && remaining <= days
}

export function isAuctionActive(item: AuctionItem, now: Date = new Date()): boolean {
  return item.status !== 'closed' && getDaysUntil(item.auctionDate, now) >= 0
}

export function isAuctionUrgent(item: AuctionItem, now: Date = new Date()): boolean {
  return isAuctionActive(item, now) && isUpcomingWithinDays(item.auctionDate, 7, now)
}

export function getEffectiveAuctionStatus(item: AuctionItem, now: Date = new Date()): AuctionStatus {
  if (!isAuctionActive(item, now)) return 'closed'
  if (isAuctionUrgent(item, now)) return 'urgent'
  return item.status === 'urgent' ? 'new' : item.status
}

export function getSummaryMetrics(items: AuctionItem[], now: Date = new Date()) {
  const activeItems = items.filter((item) => isAuctionActive(item, now))
  return {
    seoul: activeItems.filter((item) => item.city === '서울').length,
    busan: activeItems.filter((item) => item.city === '부산').length,
    newThisWeek: items.filter((item) => isInCurrentSeoulWeekToNow(item.firstSeenAt, now)).length,
    failedThisWeek: items.filter((item) => isInCurrentSeoulWeekToNow(item.failedAt, now)).length,
    upcoming: activeItems.filter((item) => isUpcomingWithinDays(item.auctionDate, 7, now)).length,
  }
}

export function formatDate(date: string | null): string {
  if (!date) return '확인 필요'
  const dateKey = normalizeToSeoulDateKey(date)
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: SEOUL_TIME_ZONE }).format(new Date(`${dateKey}T00:00:00+09:00`))
}

export const riskLabel = (risk: RiskLevel) => ({ low: '낮음', medium: '보통', high: '높음', unknown: '확인 필요' })[risk]
export const statusLabel = (status: AuctionStatus) => ({ new: '신건', failed: '유찰', urgent: '입찰임박', closed: '종료' })[status]
