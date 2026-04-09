# semo-front-service

`semo-front-service`는 Semo의 실제 사용자/관리자 Next.js 앱입니다. 현재 코드는 로그인 셸만 있는 상태가 아니라, 클럽 생성/탐색/가입부터 사용자 홈, 관리자 홈, `/more` 기능 모듈, 운영 메뉴 편집까지 연결된 상태입니다.

## Code Truth Summary

- 인증
  - Gateway OAuth 로그인
  - provider id: `naver-semo`, `kakao-semo`
  - access token 메모리 보관 + refresh 세션 복구
- 사용자 화면
  - 홈(`/`)
  - 로그인(`/login`)
  - 클럽 생성(`/clubs/create`)
  - 클럽 홈, 게시판, 일정, 프로필
  - `/more` 기능 화면
- 관리자 화면
  - 관리자 홈
  - 메뉴 관리
  - 멤버 관리
  - 신규가입 운영
  - 통계
  - 활동 로그
  - `/admin/more` 기능 화면

## Stack

- Next.js `16.1.6`
- React `19.2.3`
- TypeScript `5.x`
- Tailwind CSS `4.x`
- Motion `12.35.x` (`motion/react`)
- `@dnd-kit` 기반 정렬/재배치 UI
- ESLint `9` + `eslint-config-next 16.1.6`
- React Compiler 활성화 (`next.config.ts`)

공통 API 호출은 `app/lib/api.ts`의 `axios` 래퍼가 기준입니다.

## Runtime and Environment

- 개발 포트: `3003`
- API base: `NEXT_PUBLIC_API_URL` 기본값 `http://localhost:8080`
- 이미지 base: `NEXT_PUBLIC_IMAGE_BASE_URL` 기본값 `http://localhost:8081`

예시:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_IMAGE_BASE_URL=http://localhost:8081
```

## Core Architecture

### Auth/session
- `AuthGate`
  - `/login` 외 경로는 세션이 없으면 로그인으로 리다이렉트
- `AuthWatcher`
  - refresh 실패나 세션 만료 이벤트를 감지해 `/login?expired=1`로 이동
- `useAuthSession`
  - 포커스 복귀, online, pageshow, visibility change에서 세션 재동기화
  - React 19의 `useEffectEvent`와 `startTransition` 패턴을 적극 사용

### API/data flow
- `app/lib/api.ts`
  - 공통 JSON 요청 래퍼
  - `401` 발생 시 `/auth/refresh` 재시도
  - `web-common-core`의 `{ success, code, message }` 래퍼와 일반 JSON 둘 다 처리
  - 에러 응답도 `data` 없는 공통 envelope으로 파싱합니다.
- `app/lib/clubs.ts`
  - semo 도메인 API 타입과 함수 집합
- `app/lib/imageUpload.ts`
  - 이미지 서버로 임시 업로드

### Feature modular navigation
- More 메뉴는 하드코딩보다 `/api/semo/v1/clubs/{clubId}/features` 응답을 우선합니다.
- 관리자 메뉴 화면과 관리자 하단 `More` 메뉴는 enabled feature 순서를 저장합니다.
- 저장 후 `semo:club-features-updated` 이벤트로 네비게이션을 동기화합니다.

### Dashboard / modal route pattern
- 홈은 위젯 API를 이용해 사용자 대시보드를 렌더링합니다.
- 일부 상세/수정 흐름은 전용 페이지가 아니라 route modal 패턴을 사용합니다.
  - 예: 공지 상세/수정, 일정 상세/수정, 투표 상세/수정, 대회 상세

### Shared input components
- 날짜 선택은 네이티브 `input[type="date"]` 대신 `app/components/DatePopoverField.tsx`를 공용 기준으로 사용합니다.
- 시간 선택은 네이티브 `input[type="time"]` 대신 `app/components/TimePopoverField.tsx`를 공용 기준으로 사용합니다.
- 신규 `semo` 폼에서 날짜/시간 입력이 필요하면 기존 화면 스타일만 맞추고, 입력 경험 자체는 위 두 컴포넌트로 통일합니다.

## Route Map

### Public / auth
- `/`
  - 내 클럽 목록, 클럽 탐색, 가입 신청/취소, 검색
- `/login`
  - OAuth 진입, 토큰 복구, 프로필 초기화
- `/clubs/create`
  - 클럽 생성

### User club routes
- `/clubs/[clubId]`
  - 사용자 홈 대시보드
- `/clubs/[clubId]/board`
  - 게시판 피드
- `/clubs/[clubId]/board/[noticeId]`
  - 공지 상세 route modal
- `/clubs/[clubId]/schedule`
  - 달력/일정 overview
- `/clubs/[clubId]/schedule/[eventId]`
  - 일정 상세 route modal
- `/clubs/[clubId]/schedule/[eventId]/edit`
  - 일정 편집 route modal
- `/clubs/[clubId]/schedule/votes/[voteId]`
  - 투표 상세 route modal
- `/clubs/[clubId]/schedule/votes/[voteId]/edit`
  - 투표 편집 route modal
- `/clubs/[clubId]/profile`
  - 앱 프로필 + 클럽 프로필 편집

### User `/more`
- `/clubs/[clubId]/more/notices`
- `/clubs/[clubId]/more/notices/[noticeId]`
- `/clubs/[clubId]/more/notices/[noticeId]/edit`
- `/clubs/[clubId]/more/schedules`
- `/clubs/[clubId]/more/polls`
- `/clubs/[clubId]/more/polls/[voteId]`
- `/clubs/[clubId]/more/polls/[voteId]/edit`
- `/clubs/[clubId]/more/timeline`
- `/clubs/[clubId]/more/attendance`
- `/clubs/[clubId]/more/todos`
- `/clubs/[clubId]/more/join-requests`
- `/clubs/[clubId]/more/members`
- `/clubs/[clubId]/more/finance`
- `/clubs/[clubId]/more/tournaments`
- `/clubs/[clubId]/more/tournaments/[tournamentRecordId]`
- `/clubs/[clubId]/more/brackets`

### Admin core routes
- `/clubs/[clubId]/admin`
- `/clubs/[clubId]/admin/menu`
- `/clubs/[clubId]/admin/members`
- `/clubs/[clubId]/admin/stats`
- `/clubs/[clubId]/admin/logs`

### Admin `/more`
- `/clubs/[clubId]/admin/more/notices`
- `/clubs/[clubId]/admin/more/notices/[noticeId]`
- `/clubs/[clubId]/admin/more/notices/[noticeId]/edit`
- `/clubs/[clubId]/admin/more/schedules`
- `/clubs/[clubId]/admin/more/polls`
- `/clubs/[clubId]/admin/more/polls/[voteId]`
- `/clubs/[clubId]/admin/more/polls/[voteId]/edit`
- `/clubs/[clubId]/admin/more/timeline`
- `/clubs/[clubId]/admin/more/attendance`
- `/clubs/[clubId]/admin/more/todos`
- `/clubs/[clubId]/admin/more/join-requests`
- `/clubs/[clubId]/admin/more/members`
- `/clubs/[clubId]/admin/more/finance`
- `/clubs/[clubId]/admin/more/tournaments`
- `/clubs/[clubId]/admin/more/tournaments/[tournamentRecordId]`
- `/clubs/[clubId]/admin/more/brackets`
- `/clubs/[clubId]/admin/more/roles`
- `/clubs/[clubId]/admin/more/roles/new`
- `/clubs/[clubId]/admin/more/roles/[positionId]/edit`
- `/clubs/[clubId]/admin/more/roles/assignments`

## Feature Notes

### Home / dashboard
- 사용자 홈은 위젯 API로 공지, 일정, 투표, 프로필, 출석, 회비, 대회, 대진표 정보를 조합합니다.
- 관리자 홈은 멤버 수, 승인 대기, 최근 활동, 운영 진입 액션을 보여줍니다.
- 가입 신청은 루트 홈에서 접수하고, 클럽 내부에서는 `/more/join-requests`와 `/admin/more/join-requests`로 운영/조회 동선을 분리합니다.
- 레거시 `/admin/join-requests` 경로는 제거했고, 신규가입 관련 내부 동선은 모두 `more/join-requests` 기준으로 통일합니다.

### Board / schedule / poll
- 게시판 피드에는 공지, 일정, 투표, 대회가 섞여 노출될 수 있습니다.
- 게시글 읽음 상태를 별도 API로 조회합니다.
- 일정과 투표는 게시판/캘린더 공유 상태, 고정 여부, lifecycle 상태를 화면에서 함께 다룹니다.

### Tournament / bracket / finance / roles
- 대회는 사용자 작성 -> 관리자 승인 -> 참가 신청/승인 흐름을 가집니다.
- 대진표는 직접 작성 또는 대회 참가자 불러오기 후 제출/승인 흐름을 가집니다.
- 재정관리는 사용자 조회 화면과 관리자 발행/납부 처리 화면이 분리됩니다.
- 신규가입은 사용자 `/more/join-requests`에서 현재 대기열을 보고, 관리자 `/admin/more/join-requests`에서 승인/반려를 처리합니다.
- 회원 디렉터리는 사용자 `/more/members`에서 다른 회원을 보고, 관리자 `/admin/more/members`에서 직책/한줄소개/최근 활동 노출 여부를 설정합니다.
- 직책관리는 `ADMIN_ONLY` 기능으로, 직책 생성/수정/삭제와 멤버 할당 화면이 따로 있습니다.

## Key Paths

- `app/page.tsx`
  - 홈, 내 클럽/탐색, 가입 신청 모달
- `app/login/page.tsx`
  - OAuth callback 처리, 세션 복구, 프로필 초기화
- `app/lib/api.ts`
  - 공통 fetch 래퍼
- `app/lib/auth.ts`
  - token decode, refresh, logout
- `app/lib/clubs.ts`
  - semo API 타입/함수 집합
- `app/lib/imageUpload.ts`
  - 이미지 임시 업로드
- `app/components/DatePopoverField.tsx`
  - 공용 날짜 선택 팝오버
- `app/components/TimePopoverField.tsx`
  - 공용 시간 선택 팝오버
- `app/components/ClubBottomNav.tsx`
  - 사용자 More 메뉴
- `app/clubs/[clubId]/admin/AdminBottomNav.tsx`
  - 관리자 More 메뉴 + 정렬 저장
- `app/clubs/[clubId]/ClubDashboardFallbackClient.tsx`
  - 사용자 홈 위젯/편집
- `app/clubs/[clubId]/admin/menu/ClubAdminMenuClient.tsx`
  - 기능 on/off + 순서 편집

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm run build
npm run start
```

## Related Docs

- `AGENTS.md`
- `AGENTS_SEMO_MORE_FEATURE_CHECKLIST.md`

## Source Notes

- App Router 페이지는 `params: Promise<...>` 패턴을 사용합니다.
- React 19 패턴을 이미 실전 코드에 사용 중입니다.
  - `useEffectEvent`
  - `startTransition`
  - `useDeferredValue`
- Motion은 `MotionConfig reducedMotion="user"`와 `useReducedMotion` 경로를 함께 유지합니다.
- 이미지 로딩은 `next.config.ts`에서 로컬 이미지 서버와 원격 패턴을 허용합니다.
