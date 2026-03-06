# semo-front-service

Semo 사용자용 Next.js 앱입니다. 현재는 홈과 로그인 중심의 최소 인증 셸 상태입니다.

## 현재 구현 범위

- `/` 홈
- `/login` 로그인
- Gateway 기반 OAuth 로그인
- refresh/logout 유틸리티 제공

## 실행

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
```

## 포트

- 개발 서버: `3003`
- 프로덕션 시작: `3003`

## 환경 변수

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 인증 메모

- 로그인은 Gateway 기준 OAuth 경로를 사용합니다.
- 확인된 provider ID:
  - `naver-semo`
  - `kakao-semo`

## 기술 스택

- Next.js 16.1.6
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- Axios

## 연결 서비스

- Gateway: `cloud-back-server`
- 향후 Semo API 연동 전제
