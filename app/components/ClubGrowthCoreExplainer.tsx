"use client";

import { useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { ClubGrowthCoreMark } from "@/app/components/ClubGrowthCoreMark";
import { RouteModal } from "@/app/components/RouteModal";
import type { ClubGrowthCore } from "@/app/lib/clubs";
import {
  CLUB_GROWTH_TIER_STEPS,
  DEFAULT_CLUB_GROWTH_CORE,
  getActivitySparkleCount,
  getMemberTriangleCount,
  getTierAchievedStage,
  getTierDisplayLabel,
  getTierTransitionProgress,
} from "@/app/lib/growthCore";

type GrowthCorePresentation = "full" | "core-only";

type ClubGrowthCoreExplainerTriggerProps = {
  growthCore?: ClubGrowthCore | null;
  size?: number;
  animateActivity?: boolean;
  presentation?: GrowthCorePresentation;
  className?: string;
  surfaceClassName?: string;
  markClassName?: string;
  onRequestExplanation?: () => void;
};

type ClubGrowthCoreExplanationContentProps = {
  growthCore?: ClubGrowthCore | null;
  presentation?: GrowthCorePresentation;
  onDismiss: () => void;
  onBack?: () => void;
};

const SIGNALS = [
  {
    icon: "diamond",
    label: "티어: 보석",
    description: "함께·운영·이어짐 세 축이 모두 기준을 채울 때 소재가 한 단계 올라갑니다. 회원 수나 인기 순위가 아닙니다.",
  },
  {
    icon: "change_history",
    label: "규모: 세모",
    description: "현재 활성 멤버 수를 0~5개의 작은 세모로 바꿔 보여줍니다. 보석 크기는 회원 수와 관계없이 같습니다.",
  },
  {
    icon: "auto_awesome",
    label: "활동: 반짝임",
    description: "최근 14일 동안 기록된 성공 동작의 절대 건수 구간입니다. 보석의 밝기나 티어에는 직접 영향을 주지 않습니다.",
  },
  {
    icon: "network_node",
    label: "성장 삼각",
    description: "클럽 안에서만 함께·운영·이어짐의 다음 티어 진행을 보여줍니다. 세 축 중 가장 낮은 단계가 전체 단계를 결정합니다.",
  },
] as const;

function normalizeMemberCount(growthCore?: ClubGrowthCore | null) {
  return Number.isFinite(growthCore?.memberCount)
    ? Math.max(0, Math.floor(growthCore?.memberCount ?? 0))
    : 0;
}

export function ClubGrowthCoreExplanationContent({
  growthCore,
  presentation = "core-only",
  onDismiss,
  onBack,
}: ClubGrowthCoreExplanationContentProps) {
  const core = growthCore ?? DEFAULT_CLUB_GROWTH_CORE;
  const tierCode = core.tierCode?.trim().toUpperCase() || "RAW";
  const tierLabel = getTierDisplayLabel(core);
  const memberCount = normalizeMemberCount(core);
  const memberTriangleCount = getMemberTriangleCount(memberCount);
  const activitySparkleCount = getActivitySparkleCount(core.activityLevel);
  const achievedStage = getTierAchievedStage(getTierTransitionProgress(core));
  const showGrowthTriangle = presentation === "full";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white" data-growth-core-explainer-content>
      <header className="relative flex items-start gap-3 border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            autoFocus
            className="semo-icon-control shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-200"
            aria-label="클럽 소개로 돌아가기"
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black tracking-[0.16em] text-[var(--primary)]">SEMO TIER GUIDE</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">티어 표식 읽는 법</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">보석 주변의 세 가지 표시와 클럽 안의 성장 삼각을 설명합니다.</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="semo-icon-control shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-200"
          aria-label="티어 표시 설명 닫기"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-slate-800 bg-[radial-gradient(circle_at_28%_30%,rgba(37,99,235,0.3),transparent_38%),linear-gradient(145deg,#0c1422,#17233a)] px-4 py-5 text-white">
          <div className="grid items-center gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <div className="mx-auto flex size-36 items-center justify-center" aria-hidden="true">
              <ClubGrowthCoreMark
                growthCore={core}
                size={showGrowthTriangle ? 142 : 124}
                animateActivity={false}
                presentation={presentation}
              />
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-xs font-extrabold tracking-[0.14em] text-sky-300">현재 표시</p>
              <p className="mt-1 text-2xl font-black tracking-tight">{tierLabel}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-bold text-slate-200 sm:justify-start">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                  규모: 세모 {memberTriangleCount}개
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                  활동: 반짝임 {activitySparkleCount}개
                </span>
                {showGrowthTriangle ? (
                  <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-sky-200">
                    성장 {achievedStage}/3
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="growth-core-signal-title">
          <h3 id="growth-core-signal-title" className="text-base font-black text-slate-900">표시가 뜻하는 것</h3>
          <dl className="mt-2 divide-y divide-slate-100 border-y border-slate-100">
            {SIGNALS.map((signal) => (
              <div key={signal.label} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 py-4">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary)]/8 text-[var(--primary)]" aria-hidden="true">
                  <span className="material-symbols-outlined" aria-hidden="true">{signal.icon}</span>
                </span>
                <div>
                  <dt className="text-sm font-black text-slate-900">{signal.label}</dt>
                  <dd className="mt-1 text-sm leading-6 text-slate-500">{signal.description}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-6" aria-labelledby="growth-core-current-title">
          <h3 id="growth-core-current-title" className="text-base font-black text-slate-900">현재 표시의 기준</h3>
          <div className="mt-3 space-y-3 rounded-[var(--radius-card)] bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p>
              <strong className="font-black text-slate-900">규모: 세모 {memberTriangleCount}개</strong>
              {` · 활성 멤버 ${memberCount.toLocaleString("ko-KR")}명. 0명은 0개, 1~4명은 1개, 5~19명은 2개, 20~49명은 3개, 50~99명은 4개, 100명 이상은 5개입니다.`}
            </p>
            <p>
              <strong className="font-black text-slate-900">활동: 반짝임 {activitySparkleCount}개</strong>
              {" · 최근 14일 성공 기록이 0건이면 1개, 1~3건은 2개, 4~9건은 3개, 10~24건은 4개, 25건 이상은 5개입니다."}
            </p>
            <p>
              <strong className="font-black text-slate-900">
                {showGrowthTriangle ? `성장 ${achievedStage}/3` : "성장 삼각"}
              </strong>
              {showGrowthTriangle
                ? " · 세 축은 0/3 시작 삼각에서 출발해 33%·66%·100% 기준을 넘을 때만 다음 꼭짓점으로 이동합니다."
                : " · 함께·운영·이어짐의 상세 진행은 멤버가 클럽 안에서만 확인할 수 있습니다."}
            </p>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="growth-core-tier-title">
          <h3 id="growth-core-tier-title" className="text-base font-black text-slate-900">티어 순서</h3>
          <ol className="mt-3 flex flex-wrap gap-2">
            {CLUB_GROWTH_TIER_STEPS.map((tier) => {
              const isCurrent = tier.code === tierCode;
              return (
                <li
                  key={tier.code}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`rounded-full border px-3 py-1.5 text-xs font-extrabold ${
                    isCurrent
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {tier.label}
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs leading-5 text-slate-500">티어와 반짝임은 추천 순위나 클럽의 우열을 뜻하지 않습니다.</p>
        </section>
      </div>

      <footer className="border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onBack ?? onDismiss}
          className="semo-control w-full bg-[var(--primary)] px-4 text-sm font-black text-white hover:bg-blue-700"
        >
          {onBack ? "클럽 소개로 돌아가기" : "설명 닫기"}
        </button>
      </footer>
    </div>
  );
}

export function ClubGrowthCoreExplainerTrigger({
  growthCore,
  size = 80,
  animateActivity = false,
  presentation = "core-only",
  className,
  surfaceClassName,
  markClassName,
  onRequestExplanation,
}: ClubGrowthCoreExplainerTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tierLabel = getTierDisplayLabel(growthCore);
  const opensStandaloneDialog = onRequestExplanation == null;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onRequestExplanation) {
      onRequestExplanation();
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${tierLabel} 티어와 주변 표시 설명 보기`}
        aria-haspopup={opensStandaloneDialog ? "dialog" : undefined}
        aria-expanded={opensStandaloneDialog ? isOpen : undefined}
        title="티어 표시 설명 보기"
        data-growth-core-explainer-trigger
        data-growth-core-explainer-affordance="hover-focus"
        className={`group/growth-core relative inline-flex min-h-11 min-w-11 cursor-help items-stretch justify-stretch overflow-visible rounded-[inherit] text-left ${className ?? ""}`}
      >
        <span
          className={`pointer-events-none flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden transition-[border-color,box-shadow,background-color] duration-200 group-hover/growth-core:border-[var(--primary)]/35 group-hover/growth-core:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_10%,transparent)] group-focus-visible/growth-core:border-[var(--primary)]/45 group-focus-visible/growth-core:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_14%,transparent)] ${surfaceClassName ?? ""}`}
          data-growth-core-explainer-surface="tier"
          aria-hidden="true"
        >
          <ClubGrowthCoreMark
            growthCore={growthCore}
            size={size}
            animateActivity={animateActivity}
            presentation={presentation}
            className={markClassName}
          />
        </span>
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <RouteModal
              onDismiss={() => setIsOpen(false)}
              ariaLabel="티어 표시 설명"
              contentClassName="max-w-[34rem]"
            >
              <ClubGrowthCoreExplanationContent
                growthCore={growthCore}
                presentation={presentation}
                onDismiss={() => setIsOpen(false)}
              />
            </RouteModal>,
            document.body,
          )
        : null}
    </>
  );
}
