"use client";

import type { ReactNode } from "react";

function ShellLine({ className }: { className: string }) {
  return <div className={`rounded-full bg-slate-200 ${className}`} />;
}

function AdminShellFrame({
  titleWidthClassName,
  subtitleWidthClassName,
  mainClassName = "semo-nav-bottom-space mx-auto w-full max-w-5xl space-y-6 px-4 pt-4",
  children,
}: {
  titleWidthClassName: string;
  subtitleWidthClassName: string;
  mainClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f6f6] text-slate-900">
      <div className="min-h-screen bg-[#f8f6f6]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f8f6f6]/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-slate-200" />
              <div className="space-y-2">
                <ShellLine className={`h-4 ${titleWidthClassName}`} />
                <ShellLine className={`h-3 ${subtitleWidthClassName}`} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-white" />
              <div className="size-10 rounded-full bg-white" />
            </div>
          </div>
        </header>

        <main className={mainClassName}>{children}</main>
      </div>
    </div>
  );
}

export function AdminHomeLoadingShell() {
  return (
    <AdminShellFrame titleWidthClassName="w-24" subtitleWidthClassName="w-20">
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={`metric-${index}`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <ShellLine className="h-3 w-20" />
            <ShellLine className="mt-2 h-8 w-16" />
            <ShellLine className="mt-2 h-3 w-24" />
          </article>
        ))}
      </section>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-full bg-slate-200" />
          <ShellLine className="h-5 w-44" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }, (_, index) => (
            <article
              key={`action-${index}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="size-12 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <ShellLine className="h-4 w-32" />
                  <ShellLine className="h-3 w-full" />
                  <ShellLine className="h-3 w-3/4" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-full bg-slate-200" />
          <ShellLine className="h-5 w-36" />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {Array.from({ length: 3 }, (_, index) => (
            <article
              key={`log-${index}`}
              className={`flex gap-3 p-4 ${index > 0 ? "border-t border-slate-100" : ""}`}
            >
              <div className="size-8 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <ShellLine className="h-4 w-full" />
                <ShellLine className="h-3 w-24" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminShellFrame>
  );
}

export function AdminMenuLoadingShell() {
  return (
    <AdminShellFrame titleWidthClassName="w-36" subtitleWidthClassName="w-24" mainClassName="mx-auto w-full max-w-5xl pb-40">
      <section className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="size-5 rounded-full bg-slate-200" />
          <ShellLine className="h-5 w-40" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ShellLine className="h-3 w-28" />
          <ShellLine className="mt-4 h-8 w-48" />
          <ShellLine className="mt-3 h-4 w-full" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-orange-50 p-4">
              <ShellLine className="h-3 w-16" />
              <ShellLine className="mt-3 h-8 w-10" />
            </div>
            <div className="rounded-xl bg-slate-100 p-4">
              <ShellLine className="h-3 w-16" />
              <ShellLine className="mt-3 h-8 w-10" />
            </div>
          </div>
        </div>
      </section>
      <section className="px-4 py-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="size-5 rounded-full bg-slate-200" />
          <ShellLine className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <article
              key={`feature-on-${index}`}
              className="flex min-h-[88px] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <div className="size-12 rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-2">
                <ShellLine className="h-4 w-28" />
                <ShellLine className="h-3 w-full" />
                <ShellLine className="h-3 w-2/3" />
              </div>
              <div className="h-9 w-20 rounded-full bg-[var(--primary)]/10" />
            </article>
          ))}
        </div>
      </section>
      <section className="mb-8 px-4 py-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="size-5 rounded-full bg-slate-200" />
          <ShellLine className="h-5 w-36" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={`feature-off-${index}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="h-24 rounded-xl bg-slate-50" />
              <div className="mt-4 space-y-2">
                <ShellLine className="h-4 w-24" />
                <ShellLine className="h-3 w-full" />
                <ShellLine className="h-3 w-3/4" />
              </div>
              <div className="mt-4 h-10 w-full rounded-xl bg-slate-100" />
            </article>
          ))}
        </div>
      </section>
    </AdminShellFrame>
  );
}

export function AdminStatsLoadingShell() {
  return (
    <AdminShellFrame
      titleWidthClassName="w-32"
      subtitleWidthClassName="w-24"
      mainClassName="semo-nav-bottom-space mx-auto max-w-md"
    >
      <section className="grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={`stats-metric-${index}`}
            className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="size-5 rounded-full bg-[var(--primary)]/20" />
              <ShellLine className="h-3 w-16" />
            </div>
            <ShellLine className="h-3 w-20" />
            <ShellLine className="mt-2 h-8 w-14" />
          </article>
        ))}
      </section>
      {Array.from({ length: 4 }, (_, index) => (
        <section
          key={`stats-panel-${index}`}
          className="mx-4 mb-6 rounded-xl border border-orange-50 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-2">
              <ShellLine className="h-5 w-28" />
              <ShellLine className="h-3 w-20" />
            </div>
            <div className="space-y-2">
              <ShellLine className="h-5 w-14" />
              <ShellLine className="h-3 w-16" />
            </div>
          </div>
          <div className="h-40 rounded-xl bg-slate-100" />
        </section>
      ))}
    </AdminShellFrame>
  );
}

export function AdminMembersLoadingShell() {
  return (
    <AdminShellFrame titleWidthClassName="w-28" subtitleWidthClassName="w-24" mainClassName="min-h-screen bg-[#f6f6f8]">
      <div className="sticky top-[73px] z-10 border-b border-slate-200 bg-white">
        <div className="px-4 pb-4">
          <div className="h-11 w-full rounded-xl bg-slate-100" />
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={`filter-${index}`} className="h-9 w-20 rounded-full bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
      <main className="semo-nav-bottom-space space-y-3 px-4 py-3">
        <ShellLine className="h-4 w-28" />
        {Array.from({ length: 5 }, (_, index) => (
          <article
            key={`member-${index}`}
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-slate-100" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <ShellLine className="h-4 w-24" />
                  <div className="h-5 w-12 rounded-full bg-slate-100" />
                </div>
                <ShellLine className="h-3 w-20" />
                <ShellLine className="h-3 w-24" />
              </div>
              <div className="h-8 w-24 rounded-lg bg-slate-100" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-16 rounded-lg bg-[var(--primary)]/10" />
              <div className="h-8 w-16 rounded-lg bg-slate-100" />
            </div>
          </article>
        ))}
      </main>
    </AdminShellFrame>
  );
}

export function AdminAttendanceLoadingShell() {
  return (
    <div className="min-h-screen bg-[#f8f6f6] text-slate-900">
      <div className="min-h-screen bg-[#f8f6f6]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f8f6f6]/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-md items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-slate-100" />
              <div className="space-y-2">
                <ShellLine className="h-4 w-36" />
                <ShellLine className="h-3 w-24" />
              </div>
            </div>
            <div className="size-6 rounded-full bg-[var(--primary)]/10" />
          </div>
        </header>

        <main className="semo-nav-bottom-space mx-auto w-full max-w-md space-y-4 px-4 pt-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <ShellLine className="h-3 w-24" />
                <ShellLine className="h-6 w-40" />
                <ShellLine className="h-4 w-56" />
              </div>
              <div className="h-7 w-16 rounded-full bg-orange-50" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <ShellLine className="h-3 w-16" />
                <ShellLine className="mt-3 h-5 w-20" />
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <ShellLine className="h-3 w-16" />
                <ShellLine className="mt-3 h-5 w-20" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <div className="h-12 flex-1 rounded-xl bg-[var(--primary)]/10" />
              <div className="h-12 w-24 rounded-xl bg-slate-100" />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <ShellLine className="h-5 w-28" />
              <ShellLine className="h-3 w-20" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <article
                  key={`attendance-member-${index}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-4"
                >
                  <div className="space-y-2">
                    <ShellLine className="h-4 w-24" />
                    <ShellLine className="h-3 w-16" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="ml-auto h-6 w-16 rounded-full bg-slate-200" />
                    <ShellLine className="h-3 w-20" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
