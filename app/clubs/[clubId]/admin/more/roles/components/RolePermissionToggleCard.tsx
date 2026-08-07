"use client";

import type { ClubPermissionGroup } from "@/app/lib/clubs";

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
    <article className="semo-card overflow-hidden border-l-4 border-l-[var(--primary)] p-5">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-[var(--radius-control)] bg-orange-50 text-[var(--primary)]">
            <span className="material-symbols-outlined" aria-hidden="true">{group.iconName}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{group.displayName}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {group.description ?? `${group.permissions.length}개 세부 권한을 제어합니다.`}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[var(--primary)]">
          {activeCount}개 활성
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
                className={`relative inline-flex h-11 w-14 shrink-0 items-center rounded-full transition ${
                  selected ? "bg-[var(--primary)]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute left-1 size-6 rounded-full border border-slate-200 bg-white transition-transform ${
                    selected ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#eff4f7] pt-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="material-symbols-outlined text-base text-[var(--primary)]" aria-hidden="true">verified_user</span>
          권한 {activeCount}개 사용 중
        </div>
        <div className="text-xs font-semibold text-slate-400">전체 {group.permissions.length}개</div>
      </div>
    </article>
  );
}
