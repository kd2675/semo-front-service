"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type {
  ClubDashboard,
  ClubMemberProfile,
  ClubMemberProfileLink,
  ClubMemberProfileRecord,
} from "@/app/lib/mock-clubs";

type ClubProfileClientProps = {
  club: ClubDashboard;
  profile: ClubMemberProfile;
};

const RECORD_ICON_CLASS: Record<ClubMemberProfileRecord["accent"], string> = {
  primary: "text-[var(--primary)]",
  blue: "text-blue-500",
  orange: "text-orange-500",
  purple: "text-purple-500",
};

const RECORD_TREND_CLASS: Record<ClubMemberProfileRecord["trendTone"], string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  slate: "text-slate-400",
};

const QUICK_LINK_ICON_CLASS: Record<ClubMemberProfileLink["accent"], string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-200 text-slate-600",
};

export function ClubProfileClient({ club, profile }: ClubProfileClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <div className="min-h-screen bg-[var(--background-light)] font-display text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between px-4 pb-2 pt-6">
          <Link
            href={`/clubs/${club.id}`}
            className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
            aria-label={`${club.name} 홈으로 이동`}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold tracking-tight">My Profile</h1>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
            aria-label="프로필 설정"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-28">
          <motion.section
            className="flex flex-col items-center px-4 py-8"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="group relative">
              <div className="size-32 rounded-full border-4 border-[var(--primary)]/10 bg-gradient-to-tr from-[var(--primary)] to-blue-400 p-1">
                <div
                  className="h-full w-full rounded-full border-2 border-white bg-cover bg-center"
                  style={{ backgroundImage: `url('${profile.avatarImageUrl}')` }}
                />
              </div>
              <button
                type="button"
                className="absolute bottom-1 right-1 rounded-full border-2 border-white bg-[var(--primary)] p-2 text-white shadow-lg transition-transform hover:scale-105"
                aria-label="프로필 이미지 편집"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight">{profile.name}</h2>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="rounded-full border border-yellow-200 bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-800">
                  {profile.membershipLabel}
                </span>
                <span className="text-sm text-slate-500">• {profile.joinedLabel}</span>
              </div>
            </div>

            <div className="mt-6 flex w-full gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl bg-[var(--primary)] py-2.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
              >
                Edit Profile
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
              >
                Share Profile
              </button>
            </div>
          </motion.section>

          <section className="px-4 pb-8">
            <motion.div
              className="mb-4 flex items-center justify-between"
              {...staggeredFadeUpMotion(1, reduceMotion)}
            >
              <h3 className="text-lg font-bold tracking-tight">My Personal Records</h3>
              <button type="button" className="text-xs font-semibold text-[var(--primary)]">
                View All
              </button>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {profile.records.map((record, index) => (
                <motion.article
                  key={record.id}
                  className="flex flex-col gap-2 rounded-[1rem] border border-slate-100 bg-white p-5 shadow-sm"
                  {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-xl ${RECORD_ICON_CLASS[record.accent]}`}>
                      {record.icon}
                    </span>
                    <p className="text-sm font-medium text-slate-500">{record.title}</p>
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight">{record.value}</p>
                  <div
                    className={`flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${RECORD_TREND_CLASS[record.trendTone]}`}
                  >
                    {record.trendIcon ? (
                      <span className="material-symbols-outlined text-xs">{record.trendIcon}</span>
                    ) : null}
                    <span>{record.trendLabel}</span>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="px-4 pb-12">
            <motion.div
              className="space-y-1 rounded-[1rem] bg-slate-50 p-2"
              {...staggeredFadeUpMotion(6, reduceMotion)}
            >
              {profile.quickLinks.map((link, index) => (
                <motion.div key={link.id} {...staggeredFadeUpMotion(index + 7, reduceMotion)}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-10 items-center justify-center rounded-lg ${QUICK_LINK_ICON_CLASS[link.accent]}`}
                      >
                        <span className="material-symbols-outlined">{link.icon}</span>
                      </div>
                      <span className="text-sm font-semibold">{link.label}</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 transition-colors group-hover:text-[var(--primary)]">
                      chevron_right
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </section>
        </main>

        {club.isAdmin ? <ClubModeSwitchFab clubId={club.id} mode="user" /> : null}
        <ClubBottomNav clubId={club.id} isAdmin={club.isAdmin} />
      </div>
    </div>
  );
}
