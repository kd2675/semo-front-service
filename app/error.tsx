"use client";

import { useEffect } from "react";

import { RouterLink } from "@/app/components/RouterLink";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error("SEMO 화면 오류", error);
  }, [error]);

  return (
    <main className="semo-user-theme flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <section className="semo-card w-full max-w-md p-6 text-center" role="alert">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
          <span className="material-symbols-outlined" aria-hidden="true">error</span>
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">화면을 불러오지 못했습니다</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">일시적인 오류가 발생했습니다. 다시 시도하거나 홈으로 이동해주세요.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <RouterLink href="/" replace className="semo-control inline-flex items-center justify-center border border-slate-200 px-4 text-sm font-bold text-slate-700">
            홈으로
          </RouterLink>
          <button type="button" onClick={reset} className="semo-control bg-[var(--primary)] px-4 text-sm font-bold text-white">
            다시 시도
          </button>
        </div>
      </section>
    </main>
  );
}
