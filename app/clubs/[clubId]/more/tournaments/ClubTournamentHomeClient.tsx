"use client";

import { RouteModal } from "@/app/components/RouteModal";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubTournamentDetailClient } from "@/app/clubs/[clubId]/more/tournaments/ClubTournamentDetailClient";
import { ClubTournamentEditorClient } from "@/app/clubs/[clubId]/more/tournaments/ClubTournamentEditorClient";
import {
  type ClubAdminTournamentHomeResponse,
  type ClubTournamentHomeResponse,
  type TournamentSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import {
  getTournamentApprovalBadgeClassName,
  getTournamentApprovalLabel,
  getTournamentFeeLabel,
  getTournamentStatusBadgeClassName,
  getTournamentStatusLabel,
} from "@/app/lib/tournament";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState, type CSSProperties } from "react";

type ClubTournamentHomeClientProps = {
  clubId: string;
  payload: ClubTournamentHomeResponse | ClubAdminTournamentHomeResponse;
  mode?: "user" | "admin";
  onReload: () => void;
};

type UserTabKey = "FEATURED" | "MY" | "ARCHIVED";

function isUserPayload(
  payload: ClubTournamentHomeResponse | ClubAdminTournamentHomeResponse,
): payload is ClubTournamentHomeResponse {
  return "featuredTournament" in payload;
}

function TournamentCard({
  tournament,
  onOpen,
}: {
  tournament: TournamentSummary;
  onOpen: () => void;
}) {
  const approvalClassName = getTournamentApprovalBadgeClassName(tournament.approvalStatus);
  const approvalLabel = getTournamentApprovalLabel(tournament.approvalStatus);
  const statusClassName = getTournamentStatusBadgeClassName(tournament.tournamentStatus);
  const statusLabel = getTournamentStatusLabel(tournament.tournamentStatus);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-[28px] bg-white p-6 text-left shadow-[0_20px_40px_rgba(0,75,202,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(0,75,202,0.1)]"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${approvalClassName}`}>
              {approvalLabel}
            </span>
            {tournament.approvalStatus === "APPROVED" ? (
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${statusClassName}`}>
                {statusLabel}
              </span>
            ) : null}
          </div>
          <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900 transition group-hover:text-[var(--primary)]">
            {tournament.title}
          </h3>
        </div>
        <div className="min-w-[68px] rounded-[18px] bg-slate-100 px-3 py-3 text-center">
          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {new Date(`${tournament.startDate}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="mt-1 block text-xl font-black text-[var(--primary)]">
            {new Date(`${tournament.startDate}T00:00:00`).getDate()}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">payments</span>
            {getTournamentFeeLabel(tournament)}
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">groups</span>
            {tournament.approvedApplicationCount}/{tournament.participantLimit ?? "∞"}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#004bca_0%,#0061ff_100%)]"
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
        <span className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-sm font-black text-[var(--primary)]">
          {tournament.mine && tournament.approvalStatus !== "APPROVED" ? "검토 상태 보기" : "상세 보기"}
        </span>
      </div>
    </button>
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
    <div className="relative min-h-[140px] overflow-hidden rounded-[28px] bg-white p-6 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-6 text-sm font-medium text-slate-500">{detail}</p>
      <div className="absolute -bottom-4 -right-4 opacity-10">
        <span className="material-symbols-outlined text-[88px]">emoji_events</span>
      </div>
    </div>
  );
}

export function ClubTournamentHomeClient({
  clubId,
  payload,
  mode = "user",
  onReload,
}: ClubTournamentHomeClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [activeTab, setActiveTab] = useState<UserTabKey>("FEATURED");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailTournamentId, setDetailTournamentId] = useState<string | null>(null);
  const accent = mode === "admin" ? "#855300" : "#004bca";
  const background = "#f7f9fb";
  const userPayload = isUserPayload(payload) ? payload : null;

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

  return (
    <div
      className="min-h-full bg-[var(--background-light)] font-body text-slate-900"
      style={{ "--primary": accent, "--background-light": background } as CSSProperties}
    >
      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col bg-[var(--background-light)]">
        <ClubPageHeader
          title={mode === "admin" ? "대회 관리" : "대회 센터"}
          subtitle={payload.clubName}
          icon="emoji_events"
          theme={mode === "admin" ? "admin" : "user"}
          containerClassName={mode === "admin" ? "max-w-7xl" : "max-w-5xl"}
        />

        <main className="semo-nav-bottom-space flex-1 px-4 pb-24 pt-6 md:px-6">
          {mode === "user" && userPayload ? (
            <>
              <motion.section className="mb-8" {...staggeredFadeUpMotion(1, reduceMotion)}>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {[
                    { key: "FEATURED", label: "Featured" },
                    { key: "MY", label: "My Tournaments" },
                    { key: "ARCHIVED", label: "Archived" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
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
                className="relative mb-10 overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#004bca_0%,#0061ff_68%,#3c87ff_100%)] p-8 text-white shadow-[0_22px_58px_rgba(0,75,202,0.24)]"
                {...staggeredFadeUpMotion(2, reduceMotion)}
              >
                <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-xl">
                    <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
                      Featured Tournament
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
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Prize / Fee</p>
                          <p className="mt-1 text-xl font-black">{getTournamentFeeLabel(userPayload.featuredTournament)}</p>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Period</p>
                          <p className="mt-1 text-xl font-black">{userPayload.featuredTournament.tournamentPeriodLabel}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {userPayload.featuredTournament ? (
                    <button
                      type="button"
                      onClick={() => setDetailTournamentId(String(userPayload.featuredTournament?.tournamentRecordId))}
                      className="self-start rounded-full bg-white px-7 py-3 text-sm font-black text-[var(--primary)] shadow-sm transition hover:scale-[1.02] active:scale-[0.98] md:self-center"
                    >
                      View Details
                    </button>
                  ) : null}
                </div>
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              </motion.section>

              <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {activeUserList.length === 0 ? (
                  <div className="rounded-[28px] border-2 border-dashed border-slate-300 bg-transparent p-8 text-center text-sm font-medium text-slate-500 md:col-span-2">
                    표시할 대회가 없습니다.
                  </div>
                ) : (
                  activeUserList.map((tournament, index) => (
                    <motion.div key={tournament.tournamentRecordId} {...staggeredFadeUpMotion(index + 3, reduceMotion)}>
                      <TournamentCard
                        tournament={tournament}
                        onOpen={() => setDetailTournamentId(String(tournament.tournamentRecordId))}
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
                  label="Total"
                  value={payload.totalTournamentCount.toLocaleString("ko-KR")}
                  detail="현재 등록된 전체 대회 수"
                />
                <AdminInsightTile
                  label="Pending Review"
                  value={(payload as ClubAdminTournamentHomeResponse).pendingTournamentCount.toLocaleString("ko-KR")}
                  detail="관리자 승인을 기다리는 대회 수"
                />
                <AdminInsightTile
                  label="Rejected"
                  value={(payload as ClubAdminTournamentHomeResponse).rejectedTournamentCount.toLocaleString("ko-KR")}
                  detail="거절되어 작성자 확인이 필요한 대회 수"
                />
              </motion.section>

              <motion.section className="mt-8 rounded-[30px] border border-amber-200 bg-white px-5 py-5 shadow-sm" {...staggeredFadeUpMotion(2, reduceMotion)}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">Review Queue</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">대회 승인 검토</h3>
                  </div>
                  <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                    {(payload as ClubAdminTournamentHomeResponse).pendingTournamentCount}건 대기
                  </span>
                </div>
              </motion.section>

              <section className="mt-8 space-y-4">
                {(payload as ClubAdminTournamentHomeResponse).tournaments.map((tournament, index) => (
                  <motion.button
                    key={tournament.tournamentRecordId}
                    type="button"
                    onClick={() => setDetailTournamentId(String(tournament.tournamentRecordId))}
                    className="flex w-full flex-col gap-4 rounded-[28px] bg-white p-5 text-left shadow-sm transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                    {...staggeredFadeUpMotion(index + 3, reduceMotion)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-16 items-center justify-center rounded-[20px] bg-slate-100 text-[var(--primary)]">
                        <span className="material-symbols-outlined text-[30px]">emoji_events</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getTournamentApprovalBadgeClassName(tournament.approvalStatus)}`}>
                            {getTournamentApprovalLabel(tournament.approvalStatus)}
                          </span>
                          {tournament.approvalStatus === "APPROVED" ? (
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getTournamentStatusBadgeClassName(tournament.tournamentStatus)}`}>
                              {getTournamentStatusLabel(tournament.tournamentStatus)}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 text-lg font-black tracking-tight text-slate-900">{tournament.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            {tournament.tournamentPeriodLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">person</span>
                            {tournament.authorDisplayName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                        {tournament.approvalStatus === "PENDING" ? "검토" : "상세"}
                      </span>
                    </div>
                  </motion.button>
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
            className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-transform active:scale-95 ${
              payload.admin ? "bottom-40" : "bottom-24"
            }`}
            style={{ boxShadow: "0 10px 24px rgba(0,75,202,0.28)" }}
          >
            <span className="material-symbols-outlined text-[28px]">add</span>
          </button>
        ) : null}

        {mode === "user" && payload.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}

        <AnimatePresence>
          {showCreateModal ? (
            <RouteModal onDismiss={() => setShowCreateModal(false)} dismissOnBackdrop={false}>
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
            <RouteModal onDismiss={() => setDetailTournamentId(null)}>
              <ClubTournamentDetailClient
                clubId={clubId}
                tournamentRecordId={detailTournamentId}
                mode={mode}
                presentation="modal"
                basePath={mode === "admin" ? `/clubs/${clubId}/admin/more/tournaments` : `/clubs/${clubId}/more/tournaments`}
                onRequestClose={() => setDetailTournamentId(null)}
                onDeleted={() => {
                  setDetailTournamentId(null);
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
