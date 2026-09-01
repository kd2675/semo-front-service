"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubTournamentDetailClient } from "@/app/clubs/[clubId]/more/tournaments/clients/ClubTournamentDetailClient";
import { ClubTournamentEditorClient } from "@/app/clubs/[clubId]/more/tournaments/clients/ClubTournamentEditorClient";
import { ClubTournamentManageClient } from "@/app/clubs/[clubId]/more/tournaments/clients/ClubTournamentManageClient";
import {
  type ClubAdminTournamentHomeResponse,
  type ClubTournamentHomeResponse,
  type TournamentSummary,
} from "@/app/lib/clubs";
import { FAB_RIGHT_OFFSET_CLASS_NAME, getActionFabBottomClass } from "@/app/lib/fab";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import {
  getTournamentApprovalBadgeClassName,
  getTournamentApprovalLabel,
  getTournamentFeeLabel,
  getTournamentStatusBadgeClassName,
  getTournamentStatusLabel,
} from "@/app/lib/tournament";

type ClubTournamentHomeClientProps = {
  clubId: string;
  payload: ClubTournamentHomeResponse | ClubAdminTournamentHomeResponse;
  mode?: "user" | "admin";
  bracketEnabled?: boolean;
  onReload: () => void;
};

type UserTabKey = "FEATURED" | "MY" | "ARCHIVED";
type TournamentManagementEntryPoint = "approval" | "applications" | "review";

function isUserPayload(
  payload: ClubTournamentHomeResponse | ClubAdminTournamentHomeResponse,
): payload is ClubTournamentHomeResponse {
  return "featuredTournament" in payload;
}

function TournamentCard({
  tournament,
  onOpenDetail,
  onOpenManage,
}: {
  tournament: TournamentSummary;
  onOpenDetail: () => void;
  onOpenManage?: () => void;
}) {
  const approvalClassName = getTournamentApprovalBadgeClassName(tournament.approvalStatus);
  const approvalLabel = getTournamentApprovalLabel(tournament.approvalStatus);
  const statusClassName = getTournamentStatusBadgeClassName(tournament.tournamentStatus);
  const statusLabel = getTournamentStatusLabel(tournament.tournamentStatus);

  return (
    <div className="semo-card group w-full p-6 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-floating)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.22em] ${approvalClassName}`}>
              {approvalLabel}
            </span>
            {tournament.approvalStatus === "APPROVED" ? (
              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.22em] ${statusClassName}`}>
                {statusLabel}
              </span>
            ) : null}
          </div>
          <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900 transition group-hover:text-[var(--primary)]">
            {tournament.title}
          </h3>
        </div>
        <div className="min-w-[68px] rounded-[var(--radius-card)] bg-slate-100 px-3 py-3 text-center">
          <span className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {new Date(`${tournament.startDate}T00:00:00`).toLocaleDateString("ko-KR", { month: "short" })}
          </span>
          <span className="mt-1 block text-xl font-black text-[var(--primary)]">
            {new Date(`${tournament.startDate}T00:00:00`).getDate()}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">payments</span>
            {getTournamentFeeLabel(tournament)}
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">groups</span>
            {tournament.approvedApplicationCount}/{tournament.participantLimit ?? "∞"}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[var(--primary)]"
            style={{
              width: `${
                tournament.participantLimit
                  ? Math.min(100, (tournament.approvedApplicationCount / tournament.participantLimit) * 100)
                  : Math.min(100, tournament.approvedApplicationCount * 10)
              }%`,
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-700">{tournament.authorDisplayName}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">{tournament.tournamentPeriodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenManage ? (
            <button
              type="button"
              onClick={onOpenManage}
              className="semo-control border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-4 py-2 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/15"
            >
              관리하기
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenDetail}
            className="semo-control bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          >
            상세 보기
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminInsightTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="semo-card relative min-h-[140px] overflow-hidden p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-6 text-sm font-medium text-slate-500">{detail}</p>
      <div className="absolute -bottom-4 -right-4 opacity-10">
        <span className="material-symbols-outlined text-[88px]" aria-hidden="true">emoji_events</span>
      </div>
    </div>
  );
}

export function ClubTournamentHomeClient({
  clubId,
  payload,
  mode = "user",
  bracketEnabled = false,
  onReload,
}: ClubTournamentHomeClientProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const [activeTab, setActiveTab] = useState<UserTabKey>("FEATURED");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailTournamentId, setDetailTournamentId] = useState<string | null>(null);
  const [manageModalState, setManageModalState] = useState<{
    tournamentRecordId: string;
    initialSection: TournamentManagementEntryPoint;
  } | null>(null);
  const userPayload = isUserPayload(payload) ? payload : null;
  const hasModeSwitchFab = mode === "user" && payload.admin;

  const activeUserList = useMemo(() => {
    if (!userPayload) {
      return [];
    }
    switch (activeTab) {
      case "MY":
        return userPayload.myTournaments;
      case "ARCHIVED":
        return userPayload.archivedTournaments;
      default:
        return userPayload.tournaments;
    }
  }, [activeTab, userPayload]);

  const getUserManagementEntryPoint = (tournament: TournamentSummary): TournamentManagementEntryPoint | null => {
    if (!tournament.mine) {
      return null;
    }
    return tournament.approvalStatus === "APPROVED" ? "applications" : "approval";
  };

  const getAdminManagementEntryPoint = (tournament: TournamentSummary): TournamentManagementEntryPoint => (
    tournament.approvalStatus === "APPROVED" ? "approval" : "review"
  );

  return (
    <div className="min-h-full bg-[var(--background-light)] text-slate-900">
      <div className="semo-page-data relative flex min-h-full flex-col bg-[var(--background-light)]">
        <ClubPageHeader
          title={mode === "admin" ? "대회 관리" : "대회 센터"}
          subtitle={payload.clubName}
          icon="emoji_events"
          theme={mode === "admin" ? "admin" : "user"}
          containerClassName="semo-page-data"
        />

        <main className="semo-nav-bottom-space flex-1 px-4 pb-24 pt-6 md:px-6">
          {bracketEnabled ? (
            <section className="mb-5 flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-slate-200 bg-white px-5 py-4 shadow-[var(--shadow-card)]">
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900">대진표 초안</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  승인된 참가자를 불러와 시드 배치 초안을 만들고 검토합니다.
                </p>
              </div>
              <RouterLink
                href={mode === "admin" ? `/clubs/${clubId}/admin/more/brackets` : `/clubs/${clubId}/more/brackets`}
                className="semo-control shrink-0 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white"
              >
                열기
              </RouterLink>
            </section>
          ) : null}
          {mode === "user" && userPayload ? (
            <>
              <motion.section className="mb-8" {...staggeredFadeUpMotion(1, reduceMotion)}>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {[
                    { key: "FEATURED", label: "전체 대회" },
                    { key: "MY", label: "내가 만든 대회" },
                    { key: "ARCHIVED", label: "지난 대회" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      aria-pressed={activeTab === tab.key}
                      onClick={() => setActiveTab(tab.key as UserTabKey)}
                      className={`shrink-0 rounded-full px-6 py-2.5 text-sm font-black tracking-wide transition ${
                        activeTab === tab.key
                          ? "bg-[var(--primary)] text-white shadow-md"
                          : "bg-slate-200/70 text-slate-500 hover:bg-slate-300/80"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </motion.section>

              <motion.section
                className="relative mb-10 overflow-hidden rounded-[var(--radius-modal)] bg-[var(--primary)] p-8 text-white shadow-[var(--shadow-floating)]"
                {...staggeredFadeUpMotion(2, reduceMotion)}
              >
                <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-xl">
                    <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                      추천 대회
                    </span>
                    <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                      {userPayload.featuredTournament?.title ?? "새로운 대회를 준비해보세요"}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-white/80">
                      {userPayload.featuredTournament?.summaryText
                        ?? "모집 중인 대회와 내가 참여 중인 대회를 한 번에 확인할 수 있습니다."}
                    </p>
                    {userPayload.featuredTournament ? (
                      <div className="mt-5 flex flex-wrap items-center gap-6">
                        <div>
                          <p className="text-xs font-bold text-white/70">참가비</p>
                          <p className="mt-1 text-xl font-black">{getTournamentFeeLabel(userPayload.featuredTournament)}</p>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div>
                          <p className="text-xs font-bold text-white/70">기간</p>
                          <p className="mt-1 text-xl font-black">{userPayload.featuredTournament.tournamentPeriodLabel}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {userPayload.featuredTournament ? (
                    <button
                      type="button"
                      onClick={() => setDetailTournamentId(String(userPayload.featuredTournament?.tournamentRecordId))}
                      className="semo-control self-start bg-white px-7 py-3 text-sm font-bold text-[var(--primary)] shadow-sm transition hover:brightness-95 active:scale-[0.98] md:self-center"
                    >
                      상세 보기
                    </button>
                  ) : null}
                </div>
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              </motion.section>

              <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {activeUserList.length === 0 ? (
                  <div className="rounded-[var(--radius-modal)] border-2 border-dashed border-slate-300 bg-transparent p-8 text-center text-sm font-medium text-slate-500 md:col-span-2">
                    표시할 대회가 없습니다.
                  </div>
                ) : (
                  activeUserList.map((tournament, index) => (
                    <motion.div key={tournament.tournamentRecordId} {...staggeredFadeUpMotion(index + 3, reduceMotion)}>
                      <TournamentCard
                        tournament={tournament}
                        onOpenDetail={() => setDetailTournamentId(String(tournament.tournamentRecordId))}
                        onOpenManage={getUserManagementEntryPoint(tournament)
                          ? () => {
                              const initialSection = getUserManagementEntryPoint(tournament);
                              if (!initialSection) {
                                return;
                              }
                              setManageModalState({
                                tournamentRecordId: String(tournament.tournamentRecordId),
                                initialSection,
                              });
                            }
                          : undefined}
                      />
                    </motion.div>
                  ))
                )}
              </section>
            </>
          ) : (
            <>
              <motion.section className="grid grid-cols-1 gap-4 md:grid-cols-3" {...staggeredFadeUpMotion(1, reduceMotion)}>
                <AdminInsightTile
                  label="전체 대회"
                  value={payload.totalTournamentCount.toLocaleString("ko-KR")}
                  detail="현재 등록된 전체 대회 수"
                />
                <AdminInsightTile
                  label="승인 대기"
                  value={(payload as ClubAdminTournamentHomeResponse).pendingTournamentCount.toLocaleString("ko-KR")}
                  detail="관리자 승인을 기다리는 대회 수"
                />
                <AdminInsightTile
                  label="거절"
                  value={(payload as ClubAdminTournamentHomeResponse).rejectedTournamentCount.toLocaleString("ko-KR")}
                  detail="거절되어 작성자 확인이 필요한 대회 수"
                />
              </motion.section>

              <motion.section className="semo-card mt-8 px-5 py-5" {...staggeredFadeUpMotion(2, reduceMotion)}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-amber-700">검토 대기 목록</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">대회 승인 검토</h3>
                  </div>
                  <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                    {(payload as ClubAdminTournamentHomeResponse).pendingTournamentCount}건 대기
                  </span>
                </div>
              </motion.section>

              <section className="mt-8 space-y-4">
                {(payload as ClubAdminTournamentHomeResponse).tournaments.map((tournament, index) => (
                  <motion.div
                    key={tournament.tournamentRecordId}
                    className="semo-card flex w-full flex-col gap-4 p-5 text-left transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                    {...staggeredFadeUpMotion(index + 3, reduceMotion)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-16 items-center justify-center rounded-[var(--radius-card)] bg-slate-100 text-[var(--primary)]">
                        <span className="material-symbols-outlined text-[30px]" aria-hidden="true">emoji_events</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${getTournamentApprovalBadgeClassName(tournament.approvalStatus)}`}>
                            {getTournamentApprovalLabel(tournament.approvalStatus)}
                          </span>
                          {tournament.approvalStatus === "APPROVED" ? (
                            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${getTournamentStatusBadgeClassName(tournament.tournamentStatus)}`}>
                              {getTournamentStatusLabel(tournament.tournamentStatus)}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 text-lg font-black tracking-tight text-slate-900">{tournament.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">calendar_today</span>
                            {tournament.tournamentPeriodLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">person</span>
                            {tournament.authorDisplayName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setManageModalState({
                            tournamentRecordId: String(tournament.tournamentRecordId),
                            initialSection: getAdminManagementEntryPoint(tournament),
                          })}
                        className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-700 transition hover:bg-amber-100"
                      >
                        관리하기
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailTournamentId(String(tournament.tournamentRecordId))}
                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-slate-800"
                      >
                        상세 보기
                      </button>
                    </div>
                  </motion.div>
                ))}
              </section>
            </>
          )}
        </main>

        {mode === "user" && userPayload?.canCreate ? (
          <button
            type="button"
            aria-label="대회 생성"
            onClick={() => setShowCreateModal(true)}
            className={`fixed ${FAB_RIGHT_OFFSET_CLASS_NAME} ${getActionFabBottomClass(hasModeSwitchFab)} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-transform active:scale-95`}
            style={{ boxShadow: "0 10px 24px rgba(0,75,202,0.28)" }}
          >
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">add</span>
          </button>
        ) : null}

        {hasModeSwitchFab ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}

        <AnimatePresence>
          {showCreateModal ? (
            <RouteModal ariaLabel="대회 생성" onDismiss={() => setShowCreateModal(false)} dismissOnBackdrop={false}>
              <ClubTournamentEditorClient
                clubId={clubId}
                presentation="modal"
                onRequestClose={() => setShowCreateModal(false)}
                onSaved={(nextId) => {
                  setShowCreateModal(false);
                  onReload();
                  setDetailTournamentId(String(nextId));
                }}
              />
            </RouteModal>
          ) : null}
          {detailTournamentId ? (
            <RouteModal ariaLabel="대회 상세" onDismiss={() => setDetailTournamentId(null)}>
              <ClubTournamentDetailClient
                clubId={clubId}
                tournamentRecordId={detailTournamentId}
                mode={mode}
                presentation="modal"
                basePath={mode === "admin" ? `/clubs/${clubId}/admin/more/tournaments` : `/clubs/${clubId}/more/tournaments`}
                onRequestClose={() => setDetailTournamentId(null)}
              />
            </RouteModal>
          ) : null}
          {manageModalState ? (
            <RouteModal ariaLabel="대회 운영" onDismiss={() => setManageModalState(null)}>
              <ClubTournamentManageClient
                clubId={clubId}
                tournamentRecordId={manageModalState.tournamentRecordId}
                mode={mode}
                presentation="modal"
                initialSection={manageModalState.initialSection}
                basePath={mode === "admin" ? `/clubs/${clubId}/admin/more/tournaments` : `/clubs/${clubId}/more/tournaments`}
                onRequestClose={() => setManageModalState(null)}
                onDeleted={() => {
                  setManageModalState(null);
                  onReload();
                }}
              />
            </RouteModal>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
