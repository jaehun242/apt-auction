# 아파트 경매 지도

서울·부산의 아파트 법원경매 물건을 지도와 목록에서 함께 탐색하기 위한 React 대시보드의 1차 완성본입니다.

> 현재 화면에 표시되는 물건, 사건번호, 가격, 실거래가, 권리분석 및 점유 정보는 모두 기능 확인용 **샘플 데이터**입니다. 실제 경매 정보나 투자 판단 자료로 사용할 수 없습니다.

## 현재 구현 기능

- 서울/부산 진행 물건, 주간 신규·유찰, 7일 이내 입찰 요약 자동 계산
- 아파트명·주소·사건번호 검색
- 지역, 상태, 유찰 횟수 필터 및 5가지 정렬
- 필터 결과와 목록·지도 마커·표시 건수 동기화
- 네이버 Web Dynamic Map API의 `ncpKeyId` 인증 방식 적용
- 지도 마커와 목록 카드의 양방향 선택, 상태별 마커, 정보창
- 감정가·최저가·할인율·최근 실거래가·위험도·D-day 카드 표시
- 사실 데이터와 자동분석을 구분한 상세 모달
- API 키 누락, 지도 로딩 실패, 데이터 빈 상태 처리
- 데스크톱/태블릿/모바일 반응형 레이아웃
- GitHub Pages 자동 배포 워크플로

## 로컬 실행

Node.js 22 이상을 권장합니다.

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
```

## 네이버 지도 설정

NAVER Cloud Platform에서 새로운 Maps 상품의 **Web Dynamic Map**을 활성화하고, 로컬 프로젝트 루트에 `.env.local`을 만듭니다.

```env
VITE_NAVER_MAP_CLIENT_ID=발급받은_CLIENT_ID
```

지도 스크립트는 아래의 현재 인증 방식을 사용합니다.

```text
https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=CLIENT_ID
```

Client ID가 없거나 지도 로딩·인증이 실패해도 나머지 사이트 기능은 동작하며 지도 영역에 안내가 표시됩니다.

GitHub 저장소에는 다음 Repository Secret을 설정합니다.

- `NAVER_MAP_CLIENT_ID`: GitHub Actions 빌드에서 `VITE_NAVER_MAP_CLIENT_ID`로만 전달
- `NAVER_MAP_CLIENT_SECRET`: 향후 서버사이드 Geocoding 용도

**`NAVER_MAP_CLIENT_SECRET`은 브라우저 코드, `VITE_` 환경변수, HTML 또는 JavaScript 번들에 절대 넣지 마세요.** 현재 프론트엔드 빌드와 배포 워크플로에서는 Client Secret을 사용하지 않습니다.

## 프로젝트 구조

```text
src/
  components/          # 목록 카드, 네이버 지도, 상세 모달
  data/                # 명확히 표시된 샘플 데이터
  services/            # 교체 가능한 데이터 소스 계층
  types/               # 경매·권리·점유·문서 타입
  utils/               # 한국식 금액, 할인율, 날짜 계산
```

실데이터는 향후 `AuctionDataSource` 구현을 `public/data/auctions.json` 또는 API 기반으로 교체하여 연결할 수 있습니다.

## 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 `npm ci`, `npm run build`, Pages artifact 업로드 및 배포를 수행합니다.

- 배포 주소: https://jaehun242.github.io/apt-auction/
- Vite base path: `/apt-auction/`

## 향후 구현 예정

- 대한민국 법원 경매정보 수집 및 서울/부산 아파트 필터링
- 신규 물건 `first_seen_at` 기록과 유찰 변경 감지
- NAVER Geocoding을 통한 좌표 생성
- 국토교통부 아파트 실거래가 연동
- 법원 원문 문서 연결
- 등기·임차·점유 정보를 기반으로 한 자동 권리분석 고도화

실제 입찰 전에는 반드시 법원 원문, 등기사항, 현황조사서, 매각물건명세서와 전문가 검토가 필요합니다.
