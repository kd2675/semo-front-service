"use client";

import Link from "next/link";
import { Public_Sans } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { startTransition, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  updateClubFeatures,
  type ClubFeatureSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ClubAdminMenuClientProps = {
  clubId: string;
  clubName: string;
  initialFeatures: ClubFeatureSummary[];
  canPersist?: boolean;
};

export function ClubAdminMenuClient({
  clubId,
  clubName,
  initialFeatures,
  canPersist = true,
}: ClubAdminMenuClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [features, setFeatures] = useState(initialFeatures);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const enabledFeatures = useMemo(
    () => features.filter((feature) => feature.enabled),
    [features],
  );
  const disabledFeatures = useMemo(
    () => features.filter((feature) => !feature.enabled),
    [features],
  );
  const initialEnabledFeatureKeys = useMemo(
    () =>
      initialFeatures
        .filter((feature) => feature.enabled)
        .map((feature) => feature.featureKey)
        .sort(),
    [initialFeatures],
  );
  const currentEnabledFeatureKeys = useMemo(
    () => enabledFeatures.map((feature) => feature.featureKey).sort(),
    [enabledFeatures],
  );
  const isDirty = useMemo(
    () =>
      initialEnabledFeatureKeys.length !== currentEnabledFeatureKeys.length ||
      initialEnabledFeatureKeys.some((featureKey, index) => featureKey !== currentEnabledFeatureKeys[index]),
    [currentEnabledFeatureKeys, initialEnabledFeatureKeys],
  );

  const handleToggle = (featureKey: string) => {
    startTransition(() => {
      setFeatures((current) =>
        current.map((feature) =>
          feature.featureKey === featureKey
            ? { ...feature, enabled: !feature.enabled }
            : feature,
        ),
      );
    });
  };

  const handleSave = async () => {
    if (!canPersist) {
      setFeedback("Mock mode에서는 저장되지 않습니다.");
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    const result = await updateClubFeatures(clubId, {
      enabledFeatureKeys: features
        .filter((feature) => feature.enabled)
        .map((feature) => feature.featureKey),
    });
    setIsSaving(false);

    if (!result.ok || !result.data) {
      setFeedback(result.message ?? "기능 설정 저장에 실패했습니다.");
      return;
    }

    setFeatures(result.data);
    setFeedback("기능 설정이 저장되었습니다.");
    window.dispatchEvent(new Event("semo:club-features-updated"));
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
      <div className="relative min-h-screen overflow-x-hidden bg-[#f8f6f6]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f8f6f6]/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/clubs/${clubId}/admin`}
                className="flex size-10 items-center justify-center rounded-full text-slate-900 transition hover:bg-white"
                aria-label="관리자 홈으로 돌아가기"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Feature Settings</h1>
                <p className="text-[10px] text-slate-500">
                  Club Functions • {clubName}
                </p>
              </div>
            </div>
            <div className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[var(--primary)] shadow-sm">
              {enabledFeatures.length} enabled
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl pb-40">
          <motion.section className="p-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">dashboard</span>
              <h2 className="text-lg font-bold">Feature Overview</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] to-orange-300" />
                <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Activated Features
                    </p>
                    <h3 className="mt-3 text-2xl font-bold">
                      {enabledFeatures.length === 0
                        ? "No features enabled yet"
                        : `${enabledFeatures.length} feature${enabledFeatures.length > 1 ? "s" : ""} live`}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      활성화된 기능은 유저 More 메뉴에서 사용되고, 관리자 More 메뉴에서는 설정 화면으로 연결됩니다.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-orange-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
                        User More
                      </p>
                      <p className="mt-2 text-xl font-bold text-[var(--primary)]">
                        {enabledFeatures.length}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Available
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {disabledFeatures.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section className="px-4 py-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">view_quilt</span>
              <h2 className="text-lg font-bold">Active Features</h2>
            </div>
            <div className="flex flex-col gap-3">
              {enabledFeatures.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  아직 활성화된 기능이 없습니다.
                </div>
              ) : (
                enabledFeatures.map((feature, index) => (
                  <motion.article
                    key={feature.featureKey}
                    className="flex min-h-[88px] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                    {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                      <span className="material-symbols-outlined">{feature.iconName}</span>
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="text-base font-bold">{feature.displayName}</p>
                      <p className="text-sm text-slate-500">
                        {feature.description ?? "기능 설명이 없습니다."}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-400">
                        User: {feature.userPath}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(feature.featureKey)}
                      className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/20"
                    >
                      Disable
                    </button>
                  </motion.article>
                ))
              )}
            </div>
          </motion.section>

          <motion.section className="mb-8 px-4 py-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">add_box</span>
              <h2 className="text-lg font-bold">Available Features</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {disabledFeatures.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  현재 추가 가능한 기능이 더 없습니다.
                </div>
              ) : (
                disabledFeatures.map((feature, index) => (
                  <motion.article
                    key={feature.featureKey}
                    className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[var(--primary)]/30"
                    {...staggeredFadeUpMotion(index + 5, reduceMotion)}
                  >
                    <div className="flex h-24 items-center justify-center rounded-xl bg-slate-50">
                      <span className="material-symbols-outlined text-4xl text-[var(--primary)]">
                        {feature.iconName}
                      </span>
                    </div>
                    <div className="flex min-h-[58px] flex-col">
                      <p className="text-sm font-bold">{feature.displayName}</p>
                      <p className="text-xs text-slate-500">
                        {feature.description ?? "기능 설명이 없습니다."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(feature.featureKey)}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-[var(--primary)]/10 py-2 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Enable
                    </button>
                  </motion.article>
                ))
              )}
            </div>
          </motion.section>
        </main>

        {isDirty ? (
          <div className="pointer-events-none fixed bottom-[76px] left-0 right-0 z-30 p-4">
            <div className="pointer-events-auto mx-auto max-w-5xl">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-[0_18px_36px_rgba(236,91,19,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="material-symbols-outlined">
                  {isSaving ? "progress_activity" : "save"}
                </span>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              {feedback ? (
                <p className="mt-3 text-center text-xs font-medium text-slate-500">
                  {feedback}
                </p>
              ) : null}
            </div>
          </div>
        ) : feedback ? (
          <div className="pointer-events-none fixed bottom-[92px] left-0 right-0 z-30 p-4">
            <p className="pointer-events-auto mx-auto max-w-xl rounded-full bg-white/90 px-4 py-2 text-center text-xs font-medium text-slate-500 shadow-sm backdrop-blur-sm">
              {feedback}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
