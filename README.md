# S-MAP Front-end

S-MAP 생산관리 시스템의 프론트엔드 애플리케이션입니다. 주문, 생산계획, 자재, 라인, 리스크, AI 분석, 보고서, 관리자 기능을 제공하는 Vue 3 기반 SPA입니다.

## Tech Stack

- Vue 3
- Vue Router
- Vite
- Tailwind CSS
- Bootstrap
- FullCalendar
- Docker
- Nginx

## Getting Started

### Prerequisites

- Node.js 20 이상 권장
- npm

### Installation

```bash
npm install
```

### Environment Variables

로컬 실행 시 필요에 따라 프로젝트 루트에 `.env` 파일을 생성합니다.

```env
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://localhost:8080
```

| Name | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 브라우저에서 API를 직접 호출할 base URL입니다. 비워두면 현재 origin 기준으로 `/api`, `/ai`를 호출합니다. | `''` |
| `VITE_API_PROXY_TARGET` | Vite 개발 서버가 `/api`, `/ai` 요청을 프록시할 백엔드 주소입니다. | `http://localhost:8080` |

### Run

```bash
npm run dev
```

Vite 개발 서버가 실행되면 터미널에 표시되는 로컬 주소로 접속합니다.

### Build

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉터리에 생성됩니다.

### Preview

```bash
npm run preview
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite 개발 서버를 실행합니다. |
| `npm run build` | 운영 배포용 정적 파일을 빌드합니다. |
| `npm run preview` | 빌드 결과물을 로컬에서 미리 확인합니다. |

## Project Structure

```text
.
├── public/                 # 정적 리소스
├── src/
│   ├── assets/             # 이미지, 폰트 등 앱 리소스
│   ├── components/         # 공통 및 도메인별 UI 컴포넌트
│   ├── features/           # 기능 단위 화면, API, 상태, 유틸
│   ├── layouts/            # 사용자/관리자 레이아웃
│   ├── pages/              # 라우트 단위 페이지 컴포넌트
│   ├── styles/             # 전역 스타일
│   ├── utils/              # API 클라이언트, 스토리지 유틸
│   ├── App.vue
│   ├── main.js
│   └── router.js
├── Dockerfile
├── nginx.conf
├── vite.config.js
└── vercel.json
```

## Main Features

- 대시보드: 주문 및 납기 현황, 생산 스케줄, 라인 가동률 요약
- 주문 관리: 주문 목록 조회, 상세 확인, 등록
- 생산계획 관리: 계획 목록, 캘린더, AI 분석 화면 연계
- 자재 현황: 자재 재고 및 상태 조회
- 라인 현황: 라인별 가동 현황, 주문별 생산 라인 분배 조회
- 리스크 분석: 주문별 리스크 분석 및 원인 확인
- AI 분석: 생산계획 분석, 결과 확인, 대응안 상세 비교
- 보고서: 보고서 생성, 조회, 상세 확인, 내보내기, 메일 발송
- 관리자: 관리자 대시보드, 회원 등록, 사용자 조회

## Routing

주요 화면은 `src/router.js`에서 관리합니다.

| Path | Description |
| --- | --- |
| `/login` | 로그인 |
| `/` | 대시보드 |
| `/orders` | 주문 관리 |
| `/plan` | 생산계획 관리 |
| `/materials` | 자재 현황 |
| `/lines` | 라인 현황 |
| `/risk` | 리스크 분석 |
| `/ai/analysis` | AI 분석 |
| `/ai/result` | AI 분석 결과 |
| `/ai/detail` | 대응안 상세 비교 |
| `/reports` | 보고서 목록 |
| `/reports/:id` | 보고서 상세 |
| `/admin` | 관리자 대시보드 |
| `/admin/register` | 회원 등록 |
| `/admin/users` | 사용자 조회 |

## API

API 호출은 `src/utils/api.js`의 공통 클라이언트를 통해 처리합니다.

- 인증 토큰은 `localStorage`에 저장합니다.
- 인증이 필요한 요청에는 `Authorization: Bearer <token>` 헤더를 자동으로 추가합니다.
- 401 응답 발생 시 refresh token으로 access token을 한 번 재발급한 뒤 요청을 재시도합니다.
- 백엔드 공통 응답 형식의 `data` 필드를 우선 반환합니다.
- 개발 서버에서는 `/api`, `/ai` 요청을 `VITE_API_PROXY_TARGET`으로 프록시합니다.

## Deployment

### Docker

```bash
docker build -t s-map-front-end .
docker run --rm -p 8080:8080 s-map-front-end
```

Docker 이미지는 `npm run build`로 정적 파일을 생성한 뒤, Nginx로 `dist/` 결과물을 서빙합니다.

### Vercel

`vercel.json`에서 `/api`, `/ai` 요청을 배포 백엔드 주소로 rewrite합니다.

## Conventions

- 기능 단위 코드는 `src/features/<domain>` 아래에 배치합니다.
- 라우트 진입점은 `src/pages`에 두고, 실제 기능 구현은 `features`와 `components`로 분리합니다.
- 공통 UI는 `src/components/common`에 배치합니다.
- API 요청 JSON 필드는 camelCase를 사용합니다.
- 상태값은 화면 표시 문구가 아니라 백엔드와 합의된 코드값으로 전송합니다.
