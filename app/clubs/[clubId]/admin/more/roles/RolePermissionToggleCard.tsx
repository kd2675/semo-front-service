"use client";

import { Manrope } from "next/font/google";
import type { ClubPermissionGroup } from "@/app/lib/clubs";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

type RolePermissionToggleCardProps = {
  group: ClubPermissionGroup;
  selectedKeys: string[];
  onToggle: (permissionKey: string) => void;
};

export function RolePermissionToggleCard({
  group,
  selectedKeys,
  onToggle,
}: RolePermissionToggleCardProps) {
  const activeCount = group.permissions.filter((permission) => selectedKeys.includes(permission.permissionKey)).length;

  return (
    <article className="overflow-hidden rounded-[24px] border-l-4 border-[var(--secondary)] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-[14px] bg-[var(--secondary-soft)] text-[var(--secondary)]">
            <span className="material-symbols-outlined">{group.iconName}</span>
          </div>
          <div>
            <h3 className={`${manrope.className} text-xl font-bold text-slate-900`}>{group.displayName}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {group.description ?? `${group.permissions.length}개 세부 권한을 제어합니다.`}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--secondary)]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--secondary)]">
          {activeCount} Active
        </span>
      </div>

      <div className="space-y-4">
        {group.permissions.map((permission) => {
          const selected = selectedKeys.includes(permission.permissionKey);
          return (
            <div
              key={permission.permissionKey}
              className="flex items-center justify-between gap-4 rounded-[18px] bg-[#f7fafc] p-4 ring-1 ring-[#edf2f5]"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{permission.displayName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {permission.description ?? "이 권한에 대한 설명이 없습니다."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={selected}
                onClick={() => onToggle(permission.permissionKey)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  selected ? "bg-[var(--secondary)]" : "bg-[#dbe4e8]"
                }`}
              >
                <span
                  className={`absolute left-[2px] size-5 rounded-full border border-slate-200 bg-white transition-transform ${
                    selected ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#eff4f7] pt-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="material-symbols-outlined text-base text-[var(--secondary)]">verified_user</span>
          {activeCount} permissions enabled
        </div>
        <div className="text-[11px] font-semibold text-slate-400">{group.permissions.length} total</div>
      </div>
    </article>
  );
}
