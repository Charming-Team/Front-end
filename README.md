# S-MAP Front-end

S-MAP 생산관리 시스템의 프론트엔드 애플리케이션입니다. 사용자는 이 화면에서 주문, 생산계획, 자재, 라인, 리스크, AI 분석, 보고서, 관리자 기능을 사용할 수 있습니다.

이 레포는 S-MAP 전체 시스템 중 사용자 화면을 담당하며, Spring Boot Back-end와 FastAPI AI-server API를 호출하는 Vue 3 기반 SPA입니다.

## System Overview

상위 S-MAP 프로젝트는 다음 레포로 구성됩니다.

| Repository | Role | Main Stack |
| --- | --- | --- |
| `Front-end` | 사용자 화면, 라우팅, 인증 토큰 보관, API 호출 | Vue 3, Vite, Nginx |
| `Back-end` | 인증/권한, 주문, 생산계획, 자재, 라인, 보고서 API | Spring Boot, PostgreSQL |
| `AI-server` | 챗봇, 생산계획 최적화, 지연 예측, 리포트 생성, Risk Agent | FastAPI, CP-SAT, LLM/RAG |
| `Infra` | Kubernetes manifest, Ingress, ArgoCD 배포 설정 | Kubernetes, ArgoCD, ALB |

운영 환경에서는 Ingress가 요청 경로에 따라 서비스를 분기합니다.

| Path | Target |
| --- | --- |
| `/` | `frontend-service` |
| `/api/**` | `backend-service` |
| `/ai/**` | `fastapi-service` |

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
| `VITE_API_BASE_URL` | 브라우저에서 API를 호출할 base URL입니다. 비워두면 현재 origin 기준으로 `/api`, `/ai`를 호출합니다. | `''` |
| `VITE_API_PROXY_TARGET` | Vite 개발 서버가 `/api`, `/ai` 요청을 프록시할 대상 서버입니다. | `http://localhost:8080` |

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
├── Dockerfile              # 정적 빌드 및 Nginx 서빙 이미지
├── nginx.conf              # SPA fallback 설정
├── package.json
└── vite.config.js          # Vite 플러그인과 개발 proxy 설정
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
- 운영 환경에서는 Ingress가 `/api`는 Back-end, `/ai`는 AI-server로 라우팅합니다.

## Deployment

### Docker

```bash
docker build -t s-map-front-end .
docker run --rm -p 8080:8080 s-map-front-end
```

Docker 이미지는 `npm run build`로 정적 파일을 생성한 뒤, Nginx로 `dist/` 결과물을 서빙합니다. 컨테이너 내부 포트는 `8080`입니다.

### CI/CD

`main` 브랜치에 push되면 GitHub Actions workflow가 프론트엔드 이미지를 빌드하고 Harbor registry에 push합니다.

배포 반영 흐름은 다음과 같습니다.

```text
Front-end main push
-> GitHub Actions Docker build
-> Harbor registry push
-> Infra repository의 k8s/frontend/deployment.yaml image digest 갱신 PR 생성
-> Infra main 반영
-> ArgoCD가 Kubernetes manifest 동기화
-> ALB Ingress를 통해 서비스 노출
```

관련 파일:

| File | Description |
| --- | --- |
| `.github/workflows/docker-build-push.yml` | 프론트엔드 Docker 이미지 빌드 및 Harbor push |
| `Dockerfile` | Vite 빌드 후 Nginx unprivileged 이미지로 정적 파일 서빙 |
| `nginx.conf` | SPA 라우팅을 위한 `try_files` fallback |
| `Infra/k8s/frontend/deployment.yaml` | 프론트엔드 Kubernetes Deployment |
| `Infra/k8s/frontend/service.yaml` | 프론트엔드 Kubernetes Service |
| `Infra/k8s/ingress/ingress.yaml` | `/`, `/api`, `/ai` 라우팅 규칙 |
| `Infra/argocd/team12-infra-application.yaml` | ArgoCD Application 설정 |

## Conventions

- 기능 단위 코드는 `src/features/<domain>` 아래에 배치합니다.
- 라우트 진입점은 `src/pages`에 두고, 실제 기능 구현은 `features`와 `components`로 분리합니다.
- 공통 UI는 `src/components/common`에 배치합니다.
- API 요청 JSON 필드는 camelCase를 사용합니다.
- 상태값은 화면 표시 문구가 아니라 백엔드와 합의된 코드값으로 전송합니다.
