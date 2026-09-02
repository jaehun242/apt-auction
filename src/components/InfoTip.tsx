import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

interface InfoTipProps {
  label: string
  children: ReactNode
  wide?: boolean
}

export function InfoTip({ label, children, wide = false }: InfoTipProps) {
  return (
    <details
      className={`info-tip ${wide ? 'wide' : ''}`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <summary aria-label={`${label} 설명 보기`} title={`${label} 설명`}><Info size={12} aria-hidden="true" /></summary>
      <div className="info-tip__content" role="tooltip"><strong>{label}</strong><span>{children}</span></div>
    </details>
  )
}
