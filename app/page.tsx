"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAccessToken, getUserFromToken, logout, normalizeRole } from "@/app/lib/auth";
import { onAuthChanged } from "@/app/lib/authEvents";
import { getMyClubs, type MyClubSummary } from "@/app/lib/clubs";
import { overlayFadeMotion, popInMotion, staggeredFadeUpMotion } from "@/app/lib/motion";
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
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [myClubs, setMyClubs] = useState<MyClubSummary[]>([]);
  const [isLoadingMyClubs, setIsLoadingMyClubs] = useState(true);
  const [myClubsError, setMyClubsError] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      if (!reduceMotion) {
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }
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

  useEffect(() => {
    const unsubscribe = onAuthChanged(() => {
      setUser(getUserFromToken());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoadingMyClubs(true);
      setMyClubsError(null);
      const result = await getMyClubs();
      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setMyClubs([]);
        setMyClubsError(result.message ?? "내 클럽을 불러오지 못했습니다.");
        setIsLoadingMyClubs(false);
        return;
      }

      setMyClubs(result.data);
      setIsLoadingMyClubs(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900 antialiased">
      <AnimatePresence>
        {isSigningOut ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-white/55 backdrop-blur-sm"
              {...overlayFadeMotion(reduceMotion)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
              {...popInMotion(reduceMotion)}
            >
              <div className="semo-panel w-full max-w-sm px-6 py-7 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
                  SIGNING OUT
                </p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight">로그아웃 중입니다.</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  세션을 정리하고 로그인 화면으로 이동합니다.
                </p>
                <div className="mt-5 semo-loading-bar" />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="relative flex min-h-screen w-full flex-col">
        <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-white pb-24 shadow-xl">
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
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                aria-label="알림"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <motion.button
                type="button"
                onClick={handleSignOut}
                className="flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                aria-label="로그아웃"
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                animate={
                  isSigningOut && !reduceMotion
                    ? { scale: [1, 0.96, 1], opacity: [1, 0.85, 1] }
                    : undefined
                }
              >
                로그아웃
              </motion.button>
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
                  onChange={(event) => setSearchQuery(event.target.value)}
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
              <RouterLink
                href="/clubs/create"
                className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-[var(--primary)] shadow-sm transition-transform active:scale-95"
              >
                Get Started
              </RouterLink>
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

          <motion.section className="px-4 pb-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
            {isLoadingMyClubs ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">내 클럽을 불러오는 중입니다.</p>
                <p className="mt-1 text-xs text-slate-500">가입한 모임을 확인하고 있습니다.</p>
              </div>
            ) : myClubs.length > 0 ? (
              <div className="hide-scrollbar flex overflow-x-auto pb-1">
                <div className="flex items-stretch gap-4">
                  {myClubs.map((club, index) => (
                    <motion.div
                      key={club.clubId}
                      className="min-w-[240px]"
                      {...staggeredFadeUpMotion(index + 4, reduceMotion)}
                    >
                      <RouterLink
                        href={`/clubs/${club.clubId}`}
                        className="flex h-full min-w-[240px] flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 shadow-sm transition-transform hover:-translate-y-0.5"
                      >
                        <div
                          className="aspect-[16/9] w-full rounded-lg bg-slate-200 bg-cover bg-center"
                          style={club.imageUrl ? { backgroundImage: `url("${club.imageUrl}")` } : undefined}
                        >
                          {!club.imageUrl ? (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 to-blue-100 text-[var(--primary)]">
                              <span className="material-symbols-outlined text-4xl">groups</span>
                            </div>
                          ) : null}
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-base font-bold text-slate-900">{club.name}</p>
                            {club.admin ? (
                              <span className="rounded-full bg-[var(--primary)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                                Admin
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">
                            {club.summary ?? club.description ?? "클럽 소개가 아직 없습니다."}
                          </p>
                          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <span className="material-symbols-outlined text-sm text-[var(--primary)]">group</span>
                            <span>{club.roleCode}</span>
                            {club.categoryKey ? <span>· {club.categoryKey}</span> : null}
                          </div>
                        </div>
                      </RouterLink>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">아직 가입한 클럽이 없습니다.</p>
                <p className="mt-1 text-xs text-slate-500">
                  {myClubsError ?? "클럽에 가입하면 이 영역에 내 모임이 표시됩니다."}
                </p>
              </div>
            )}
          </motion.section>

          <motion.section className="px-4 pb-3 pt-6" {...staggeredFadeUpMotion(6, reduceMotion)}>
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-bold text-slate-900">Recommended for You</h2>
              <span className="text-[10px] font-medium text-slate-400">클럽 찾기/추천</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Based on your interests in Seoul</p>
          </motion.section>

          <section className="flex flex-1 flex-col gap-4 px-4 pb-20">
            <motion.div
              className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center"
              {...staggeredFadeUpMotion(7, reduceMotion)}
            >
              <p className="text-sm font-semibold text-slate-700">추천 클럽 데이터가 아직 없습니다.</p>
              <p className="mt-1 text-xs text-slate-500">
                백엔드 추천 API가 연결되면 이 영역에 클럽이 표시됩니다.
              </p>
            </motion.div>
          </section>

          <motion.div
            className="fixed bottom-6 right-[max(1.5rem,calc(50%-180px))] z-20 flex size-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-2xl transition-transform active:scale-90"
            {...staggeredFadeUpMotion(8, reduceMotion)}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          >
            <RouterLink
              href="/clubs/create"
              aria-label="클럽 만들기"
              className="flex size-full items-center justify-center"
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </RouterLink>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
