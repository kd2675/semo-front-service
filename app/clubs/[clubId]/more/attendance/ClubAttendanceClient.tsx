"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import {
  checkInClubAttendance,
  type ClubAttendanceResponse,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubAttendanceClientProps = {
  clubId: string;
  initialData: ClubAttendanceResponse;
  isAdmin: boolean;
  canPersist?: boolean;
};

export function ClubAttendanceClient({
  clubId,
  initialData,
  isAdmin,
  canPersist = true,
}: ClubAttendanceClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [attendance, setAttendance] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, clearToast } = useEphemeralToast();

  const currentSession = attendance.currentSession;

  const handleCheckIn = async () => {
    if (!currentSession) {
      return;
    }
    if (!canPersist) {
      showToast("Mock mode에서는 출석 저장이 되지 않습니다.", "info");
      return;
    }

    setIsSubmitting(true);
    clearToast();
    const result = await checkInClubAttendance(clubId, {
      sessionId: currentSession.sessionId,
    });
    setIsSubmitting(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "출석 체크에 실패했습니다.", "error");
      return;
    }

    setAttendance((current) => ({
      ...current,
      currentSession: result.data,
      recentSessions: current.recentSessions.map((session) =>
        session.sessionId === result.data?.sessionId
          ? {
              ...session,
              checkedIn: true,
              checkedInAtLabel: result.data.checkedInAtLabel,
              status: result.data.status,
            }
          : session,
      ),
    }));
    showToast("출석 체크가 완료되었습니다.", "success");
  };

  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative min-h-screen">
        <ClubPageHeader
          title="출석 체크"
          subtitle={attendance.clubName}
          icon="fact_check"
          className="bg-white/85 backdrop-blur-md"
        />

        <main className="semo-nav-bottom-space mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-4">
          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              오늘
            </p>
            <h2 className="mt-3 text-xl font-bold">
              {currentSession?.title ?? "열린 출석 세션이 없습니다."}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {currentSession?.attendanceDateLabel ?? "관리자가 출석 세션을 열면 이곳에서 체크할 수 있습니다."}
            </p>
            {currentSession ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    상태
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {currentSession.checkedIn ? "출석 완료" : currentSession.status}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    진행률
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {currentSession.checkedInCount}/{currentSession.memberCount}
                  </p>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void handleCheckIn()}
              disabled={!currentSession?.canCheckIn || isSubmitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#135bec]/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              <span className="material-symbols-outlined">
                {isSubmitting ? "progress_activity" : "how_to_reg"}
              </span>
              {currentSession?.checkedIn
                ? "이미 출석 완료"
                : isSubmitting
                  ? "출석 처리 중..."
                  : "출석 체크"}
            </button>
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">최근 세션</h3>
              <span className="text-xs font-medium text-slate-400">
                {attendance.recentSessions.length}건
              </span>
            </div>
            <div className="space-y-3">
              {attendance.recentSessions.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  최근 출석 기록이 없습니다.
                </div>
              ) : (
                attendance.recentSessions.map((session, index) => (
                  <motion.article
                    key={session.sessionId}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4"
                    {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{session.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {session.attendanceDateLabel}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          session.checkedIn
                            ? "bg-blue-50 text-[#135bec]"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {session.checkedIn ? "출석" : session.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      {session.checkedInAtLabel ?? "체크인 기록이 없습니다."}
                    </p>
                  </motion.article>
                ))
              )}
            </div>
          </motion.section>
        </main>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <EphemeralToast message={toast?.message ?? null} tone={toast?.tone} />
      </div>
    </div>
  );
}
