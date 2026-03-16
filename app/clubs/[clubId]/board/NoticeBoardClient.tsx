"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { startTransition, useDeferredValue, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type { ClubNotice, NoticeBoardCategory } from "@/app/lib/mock-clubs";

type NoticeBoardClientProps = {
  clubId: string;
  clubName: string;
  notices: ClubNotice[];
  isAdmin?: boolean;
};

const CATEGORIES: Array<{ id: NoticeBoardCategory; label: string }> = [
  { id: "all", label: "All Posts" },
  { id: "tournaments", label: "Tournaments" },
  { id: "matches", label: "Matches" },
  { id: "social", label: "Social" },
];

export function NoticeBoardClient({
  clubId,
  clubName,
  notices,
  isAdmin = false,
}: NoticeBoardClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<NoticeBoardCategory>("all");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const visibleNotices = notices.filter((notice) => {
    const matchesCategory =
      activeCategory === "all" ? true : notice.category === activeCategory;
    const matchesQuery = normalizedQuery
      ? `${notice.title} ${notice.summary} ${notice.author}`
          .toLowerCase()
          .includes(normalizedQuery)
      : true;
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <RouterLink
            href={`/clubs/${clubId}`}
            className="flex size-10 items-center justify-start text-slate-900"
            aria-label={`${clubName} 홈으로 돌아가기`}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </RouterLink>
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight">
            Notice Board
          </h2>
          <div className="flex w-10 items-center justify-end">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent text-slate-900"
              aria-label="검색"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </header>

        <main className="flex-1 pb-28">
          <motion.div className="px-4 py-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
            <label className="flex w-full flex-col">
              <div className="flex h-12 w-full items-stretch rounded-xl bg-slate-100">
                <div className="flex items-center justify-center pl-4 text-slate-500">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="form-input flex w-full border-none bg-transparent px-3 text-base text-slate-900 placeholder:text-slate-500 focus:ring-0"
                  placeholder="Search announcements..."
                  type="text"
                  value={query}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => {
                      setQuery(nextValue);
                    });
                  }}
                />
              </div>
            </label>
          </motion.div>

          <motion.div className="mb-2 px-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="hide-scrollbar flex gap-6 overflow-x-auto border-b border-slate-200">
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex shrink-0 flex-col items-center justify-center border-b-2 pb-3 pt-2 ${
                      isActive
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    <p className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>{category.label}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <div className="flex flex-col divide-y divide-slate-100">
            {visibleNotices.map((notice, index) => (
              <motion.article
                key={notice.id}
                className="flex gap-4 bg-white px-4 py-5 transition-colors hover:bg-slate-50"
                {...staggeredFadeUpMotion(index + 2, reduceMotion)}
              >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <span className="material-symbols-outlined">{notice.icon}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between">
                      <p className="text-base font-bold leading-snug text-slate-900">{notice.title}</p>
                      <span className="ml-2 whitespace-nowrap text-xs text-slate-400">{notice.timeAgo}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-600">{notice.summary}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex size-5 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)]/20">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                      </div>
                      <p className="text-xs font-semibold text-[var(--primary)]">{notice.author}</p>
                    </div>
                  </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            className="flex justify-center p-8"
            {...staggeredFadeUpMotion(visibleNotices.length + 2, reduceMotion)}
          >
            {visibleNotices.length > 0 ? (
              <button
                type="button"
                className="rounded-full bg-[var(--primary)]/10 px-6 py-2 text-sm font-bold text-[var(--primary)]"
              >
                Load more notices
              </button>
            ) : (
              <div className="rounded-full bg-slate-100 px-6 py-2 text-sm font-semibold text-slate-500">
                검색 결과가 없습니다
              </div>
            )}
          </motion.div>
        </main>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <ClubBottomNav clubId={clubId} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
