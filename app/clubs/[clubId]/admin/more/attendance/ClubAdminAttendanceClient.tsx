"use client";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { Public_Sans } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { type ClubAdminAttendanceResponse } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ClubAdminAttendanceClientProps = {
  initialData: ClubAdminAttendanceResponse;
};

function getRoleLabel(roleCode: string) {
  if (roleCode === "OWNER") {
    return "오너";
  }
  if (roleCode === "ADMIN") {
    return "어드민";
  }
  if (roleCode === "MEMBER") {
    return "회원";
  }
  return roleCode;
}

export function ClubAdminAttendanceClient({
  initialData,
}: ClubAdminAttendanceClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const attendance = initialData;
  
  const todayAttendance = attendance.todayAttendance;

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
        <ClubPageHeader
          title="출석 관리"
          subtitle={attendance.clubName}
          icon="fact_check"
          theme="admin"
          containerClassName="max-w-md"
        />

        <main className="semo-nav-bottom-space mx-auto w-full max-w-md space-y-4 px-4 pt-4">
          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  오늘 로그
                </p>
                <h2 className="mt-3 text-xl font-bold">
                  {todayAttendance?.attendanceDateLabel ?? "오늘 출석 로그가 없습니다."}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  오늘 멤버 출석 현황과 최근 일자 로그를 확인할 수 있습니다.
                </p>
              </div>
              <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                {todayAttendance?.checkedInCount ?? 0}/{todayAttendance?.memberCount ?? attendance.members.length} 출석
              </div>
            </div>
            {todayAttendance ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    출석 완료
                  </p>
                  <p className="mt-2 text-sm font-bold">
                    {todayAttendance.checkedInCount}/{todayAttendance.memberCount}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    내 상태
                  </p>
                  <p className="mt-2 text-sm font-bold">
                    {todayAttendance.checkedIn ? "출석 완료" : "미출석"}
                  </p>
                </div>
              </div>
            ) : null}
            <div className="mt-5 rounded-xl bg-orange-50 px-4 py-3 text-sm text-slate-600">
              출석은 멤버가 하루에 한 번 직접 체크합니다. 관리자는 당일 출석 현황과 최근 일자 로그를 확인합니다.
            </div>
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">멤버 상태</h3>
              <span className="text-xs font-medium text-slate-400">
                {attendance.members.length}명
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
                    <p className="mt-1 text-xs text-slate-500">{getRoleLabel(member.roleCode)}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        member.checkedIn
                          ? "bg-orange-50 text-[var(--primary)]"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {member.checkedIn ? "출석" : "대기"}
                    </span>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {member.checkedInAtLabel ?? "체크인 기록 없음"}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">최근 일자 로그</h3>
              <span className="text-xs font-medium text-slate-400">
                {attendance.recentLogs.length}일
              </span>
            </div>
            <div className="space-y-3">
              {attendance.recentLogs.map((log, index) => (
                <motion.article
                  key={`${log.attendanceDateLabel}-${index}`}
                  className="rounded-xl bg-slate-50 px-4 py-4"
                  {...staggeredFadeUpMotion(index + 3, reduceMotion)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{log.attendanceDateLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.checkedInCount}/{log.memberCount}명 출석
                      </p>
                    </div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-[var(--primary)]">
                      {Math.round((log.checkedInCount / Math.max(log.memberCount, 1)) * 100)}%
                    </span>
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
