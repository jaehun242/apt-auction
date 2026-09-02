import type { AuctionItem } from '../types/auction'

type SearchableAuction = Pick<AuctionItem, 'apartmentName' | 'address' | 'caseNumber'>

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, '')
    .replaceAll('에스케이', 'sk')
    .replaceAll('엘지', 'lg')
    .replaceAll('아파트', '')
}

export function matchesAuctionSearch(item: SearchableAuction, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true
  return [item.apartmentName, item.address, item.caseNumber]
    .some((value) => normalizeSearchText(value).includes(normalizedQuery))
}
