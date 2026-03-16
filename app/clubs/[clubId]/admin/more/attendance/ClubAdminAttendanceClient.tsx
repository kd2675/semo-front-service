"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { Public_Sans } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { CSSProperties } from "react";
import {
  closeClubAttendanceSession,
  createClubAttendanceSession,
  type ClubAdminAttendanceResponse,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ClubAdminAttendanceClientProps = {
  clubId: string;
  initialData: ClubAdminAttendanceResponse;
  canPersist?: boolean;
};

export function ClubAdminAttendanceClient({
  clubId,
  initialData,
  canPersist = true,
}: ClubAdminAttendanceClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [attendance, setAttendance] = useState(initialData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentSession = attendance.currentSession;

  const handleCreateSession = async () => {
    if (!canPersist) {
      setFeedback("Mock mode에서는 세션이 저장되지 않습니다.");
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    const result = await createClubAttendanceSession(clubId, {});
    setIsProcessing(false);

    if (!result.ok || !result.data) {
      setFeedback(result.message ?? "출석 세션 생성에 실패했습니다.");
      return;
    }

    const session = result.data;

    setAttendance((current) => ({
      ...current,
      currentSession: session,
      recentSessions: [
        {
          sessionId: session.sessionId,
          title: session.title,
          attendanceDateLabel: session.attendanceDateLabel,
          status: session.status,
          checkedIn: false,
          checkedInAtLabel: null,
        },
        ...current.recentSessions.filter((item) => item.sessionId !== session.sessionId),
      ],
    }));
    setFeedback("오늘 출석 세션이 열렸습니다.");
  };

  const handleCloseSession = async () => {
    if (!currentSession) {
      return;
    }
    if (!canPersist) {
      setFeedback("Mock mode에서는 세션 상태가 저장되지 않습니다.");
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    const result = await closeClubAttendanceSession(clubId, currentSession.sessionId);
    setIsProcessing(false);

    if (!result.ok || !result.data) {
      setFeedback(result.message ?? "출석 세션 종료에 실패했습니다.");
      return;
    }

    const session = result.data;

    setAttendance((current) => ({
      ...current,
      currentSession: session,
      recentSessions: current.recentSessions.map((historySession) =>
        historySession.sessionId === session.sessionId
          ? {
              ...historySession,
              status: session.status,
            }
          : historySession,
      ),
    }));
    setFeedback("출석 세션이 종료되었습니다.");
  };

  return (
    <div
      className={`${publicSans.className} min-h-screen bg-[#f8f6f6] text-slate-900`}
      style={
        {
          "--primary": "#ec5b13",
          "--background-light": "#f8f6f6",
        } as CSSProperties
      }
    >
      <div className="min-h-screen bg-[#f8f6f6]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f8f6f6]/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-md items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <RouterLink
                href={`/clubs/${clubId}/admin`}
                className="flex size-10 items-center justify-center rounded-full text-slate-900 transition hover:bg-white"
                aria-label="관리자 홈으로 돌아가기"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </RouterLink>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Attendance Admin</h1>
                <p className="text-xs text-slate-500">{attendance.clubName}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--primary)]">fact_check</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-md space-y-4 px-4 pb-32 pt-4">
          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Current Session
                </p>
                <h2 className="mt-3 text-xl font-bold">
                  {currentSession?.title ?? "아직 열린 세션이 없습니다."}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {currentSession?.attendanceDateLabel ?? "오늘 출석 세션을 생성해보세요."}
                </p>
              </div>
              <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                {currentSession?.status ?? "IDLE"}
              </div>
            </div>
            {currentSession ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Checked In
                  </p>
                  <p className="mt-2 text-sm font-bold">
                    {currentSession.checkedInCount}/{currentSession.memberCount}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Opened At
                  </p>
                  <p className="mt-2 text-sm font-bold">
                    {currentSession.openAtLabel ?? "-"}
                  </p>
                </div>
              </div>
            ) : null}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => void handleCreateSession()}
                disabled={Boolean(currentSession && currentSession.status === "OPEN") || isProcessing}
                className="flex-1 rounded-xl bg-[var(--primary)] py-3 text-sm font-bold text-white transition hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {isProcessing ? "Processing..." : "Open Today"}
              </button>
              <button
                type="button"
                onClick={() => void handleCloseSession()}
                disabled={!currentSession || currentSession.status !== "OPEN" || isProcessing}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
              >
                Close
              </button>
            </div>
            {feedback ? (
              <p className="mt-3 text-center text-xs font-medium text-slate-500">{feedback}</p>
            ) : null}
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Member Status</h3>
              <span className="text-xs font-medium text-slate-400">
                {attendance.members.length} members
              </span>
            </div>
            <div className="space-y-3">
              {attendance.members.map((member, index) => (
                <motion.article
                  key={member.clubProfileId}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-4"
                  {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                >
                  <div>
                    <p className="text-sm font-bold">{member.displayName}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.roleCode}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        member.checkedIn
                          ? "bg-orange-50 text-[var(--primary)]"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {member.checkedIn ? "Present" : "Pending"}
                    </span>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {member.checkedInAtLabel ?? "Not checked in"}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
