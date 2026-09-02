import { AlertTriangle, ExternalLink, FileText, ShieldCheck, X } from 'lucide-react'
import { useEffect } from 'react'
import type { AuctionDocuments, AuctionItem } from '../types/auction'
import { formatDate, formatKoreanCurrency, getPriceRatio, getRecentDealDiscount, riskLabel } from '../utils/auction'

interface DetailModalProps {
  item: AuctionItem
  onClose: () => void
}

const valueOrCheck = (value: string | null) => value ?? '확인 필요'
const assumedAmount = (value: number | null) => value === null ? '추가 확인 필요' : formatKoreanCurrency(value)

export function DetailModal({ item, onClose }: DetailModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const recentDiscount = getRecentDealDiscount(item)
  const documents: { label: string; key: keyof AuctionDocuments }[] = [
    { label: '매각물건명세서', key: 'saleSpecificationUrl' },
    { label: '현황조사서', key: 'statusReportUrl' },
    { label: '감정평가서', key: 'appraisalReportUrl' },
    { label: '법원 원문보기', key: 'courtUrl' },
  ]

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <header className="detail-header">
          <div>
            <div className="detail-kicker"><span className="sample-badge">샘플 데이터</span><span>{item.city} · {item.district}</span></div>
            <h2 id="detail-title">{item.apartmentName}</h2>
            <p>{item.address}</p>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="상세 창 닫기"><X size={20} /></button>
        </header>

        <div className="detail-warning"><AlertTriangle size={17} /><span>이 상세화면의 모든 물건 정보는 기능 확인용 샘플이며 실제 법원 경매 정보가 아닙니다.</span></div>

        <div className="detail-content">
          <DetailSection title="기본정보" kind="fact">
            <DataGrid rows={[
              ['아파트명', item.apartmentName], ['주소', item.address], ['사건번호', item.caseNumber], ['관할법원', item.court],
              ['동/층', item.buildingUnit ?? `${item.floor}층`], ['전용면적', `${item.exclusiveAreaM2}㎡`], ['감정가', formatKoreanCurrency(item.appraisalPrice)],
              ['최저매각가격', formatKoreanCurrency(item.minimumPrice)], ['유찰횟수', `${item.failedCount}회`], ['입찰일', formatDate(item.auctionDate)],
            ]} />
          </DetailSection>

          <DetailSection title="가격분석" kind="analysis">
            <div className="price-analysis-cards">
              <AnalysisPrice label="감정가" value={formatKoreanCurrency(item.appraisalPrice)} />
              <AnalysisPrice label="최저가" value={formatKoreanCurrency(item.minimumPrice)} highlight />
              <AnalysisPrice label="감정가 대비" value={`${getPriceRatio(item).toFixed(1)}%`} />
              <AnalysisPrice label="최근 실거래가" value={formatKoreanCurrency(item.recentDealPrice)} sub={formatDate(item.recentDealDate)} />
              <AnalysisPrice label="실거래 대비 할인율" value={recentDiscount === null ? '확인 필요' : `${recentDiscount.toFixed(1)}%`} />
            </div>
          </DetailSection>

          <DetailSection title="법원 원문 정보" kind="fact">
            <div className="document-grid">
              {documents.map(({ label, key }) => item.documents[key] ? (
                <a key={key} href={item.documents[key]!} target="_blank" rel="noreferrer"><FileText size={17} /><span>{label}</span><ExternalLink size={13} /></a>
              ) : (
                <button key={key} type="button" disabled><FileText size={17} /><span>{label}<small>실데이터 연결 후 제공</small></span></button>
              ))}
            </div>
          </DetailSection>

          <DetailSection title="자동 권리분석" kind="analysis">
            <DataGrid rows={[
              ['말소기준권리', valueOrCheck(item.rightsAnalysis.benchmarkRight)],
              ['말소기준권리 일자', formatDate(item.rightsAnalysis.benchmarkRightDate)],
              ['선순위 임차인', valueOrCheck(item.rightsAnalysis.seniorTenant)],
              ['후순위 임차인', valueOrCheck(item.rightsAnalysis.juniorTenant)],
              ['매각 후 존속권리', valueOrCheck(item.rightsAnalysis.survivingRights)],
              ['예상 인수금액', assumedAmount(item.rightsAnalysis.assumedAmount)],
              ['권리위험도', riskLabel(item.rightsAnalysis.riskLevel)],
              ['분석 메모', valueOrCheck(item.rightsAnalysis.notes)],
            ]} />
            <p className="analysis-disclaimer"><ShieldCheck size={15} /> 자동 분석 결과이며 실제 입찰 전 법원 원문 및 등기사항 확인이 필요합니다.</p>
          </DetailSection>

          <DetailSection title="점유 및 명도" kind="analysis">
            <DataGrid rows={[
              ['현재 점유자', valueOrCheck(item.occupancyAnalysis.occupant)],
              ['대항력 있는 임차인 여부', valueOrCheck(item.occupancyAnalysis.tenantOpposability)],
              ['명도위험도', riskLabel(item.occupancyAnalysis.evictionRisk)],
              ['확인사항', valueOrCheck(item.occupancyAnalysis.notes)],
            ]} />
          </DetailSection>

          <DetailSection title="추가비용" kind="analysis">
            <DataGrid rows={[
              ['체납관리비', item.additionalCosts.managementFeeAmount === null ? '확인 필요' : formatKoreanCurrency(item.additionalCosts.managementFeeAmount)],
              ['관리비 확인 상태', { confirmed: '확인됨', estimated: '추정치', unknown: '확인 필요' }[item.additionalCosts.managementFeeStatus]],
              ['예상 인수금액', assumedAmount(item.rightsAnalysis.assumedAmount)],
              ['기타 추가확인사항', valueOrCheck(item.additionalCosts.notes)],
            ]} />
          </DetailSection>
        </div>
      </section>
    </div>
  )
}

function DetailSection({ title, kind, children }: { title: string; kind: 'fact' | 'analysis'; children: React.ReactNode }) {
  return <section className="detail-section"><div className="section-title"><h3>{title}</h3><span className={`section-kind ${kind}`}>{kind === 'fact' ? '법원 원문 / 사실 데이터' : '자동분석'}</span></div>{children}</section>
}

function DataGrid({ rows }: { rows: [string, string][] }) {
  return <dl className="data-grid">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}

function AnalysisPrice({ label, value, sub, highlight = false }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return <div className={highlight ? 'highlight' : ''}><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>
}
