"use client";

import type { ReactNode } from "react";

type ClubPageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  rightSlot?: ReactNode;
  className?: string;
};

export function ClubPageHeader({
  title,
  subtitle,
  icon,
  rightSlot,
  className,
}: ClubPageHeaderProps) {
  return (
    <header className={`border-b border-slate-200 bg-white ${className ?? ""}`}>
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-4">
        <div className="min-w-0 flex items-center gap-3">
          {icon ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
              <span className="material-symbols-outlined text-[24px] text-[var(--primary)]">
                {icon}
              </span>
            </div>
          ) : null}
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
