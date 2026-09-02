# semo-front-service

`semo-front-service`는 Semo의 실제 사용자/관리자 Next.js 앱입니다. 현재 코드는 로그인 셸만 있는 상태가 아니라, 클럽 생성/탐색/가입부터 사용자 홈, 관리자 홈, `/more` 기능 모듈, 운영 메뉴 편집까지 연결된 상태입니다.

## Code Truth Summary

- 인증
  - `USER`, `ADMIN` 아이디 로그인 + `USER` 회원가입 + Gateway OAuth 로그인
  - 전역 `ADMIN`도 로그인할 수 있지만 클럽 운영 권한은 클럽 멤버십의 `OWNER`/`ADMIN` 역할을 따름
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

- Next.js `16.3.4`
- React `19.2.3`
- TypeScript `5.x`
- Tailwind CSS `4.x`
- Motion `12.35.x` (`motion/react`)
- `@dnd-kit` 기반 정렬/재배치 UI
- ESLint `9` + `eslint-config-next 16.3.4`
- React Compiler 활성화 (`next.config.ts`)

공통 API 호출은 `app/lib/api.ts`의 `axios` 래퍼가 기준입니다.

## Runtime and Environment

- 개발 포트: `3003`
- 기본 모드: `direct`
- Semo API base: `NEXT_PUBLIC_SEMO_API_URL` 기본값 `http://localhost:20280`
- Auth/OAuth base: `NEXT_PUBLIC_AUTH_API_URL` 기본값 `http://localhost:9000`
- Cloud Gateway 모드: `NEXT_PUBLIC_API_MODE=gateway`, `NEXT_PUBLIC_API_URL=http://localhost:8080`
- 이미지 base: `NEXT_PUBLIC_IMAGE_BASE_URL` 기본값 `http://localhost:8081`

예시:

```bash
NEXT_PUBLIC_API_MODE=direct
NEXT_PUBLIC_SEMO_API_URL=http://localhost:20280
NEXT_PUBLIC_AUTH_API_URL=http://localhost:9000
NEXT_PUBLIC_IMAGE_BASE_URL=http://localhost:8081
```

Cloud Gateway/Eureka 경유로 실행할 때는 다음처럼 전환합니다.

```bash
NEXT_PUBLIC_API_MODE=gateway
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Core Architecture

### Auth/session
- `AuthGate`
  - `/login`, `/auth/callback` 외 경로는 세션이 없으면 원래 경로를 보관하고 로그인으로 리다이렉트
- `AuthWatcher`
  - refresh 실패나 세션 만료 이벤트를 감지해 `/login?expired=1`로 이동
- `useAuthSession`
  - 포커스 복귀, online, pageshow, visibility change에서 세션 재동기화
  - React 19의 `useEffectEvent`와 `startTransition` 패턴을 적극 사용

### API/data flow
- `app/lib/api.ts`
  - direct/gateway 모드별 Semo API와 Auth API 주소 분리
  - direct 모드에서는 access token의 `X-User-Name`, `X-User-Key`, `X-User-Role`을 Semo API 요청에 전달
  - gateway 모드에서는 Gateway가 해당 헤더를 제거한 뒤 검증된 JWT 값으로 다시 주입
  - 공통 JSON 요청 래퍼
  - `401` 발생 시 `/auth/refresh` 재시도
  - `web-common-core`의 `{ success, code, message }` 래퍼와 일반 JSON 둘 다 처리
  - 에러 응답도 `data` 없는 공통 envelope으로 파싱합니다.
  - 보호 첨부 다운로드는 같은 인증/refresh 흐름의 binary 요청으로 처리합니다.
- `app/lib/clubs.ts`
  - semo 도메인 API 타입과 함수 집합
- `app/lib/imageUpload.ts`
  - 이미지 서버로 임시 업로드
- `app/lib/semo/attachment.ts`, `app/components/ResourceAttachmentPanel.tsx`
  - 일반 문서 파일은 이미지 서버에 임시 업로드한 뒤 SEMO 리소스에 등록
  - 다운로드는 최종 이미지 서버 URL을 직접 열지 않고 SEMO가 리소스 권한을 재검사하는 보호 API를 호출

### Feature modular navigation
- More 메뉴와 영구 허브는 `/api/semo/v1/clubs/{clubId}/more/summary`의 기능 순서, capability, 미처리 건수, 즐겨찾기, 최근 사용 정보를 기준으로 렌더링합니다.
- 관리자 메뉴 화면과 관리자 하단 `More` 메뉴는 enabled feature 순서를 저장합니다.
- 저장 후 `semo:club-features-updated` 이벤트로 네비게이션을 동기화합니다.
- `NOTICE`는 게시판, `SCHEDULE_MANAGE`·`POLL`·`ATTENDANCE`는 캘린더가 대표 화면입니다.
- 위 기능의 기존 `/more` URL은 북마크 호환을 위해 대표 화면으로 redirect하며 More 메뉴에는 중복 노출하지 않습니다.
- More에는 회비·정산, 업무, 대회, 대진표 초안, 회원 디렉터리, 비공개 피드백 등 독립 작업 흐름만 노출합니다.
- 하단 More는 빠른 이동 모달이고 `/clubs/{clubId}/more`, `/clubs/{clubId}/admin/more`는 확인 필요·즐겨찾기·최근 사용·전체 기능을 제공하는 영구 허브입니다.
- 관리자 모드의 사용자 화면 복귀는 콘텐츠를 가리는 FAB가 아니라 관리자 하단 내비게이션의 `사용자 모드` 항목으로 제공합니다.

### Dashboard / modal route pattern
- 홈은 위젯 API를 이용해 사용자 대시보드를 렌더링합니다.
- 일부 상세/수정 흐름은 전용 페이지가 아니라 route modal 패턴을 사용합니다.
  - 예: 공지 상세/수정, 일정 상세/수정, 투표 상세/수정, 대회 상세

### Visual identity and feedback
- `SemoBrandMark`는 로그인·루트 홈·로딩·오류 같은 앱 경계의 브랜드 표식입니다.
- `ClubGrowthCoreMark`는 앱 로고가 아니라 특정 모임의 멤버 수·활동·성장 기록을 표현하는 데이터 표식입니다. 티어별 보석은 `public/image/growth-gems/`의 생성 이미지 자산을 사용합니다. 티어를 보여주는 모든 위치에는 고정 크기 소재 보석, 최근 활동 기반 1~5개 반짝임, 보석 하단의 활성 멤버 규모 세모 0~5개를 함께 표시합니다. 멤버 수가 보석 크기를 바꾸지 않으며 보석의 광도도 활동량과 무관하게 고정합니다. 목록·공개 소개의 티어 표식은 키보드로도 선택 가능한 설명 트리거이고, 클럽 커버 오른쪽의 표식은 `/clubs/{clubId}/growth` 상세 화면으로 이동하는 링크입니다. 목록마다 `표시 설명` 배지를 반복하지 않고 마우스 오버·키보드 포커스의 테두리 변화로 상호작용을 알립니다. 공개 클럽 소개 모달에서는 대화상자를 중첩하지 않고 같은 모달 안에서 설명 화면으로 전환합니다. 클럽 내부 성장 상세 화면에서만 티어 보석 뒤에 게임 스탯형 성장 삼각을 배경 레이어로 겹쳐 표시합니다. `0/3`에서도 실선 시작 삼각을 유지하며, `함께`·`운영`·`이어짐`의 현재 달성점은 점선 사이를 보간하지 않고 33·66·100%를 넘을 때 해당 목표 꼭짓점으로 이동합니다. 축 이름과 달성 단계도 같은 목표 꼭짓점에 정렬합니다.
- `SemoMotionField`는 사용자/관리자 색을 따르는 삼각 배경장, 스크롤 진행선, 저속 부유 모션과 데스크톱 포인터 반응광을 제공하며 콘텐츠보다 뒤에서만 동작합니다.
- 페이지 헤더와 활성 하단 내비게이션은 공용 삼각 문법을 사용하며, 하단 내비게이션에는 아이콘과 텍스트 라벨을 함께 표시합니다.
- 유저 주색은 blue token, 관리자 주색은 orange token을 사용하고 기능 고유색은 상태·보조 강조에 제한합니다.
- 사용자 작업 화면은 `semo-page-user`, 운영 화면은 `semo-page-admin`, 대시보드·데이터 화면은 전용 폭 token을 사용해 데스크톱을 모바일 미리보기 폭으로 제한하지 않습니다.
- 공용 반경·그림자·간격·동작 시간 token을 우선하며, 본문·보조 정보는 최소 `text-xs`를 기준으로 유지합니다.
- toast는 비차단 피드백, alert는 닫을 수 있는 배너, confirm과 `RouteModal`은 포커스·스크롤을 관리하는 모달입니다.

### Shared input components
- 날짜 선택은 네이티브 `input[type="date"]` 대신 `app/components/DatePopoverField.tsx`를 공용 기준으로 사용합니다.
- 시간 선택은 네이티브 `input[type="time"]` 대신 `app/components/TimePopoverField.tsx`를 공용 기준으로 사용합니다.
- 이진 설정은 시각 트랙과 별도로 44px 조작 영역을 보장하는 `app/components/SemoSwitch.tsx`를 공용 기준으로 사용합니다.
- 신규 `semo` 폼에서 날짜·시간·이진 설정 입력이 필요하면 기존 화면 스타일만 맞추고, 입력 경험 자체는 위 공용 컴포넌트로 통일합니다.

## Route Map

### Public / auth
- `/`
  - 내 클럽 목록, 클럽 탐색, 가입 신청/취소, 검색
- `/login`
  - 아이디 로그인/회원가입, OAuth 진입, 기존 세션 복구
- `/auth/callback`
  - HttpOnly refresh cookie 교환, 역할/프로필 검증, 원래 경로 복귀
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
  - RSVP와 실제 출석 상태를 구분해 표시하며 `ATTENDANCE_MANAGE` capability가 있으면 멤버별 출석을 같은 화면에서 관리
- `/clubs/[clubId]/schedule/[eventId]/edit`
  - 일정 편집 route modal
- `/clubs/[clubId]/schedule/votes/[voteId]`
  - 투표 상세 route modal
- `/clubs/[clubId]/schedule/votes/[voteId]/edit`
  - 투표 편집 route modal
- `/clubs/[clubId]/profile`
  - 앱 프로필 + 클럽 프로필 편집
- `/clubs/[clubId]/profile/activity`
  - 기능 토글과 무관하게 본인이 수행한 활동만 조회

### User `/more`
- `/clubs/[clubId]/more`
  - 사용자별 미처리·지연 건수, 즐겨찾기, 최근 사용, capability 위임 도구를 제공하는 영구 허브
- `/clubs/[clubId]/more/notices`, `/more/schedules`, `/more/polls`, `/more/attendance`
  - 기존 링크 호환용이며 게시판 또는 캘린더 대표 화면으로 이동
- `/clubs/[clubId]/more/timeline`
  - 기존 링크 호환용이며 내 프로필 활동 내역으로 이동
- `/clubs/[clubId]/more/todos`
- `/clubs/[clubId]/more/join-requests`
  - 기존 링크 호환용이며 클럽 홈으로 이동; 가입 신청 접수·취소 상태는 루트 홈의 클럽 탐색에서 확인
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
- `/clubs/[clubId]/admin/more`
  - 관리자 또는 위임받은 운영자에게 허용된 도구만 모아 보여주는 영구 운영 허브
- `/clubs/[clubId]/admin/more/notices`, `/admin/more/schedules`, `/admin/more/polls`, `/admin/more/attendance`
  - 기존 링크 호환용이며 게시판 또는 캘린더 대표 화면으로 이동
- `/clubs/[clubId]/admin/more/timeline`
  - 기존 링크 호환용이며 항상 활성화된 관리자 감사 로그로 이동
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
  - 기존 링크 호환용이며 직책·권한 대표 화면의 멤버 탭으로 이동

## Feature Notes

### Home / dashboard
- 사용자 홈은 위젯 API로 공지, 일정, 투표, 프로필, 출석, 회비, 대회, 대진표 정보를 조합합니다.
- 모임 성장 코어는 모임 생성과 동시에 생기는 상시 기능입니다. 루트 홈의 내 클럽·탐색 카드와 공개 클럽 소개 모달에는 고정 크기 소재 보석·활성 멤버 규모 세모 0~5개·최근 활동 반짝임 1~5개를 표시합니다. 클럽 내부 홈은 상단 커버 오른쪽에 같은 요약 표식을 두고, 선택하면 `/clubs/{clubId}/growth` 상세 화면으로 이동합니다. 바깥 세 꼭짓점의 `함께`·`운영`·`이어짐` 진행은 이 상세 화면에서만 크게 표시하며 More 메뉴나 기능 토글에는 넣지 않습니다.
- 클럽 내부 성장 세모는 `0/3`의 실선 시작 삼각과 다음 소재까지 33%·66%·100%에 놓인 세 점선 목표를 표시합니다. 화면 상태는 `0/3`·`1/3`·`2/3`·`3/3`의 4단계이며, 각 축의 꼭짓점은 `0~32%=시작 삼각`, `33~65%=1단계`, `66~99%=2단계`, `100%=3단계`에만 놓입니다. 점선 사이에서는 움직이지 않으며 세 축 중 가장 낮은 달성 단계를 모임의 현재 단계로 사용합니다.
- 관리자 홈은 멤버 수, 승인 대기, 최근 활동, 운영 진입 액션을 보여줍니다.
- 가입 신청 접수·취소와 내 상태 확인은 루트 홈의 클럽 탐색에서 처리합니다. 클럽 내부 대기열은 관리자 canonical 경로인 `/admin/more/join-requests`에서만 운영합니다.
- 레거시 `/admin/join-requests`와 사용자 대기열 API는 제거했고, `/more/join-requests` 프론트 경로만 기존 링크 호환을 위해 클럽 홈으로 리다이렉트합니다.

### Board / schedule / poll
- 게시판 피드에는 공지, 일정, 투표, 대회가 섞여 노출될 수 있습니다.
- 게시글 읽음 상태를 별도 API로 조회합니다.
- 일정과 투표는 게시판/캘린더 공유 상태, 고정 여부, lifecycle 상태를 화면에서 함께 다룹니다.
- 게시판의 작성 버튼은 활성 기능과 실제 작성 권한에 따라 공지·일정·투표·대회 작성 모달을 제공합니다.
- 캘린더의 작성 버튼은 활성 기능과 실제 작성 권한에 따라 일정·투표 작성 모달을 제공합니다.
- 출석은 별도 세션 화면을 새로 늘리지 않고 일정 상세의 참석 응답으로 다룹니다.

### Tournament / bracket / finance / roles
- 대회는 사용자 작성 -> 관리자 승인 -> 개인/팀 참가 신청 -> 정원 초과 대기열 -> 참가 승인·참가비 -> 코트 시간표·체크인·결과 흐름을 가집니다.
- 승인된 대회의 핵심 내용이 수정되면 다시 승인 대기 상태로 돌아갑니다.
- 대진표 초안은 직접 작성 또는 승인된 대회 참가자 불러오기 후 제출/승인 흐름을 가지며 표준 시드 배치를 사용합니다.
- 관리자 기능 설정의 클럽 프리셋은 스포츠·학회·스터디별 기능, 홈 위젯과 위임 직책을 기존 설정에 추가합니다.
- 같은 화면의 운영 템플릿은 정기 모임, 월 회비, 대회, 신입 모집, 인수인계 업무와 체크리스트를 실제 생성합니다.
- 회비·정산은 사용자 조회·요청과 관리자 발행·납부·승인 흐름이 분리되며, 승인된 지출/환급 요청은 연결된 지출 장부로 자동 반영됩니다.
- 신규가입 신청자는 루트 홈에서 본인 상태를 확인하고, 관리자는 `/admin/more/join-requests`에서 전체 대기열의 승인/반려를 처리합니다.
- 회원 디렉터리는 사용자 `/more/members`에서 다른 회원을 보고, 관리자 `/admin/more/members`에서 직책/한줄소개/최근 활동 노출 여부를 설정합니다.
- 직책·권한은 끌 수 없는 `ADMIN_ONLY` 핵심 운영 기능입니다. `OWNER`/`ADMIN` 접근 등급은 거버넌스를 담당하고, 업무 직책은 기능 운영 책임과 표시·이력을 담당합니다. 생성·편집 화면은 원자 권한 체크박스 대신 검색 가능한 기능별 운영 수준을 서버에 저장하며, 재정 검토·수납·내보내기·마감 같은 민감 행위만 추가 승인으로 분리합니다. 정책 변경은 기존 직책에 자동 적용하지 않고 화면의 명시적 최신 정책 적용으로만 반영합니다. 기존 맞춤 권한 조합은 표준 수준을 선택하기 전까지 보존하고, 동시 수정은 직책 버전 충돌로 막습니다. 직책 사용 종료 시 현재 배정은 닫되 과거 보유 이력과 인수인계 참조는 보존합니다.
- 피드백은 기본 비공개이며 익명 제출자의 신원은 관리자에게도 노출하지 않습니다.
- 업무 삭제는 이력 보존을 위해 취소 상태 보관으로 처리하며, 신청이 진행 중인 업무는 먼저 신청을 정리해야 합니다.
- 업무·재정·피드백·인수인계·결정 기록의 첨부는 공개 범위 라벨을 표시하며, 다운로드 시에도 목록 조회와 동일한 권한 검사를 다시 거칩니다.

## Key Paths

- `app/page.tsx`
  - 홈, 내 클럽/탐색, 가입 신청 모달
- `app/login/page.tsx`
  - OAuth 진입, 세션 복구
- `app/auth/callback/page.tsx`
  - OAuth 성공 처리, 역할/프로필 검증
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
npm run verify:auth
npm run verify:ui
npm run build
npm run start
```

## Related Docs

- `AGENTS.md`
- `SEMO_MORE_FEATURE_GUIDE.md`
- `SEMO_UI_DESIGN_PROMPT.md`

## Verification Snapshot

- 2026-09-02 확인
  - `npm run lint` 성공
  - `npm run verify:auth` 성공
  - `npm run verify:ui` 성공 (66개 라우트, 214개 TSX UI 계약 검사, 11px 텍스트 0건)
  - `npm run build` 성공

## Source Notes

- App Router 페이지는 `params: Promise<...>` 패턴을 사용합니다.
- React 19 패턴을 이미 실전 코드에 사용 중입니다.
  - `useEffectEvent`
  - `startTransition`
  - `useDeferredValue`
- Motion은 `MotionConfig reducedMotion="user"`와 hydration-safe `useHydrationSafeReducedMotion` 경로를 함께 유지합니다.
- 이미지 로딩은 `next.config.ts`에서 로컬 이미지 서버와 원격 패턴을 허용합니다.
