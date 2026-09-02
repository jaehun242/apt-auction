import { sampleAuctions } from '../data/sampleAuctions'
import type { AuctionDataFile } from '../types/auction'

const DELAYED_AFTER_MS = 36 * 60 * 60 * 1000

function sampleData(): AuctionDataFile {
  const collectedAt = new Date().toISOString()
  return {
    schemaVersion: 1,
    metadata: {
      collectedAt,
      source: { name: '개발용 샘플 데이터', url: '' },
      status: 'NORMAL',
      total: sampleAuctions.length,
      seoul: sampleAuctions.filter((item) => item.city === '서울').length,
      busan: sampleAuctions.filter((item) => item.city === '부산').length,
    },
    items: sampleAuctions,
  }
}

export async function getAuctionData(): Promise<AuctionDataFile> {
  if (import.meta.env.DEV && import.meta.env.VITE_SAMPLE_DATA === 'true') return sampleData()

  const response = await fetch(`${import.meta.env.BASE_URL}data/auctions.json`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`경매 데이터 응답 오류: HTTP ${response.status}`)
  const payload = await response.json() as AuctionDataFile
  if (!payload?.metadata || !Array.isArray(payload.items) || payload.metadata.status === 'FAILURE') {
    throw new Error('경매 데이터 형식이 올바르지 않거나 수집에 실패했습니다.')
  }
  const collectedTime = new Date(payload.metadata.collectedAt).getTime()
  if (!Number.isFinite(collectedTime)) throw new Error('경매 데이터 수집 시각이 올바르지 않습니다.')
  if (Date.now() - collectedTime > DELAYED_AFTER_MS) {
    return { ...payload, metadata: { ...payload.metadata, status: 'DELAYED' } }
  }
  return payload
}
