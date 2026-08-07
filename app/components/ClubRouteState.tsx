"use client";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouterLink } from "@/app/components/RouterLink";

type ClubRouteErrorStateProps = {
  title: string;
  message: string;
  backHref: string;
  theme?: "user" | "admin";
  onRetry?: () => void;
  heading?: string;
  icon?: "error" | "lock";
};

type ClubRouteLoadingStateProps = {
  title?: string;
  theme?: "user" | "admin";
};

export function ClubRouteLoadingState({
  title = "화면을 준비하고 있습니다",
  theme = "user",
}: ClubRouteLoadingStateProps) {
  const isAdmin = theme === "admin";

  return (
    <div
      className={`${isAdmin ? "semo-admin-theme" : "semo-user-theme"} min-h-screen bg-[var(--background-light)] text-slate-900`}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <ClubPageHeader
        title={title}
        subtitle={isAdmin ? "관리자 화면" : "클럽 화면"}
        icon="progress_activity"
        theme={theme}
      />
      <main className={`semo-nav-bottom-space px-4 pt-6 ${isAdmin ? "semo-page-admin" : "semo-page-user"}`}>
        <div className="space-y-4" aria-hidden="true">
          <div className="h-28 animate-pulse rounded-[var(--radius-card)] bg-slate-200/75" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-slate-200/65" />
            <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-slate-200/65" />
          </div>
          <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-slate-200/55" />
        </div>
      </main>
    </div>
  );
}

export function ClubRouteErrorState({
  title,
  message,
  backHref,
  theme = "user",
  onRetry,
  heading = "화면을 불러오지 못했습니다",
  icon = "error",
}: ClubRouteErrorStateProps) {
  const isAdmin = theme === "admin";

  return (
    <div className={`${isAdmin ? "semo-admin-theme" : "semo-user-theme"} min-h-screen bg-[var(--background-light)] text-slate-900`}>
      <ClubPageHeader
        title={title}
        subtitle={isAdmin ? "관리자 화면" : "클럽 화면"}
        icon={icon}
        theme={theme}
      />
      <main className={`semo-nav-bottom-space px-4 pt-6 ${isAdmin ? "semo-page-admin" : "semo-page-user"}`}>
        <section className="semo-card px-5 py-6" role="alert" aria-live="assertive">
          <div className="flex items-start gap-4">
            <span
              className={`material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-xl ${
                icon === "lock"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-rose-50 text-rose-700"
              }`}
              aria-hidden="true"
            >
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900">{heading}</h2>
              <p className="mt-2 break-keep text-sm leading-6 text-slate-600">{message}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <RouterLink
              href={backHref}
              replace
              className="semo-control inline-flex items-center justify-center border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              이전 화면
            </RouterLink>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="semo-control inline-flex items-center justify-center bg-[var(--primary)] px-4 text-sm font-bold text-white hover:brightness-95"
              >
                다시 시도
              </button>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
