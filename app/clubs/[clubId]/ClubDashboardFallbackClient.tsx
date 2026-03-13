"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { getMyClub, type MyClubSummary } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubDashboardFallbackClientProps = {
  clubId: string;
};

export function ClubDashboardFallbackClient({
  clubId,
}: ClubDashboardFallbackClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);
      const result = await getMyClub(clubId);
      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setClub(null);
        setError(result.message ?? "클럽 정보를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      setClub(result.data);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId]);

  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex size-10 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"
              >
                <span className="material-symbols-outlined">menu</span>
              </Link>
              <h1 className="text-xl font-bold tracking-tight">
                {club?.name ?? "Club Home"}
              </h1>
            </div>
            <div className="size-10" />
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 pb-28 md:p-6 md:pb-32">
          <motion.section {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-200 shadow-sm">
              {club?.imageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${club.imageUrl}')` }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-blue-100" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-end gap-4">
                <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white text-2xl font-bold text-[var(--primary)] shadow-lg">
                  {(club?.name ?? "SEMO").slice(0, 2).toUpperCase()}
                </div>
                {club?.admin ? (
                  <div className="pb-1">
                    <span className="inline-flex items-center rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-semibold text-white">
                      Admin View
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            {isLoading ? (
              <>
                <h2 className="text-lg font-bold">클럽 홈을 준비하는 중입니다.</h2>
                <p className="mt-2 text-sm text-slate-500">
                  가입한 클럽 정보를 불러오고 있습니다.
                </p>
              </>
            ) : error ? (
              <>
                <h2 className="text-lg font-bold">클럽 정보를 열지 못했습니다.</h2>
                <p className="mt-2 text-sm text-slate-500">{error}</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{club?.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {club?.summary ?? club?.description ?? "클럽 소개가 아직 없습니다."}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {club?.roleCode}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Category
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-900">
                      {club?.categoryKey ?? "OTHER"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-900">
                      클럽 홈이 준비되었습니다.
                    </p>
                  </div>
                </div>
              </>
            )}
          </motion.section>
        </main>

        {club?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <ClubBottomNav clubId={clubId} isAdmin={club?.admin ?? false} />
      </div>
    </div>
  );
}
