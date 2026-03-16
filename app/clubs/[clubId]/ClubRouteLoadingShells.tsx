"use client";

import type { ReactNode } from "react";

function ShellLine({ className }: { className: string }) {
  return <div className={`rounded-full bg-slate-200 ${className}`} />;
}

function ShellBlock({ className }: { className: string }) {
  return <div className={`rounded-2xl bg-slate-100 ${className}`} />;
}

function MobileBottomNavShell() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="flex w-full max-w-md items-center justify-center rounded-full border border-white/70 bg-white/88 px-6 py-3 shadow-[0_18px_42px_rgba(15,23,42,0.12)] backdrop-blur-md">
        <div className="flex w-full items-center justify-around">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={`nav-${index}`} className="size-10 rounded-full bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MobilePageShell({
  titleWidthClassName,
  actionWidthClassName = "size-10",
  mainClassName = "space-y-4 px-4 pb-28 pt-4",
  children,
  showBottomNav = true,
}: {
  titleWidthClassName: string;
  actionWidthClassName?: string;
  mainClassName?: string;
  children: ReactNode;
  showBottomNav?: boolean;
}) {
  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <div className="size-10 rounded-full bg-slate-100" />
          <ShellLine className={`h-5 ${titleWidthClassName}`} />
          <div className={`${actionWidthClassName} rounded-xl bg-slate-100`} />
        </header>

        <main className={`flex-1 ${mainClassName}`}>{children}</main>
        {showBottomNav ? <MobileBottomNavShell /> : null}
      </div>
    </div>
  );
}

export function ClubDashboardLoadingShell() {
  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[var(--primary)]/10" />
              <ShellLine className="h-6 w-28" />
            </div>
            <div className="h-8 w-16 rounded-full bg-slate-100" />
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 pb-28 md:p-6 md:pb-32">
          <section className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-200 shadow-sm" />
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <ShellLine className="h-6 w-40" />
            <ShellLine className="mt-3 h-4 w-full" />
            <ShellLine className="mt-2 h-4 w-2/3" />
          </section>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <article
                key={`dashboard-widget-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-slate-100" />
                  <div className="space-y-2">
                    <ShellLine className="h-4 w-28" />
                    <ShellLine className="h-3 w-20" />
                  </div>
                </div>
                <ShellLine className="h-4 w-full" />
                <ShellLine className="mt-2 h-4 w-3/4" />
                <div className="mt-6 h-8 w-24 rounded-full bg-slate-100" />
              </article>
            ))}
          </section>
        </main>
        <MobileBottomNavShell />
      </div>
    </div>
  );
}

export function ClubDashboardWidgetGridShell() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <article
          key={`widget-shell-${index}`}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-slate-100" />
            <div className="space-y-2">
              <ShellLine className="h-4 w-24" />
              <ShellLine className="h-3 w-16" />
            </div>
          </div>
          <ShellLine className="h-4 w-full" />
          <ShellLine className="mt-2 h-4 w-2/3" />
          <div className="mt-6 h-8 w-24 rounded-full bg-slate-100" />
        </article>
      ))}
    </div>
  );
}

export function ClubBoardFeedLoadingShell() {
  return (
    <MobilePageShell titleWidthClassName="w-32">
      <div className="px-4 py-4">
        <div className="flex h-12 w-full items-stretch rounded-xl bg-slate-100" />
      </div>
      <div className="mb-2 px-4">
        <div className="flex gap-3 border-b border-slate-200 pb-3">
          {Array.from({ length: 4 }, (_, index) => (
            <ShellLine key={`tab-${index}`} className="h-4 w-20" />
          ))}
        </div>
      </div>
      <div className="flex flex-col divide-y divide-slate-100">
        {Array.from({ length: 5 }, (_, index) => (
          <article key={`notice-${index}`} className="flex gap-4 bg-white px-4 py-5">
            <div className="size-12 rounded-xl bg-[var(--primary)]/10" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-5 w-10 rounded-full bg-[var(--primary)]/10" />
                <ShellLine className="h-4 w-28" />
              </div>
              <ShellLine className="mt-3 h-4 w-full" />
              <ShellLine className="mt-2 h-4 w-3/4" />
              <div className="mt-3 flex gap-2">
                <ShellLine className="h-3 w-20" />
                <ShellLine className="h-3 w-16" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </MobilePageShell>
  );
}

export function ClubProfileLoadingShell() {
  return (
    <MobilePageShell titleWidthClassName="w-28" actionWidthClassName="size-10 rounded-full bg-transparent">
      <section className="px-4 py-6">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <ShellLine className="h-3 w-24" />
          <ShellLine className="mt-4 h-8 w-36" />
          <ShellLine className="mt-3 h-4 w-full" />
          <ShellLine className="mt-2 h-4 w-2/3" />
        </div>
      </section>
      <section className="px-4 pb-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <ShellLine className="h-3 w-24" />
          <ShellLine className="mt-4 h-6 w-32" />
          <ShellLine className="mt-3 h-4 w-full" />
          <ShellLine className="mt-2 h-4 w-3/4" />
          <div className="mt-4 flex gap-2">
            <div className="h-7 w-20 rounded-full bg-[var(--primary)]/10" />
            <div className="h-7 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-4 px-4 pb-12">
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={`record-${index}`}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <ShellLine className="h-3 w-16" />
            <ShellLine className="mt-3 h-7 w-14" />
            <ShellLine className="mt-3 h-4 w-full" />
          </article>
        ))}
      </section>
    </MobilePageShell>
  );
}

export function ClubScheduleLoadingShell() {
  return (
    <MobilePageShell titleWidthClassName="w-32">
      <section className="bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="size-8 rounded-full bg-slate-100" />
          <ShellLine className="h-5 w-28" />
          <div className="size-8 rounded-full bg-slate-100" />
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          {Array.from({ length: 35 }, (_, index) => (
            <div key={`day-${index}`} className="flex justify-center py-1">
              <div className="size-8 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-between px-4 pb-2 pt-6">
        <ShellLine className="h-6 w-40" />
        <div className="h-6 w-20 rounded bg-[var(--primary)]/10" />
      </section>
      <section className="space-y-3 px-4">
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={`event-${index}`}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <ShellLine className="h-5 w-32" />
                <ShellLine className="h-4 w-24" />
              </div>
              <div className="h-6 w-16 rounded-full bg-slate-100" />
            </div>
            <ShellLine className="mt-4 h-4 w-full" />
            <ShellLine className="mt-2 h-4 w-2/3" />
          </article>
        ))}
      </section>
    </MobilePageShell>
  );
}

export function ClubDetailLoadingShell() {
  return (
    <MobilePageShell titleWidthClassName="w-20">
      <section className="border-b border-slate-100 px-4 py-6">
        <div className="mb-3 flex gap-2">
          <div className="h-5 w-14 rounded-full bg-[var(--primary)]/10" />
          <div className="h-5 w-12 rounded-full bg-slate-100" />
        </div>
        <ShellLine className="h-8 w-full" />
        <ShellLine className="mt-3 h-8 w-3/4" />
        <div className="mt-5 space-y-2">
          <ShellLine className="h-4 w-32" />
          <ShellLine className="h-4 w-28" />
          <ShellLine className="h-4 w-24" />
        </div>
      </section>
      <section className="px-4 pt-5">
        <div className="rounded-2xl bg-[var(--primary)]/5 px-4 py-4">
          <ShellLine className="h-4 w-24" />
          <ShellLine className="mt-3 h-4 w-full" />
          <ShellLine className="mt-2 h-4 w-2/3" />
        </div>
      </section>
      <section className="px-4 py-6">
        <ShellLine className="h-4 w-full" />
        <ShellLine className="mt-3 h-4 w-full" />
        <ShellLine className="mt-3 h-4 w-5/6" />
        <ShellLine className="mt-3 h-4 w-full" />
        <ShellLine className="mt-3 h-4 w-2/3" />
      </section>
      <section className="px-4 pb-8">
        <div className="h-12 w-full rounded-2xl bg-slate-100" />
      </section>
    </MobilePageShell>
  );
}

export function ClubEditorLoadingShell({
  presentation = "page",
}: {
  presentation?: "page" | "modal";
}) {
  const isModal = presentation === "modal";

  return (
    <div
      className={
        isModal
          ? "flex min-h-0 flex-1 flex-col font-display text-slate-900"
          : "bg-[var(--background-light)] font-display text-slate-900"
      }
    >
      <div className={isModal ? "flex min-h-0 flex-1 flex-col" : "mx-auto flex min-h-screen max-w-md flex-col bg-white"}>
        <header
          className={`sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 ${
            isModal ? "bg-white/92 px-5 py-4 backdrop-blur" : "bg-white p-4"
          }`}
        >
          <div className="size-10 rounded-full bg-slate-100" />
          <ShellLine className="h-5 w-28" />
          <div className="size-10" />
        </header>

        <main className={`flex-1 px-4 py-5 ${isModal ? "overflow-y-auto pb-6" : "pb-10"}`}>
          <div className="space-y-4">
            <ShellLine className="h-4 w-20" />
            {Array.from({ length: 5 }, (_, index) => (
              <div key={`field-${index}`}>
                <ShellLine className="mb-2 h-4 w-24" />
                <ShellBlock className={index === 2 ? "h-40 w-full" : "h-12 w-full"} />
              </div>
            ))}
            <div className="h-12 w-full rounded-2xl bg-[var(--primary)]/10" />
          </div>
        </main>
      </div>
    </div>
  );
}
