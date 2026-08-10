# Semo More Features Implemented

<!-- Updated: 2026-08-10 -->

이 문서는 현재 코드 기준으로 구현된 `semo`의 `/more` 기능을 분석하고 설명합니다.

확인 기준:

- Frontend: Next.js `16.1.6`, React `19.2.3`, React Query `5.96.2`, Motion `12.35.2`
- Backend: Java `21`, Spring Boot `4.0.2`, Spring Cloud `2025.1.0`
- 기능 소스: `feature_catalog`, `feature_activation`, `/more` 라우트, `/admin/more` 라우트, 기능별 API, 기능별 DB 테이블
- 외부 공식 문서 확인은 하지 않았습니다. 이번 작업은 프레임워크 API 변경 구현이 아니라 현재 로컬 코드와 DB 정의를 기준으로 한 문서화 작업입니다.

## Overall Structure

`semo`의 `/more`는 단순 메뉴가 아니라 클럽별로 켜고 끄는 기능 모듈 구조입니다.

핵심 흐름:

1. `feature_catalog`가 전체 기능 목록을 정의합니다.
2. `feature_activation`이 클럽별 활성 상태와 정렬 순서를 저장합니다.
3. `GET /api/semo/v1/clubs/{clubId}/features`가 유저/관리자 경로를 포함한 기능 목록을 반환합니다.
4. 유저 하단 내비게이션은 활성 기능 중 `ADMIN_ONLY`가 아닌 기능의 `userPath`를 렌더링합니다.
5. 관리자 하단 내비게이션은 활성 기능의 `adminPath`를 렌더링하고, 드래그 정렬을 저장합니다.
6. 기능 저장 후 `ClubDashboardService.syncWidgetsForClub`가 홈 위젯 활성 상태를 동기화합니다.

주요 파일:

- `semo-back-service/src/main/java/semo/back/service/feature/clubfeature/biz/ClubFeatureService.java`
- `semo-back-service/src/main/resources/db/ddl/semo_ddl_all.sql`
- `semo-back-service/src/main/resources/db/seed/semo_seed_all.sql`
- `semo-front-service/app/components/ClubBottomNav.tsx`
- `semo-front-service/app/clubs/[clubId]/admin/AdminBottomNav.tsx`
- `semo-front-service/app/lib/semo/club.ts`

## Implemented Feature Catalog

현재 seed 기준 구현된 `/more` 기능은 12개입니다. 개인 활동과 관리자 감사 로그는 기능 토글과 분리된 핵심 기능입니다.

| Feature Key | 이름 | 범위 | 유저 경로 | 관리자 경로 | 상태 |
| --- | --- | --- | --- | --- | --- |
| `JOIN_REQUEST` | 신규가입 | 유저+관리자 | `/clubs/{clubId}/more/join-requests` | `/clubs/{clubId}/admin/more/join-requests` | 구현됨 |
| `NOTICE` | 공지관리 | 유저+관리자 | `/clubs/{clubId}/board` | `/clubs/{clubId}/board` | 구현됨 |
| `ATTENDANCE` | 일정 출석 | 유저+관리자 | `/clubs/{clubId}/schedule` | `/clubs/{clubId}/schedule` | 구현됨 |
| `POLL` | 투표 | 유저+관리자 | `/clubs/{clubId}/schedule` | `/clubs/{clubId}/schedule` | 구현됨 |
| `SCHEDULE_MANAGE` | 일정관리 | 유저+관리자 | `/clubs/{clubId}/schedule` | `/clubs/{clubId}/schedule` | 구현됨 |
| `TOURNAMENT_RECORD` | 대회기록 | 유저+관리자 | `/clubs/{clubId}/more/tournaments` | `/clubs/{clubId}/admin/more/tournaments` | 구현됨 |
| `BRACKET` | 대진표 | 유저+관리자 | `/clubs/{clubId}/more/brackets` | `/clubs/{clubId}/admin/more/brackets` | 구현됨 |
| `FINANCE` | 재정관리 | 유저+관리자 | `/clubs/{clubId}/more/finance` | `/clubs/{clubId}/admin/more/finance` | 구현됨 |
| `ROLE_MANAGEMENT` | 직책관리 | 관리자 전용 | 관리자 경로로 우회 | `/clubs/{clubId}/admin/more/roles` | 구현됨 |
| `MEMBER_DIRECTORY` | 회원 디렉터리 | 유저+관리자 | `/clubs/{clubId}/more/members` | `/clubs/{clubId}/admin/more/members` | 구현됨 |
| `FEEDBACK` | 피드백 | 유저+관리자 | `/clubs/{clubId}/more/feedback` | `/clubs/{clubId}/admin/more/feedback` | 구현됨 |
| `TODO` | 할 일 | 유저+관리자 | `/clubs/{clubId}/more/todos` | `/clubs/{clubId}/admin/more/todos` | 구현됨 |

`JOIN_REQUEST`는 `ClubFeatureService`에서 암묵적으로 활성화되는 기능입니다. 클럽별 `feature_activation` row가 없어도 기본 노출됩니다.

## Feature Details

### 1. 신규가입

신규가입 기능은 클럽 가입 신청과 운영자 승인 대기열을 다룹니다.

유저 기능:

- 가입 신청 상태 조회
- 가입 신청 취소
- 가입 메시지 기반 신청 흐름 확인

관리자 기능:

- 가입 신청 대기열 조회
- 가입 신청 승인 또는 반려

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/more/join-requests`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/join-requests`
- `PUT /api/semo/v1/clubs/{clubId}/admin/more/join-requests/{clubJoinRequestId}/review`
- `POST /api/semo/v1/clubs/{clubId}/join-requests`
- `DELETE /api/semo/v1/clubs/{clubId}/join-requests/me`

주요 DB:

- `club_join_request`
- `club_member`
- `club_profile`

분석:

- 탐색 후 가입 신청, 대기, 승인, 반려까지는 구현되어 있습니다.
- 초대 링크, QR, 일회성 초대코드 같은 빠른 초대 도메인은 아직 없습니다.

### 2. 공지관리

공지관리는 대표 게시판에서 공지를 작성하고, 게시판과 캘린더 공유 정책까지 함께 다루는 기능입니다.

유저/관리자 기능:

- 공지 목록 조회
- 공지 상세 조회
- 공지 생성, 수정, 삭제
- 고정 여부 관리
- 게시판 공유와 캘린더 공유
- 읽음 상태 기록

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/board/notices`
- `GET /api/semo/v1/clubs/{clubId}/board/notices/{noticeId}`
- `POST /api/semo/v1/clubs/{clubId}/board/notices`
- `PUT /api/semo/v1/clubs/{clubId}/board/notices/{noticeId}`
- `DELETE /api/semo/v1/clubs/{clubId}/board/notices/{noticeId}`
- `POST /api/semo/v1/clubs/{clubId}/board/items/{boardItemId}/read`

주요 DB:

- `club_notice`
- `club_board_item`
- `club_calendar_item`
- `club_board_item_read`

분석:

- 공지 자체와 게시판/캘린더 노출이 연결되어 있습니다.
- 공지/게시판/캘린더 공유 라벨 정책은 `AGENTS.md`와 `AGENTS_SEMO_MORE_FEATURE_CHECKLIST.md` 기준으로 중요합니다.

### 3. 일정 출석

출석 기능은 대표 캘린더의 일정 참가 응답과 현장 출석 확인을 하나의 운영 흐름으로 제공합니다. RSVP와 실제 출석은 의미가 다르므로 같은 원장 안에서 별도 상태로 보존합니다.

유저 기능:

- 일정별 `GOING`, `NOT_GOING`, `CANCELED` 참가 응답
- 일정 상세와 홈 위젯에서 내 실제 출석 상태 확인
- 최근 일정별 출석 기록 확인

운영자 기능:

- 일정 상세에서 전체 활성 멤버의 RSVP 상태 확인
- `PRESENT`, `LATE`, `ABSENT`, `EXCUSED` 실제 출석 기록
- 확인 시각, 확인자, 운영 메모 저장
- `ATTENDANCE_MANAGE` 직책 capability를 통한 출석 운영 위임

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/schedule/attendance/summary`
- `GET /api/semo/v1/clubs/{clubId}/schedule/events/{eventId}/attendance`
- `PUT /api/semo/v1/clubs/{clubId}/schedule/events/{eventId}/attendance/{clubProfileId}`

주요 DB:

- `club_schedule_event`
- `club_event_participant`

홈 위젯:

- `ATTENDANCE_STATUS`
- `ATTENDANCE_RECENT`

레거시 이관:

- event 연결이 있는 `club_attendance_record`는 명시적 migration으로 일정 참가자 원장에 이관합니다.
- 일정 연결 근거가 없는 `attendance_session`, `attendance_checkin`은 날짜만으로 임의 매칭하지 않고 미매핑 수를 검증한 뒤 수동 이관 또는 폐기합니다.
- 기존 `/more/attendance` 프론트 경로는 북마크 호환 redirect만 남으며 구형 일일 체크인 API와 클라이언트는 제거했습니다.

### 핵심 기능: 개인 활동과 관리자 감사 로그

활동 기록은 `/more` 카탈로그가 아니라 항상 동작하는 핵심 기능입니다.

유저 기능:

- 본인이 수행한 활동만 조회
- 커서 기반 목록 조회

관리자 기능:

- 전체 관리자 감사 로그 조회
- 직책 재임 기간 기준 필터

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/profile/activity`
- `GET /api/semo/v1/clubs/{clubId}/admin/activity`

주요 연계:

- `club_activity_log`
- 여러 기능별 도메인 데이터

분석:

- 개인 활동과 관리자 감사 로그는 기능 활성화와 무관하게 기록·조회됩니다.
- 기존 `/more/timeline` 프론트 경로는 북마크 호환용 리다이렉트만 유지합니다.
- “왜 이런 결정을 했는가”를 담는 결정 로그나 회의록 도메인은 아직 별도 구현이 아닙니다.

### 5. 투표

투표 기능은 대표 캘린더에서 클럽 투표를 만들고, 참여하고, 마감하는 흐름을 담당합니다.

유저/관리자 기능:

- 투표 목록 조회
- 투표 상세 조회
- 투표 생성, 수정, 삭제
- 투표 선택 제출
- 투표 마감
- 게시판/캘린더 공유

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/schedule/votes/summary`
- `GET /api/semo/v1/clubs/{clubId}/schedule/votes/{voteId}`
- `POST /api/semo/v1/clubs/{clubId}/schedule/votes`
- `PUT /api/semo/v1/clubs/{clubId}/schedule/votes/{voteId}`
- `DELETE /api/semo/v1/clubs/{clubId}/schedule/votes/{voteId}`
- `PUT /api/semo/v1/clubs/{clubId}/schedule/votes/{voteId}/selection`
- `PUT /api/semo/v1/clubs/{clubId}/schedule/votes/{voteId}/close`

주요 DB:

- `club_schedule_vote`
- `club_schedule_vote_option`
- `club_schedule_vote_selection`
- `club_board_item`
- `club_calendar_item`

홈 위젯:

- `POLL_STATUS`
- `POLL_PULSE`

분석:

- 현재 투표는 일정 도메인의 투표 테이블을 재사용하는 구조입니다.
- 투표 상태 라벨은 참여 여부가 아니라 lifecycle 기준으로 유지해야 합니다.

### 6. 일정관리

일정관리는 별도 More 홈 없이 대표 캘린더의 API와 화면에서 동작합니다.

유저/관리자 기능:

- 일정 홈 조회
- 월별 일정 조회
- 일정 상세 조회
- 일정 생성, 수정, 삭제
- 참석/불참 상태 제출
- 일정 투표 생성, 수정, 삭제, 선택 제출, 마감
- 게시판/캘린더 공유

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/schedule`
- `GET /api/semo/v1/clubs/{clubId}/schedule/events/{eventId}`
- `POST /api/semo/v1/clubs/{clubId}/schedule/events`
- `PUT /api/semo/v1/clubs/{clubId}/schedule/events/{eventId}`
- `DELETE /api/semo/v1/clubs/{clubId}/schedule/events/{eventId}`
- `PUT /api/semo/v1/clubs/{clubId}/schedule/events/{eventId}/participation`
- `GET /api/semo/v1/clubs/{clubId}/schedule/votes/{voteId}`
- `POST /api/semo/v1/clubs/{clubId}/schedule/votes`
- `PUT /api/semo/v1/clubs/{clubId}/schedule/votes/{voteId}`
- `DELETE /api/semo/v1/clubs/{clubId}/schedule/votes/{voteId}`
- `PUT /api/semo/v1/clubs/{clubId}/schedule/votes/{voteId}/selection`
- `PUT /api/semo/v1/clubs/{clubId}/schedule/votes/{voteId}/close`

주요 DB:

- `club_schedule_event`
- `club_event_participant`
- `club_schedule_vote`
- `club_schedule_vote_option`
- `club_schedule_vote_selection`
- `club_calendar_item`
- `club_board_item`

홈 위젯:

- `SCHEDULE_OVERVIEW`
- `SCHEDULE_INSIGHT`

분석:

- 일정·투표·RSVP는 대표 캘린더의 단일 화면과 API 계약을 사용합니다.
- 기존 `/more/schedules`, `/more/polls` 프론트 경로는 북마크 호환용 리다이렉트만 유지합니다.

### 7. 대회기록

대회기록은 멤버가 대회를 작성하고, 관리자가 대회를 승인한 뒤 참가 신청과 참가자 운영을 진행하는 기능입니다.

유저 기능:

- 대회 목록 조회
- 대회 상세 조회
- 대회 생성, 수정
- 대회 취소
- 참가 신청
- 내 참가 신청 취소
- 작성자가 참가 신청 승인/거절

관리자 기능:

- 대회 승인 대기열 조회
- 대회 승인/거절
- 대회 삭제

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/more/tournaments`
- `GET /api/semo/v1/clubs/{clubId}/more/tournaments/{tournamentRecordId}`
- `POST /api/semo/v1/clubs/{clubId}/more/tournaments`
- `PUT /api/semo/v1/clubs/{clubId}/more/tournaments/{tournamentRecordId}`
- `PUT /api/semo/v1/clubs/{clubId}/more/tournaments/{tournamentRecordId}/cancel`
- `POST /api/semo/v1/clubs/{clubId}/more/tournaments/{tournamentRecordId}/applications`
- `DELETE /api/semo/v1/clubs/{clubId}/more/tournaments/{tournamentRecordId}/applications/me`
- `PUT /api/semo/v1/clubs/{clubId}/more/tournaments/{tournamentRecordId}/applications/{tournamentApplicationId}/review`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/tournaments`
- `PUT /api/semo/v1/clubs/{clubId}/admin/more/tournaments/{tournamentRecordId}/review`
- `DELETE /api/semo/v1/clubs/{clubId}/admin/more/tournaments/{tournamentRecordId}`

주요 DB:

- `tournament_record`
- `tournament_application`

홈 위젯:

- `TOURNAMENT_RECORD_LATEST`
- `TOURNAMENT_RECORD_MINE`

분석:

- 승인 전/승인 후 흐름이 분리되어 있습니다.
- 승인된 대회만 일반 멤버에게 노출되는 정책을 전제로 합니다.
- 신청자 승인 후 참가 선수가 되는 모델입니다.

### 8. 대진표

대진표 기능은 직접 작성 또는 승인된 대회 참가자를 불러와 초안을 만들고, 관리자 승인을 받는 구조입니다.

유저 기능:

- 대진표 홈 조회
- 대진표 상세 조회
- 대진표 초안 생성
- 대진표 초안 수정
- 대진표 제출
- 직접 참가자 작성
- 대회 참가자 불러오기

관리자 기능:

- 대진표 승인 대기열 조회
- 대진표 승인/반려
- 대진표 삭제

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/more/brackets`
- `GET /api/semo/v1/clubs/{clubId}/more/brackets/{bracketRecordId}`
- `POST /api/semo/v1/clubs/{clubId}/more/brackets`
- `PUT /api/semo/v1/clubs/{clubId}/more/brackets/{bracketRecordId}`
- `PUT /api/semo/v1/clubs/{clubId}/more/brackets/{bracketRecordId}/submit`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/brackets`
- `PUT /api/semo/v1/clubs/{clubId}/admin/more/brackets/{bracketRecordId}/review`
- `DELETE /api/semo/v1/clubs/{clubId}/admin/more/brackets/{bracketRecordId}`

주요 DB:

- `bracket_record`
- `bracket_participant`

홈 위젯:

- `BRACKET_LATEST`

분석:

- 대회기록과 연결되는 경쟁 운영 기능입니다.
- 승인형 workflow를 갖고 있어 관리자가 최종 공개 상태를 통제할 수 있습니다.

### 9. 재정관리

재정관리는 회비/납부/요청/지출 장부를 다루는 비교적 넓은 운영 기능입니다.

유저 기능:

- 내 납부 대상 조회
- 내 재정 요청 목록 조회
- 재정 요청 생성

관리자 기능:

- 재정 홈 조회
- 회비/납부 의무 발행
- 납부 항목 목록 조회
- 납부자별 결제 상태 조회
- 납부 상태 변경
- 재정 요청 승인/거절
- 지출 장부 조회
- 지출 등록
- 발행 항목 삭제

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/more/finance`
- `GET /api/semo/v1/clubs/{clubId}/more/finance/requests`
- `POST /api/semo/v1/clubs/{clubId}/more/finance/requests`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/finance`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/finance/obligations`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/finance/obligations/{obligationId}/payments`
- `POST /api/semo/v1/clubs/{clubId}/admin/more/finance/obligations`
- `DELETE /api/semo/v1/clubs/{clubId}/admin/more/finance/obligations/{obligationId}`
- `PATCH /api/semo/v1/clubs/{clubId}/admin/more/finance/payments/{paymentId}/status`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/finance/requests`
- `POST /api/semo/v1/clubs/{clubId}/admin/more/finance/requests/{requestId}/review`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/finance/expenses`
- `POST /api/semo/v1/clubs/{clubId}/admin/more/finance/expenses`

주요 DB:

- `finance_obligation`
- `finance_payment`
- `finance_request`
- `finance_expense`

홈 위젯:

- `FINANCE_STATUS`
- `FINANCE_LEDGER`

분석:

- 운영 항목 발행, 납부 상태 관리, 요청 승인, 지출 장부까지 구현되어 있습니다.
- 영수증 파일, 입금 증빙, 결제 링크, 계좌 정보, 정산 리포트 내보내기는 아직 명확한 도메인/필드로 보이지 않습니다.

### 10. 직책관리

직책관리는 관리자 전용 기능으로, 직책과 하위 권한을 만들고 멤버에게 배정합니다.

관리자 기능:

- 직책 목록 조회
- 직책 생성
- 직책 상세 조회
- 직책 수정
- 직책 삭제
- 멤버별 직책 배정
- 직책 권한 그룹 조회와 권한 연결
- 직책 보유 이력 조회
- 잘못된 직책 이력 삭제

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/admin/more/roles`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/roles/{clubPositionId}`
- `POST /api/semo/v1/clubs/{clubId}/admin/more/roles`
- `PUT /api/semo/v1/clubs/{clubId}/admin/more/roles/{clubPositionId}`
- `DELETE /api/semo/v1/clubs/{clubId}/admin/more/roles/{clubPositionId}`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/roles/history`
- `DELETE /api/semo/v1/clubs/{clubId}/admin/more/roles/history/{positionHistoryId}`
- `PUT /api/semo/v1/clubs/{clubId}/admin/members/{clubMemberId}/positions`

주요 DB:

- `club_position`
- `feature_permission_catalog`
- `club_position_permission`
- `club_member_position`
- `club_member_position_history`

분석:

- 직책의 현재 상태뿐 아니라 보유 기간 이력까지 저장됩니다.
- 활동 로그는 직책 이력 기준으로 직책 필터를 적용할 수 있습니다.
- 집행부 term, 시즌, 인수인계 센터와는 아직 직접 연결되어 있지 않습니다.

### 11. 회원 디렉터리

회원 디렉터리는 멤버 목록, 직책, 자기소개, 최근 활동을 조회하는 기능입니다.

유저 기능:

- 회원 목록 조회
- 회원 프로필/직책/최근 활동 확인

관리자 기능:

- 디렉터리 설정 조회
- 디렉터리 설정 변경
- 관리자용 회원 디렉터리 조회

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/more/members`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/members`
- `PUT /api/semo/v1/clubs/{clubId}/admin/more/members`

주요 DB:

- `member_directory_setting`
- `club_member`
- `club_profile`
- `club_member_position`
- `club_member_position_history`

분석:

- 멤버 상태 조회와 직책 가시성에는 유용합니다.
- “누가 어떤 기간 동안 어떤 직책이었는지”는 직책관리의 이력과 함께 봐야 더 완성됩니다.

### 12. 피드백

피드백 기능은 멤버가 건의, 불편 신고, 개선 요청을 남기고 관리자가 답변/상태를 관리하는 흐름입니다.

유저 기능:

- 피드백 목록 조회
- 피드백 상세 조회
- 피드백 생성
- 익명/기명 visibility 선택
- 공개/비공개 범위 선택
- 관리자 답변 확인

관리자 기능:

- 피드백 전체 조회
- 피드백 상세 조회
- 상태 변경
- 운영 답변 작성

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/more/feedback`
- `GET /api/semo/v1/clubs/{clubId}/more/feedback/{feedbackId}`
- `POST /api/semo/v1/clubs/{clubId}/more/feedback`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/feedback`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/feedback/{feedbackId}`
- `PUT /api/semo/v1/clubs/{clubId}/admin/more/feedback/{feedbackId}`

주요 DB:

- `club_feedback`

분석:

- 멤버의 개선 요청과 관리자 응답이 도메인으로 분리되어 있습니다.
- 답변 알림이나 처리 기한 리마인더는 아직 별도 notification 도메인으로 보이지 않습니다.

### 13. 할 일

할 일 기능은 운영자가 업무를 만들고, 담당자를 지정하거나 멤버가 지원할 수 있게 하는 운영 업무 관리 기능입니다.

유저 기능:

- 할 일 목록 조회
- 지원 가능 업무 신청
- 내 지원 취소
- 바로 맡기
- 완료 처리

관리자 기능:

- 관리자 할 일 목록 조회
- 할 일 생성
- 할 일 수정
- 상태 변경
- 삭제
- 지원자 목록 조회
- 지원자 승인/거절
- 담당자 지정 또는 지원 가능 업무 전환

주요 API:

- `GET /api/semo/v1/clubs/{clubId}/more/todos`
- `POST /api/semo/v1/clubs/{clubId}/more/todos/{todoItemId}/claim`
- `POST /api/semo/v1/clubs/{clubId}/more/todos/{todoItemId}/apply`
- `DELETE /api/semo/v1/clubs/{clubId}/more/todos/{todoItemId}/applications/me`
- `POST /api/semo/v1/clubs/{clubId}/more/todos/{todoItemId}/complete`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/todos`
- `GET /api/semo/v1/clubs/{clubId}/admin/more/todos/{todoItemId}/applications`
- `PUT /api/semo/v1/clubs/{clubId}/admin/more/todos/{todoItemId}/applications/{todoItemApplicationId}/review`
- `POST /api/semo/v1/clubs/{clubId}/admin/more/todos`
- `PUT /api/semo/v1/clubs/{clubId}/admin/more/todos/{todoItemId}`
- `PUT /api/semo/v1/clubs/{clubId}/admin/more/todos/{todoItemId}/status`
- `DELETE /api/semo/v1/clubs/{clubId}/admin/more/todos/{todoItemId}`

주요 DB:

- `todo_item`
- `todo_item_application`

분석:

- 운영 업무 배정과 자원 신청 흐름이 구현되어 있습니다.
- 인수인계 센터가 생기면 미완료 업무의 핵심 입력 데이터가 됩니다.

## Cross Feature Capabilities

### Feature Activation

구현됨:

- 기능 카탈로그 조회
- 클럽별 기능 on/off 저장
- 활성 기능 정렬 저장
- 유저/관리자 더보기 메뉴 동기화
- 기능 저장 후 홈 위젯 동기화

API:

- `GET /api/semo/v1/clubs/{clubId}/features`
- `PUT /api/semo/v1/clubs/{clubId}/features`

DB:

- `feature_catalog`
- `feature_activation`

### Home Dashboard Widgets

구현됨:

- 사용자 홈 위젯 카탈로그
- 기능 활성 상태 기반 위젯 available 계산
- 관리자 편집 화면에서 위젯 on/off, 정렬, span, 제목 override 저장
- 기능 저장 후 위젯 동기화

주요 위젯:

- 공지/게시판: `BOARD_NOTICE`, `BOARD_STRIP`
- 일정: `SCHEDULE_OVERVIEW`, `SCHEDULE_INSIGHT`
- 투표: `POLL_STATUS`, `POLL_PULSE`
- 대회: `TOURNAMENT_RECORD_LATEST`, `TOURNAMENT_RECORD_MINE`
- 대진표: `BRACKET_LATEST`
- 출석: `ATTENDANCE_STATUS`, `ATTENDANCE_RECENT`
- 재정: `FINANCE_STATUS`, `FINANCE_LEDGER`
- 프로필: `PROFILE_SUMMARY`

DB:

- `dashboard_widget_catalog`
- `club_dashboard_widget`

### Activity Log

구현됨:

- 주요 운영 액션 활동 로그 기록
- 성공/실패 상태 기록
- 관리자 활동 로그 조회
- 커서 기반 목록 조회
- 직책 이력 기반 직책 필터
- 활동 당시 행위자 직책 표시

API:

- `GET /api/semo/v1/clubs/{clubId}/admin/activity`

DB:

- `club_activity_log`
- `club_member_position_history`

분석:

- “누가 무엇을 했는지”는 상당히 잘 쌓입니다.
- “왜 그렇게 결정했는지”, “다음 운영자가 무엇을 봐야 하는지”는 아직 별도 도메인이 필요합니다.

### Permission Model

구현됨:

- 기능별 권한 카탈로그
- 직책별 권한 연결
- 기능별 permission evaluator
- `OWNER`, `ADMIN`, 직책 기반 세부 권한 흐름

DB:

- `feature_permission_catalog`
- `club_position`
- `club_position_permission`
- `club_member_position`

현재 seed에 보이는 권한 예:

- 공지: `NOTICE_CREATE`, `NOTICE_UPDATE_SELF`, `NOTICE_DELETE_SELF`
- 투표: `POLL_CREATE`, `POLL_UPDATE_SELF`, `POLL_DELETE_SELF`
- 일정: `SCHEDULE_CREATE`, `SCHEDULE_UPDATE_SELF`, `SCHEDULE_DELETE_SELF`
- 대회: `TOURNAMENT_RECORD_CREATE`, `TOURNAMENT_RECORD_UPDATE_SELF`, `TOURNAMENT_RECORD_PIN`, `TOURNAMENT_RECORD_REVIEW`, `TOURNAMENT_RECORD_DELETE_ANY`
- 대진표: `BRACKET_CREATE`, `BRACKET_UPDATE_SELF`, `BRACKET_REVIEW`, `BRACKET_DELETE_ANY`
- 재정: `FINANCE_VIEW`, `FINANCE_ISSUE`, `FINANCE_MARK_PAID`, `FINANCE_MARK_WAIVED`
- 할 일: `TODO_VIEW`, `TODO_CREATE`, `TODO_ASSIGN`, `TODO_MANAGE_STATUS`, `TODO_DELETE_ANY`

## Current Product Reading

현재 `/more`는 이미 운영 도구 모음 수준까지 구현되어 있습니다.

강점:

- 기능 on/off 구조가 DB 기반입니다.
- 유저/관리자 경로가 기능 카탈로그에서 같이 내려옵니다.
- 대부분 기능이 유저 화면과 관리자 화면을 모두 가집니다.
- 재정, 할 일, 대회, 대진표처럼 운영성이 강한 기능이 이미 있습니다.
- 직책관리와 권한 카탈로그가 있어 운영 권한을 세분화할 수 있습니다.
- 활동 로그와 직책 이력이 연결되기 시작했습니다.

주의점:

- `more`는 기능 묶음이고, 일정처럼 기본 탭과 공유되는 도메인도 있습니다.
- `ROLE_MANAGEMENT`는 관리자 전용이므로 유저 메뉴에는 직접 노출하지 않는 것이 맞습니다.
- 현재 홈 위젯은 기능별 요약에 가깝고, “내가 지금 해야 할 일” 액션 큐는 아직 아닙니다.
- 활동 로그는 이벤트 기록이고, 결정 이유나 운영 메모를 보존하는 도메인은 아닙니다.

## Remaining Gaps Around More

현재 구현 상태 기준으로 `/more` 기능 자체는 넓지만, 다음 항목은 아직 제품 레벨에서 남아 있습니다.

1. 인수인계 센터
   - `roles + todos + finance + activity`를 한 화면에 묶는 운영 상태판이 없습니다.

2. 결정 로그
   - 회의록, 정책 변경 이유, 회비 변경 사유, 대회 기준 변경 사유를 기능과 연결하는 도메인이 없습니다.

3. term / season / executive group
   - 직책 보유 기간은 생겼지만, 집행부 term이나 시즌 단위로 업무/예산/대회를 묶는 상위 모델은 없습니다.

4. 사용자 액션 큐
   - 출석, 미응답 투표, 미납, 내 할 일, 대회 승인 상태, 피드백 답변을 하나로 합친 “지금 해야 할 일” API/화면은 없습니다.

5. notification / reminder
   - 프론트 toast/modal은 있지만 백엔드 알림 도메인, 푸시/리마인더 큐, 발송 이력은 보이지 않습니다.

6. 초대 기반 가입
   - 가입 신청은 구현되어 있지만 초대 링크, QR, 일회성 초대코드, 행사 당일 빠른 가입 흐름은 없습니다.

7. 재정 증빙
   - 영수증 파일, 입금 증빙, 결제 링크, 계좌 정보, 정산 리포트 내보내기는 아직 별도 구현이 약합니다.

## Suggested Next Documentation Split

추가 문서화가 필요하면 아래처럼 나누는 것이 좋습니다.

- `SEMO_MORE_API_MATRIX.md`: 기능별 API, request/response, 권한, 화면 매핑
- `SEMO_MORE_DB_MATRIX.md`: 기능별 테이블, 관계, 인덱스, soft delete 여부
- `SEMO_MORE_GAP_ROADMAP.md`: 인수인계 센터, 결정 로그, term/season, 알림, 액션 큐 구현 순서
