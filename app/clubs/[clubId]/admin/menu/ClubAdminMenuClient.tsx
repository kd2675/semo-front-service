"use client";

import Link from "next/link";
import { Public_Sans } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ActiveWidget = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

type AvailableWidget = {
  id: string;
  title: string;
  description: string;
  icon: string;
  imageUrl?: string;
};

type ClubAdminMenuClientProps = {
  clubId: string;
  clubName: string;
  activeWidgets: ActiveWidget[];
  availableWidgets: AvailableWidget[];
};

export function ClubAdminMenuClient({
  clubId,
  clubName,
  activeWidgets,
  availableWidgets,
}: ClubAdminMenuClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

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
                <h1 className="text-lg font-bold tracking-tight">Widget Customization</h1>
                <p className="text-[10px] text-slate-500">Menu Management • {clubName}</p>
              </div>
            </div>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
              aria-label="도움말"
            >
              <span className="material-symbols-outlined">info</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl pb-40">
          <motion.section className="p-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">dashboard</span>
              <h2 className="text-lg font-bold">Layout Preview</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div
                className="relative aspect-[16/9] overflow-hidden rounded-xl border border-slate-200 bg-cover bg-center shadow-sm"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.38)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBuuDJecOabU9easE-Y4QW3oZ0NMgQxAbLIgB1Pj4cTatmIsqnKm0u_nl92SKXdie0qyT2lN2ng-AJP9oyqUnE6xO1-lZvwBImObgaFuuI8BiVrJVeorUWPgqhOC37DB2gT74hksE5Tzz6GuYunze3llCj5TOZwPYGy4CWnsOs6RRJZ2lj9jjMSxrsNRTdMmmxbvCpW0ZHOTEURFTA_1Ve1d6BuMlwo8RYPpg8vum_yloYXtLyuIhl19Qvz1R8wMRpnzcLJq0qh5w9Q')",
                }}
              >
                <div className="absolute inset-0 flex flex-col gap-2 p-4">
                  <div className="h-8 rounded-lg bg-white/20 backdrop-blur-sm" />
                  <div className="flex gap-2">
                    <div className="h-24 w-2/3 rounded-lg bg-white/20 backdrop-blur-sm" />
                    <div className="h-24 w-1/3 rounded-lg border border-[var(--primary)]/50 bg-[var(--primary)]/35 backdrop-blur-sm" />
                  </div>
                  <div className="h-12 rounded-lg bg-white/20 backdrop-blur-sm" />
                </div>
                <span className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-white px-4 py-2 text-xs font-bold shadow-lg">
                  Live Club Home Preview
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section className="px-4 py-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">view_quilt</span>
              <h2 className="text-lg font-bold">Active Widgets</h2>
            </div>
            <div className="flex flex-col gap-3">
              {activeWidgets.map((widget, index) => (
                <motion.article
                  key={widget.id}
                  className="flex min-h-[72px] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                    <span className="material-symbols-outlined">{widget.icon}</span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-base font-bold leading-tight">{widget.title}</p>
                    <p className="text-sm text-slate-500">{widget.description}</p>
                  </div>
                  <div className="shrink-0">
                    <span className="material-symbols-outlined cursor-grab text-slate-300">
                      drag_indicator
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.section>

          <motion.section className="mb-8 px-4 py-4" {...staggeredFadeUpMotion(5, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">add_box</span>
              <h2 className="text-lg font-bold">Available Widgets</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {availableWidgets.map((widget, index) => (
                <motion.article
                  key={widget.id}
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[var(--primary)]/30"
                  {...staggeredFadeUpMotion(index + 6, reduceMotion)}
                >
                  <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                    {widget.imageUrl ? (
                      <div
                        className="h-full w-full bg-cover bg-center opacity-50 grayscale transition-all group-hover:grayscale-0"
                        style={{ backgroundImage: `url('${widget.imageUrl}')` }}
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-slate-400">
                        {widget.icon}
                      </span>
                    )}
                  </div>
                  <div className="flex min-h-[48px] flex-col">
                    <p className="text-sm font-bold">{widget.title}</p>
                    <p className="text-xs text-slate-500">{widget.description}</p>
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-[var(--primary)]/10 py-2 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add
                  </button>
                </motion.article>
              ))}
            </div>
          </motion.section>
        </main>

        <div className="pointer-events-none fixed bottom-[76px] left-0 right-0 z-30 p-4">
          <div className="pointer-events-auto mx-auto max-w-5xl">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-[0_18px_36px_rgba(236,91,19,0.22)]"
            >
              <span className="material-symbols-outlined">save</span>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
