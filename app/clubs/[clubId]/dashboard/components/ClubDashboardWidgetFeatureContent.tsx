"use client";

import { useMemo } from "react";
import { RouterLink } from "@/app/components/RouterLink";
import {
  getTournamentFeeLabel,
  getTournamentFormatLabel,
  getTournamentStatusLabel,
} from "@/app/lib/tournament";
import { getScheduleItemDate } from "../utils/dashboardWidgetUtils";
import type { ClubDashboardWidgetCardProps } from "../types/dashboardWidgetTypes";

type FeatureContentProps = Pick<
  ClubDashboardWidgetCardProps,
  | "clubId"
  | "widget"
  | "boardData"
  | "boardLoading"
  | "boardError"
  | "scheduleData"
  | "scheduleLoading"
  | "scheduleError"
  | "tournamentData"
  | "tournamentLoading"
  | "tournamentError"
  | "bracketData"
  | "bracketLoading"
  | "bracketError"
>;

export function ClubDashboardWidgetFeatureContent({
  clubId,
  widget,
  boardData,
  boardLoading,
  boardError,
  scheduleData,
  scheduleLoading,
  scheduleError,
  tournamentData,
  tournamentLoading,
  tournamentError,
  bracketData,
  bracketLoading,
  bracketError,
}: FeatureContentProps) {
  const isBoardNoticeWidget = widget.widgetKey === "BOARD_NOTICE";
  const isBoardStripWidget = widget.widgetKey === "BOARD_STRIP";
  const isScheduleOverviewWidget = widget.widgetKey === "SCHEDULE_OVERVIEW";
  const isScheduleInsightWidget = widget.widgetKey === "SCHEDULE_INSIGHT";
  const isTournamentLatestWidget = widget.widgetKey === "TOURNAMENT_RECORD_LATEST";
  const isTournamentMineWidget = widget.widgetKey === "TOURNAMENT_RECORD_MINE";
  const isBracketLatestWidget = widget.widgetKey === "BRACKET_LATEST";
  const isBracketWorkbenchWidget = widget.widgetKey === "BRACKET_WORKBENCH";
  const latestNotice = boardData?.notices?.[0] ?? null;
  const boardStripNotices = boardData?.notices?.slice(0, 3) ?? [];
  const todayScheduleItems = useMemo(() => {
    if (!scheduleData) {
      return [];
    }

    const today = new Date();
    const todayLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}`;

    return scheduleData.items
      .filter((item) => {
        if (item.contentType === "SCHEDULE_EVENT" && item.event) {
          return item.event.startDate === todayLabel;
        }
        if (item.contentType === "SCHEDULE_VOTE" && item.vote) {
          return item.vote.voteStartDate === todayLabel;
        }
        if (item.contentType === "NOTICE" && item.notice?.scheduleAt) {
          return item.notice.scheduleAt.slice(0, 10) === todayLabel;
        }
        return false;
      })
      .slice(0, 3);
  }, [scheduleData]);
  const upcomingScheduleItems = useMemo(() => {
    if (!scheduleData) {
      return [];
    }

    const today = new Date();
    const todayLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}`;

    return [...scheduleData.items]
      .filter((item) => {
        const itemDate = getScheduleItemDate(item);
        return itemDate ? itemDate >= todayLabel : false;
      })
      .sort((left, right) => {
        const leftDate = getScheduleItemDate(left) ?? "";
        const rightDate = getScheduleItemDate(right) ?? "";
        return leftDate.localeCompare(rightDate);
      });
  }, [scheduleData]);
  const nextUpcomingScheduleItem = upcomingScheduleItems[0] ?? null;
  const pendingVoteCount = useMemo(() => {
    if (!scheduleData) {
      return 0;
    }

    return scheduleData.items.filter(
      (item) => item.contentType === "SCHEDULE_VOTE" && item.vote && item.vote.voteStatus !== "CLOSED",
    ).length;
  }, [scheduleData]);
  const upcomingEventCount = upcomingScheduleItems.filter((item) => item.contentType === "SCHEDULE_EVENT").length;
  const upcomingNoticeCount = upcomingScheduleItems.filter((item) => item.contentType === "NOTICE").length;
  const featuredTournament = tournamentData?.featuredTournament ?? null;
  const closestMyTournament = tournamentData?.myTournaments?.[0] ?? null;
  const myTournamentCount = tournamentData?.myTournaments.length ?? 0;
  const tournamentHero = closestMyTournament ?? featuredTournament ?? tournamentData?.tournaments?.[0] ?? null;
  const latestMyBracket = bracketData?.myBrackets?.[0] ?? null;
  const featuredBracket = bracketData?.featuredBracket ?? bracketData?.publishedBrackets?.[0] ?? null;
  const bracketHero = latestMyBracket ?? featuredBracket;
  const bracketHeroLabel = latestMyBracket?.mine ? "My Latest Bracket" : "Featured Bracket";

  if (isBoardNoticeWidget) {
    return (
      <div className="space-y-2">
        {boardLoading ? (
          <>
            <div className="h-4 w-28 rounded-full bg-slate-100" />
            <div className="h-5 w-full rounded-full bg-slate-100" />
            <div className="h-4 w-full rounded-full bg-slate-50" />
            <div className="h-4 w-2/3 rounded-full bg-slate-50" />
          </>
        ) : boardError ? (
          <p className="text-sm text-slate-500">최근 공지를 가져오지 못했습니다.</p>
        ) : latestNotice ? (
          <>
            {latestNotice.thumbnailUrl || latestNotice.imageUrl ? (
              <div className="overflow-hidden rounded-xl bg-slate-100">
                <div
                  className="h-28 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${latestNotice.thumbnailUrl ?? latestNotice.imageUrl}')` }}
                />
              </div>
            ) : null}
            <p className="text-xs font-semibold text-blue-600">최근 공지</p>
            <p className="line-clamp-2 text-base font-bold text-slate-900">{latestNotice.title}</p>
            <p className="line-clamp-2 text-sm text-slate-500">{latestNotice.summary}</p>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium text-slate-500">{latestNotice.author}</p>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                {latestNotice.timeAgo}
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-900">아직 등록된 공지가 없습니다.</p>
            <p className="text-xs text-slate-500">가장 최근 공지가 생기면 이 위젯에 바로 표시됩니다.</p>
          </>
        )}
      </div>
    );
  }

  if (isBoardStripWidget) {
    return (
      <div className="space-y-3">
        {boardLoading ? (
          <>
            <div className="h-4 w-24 rounded-full bg-slate-100" />
            <div className="h-16 w-full rounded-xl bg-slate-50" />
          </>
        ) : boardError ? (
          <p className="text-sm text-slate-500">공지 목록을 가져오지 못했습니다.</p>
        ) : boardStripNotices.length > 0 ? (
          <>
            {boardStripNotices.map((notice) => (
              <RouterLink
                key={`board-strip-${notice.id}`}
                href={`/clubs/${clubId}/board`}
                className="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-white px-3 py-3 shadow-sm transition-all hover:border-sky-300"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{notice.title}</p>
                  <p className="truncate text-xs text-slate-500">{notice.summary}</p>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-sky-600">{notice.timeAgo}</span>
              </RouterLink>
            ))}
          </>
        ) : (
          <p className="text-sm text-slate-500">최근 공지가 아직 없습니다.</p>
        )}
      </div>
    );
  }

  if (isScheduleOverviewWidget) {
    return (
      <div className="space-y-3">
        {scheduleLoading ? (
          <>
            <div className="h-4 w-24 rounded-full bg-slate-100" />
            <div className="h-16 w-full rounded-xl bg-slate-50" />
            <div className="h-16 w-full rounded-xl bg-slate-50" />
          </>
        ) : scheduleError ? (
          <p className="text-sm text-slate-500">오늘 일정을 가져오지 못했습니다.</p>
        ) : todayScheduleItems.length > 0 ? (
          <>
            <p className="text-xs font-semibold text-amber-600">오늘 일정</p>
            <div className="space-y-2">
              {todayScheduleItems.map((item) => {
                if (item.contentType === "SCHEDULE_EVENT" && item.event) {
                  return (
                    <RouterLink
                      key={`schedule-widget-event-${item.calendarItemId}`}
                      href={`/clubs/${clubId}/schedule/${item.event.eventId}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-[var(--primary)]/40"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                        <span className="material-symbols-outlined">edit_calendar</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{item.event.title}</p>
                        <p className="truncate text-xs text-slate-500">{item.event.locationLabel ?? item.event.dateLabel}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-slate-900">{item.event.timeLabel ?? "종일"}</p>
                        <p className="text-xs font-medium text-slate-400">일정</p>
                      </div>
                    </RouterLink>
                  );
                }

                if (item.contentType === "SCHEDULE_VOTE" && item.vote) {
                  return (
                    <RouterLink
                      key={`schedule-widget-vote-${item.calendarItemId}`}
                      href={`/clubs/${clubId}/schedule/votes/${item.vote.voteId}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-amber-500/40"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                        <span className="material-symbols-outlined">poll</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{item.vote.title}</p>
                        <p className="truncate text-xs text-slate-500">
                          {item.vote.votePeriodLabel}
                          {item.vote.voteTimeLabel ? ` · ${item.vote.voteTimeLabel}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-slate-900">{item.vote.totalResponses}명</p>
                        <p className="text-xs font-medium text-slate-400">투표</p>
                      </div>
                    </RouterLink>
                  );
                }

                if (item.contentType === "NOTICE" && item.notice) {
                  return (
                    <RouterLink
                      key={`schedule-widget-notice-${item.calendarItemId}`}
                      href={`/clubs/${clubId}/board/${item.notice.noticeId}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-sky-500/40"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                        <span className="material-symbols-outlined">campaign</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{item.notice.title}</p>
                        <p className="truncate text-xs text-slate-500">
                          {item.notice.locationLabel ?? item.notice.scheduleAtLabel ?? item.notice.timeAgo}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-slate-900">{item.notice.scheduleAtLabel ?? "공지"}</p>
                        <p className="text-xs font-medium text-slate-400">공지</p>
                      </div>
                    </RouterLink>
                  );
                }

                return null;
              })}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-900">오늘 일정이 없습니다.</p>
            <p className="text-xs text-slate-500">오늘 날짜에 연결된 일정, 투표, 공지가 최대 3개까지 표시됩니다.</p>
          </>
        )}
      </div>
    );
  }

  if (isScheduleInsightWidget) {
    return (
      <div className="space-y-3">
        {scheduleLoading ? (
          <>
            <div className="h-4 w-24 rounded-full bg-slate-100" />
            <div className="h-20 w-full rounded-xl bg-slate-50" />
          </>
        ) : scheduleError ? (
          <p className="text-sm text-slate-500">일정 지표를 가져오지 못했습니다.</p>
        ) : scheduleData ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-orange-50 px-3 py-3">
                <p className="text-xs font-bold text-orange-700">예정</p>
                <p className="mt-2 text-base font-bold text-slate-900">{upcomingScheduleItems.length}</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-3">
                <p className="text-xs font-bold text-amber-700">투표</p>
                <p className="mt-2 text-base font-bold text-slate-900">{pendingVoteCount}</p>
              </div>
              <div className="rounded-xl bg-sky-50 px-3 py-3">
                <p className="text-xs font-bold text-sky-700">공지</p>
                <p className="mt-2 text-base font-bold text-slate-900">{upcomingNoticeCount}</p>
              </div>
            </div>
            {nextUpcomingScheduleItem ? (
              <div className="rounded-xl border border-orange-100 bg-white px-3 py-3">
                <p className="text-xs font-semibold text-slate-500">다음 일정</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {nextUpcomingScheduleItem.contentType === "SCHEDULE_EVENT" && nextUpcomingScheduleItem.event
                    ? nextUpcomingScheduleItem.event.title
                    : nextUpcomingScheduleItem.contentType === "SCHEDULE_VOTE" && nextUpcomingScheduleItem.vote
                      ? nextUpcomingScheduleItem.vote.title
                      : nextUpcomingScheduleItem.contentType === "NOTICE" && nextUpcomingScheduleItem.notice
                        ? nextUpcomingScheduleItem.notice.title
                        : "예정된 항목"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {getScheduleItemDate(nextUpcomingScheduleItem)}
                  {upcomingEventCount > 0 ? ` · 이벤트 ${upcomingEventCount}건` : ""}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-500">일정 데이터가 아직 없습니다.</p>
        )}
      </div>
    );
  }

  if (isTournamentLatestWidget) {
    return (
      <div className="space-y-3">
        {tournamentLoading ? (
          <>
            <div className="h-4 w-28 rounded-full bg-slate-100" />
            <div className="h-24 w-full rounded-xl bg-slate-50" />
          </>
        ) : tournamentError ? (
          <p className="text-sm text-slate-500">대회 정보를 가져오지 못했습니다.</p>
        ) : tournamentHero ? (
          <RouterLink
            href={`/clubs/${clubId}/more/tournaments/${tournamentHero.tournamentRecordId}`}
            className="block rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                  {closestMyTournament ? "My Tournament" : "Featured Tournament"}
                </p>
                <p className="mt-2 line-clamp-2 text-base font-bold text-slate-900">{tournamentHero.title}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {getTournamentStatusLabel(tournamentHero.tournamentStatus)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {tournamentHero.tournamentPeriodLabel}
              {tournamentHero.locationLabel ? ` · ${tournamentHero.locationLabel}` : ""}
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50/60 px-3 py-2">
              <p className="text-xs font-medium text-slate-500">
                {getTournamentFormatLabel(tournamentHero.matchFormat)} · {tournamentHero.approvedApplicationCount}명 승인
              </p>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {getTournamentFeeLabel(tournamentHero)}
              </span>
            </div>
          </RouterLink>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-900">표시할 대회가 없습니다.</p>
            <p className="text-xs text-slate-500">대표 대회나 내가 참여 중인 대회가 생기면 이 위젯에 표시됩니다.</p>
          </>
        )}
      </div>
    );
  }

  if (isTournamentMineWidget) {
    return (
      <div className="space-y-3">
        {tournamentLoading ? (
          <>
            <div className="h-4 w-28 rounded-full bg-slate-100" />
            <div className="h-24 w-full rounded-xl bg-slate-50" />
          </>
        ) : tournamentError ? (
          <p className="text-sm text-slate-500">내 대회 현황을 가져오지 못했습니다.</p>
        ) : tournamentData ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-lime-50 px-3 py-3">
                <p className="text-xs font-bold text-lime-700">내 대회</p>
                <p className="mt-2 text-base font-bold text-slate-900">{myTournamentCount}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-3">
                <p className="text-xs font-bold text-emerald-700">진행 중</p>
                <p className="mt-2 text-base font-bold text-slate-900">{tournamentData.participatingCount}</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-3">
                <p className="text-xs font-bold text-amber-700">모집 중</p>
                <p className="mt-2 text-base font-bold text-slate-900">{tournamentData.recruitingCount}</p>
              </div>
            </div>
            {closestMyTournament ? (
              <div className="rounded-xl border border-lime-100 bg-white px-3 py-3">
                <p className="text-xs font-semibold text-slate-500">가장 가까운 내 대회</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{closestMyTournament.title}</p>
                <p className="mt-1 text-xs text-slate-500">{closestMyTournament.tournamentPeriodLabel}</p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-500">참여 중인 대회가 아직 없습니다.</p>
        )}
      </div>
    );
  }

  if (isBracketLatestWidget) {
    return (
      <div className="space-y-3">
        {bracketLoading ? (
          <>
            <div className="h-4 w-28 rounded-full bg-slate-100" />
            <div className="h-24 w-full rounded-xl bg-slate-50" />
          </>
        ) : bracketError ? (
          <p className="text-sm text-slate-500">대진표 정보를 가져오지 못했습니다.</p>
        ) : bracketHero ? (
          <RouterLink
            href={widget.userPath || `/clubs/${clubId}/more/brackets`}
            className="block rounded-xl border border-amber-100 bg-white p-4 shadow-sm transition-all hover:border-amber-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">{bracketHeroLabel}</p>
                <p className="mt-2 line-clamp-2 text-base font-bold text-slate-900">{bracketHero.title}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  bracketHero.approvalStatus === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700"
                    : bracketHero.approvalStatus === "PENDING"
                      ? "bg-amber-50 text-amber-700"
                      : bracketHero.approvalStatus === "REJECTED"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                }`}
              >
                {bracketHero.approvalStatus === "APPROVED"
                  ? "승인 완료"
                  : bracketHero.approvalStatus === "PENDING"
                    ? "승인 대기"
                    : bracketHero.approvalStatus === "REJECTED"
                      ? "반려"
                      : "초안"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {bracketHero.summaryText ??
                `${bracketHero.participantCount}명 참가 · ${bracketHero.sourceType === "TOURNAMENT" ? "대회 불러오기" : "직접 작성"}`}
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2">
              <p className="text-xs font-medium text-slate-500">
                {bracketHero.participantCount}명 참가
                {bracketHero.authorDisplayName ? ` · ${bracketHero.authorDisplayName}` : ""}
              </p>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-amber-700">
                {bracketHero.sourceType === "TOURNAMENT" ? "대회 연동" : "직접 작성"}
              </span>
            </div>
            {latestMyBracket && featuredBracket && latestMyBracket.bracketRecordId !== featuredBracket.bracketRecordId ? (
              <p className="mt-3 text-[11px] font-medium text-slate-400">공개 대진표: {featuredBracket.title}</p>
            ) : null}
          </RouterLink>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-900">표시할 대진표가 없습니다.</p>
            <p className="text-xs text-slate-500">승인된 대진표나 내 최신 작업이 생기면 이 위젯에 표시됩니다.</p>
          </>
        )}
      </div>
    );
  }

  if (isBracketWorkbenchWidget) {
    return (
      <div className="space-y-3">
        {bracketLoading ? (
          <>
            <div className="h-4 w-28 rounded-full bg-slate-100" />
            <div className="h-20 w-full rounded-xl bg-slate-50" />
          </>
        ) : bracketError ? (
          <p className="text-sm text-slate-500">대진표 지표를 가져오지 못했습니다.</p>
        ) : bracketData ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-emerald-50 px-3 py-3">
                <p className="text-xs font-bold text-emerald-700">승인</p>
                <p className="mt-2 text-base font-bold text-slate-900">{bracketData.approvedBracketCount}</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-3">
                <p className="text-xs font-bold text-amber-700">대기 중</p>
                <p className="mt-2 text-base font-bold text-slate-900">{bracketData.pendingBracketCount}</p>
              </div>
              <div className="rounded-xl bg-yellow-50 px-3 py-3">
                <p className="text-xs font-bold text-yellow-700">내 신청</p>
                <p className="mt-2 text-base font-bold text-slate-900">{bracketData.myBrackets.length}</p>
              </div>
            </div>
            {latestMyBracket ? (
              <div className="rounded-xl border border-yellow-100 bg-white px-3 py-3">
                <p className="text-xs font-semibold text-slate-500">최근 작업</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{latestMyBracket.title}</p>
                <p className="mt-1 text-xs text-slate-500">{latestMyBracket.participantCount}명 참가</p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-500">대진표 데이터가 아직 없습니다.</p>
        )}
      </div>
    );
  }

  return null;
}
