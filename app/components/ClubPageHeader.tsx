"use client";

import { RouterLink } from "@/app/components/RouterLink";
import type { ReactNode } from "react";

type ClubPageHeaderTheme = "user" | "admin";

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
}: ClubPageHeaderProps) {
  const headerClassName = `${sticky ? "sticky top-0 z-50" : ""} border-b border-slate-200 backdrop-blur-md ${
    theme === "admin" ? "bg-[#f8f6f6]/85" : "bg-[var(--background-light)]/85"
  } ${className ?? ""}`;
  const resolvedContainerClassName =
    containerClassName ?? (theme === "admin" ? "max-w-5xl" : "max-w-md");
  const iconElement = (
    <div className="shrink-0 rounded-xl bg-[var(--primary)]/10 p-2 text-[var(--primary)]">
      <span className="material-symbols-outlined">{icon}</span>
    </div>
  );

  return (
    <header className={headerClassName}>
      <div className={`mx-auto flex w-full items-center justify-between gap-3 p-4 ${resolvedContainerClassName}`}>
        <div className="min-w-0 flex items-center gap-3">
          {leftSlot ? <div className="shrink-0">{leftSlot}</div> : null}
          {icon === "home" ? (
            <RouterLink href="/" aria-label="SEMO 홈으로 이동">
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
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </header>
  );
}
