import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'

interface MetricGuideModalProps {
  onClose: () => void
}

const guideItems = [
  ['진행중', '향후 매각기일이 예정되어 현재 입찰 가능한 상태'],
  ['신규', '이번 주 월요일 00:00부터 현재까지 우리 사이트에서 처음 확인된 물건'],
  ['유찰', '입찰자가 없거나 매각이 성립되지 않아 다음 매각기일로 넘어간 물건'],
  ['입찰임박', '입찰일까지 7일 이하 남은 진행 중 물건'],
  ['유찰 횟수', '현재까지 매각이 성립되지 않아 재매각된 횟수'],
  ['감정가', '법원의 감정평가를 통해 정해진 평가금액'],
  ['최저매각가격', '현재 회차에서 입찰 가능한 최저가격'],
  ['감정가 대비', '현재 최저매각가격 ÷ 감정가. 감정가 10억원, 최저가 8억원이면 감정가 대비 80%이며 감정가보다 20% 낮습니다.'],
  ['최근 실거래가', '국토교통부 실거래 공개자료에서 확인한 동일 또는 유사 면적의 최근 거래가격입니다. 향후 실제 데이터를 연결할 예정입니다.'],
] as const

export function MetricGuideModal({ onClose }: MetricGuideModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="metric-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="metric-guide-modal" role="dialog" aria-modal="true" aria-labelledby="metric-guide-title">
        <header><div><span>용어와 계산 기준</span><h2 id="metric-guide-title">경매 상태 안내</h2></div><button type="button" onClick={onClose} aria-label="지표 설명 닫기"><X size={19} /></button></header>
        <div className="metric-guide-list">
          {guideItems.map(([term, description]) => <div key={term}><i aria-hidden="true" /><dl><dt>{term}</dt><dd>{description}</dd></dl></div>)}
        </div>
        <p className="metric-guide-caution"><AlertTriangle size={16} /> 경매정보 및 자동분석은 참고용입니다. 실제 입찰 전 법원 원문, 등기사항, 임차관계 등을 반드시 확인해야 합니다.</p>
      </section>
    </div>
  )
}
