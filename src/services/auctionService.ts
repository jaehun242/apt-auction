import { auctionData } from '../data/auctionData'
import type { AuctionItem } from '../types/auction'

export interface AuctionDataSource {
  getAuctions(): Promise<AuctionItem[]>
}

class SampleAuctionDataSource implements AuctionDataSource {
  async getAuctions(): Promise<AuctionItem[]> {
    return auctionData
  }
}

const dataSource: AuctionDataSource = new SampleAuctionDataSource()

export async function getAuctions(): Promise<AuctionItem[]> {
  return dataSource.getAuctions()
}
