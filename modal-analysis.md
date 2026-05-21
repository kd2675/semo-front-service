# Semo Modal / Overlay Analysis

<!-- Updated: 2026-05-21 -->

## Scope

이 문서는 `semo-front-service`의 모달, 알림, route modal, sheet 성격 UI를 현재 코드 기준으로 정리합니다.

기준 의존성:

- Next.js `16.1.6`
- React `19.2.3`
- TypeScript `5.9.3`
- Redux Toolkit `2.11.2`
- React Query `5.96.2`
- Motion `12.35.2` (`motion/react`)

## Global Modal System

전역 모달/알림은 Redux `modalSlice`와 `GlobalModalViewport`가 기준입니다.

관련 파일:

- `app/redux/slices/modalSlice.ts`
- `app/redux/modalCallbackRegistry.ts`
- `app/components/GlobalModalViewport.tsx`
- `app/components/modal/BasicAlert.tsx`
- `app/components/modal/BasicConfirm.tsx`
- `app/components/modal/BasicNoti.tsx`
- `app/components/modal/BasicToast.tsx`
- `app/hooks/useAppAlert.ts`
- `app/hooks/useAppConfirm.ts`
- `app/hooks/useAppNoti.ts`
- `app/hooks/useAppToast.ts`

전역 계열:

- `alert`: 확인형 알림
- `confirm`: 사용자 확인/취소
- `noti`: 우상단 알림
- `toast`: 짧은 상태 알림

콜백은 Redux serializable state에 직접 넣지 않고 `modalCallbackRegistry.ts`에 id로 등록합니다.

## Route Modal Pattern

상세/편집 화면 일부는 목록 위에 route modal로 뜹니다.

공통 파일:

- `app/components/RouteModal.tsx`
- `app/components/RouteModalPresence.tsx`

대표 사용처:

- 공지 상세/수정
  - `app/clubs/[clubId]/board/[noticeId]/ClubNoticeDetailRouteModal.tsx`
  - `app/clubs/[clubId]/more/notices/ClubNoticeDetailRouteModal.tsx`
  - `app/clubs/[clubId]/more/notices/ClubNoticeEditRouteModal.tsx`
- 일정 상세/수정
  - `app/clubs/[clubId]/schedule/[eventId]/ClubScheduleDetailRouteModal.tsx`
  - `app/clubs/[clubId]/schedule/[eventId]/edit/ClubScheduleEditRouteModal.tsx`
- 투표 상세/수정
  - `app/clubs/[clubId]/schedule/clients/ClubScheduleVoteDetailClient.tsx`
  - `app/clubs/[clubId]/more/polls/[voteId]/ClubPollDetailRouteModal.tsx`
  - `app/clubs/[clubId]/more/polls/[voteId]/edit/ClubPollEditRouteModal.tsx`
  - `app/clubs/[clubId]/admin/more/polls/[voteId]/ClubAdminPollDetailRouteModal.tsx`
  - `app/clubs/[clubId]/admin/more/polls/[voteId]/edit/ClubAdminPollEditRouteModal.tsx`
- 대회 상세
  - `app/clubs/[clubId]/more/tournaments/ClubTournamentDetailRouteModal.tsx`

## Feature-Specific Modal / Sheet UI

도메인별로 전용 모달이나 sheet가 추가됩니다.

- 일정
  - `app/clubs/[clubId]/schedule/modals/ScheduleActionConfirmModal.tsx`
- 할 일
  - `app/components/TodoApplicationManagerModal.tsx`
- 읽음 상태
  - `app/components/ItemReadStatusModal.tsx`
- 재정 관리
  - `app/clubs/[clubId]/admin/more/finance/components/financeModals.tsx`
  - `app/clubs/[clubId]/admin/more/finance/components/financePanels.tsx`
- 직책 관리
  - `app/clubs/[clubId]/admin/more/roles/components/RoleAssignmentSheet.tsx`
  - `app/clubs/[clubId]/admin/more/roles/components/RoleEditSheet.tsx`

## Motion and Accessibility Rules

- Motion은 `motion/react`를 사용합니다.
- 공통 motion preset은 `app/lib/motion.ts`를 우선 사용합니다.
- 모션 컴포넌트는 `useReducedMotion` 경로를 유지합니다.
- 커스텀 모달은 닫기 버튼, ESC 닫힘, 바깥 클릭, 모바일 스크롤, 포커스 복귀를 함께 확인해야 합니다.

## Current Assessment

현재 semo의 모달 구조는 크게 세 층입니다.

1. 전역 알림/확인: Redux + `GlobalModalViewport`
2. 라우트 기반 상세/편집: `RouteModal`
3. 기능 전용 운영 모달/sheet: 각 feature route 하위 컴포넌트

새 모달을 추가할 때는 전역성 여부를 먼저 판단합니다.

- 여러 화면에서 재사용되는 알림/확인은 전역 훅 사용
- URL로 복구되어야 하는 상세/편집은 route modal 사용
- 특정 기능 내부의 일회성 작업은 feature-local modal 또는 sheet 사용
