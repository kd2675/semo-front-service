"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAccessToken, getUserFromToken, logout, normalizeRole } from "@/app/lib/auth";
import { onAuthChanged } from "@/app/lib/authEvents";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { MY_CLUBS, RECOMMENDED_CLUBS } from "@/app/lib/mock-clubs";
import type { AuthUser } from "@/app/types/auth";

function createProfileLabel(user: AuthUser | null): string {
  const source = user?.username?.trim();
  if (!source) {
    return "S";
  }

  return source.slice(0, 1).toUpperCase();
}

export default function Home() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [user, setUser] = useState<AuthUser | null>(() => getUserFromToken());
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      // Ignore logout API failure and clear the local session regardless.
    } finally {
      clearAccessToken();
      router.replace("/login");
    }
  };

  const roleLabel = normalizeRole(user?.role) ?? "GUEST";
  const profileLabel = createProfileLabel(user);
  const userName = user?.username ?? "익명 사용자";
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const visibleRecommendations = normalizedQuery
    ? RECOMMENDED_CLUBS.filter((club) => {
        const haystack = `${club.name} ${club.description}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : RECOMMENDED_CLUBS;

  useEffect(() => {
    const unsubscribe = onAuthChanged(() => {
      setUser(getUserFromToken());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900 antialiased">
      <div className="relative flex min-h-screen w-full flex-col">
        <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-white shadow-xl">
          <motion.header
            className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-4 pb-2"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div
              className="flex size-10 shrink-0 items-center overflow-hidden rounded-full ring-2 ring-[var(--primary)]/20"
              title={`${userName} · ${roleLabel}`}
              aria-label={`${userName} ${roleLabel}`}
            >
              <div className="flex size-10 items-center justify-center bg-gradient-to-br from-[var(--primary)] to-blue-600 text-sm font-bold text-white">
                {profileLabel}
              </div>
            </div>
            <h2 className="ml-3 flex-1 text-xl font-bold leading-tight tracking-tight text-slate-900">SEMO</h2>
            <div className="flex w-12 items-center justify-end">
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                aria-label="알림"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          </motion.header>

          <motion.div className="px-4 py-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <label className="flex w-full flex-col">
              <div className="flex h-12 w-full items-stretch rounded-xl border border-transparent bg-slate-100 transition-all focus-within:border-[var(--primary)]/50">
                <div className="flex items-center justify-center pl-4 text-slate-500">
                  <span className="material-symbols-outlined text-xl">search</span>
                </div>
                <input
                  className="form-input flex w-full border-none bg-transparent px-3 text-base font-normal text-slate-900 placeholder:text-slate-500 focus:ring-0"
                  placeholder="Find your next community..."
                  value={searchQuery}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => {
                      setSearchQuery(nextValue);
                    });
                  }}
                />
              </div>
            </label>
          </motion.div>

          <motion.section className="px-4 pb-2" {...staggeredFadeUpMotion(2, reduceMotion)}>
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-[var(--primary)] to-blue-600 p-4 shadow-lg shadow-[var(--primary)]/20">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Create Club</h3>
                <p className="mt-0.5 text-xs text-blue-100">Start your own community today</p>
                <p className="mt-1 text-[10px] font-medium text-blue-100/70">클럽 만들기</p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-[var(--primary)] shadow-sm transition-transform active:scale-95"
              >
                Get Started
              </button>
            </div>
          </motion.section>

          <motion.section
            className="flex items-center justify-between px-4 pb-2 pt-4"
            {...staggeredFadeUpMotion(3, reduceMotion)}
          >
            <div className="flex flex-col">
              <h2 className="text-lg font-bold leading-none text-slate-900">My Clubs</h2>
              <span className="mt-1 text-[10px] font-medium text-slate-400">내 클럽</span>
            </div>
            <button type="button" className="text-sm font-semibold text-[var(--primary)]">
              See all
            </button>
          </motion.section>

          <section className="hide-scrollbar flex overflow-x-auto pb-4">
            <div className="flex items-stretch gap-4 px-4">
              {MY_CLUBS.map((club, index) => (
                <motion.div
                  key={club.id}
                  {...staggeredFadeUpMotion(index + 4, reduceMotion)}
                >
                  <Link
                    href={`/clubs/${club.id}`}
                    className="flex min-w-[240px] flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    <div
                      className="aspect-[16/9] w-full rounded-lg bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url("${club.imageUrl}")` }}
                    />
                    <div>
                      <p className="text-base font-bold text-slate-900">{club.name}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className="material-symbols-outlined text-sm text-[var(--primary)]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {club.icon}
                        </span>
                        <p className="text-xs font-medium text-slate-600">{club.subtitle}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          <motion.section className="px-4 pb-3 pt-6" {...staggeredFadeUpMotion(6, reduceMotion)}>
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-bold text-slate-900">Recommended for You</h2>
              <span className="text-[10px] font-medium text-slate-400">클럽 찾기/추천</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Based on your interests in Seoul</p>
          </motion.section>

          <section className="flex flex-1 flex-col gap-4 px-4 pb-20">
            {visibleRecommendations.map((club, index) => (
              <motion.article
                key={club.id}
                className="flex gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                {...staggeredFadeUpMotion(index + 7, reduceMotion)}
              >
                <div
                  className="size-20 shrink-0 rounded-lg bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url("${club.imageUrl}")` }}
                />
                <div className="flex flex-1 flex-col justify-center">
                  <h3 className="text-base font-bold text-slate-900">{club.name}</h3>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{club.description}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">group</span>
                      <span className="text-[10px] font-medium text-slate-500">{club.members}</span>
                    </div>
                    <button
                      type="button"
                      className="ml-auto rounded-full bg-[var(--primary)] px-3 py-1.5 text-[10px] font-bold text-white"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}

            {visibleRecommendations.length === 0 ? (
              <motion.div
                className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center"
                {...staggeredFadeUpMotion(7, reduceMotion)}
              >
                <p className="text-sm font-semibold text-slate-700">검색 결과가 없습니다.</p>
                <p className="mt-1 text-xs text-slate-500">다른 키워드로 새로운 커뮤니티를 찾아보세요.</p>
              </motion.div>
            ) : null}
          </section>

          <motion.button
            type="button"
            className="fixed bottom-6 right-[max(1.5rem,calc(50%-180px))] z-20 flex size-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-2xl transition-transform active:scale-90"
            aria-label="클럽 만들기"
            {...staggeredFadeUpMotion(8, reduceMotion)}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          >
            <span className="material-symbols-outlined text-3xl">add</span>
          </motion.button>

          <motion.button
            type="button"
            onClick={handleSignOut}
            className="fixed bottom-6 left-[max(1.5rem,calc(50%-180px))] z-20 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-lg"
            {...staggeredFadeUpMotion(9, reduceMotion)}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          >
            로그아웃
          </motion.button>
        </main>
      </div>
    </div>
  );
}
