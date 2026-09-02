"use client";

import { ClubGrowthCoreMark } from "@/app/components/ClubGrowthCoreMark";
import { RouterLink } from "@/app/components/RouterLink";
import type { ClubGrowthCore } from "@/app/lib/clubs";
import { getTierDisplayLabel } from "@/app/lib/growthCore";

type ClubGrowthCoreCoverLinkProps = {
  clubId: string;
  growthCore?: ClubGrowthCore | null;
};

export function ClubGrowthCoreCoverLink({
  clubId,
  growthCore,
}: ClubGrowthCoreCoverLinkProps) {
  const tierLabel = getTierDisplayLabel(growthCore);

  return (
    <RouterLink
      href={`/clubs/${clubId}/growth`}
      aria-label={`${tierLabel} 티어 모임 성장 상세 보기`}
      title="모임 성장 상세 보기"
      data-growth-core-cover-link
      className="group absolute bottom-3 right-3 top-3 z-10 flex w-[7.25rem] touch-manipulation flex-col items-center justify-between overflow-hidden rounded-[var(--radius-card)] border border-white/20 bg-slate-950/58 px-2.5 py-2.5 text-white shadow-[0_16px_36px_rgba(2,6,23,0.26)] backdrop-blur-md transition duration-[var(--duration-normal)] hover:-translate-y-0.5 hover:border-sky-200/45 hover:bg-slate-950/68 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 md:bottom-4 md:right-4 md:top-4 md:w-36"
    >
      <span
        className="pointer-events-none absolute -right-9 -top-8 size-24 rotate-12 border border-sky-200/10"
        aria-hidden="true"
      />
      <span className="relative flex w-full items-center justify-between gap-2 px-0.5 text-xs font-extrabold tracking-[0.13em] text-sky-200">
        <span>GROWTH</span>
        <span
          className="material-symbols-outlined text-[18px] transition-transform duration-[var(--duration-normal)] group-hover:translate-x-0.5"
          aria-hidden="true"
        >
          arrow_forward
        </span>
      </span>

      <ClubGrowthCoreMark
        growthCore={growthCore}
        size={100}
        presentation="core-only"
        className="-my-2 size-[6.25rem] transition-transform duration-[var(--duration-slow)] group-hover:scale-[1.04]"
      />

      <span className="relative flex w-full items-end justify-between gap-2 border-t border-white/12 pt-2">
        <span className="min-w-0">
          <strong className="block truncate text-sm font-black text-white">{tierLabel}</strong>
          <span className="block text-xs font-semibold text-slate-300">성장 상세</span>
        </span>
        <span className="size-2 shrink-0 rotate-45 border-r border-t border-sky-200/70" aria-hidden="true" />
      </span>
    </RouterLink>
  );
}
