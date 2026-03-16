"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
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
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentSession = attendance.currentSession;

  const handleCheckIn = async () => {
    if (!currentSession) {
      return;
    }
    if (!canPersist) {
      setFeedback("Mock mode에서는 출석 저장이 되지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const result = await checkInClubAttendance(clubId, {
      sessionId: currentSession.sessionId,
    });
    setIsSubmitting(false);

    if (!result.ok || !result.data) {
      setFeedback(result.message ?? "출석 체크에 실패했습니다.");
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
    setFeedback("출석 체크가 완료되었습니다.");
  };

  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-md items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <RouterLink
                href={`/clubs/${clubId}`}
                className="flex size-10 items-center justify-center rounded-full text-slate-900 transition hover:bg-slate-100"
                aria-label="클럽 홈으로 돌아가기"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </RouterLink>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Attendance Check</h1>
                <p className="text-xs text-slate-500">{attendance.clubName}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--primary)]">
              fact_check
            </span>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pb-28 pt-4">
          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Today
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
                    Status
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {currentSession.checkedIn ? "Checked In" : currentSession.status}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Progress
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
                ? "Already Checked In"
                : isSubmitting
                  ? "Checking In..."
                  : "Check In"}
            </button>
            {feedback ? (
              <p className="mt-3 text-center text-xs font-medium text-slate-500">{feedback}</p>
            ) : null}
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Recent Sessions</h3>
              <span className="text-xs font-medium text-slate-400">
                {attendance.recentSessions.length} sessions
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
                        {session.checkedIn ? "Present" : session.status}
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
        <ClubBottomNav clubId={clubId} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
