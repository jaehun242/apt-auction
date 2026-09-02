import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AuctionApp from './AuctionApp'
import './styles.css'
import './enhancements.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuctionApp />
  </StrictMode>,
)
