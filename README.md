# 아파트 경매 지도

대한민국 법원경매정보의 공개 검색 결과에서 서울·부산 아파트 진행 물건을 매일 수집해 지도와 목록으로 보여주는 React/Vite 사이트입니다.

## 구현 범위

- 서울·부산, 실행일~90일을 14일 이하 7개 구간으로 분할해 법원 용도코드 `20000 > 20100 > 20104` 아파트만 수집
- 각 구간 전체 페이지 저속 수집과 `법원코드 + 내부사건번호 + 물건번호` 그룹 중복 제거
- 사건번호, 법원, 주소, 아파트명, 면적, 감정가, 최저매각가, 유찰횟수, 매각기일 저장
- FIRST_SEEN, FAILED, AUCTION_DATE_CHANGED, MINIMUM_PRICE_CHANGED, STATUS_CHANGED, REMOVED 이력 저장
- 최초 적재 및 수집 정책 확대 backfill 물건은 `isBootstrapItem`으로 표시해 이번 주 신규에서 제외
- 0건 또는 기존 대비 50% 이상 급감 시 기존 정상 파일을 덮어쓰지 않는 fail-safe
- GitHub Actions에서만 NAVER Geocoding 실행, 주소별 좌표 캐시 및 실패 물건 보존
- 검색 시 공백·구두점·아파트 표기와 `SK ↔ 에스케이`, `LG ↔ 엘지` 별칭 정규화
- 매일 22:00 UTC(한국시간 다음 날 07:00) 자동 수집·테스트·빌드·커밋·Pages 배포

## 로컬 실행

Node.js 22 이상을 권장합니다.

```bash
npm ci
npm test
npm run build
npm run dev
```

로컬 화면은 기본적으로 `public/data/auctions.json`을 읽습니다. 개발 중에만 샘플을 명시적으로 사용하려면 다음 값을 설정합니다.

```env
VITE_SAMPLE_DATA=true
```

## 데이터 수집

```bash
npm run collect:auctions
```

수집 결과는 `public/data/auctions.json`, 비교 상태는 `data/auction-state.json`, 좌표 캐시는 `data/geocode-cache.json`에 저장됩니다. 로컬에서는 NAVER Geocoding을 실행하지 않으며, GitHub Actions의 캐시 미등록 주소만 서버에서 조회합니다.

상세 조사 근거와 운영 원칙은 [docs/data-source-investigation.md](docs/data-source-investigation.md)에 기록했습니다.

## GitHub Secrets

- `NAVER_MAP_CLIENT_ID`: Actions 서버의 Geocoding과 Pages의 Web Dynamic Map 공개 Client ID
- `NAVER_MAP_CLIENT_SECRET`: Actions 서버 Geocoding 전용 비밀키

Client Secret은 브라우저 코드, `VITE_` 환경변수, HTML 또는 빌드 산출물에 넣지 않습니다.

## 데이터 신뢰 범위

권리관계, 점유·명도, 체납관리비, 최근 실거래가와 안정적인 사건별 원문 문서 링크는 아직 연동하지 않았습니다. 사이트에는 추정값 대신 `확인 필요`로 표시합니다. 실제 입찰 전 법원 원문, 등기사항, 현황조사서, 매각물건명세서 및 전문가 검토가 필요합니다.

## 배포

- 사이트: https://jaehun242.github.io/apt-auction/
- 일반 코드 push: `.github/workflows/deploy.yml`
- 매일 데이터 갱신과 배포: `.github/workflows/update-auctions.yml`
