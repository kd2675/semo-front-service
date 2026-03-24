"use client";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { type ClubAdminTimelineResponse } from "@/app/lib/clubs";
import { motion, useReducedMotion } from "motion/react";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubAdminTimelineClientProps = {
  clubId: string;
  initialData: ClubAdminTimelineResponse;
};

export function ClubAdminTimelineClient({
  clubId,
  initialData,
}: ClubAdminTimelineClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <div className="min-h-screen bg-[#f8f6f6] text-slate-900">
      <div className="mx-auto min-h-screen max-w-md bg-[#f8f6f6] pb-28">
        <ClubPageHeader
          title="타임라인 설정"
          subtitle={initialData.clubName}
          icon="timeline"
          theme="admin"
          containerClassName="max-w-md"
          className="bg-[#f8f6f6]/90"
        />

        <main className="semo-nav-bottom-space space-y-4 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Activity Source
            </p>
            <h2 className="mt-3 text-2xl font-bold">유저 타임라인은 본인 활동 로그만 노출</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              유저 화면의 타임라인은 활동 로그 중 현재 사용자가 직접 남긴 액션만 시간순으로 노출합니다.
            </p>
          </motion.section>

          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 text-[#ec5b13]">info</span>
              <div className="space-y-2 text-sm text-slate-600">
                <p>클럽 ID: {clubId}</p>
                <p>타임라인 표시 순서는 최신 본인 활동 로그 기준으로 유지됩니다.</p>
                <p>다른 멤버가 남긴 로그는 유저 타임라인에 포함되지 않습니다.</p>
              </div>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
