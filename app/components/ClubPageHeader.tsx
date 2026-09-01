"use client";

import type { ReactNode } from "react";

import { NotificationBellLink } from "@/app/components/NotificationBellLink";
import { RouterLink } from "@/app/components/RouterLink";
import { SemoBrandMark } from "@/app/components/SemoBrandMark";

type ClubPageHeaderTheme = "user" | "admin";
type ClubPageHeaderLayout = "page" | "modal";

type ClubPageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  theme?: ClubPageHeaderTheme;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
  containerClassName?: string;
  sticky?: boolean;
  layout?: ClubPageHeaderLayout;
  showNotifications?: boolean;
};

export function ClubPageHeader({
  title,
  subtitle,
  icon = "dashboard",
  theme = "user",
  leftSlot,
  rightSlot,
  className,
  containerClassName,
  sticky = true,
  layout = "page",
  showNotifications = true,
}: ClubPageHeaderProps) {
  const headerClassName = `${sticky ? "sticky top-0 z-50" : ""} semo-sticky-surface border-b ${className ?? ""}`;
  const resolvedContainerClassName =
    containerClassName ?? (
      layout === "modal"
        ? "max-w-none px-5"
        : theme === "admin"
          ? "semo-page-admin"
          : "semo-page-user"
    );
  const iconElement = icon === "home" ? (
    <SemoBrandMark className="size-10 text-[var(--primary)]" />
  ) : (
    <span className="semo-page-glyph" aria-hidden="true">
      <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{icon}</span>
    </span>
  );

  return (
    <header className={headerClassName} data-semo-page-header data-layout={layout}>
      <div
        className={`mx-auto flex w-full items-center justify-between gap-3 p-4 ${resolvedContainerClassName}`}
        data-semo-page-header-inner
      >
        <div className="min-w-0 flex items-center gap-3">
          {leftSlot ? <div className="shrink-0">{leftSlot}</div> : null}
          {icon === "home" ? (
            <RouterLink href="/" aria-label="SEMO 전체 모임 홈으로 이동" className="semo-icon-control">
              {iconElement}
            </RouterLink>
          ) : (
            iconElement
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {rightSlot || (showNotifications && layout === "page") ? (
          <div className="flex shrink-0 items-center gap-1">
            {rightSlot}
            {showNotifications && layout === "page" ? <NotificationBellLink /> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
