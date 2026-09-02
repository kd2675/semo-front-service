"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";

import { ClubGrowthCorePanel } from "@/app/components/ClubGrowthCorePanel";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubRouteErrorState, ClubRouteLoadingState } from "@/app/components/ClubRouteState";
import { RouterLink } from "@/app/components/RouterLink";
import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";

type ClubGrowthCoreDetailClientProps = {
  clubId: string;
};

const GROWTH_AXIS_GUIDE = [
  {
    label: "함께",
    description: "출석, 투표, 읽기처럼 멤버가 함께 남긴 참여 기록",
    icon: "groups",
  },
  {
    label: "운영",
    description: "공지, 업무 완료, 응답과 마감처럼 운영을 끝낸 기록",
    icon: "task_alt",
  },
  {
    label: "이어짐",
    description: "결정 연결, 반복 업무와 인수인계처럼 다음 운영으로 이어진 기록",
    icon: "account_tree",
  },
] as const;

export function ClubGrowthCoreDetailClient({ clubId }: ClubGrowthCoreDetailClientProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const clubQuery = useQuery(myClubQueryOptions(clubId));
  const club = clubQuery.data ?? null;

  if (clubQuery.isError && !club) {
    return (
      <ClubRouteErrorState
        title="모임 성장"
        message={getQueryErrorMessage(clubQuery.error, "모임 성장 정보를 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}`}
        onRetry={() => void clubQuery.refetch()}
      />
    );
  }

  if (!club) {
    return <ClubRouteLoadingState title="모임 성장을 불러오는 중" />;
  }

  return (
    <div className="min-h-full bg-[var(--background-light)] text-slate-900">
      <ClubPageHeader
        title="모임 성장"
        subtitle={club.name}
        icon="diamond"
        containerClassName="semo-page-dashboard"
        leftSlot={
          <RouterLink
            href={`/clubs/${clubId}`}
            className="flex size-11 items-center justify-start text-slate-900"
            aria-label="클럽 홈으로 돌아가기"
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          </RouterLink>
        }
      />

      <main className="semo-page-dashboard semo-nav-bottom-space flex-1 space-y-6 p-4 md:p-6">
        <ClubGrowthCorePanel growthCore={club.growthCore} />

        <motion.section
          className="semo-card overflow-hidden p-5 md:p-6"
          {...staggeredFadeUpMotion(1, reduceMotion)}
        >
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold tracking-[0.16em] text-[var(--primary)]">성장 기록의 기준</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">세 축이 함께 채워져야 다음 티어로 올라갑니다</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              모임에서 실제로 완료된 운영 기록만 반영합니다. 세 축 중 가장 낮은 단계가 현재 전체 단계를 결정하며, 회원 수나 인기 순위로 티어가 바뀌지 않습니다.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {GROWTH_AXIS_GUIDE.map((axis, index) => (
              <motion.article
                key={axis.label}
                className="rounded-[var(--radius-card)] bg-slate-50 p-4"
                {...staggeredFadeUpMotion(index + 2, reduceMotion)}
              >
                <span className="semo-page-glyph" aria-hidden="true">
                  <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{axis.icon}</span>
                </span>
                <h3 className="mt-4 text-base font-black text-slate-900">{axis.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{axis.description}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}
