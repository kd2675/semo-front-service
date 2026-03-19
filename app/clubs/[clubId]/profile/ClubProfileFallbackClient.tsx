"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { getClubProfile, type ClubProfileResponse } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { ClubProfileLoadingShell } from "../ClubRouteLoadingShells";

type ClubProfileFallbackClientProps = {
  clubId: string;
};

export function ClubProfileFallbackClient({ clubId }: ClubProfileFallbackClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [payload, setPayload] = useState<ClubProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getClubProfile(clubId);
      if (cancelled) {
        return;
      }
      setIsLoading(false);
      if (cancelled || !result.ok || !result.data) {
        return;
      }
      setPayload(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  const appProfile = payload?.appProfile;
  const clubProfile = payload?.clubProfile;

  if (isLoading) {
    return <ClubProfileLoadingShell />;
  }

  return (
    <div className="min-h-full bg-[var(--background-light)] font-display text-slate-900">
      <div className="mx-auto flex min-h-full max-w-md flex-col bg-white shadow-xl">
        <ClubPageHeader title="Club Profile" />

        <main className="semo-nav-bottom-space flex-1">
          <motion.section className="px-4 py-6" {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">App Profile</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                {appProfile?.displayName ?? "SEMO User"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {appProfile?.tagline ?? "앱 프로필 정보가 준비 중입니다."}
              </p>
            </div>
          </motion.section>

          <motion.section className="px-4 pb-6" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Club Profile</p>
              <h3 className="mt-3 text-xl font-bold">{clubProfile?.displayName ?? payload?.clubName ?? "Club"}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {clubProfile?.tagline ?? clubProfile?.introText ?? "클럽 안에서 사용하는 프로필 정보입니다."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  {clubProfile?.roleCode ?? "MEMBER"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {clubProfile?.membershipStatus ?? "ACTIVE"}
                </span>
                <span className="text-sm text-slate-500">
                  {clubProfile?.joinedLabel ?? "Joined recently"}
                </span>
              </div>
            </div>
          </motion.section>

          <section className="px-4 pb-12">
            <div className="grid grid-cols-2 gap-4">
              {(payload?.clubRecords ?? []).map((record, index) => (
                <motion.article
                  key={record.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                  {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {record.title}
                  </p>
                  <p className="mt-2 text-xl font-extrabold tracking-tight">{record.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{record.description}</p>
                </motion.article>
              ))}
            </div>
          </section>
        </main>

        {payload?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
      </div>
    </div>
  );
}
