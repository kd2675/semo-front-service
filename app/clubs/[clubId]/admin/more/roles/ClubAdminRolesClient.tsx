"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Public_Sans } from "next/font/google";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouterLink } from "@/app/components/RouterLink";
import { useAppToast } from "@/app/hooks/useAppToast";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/modals/ScheduleActionConfirmModal";
import { FAB_RIGHT_OFFSET_CLASS_NAME, getActionFabBottomClass } from "@/app/lib/fab";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type {
  ClubAdminRoleManagementResponse,
  ClubPermissionGroup,
  ClubPositionHistoryItem,
  ClubPositionSummary,
} from "@/app/lib/clubs";
import { deleteRoleHistoryMutationOptions } from "@/app/lib/react-query/roles/mutations";
import {
  adminRoleHistoryQueryOptions,
  adminRoleManagementQueryOptions,
  roleQueryKeys,
} from "@/app/lib/react-query/roles/queries";
import { RoleEditSheet } from "./components/RoleEditSheet";
import { DEFAULT_ROLE_COLOR, makeInitials } from "./utils/roleUtils";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

type ClubAdminRolesClientProps = {
  clubId: string;
  initialData: ClubAdminRoleManagementResponse;
};

type RoleSheetTab = "overview" | "permissions" | "members";

type RolePageTab = "ROLES" | "PERMISSIONS" | "HISTORY";

const ROLE_PAGE_TABS: { key: RolePageTab; label: string; icon: string }[] = [
  { key: "ROLES", label: "직책", icon: "badge" },
  { key: "PERMISSIONS", label: "권한", icon: "rule" },
  { key: "HISTORY", label: "이력", icon: "history" },
];

function normalizeRoleSheetTab(value: string | null): RoleSheetTab {
  switch (value) {
    case "permissions":
      return "permissions";
    case "members":
      return "members";
    default:
      return "overview";
  }
}

function getRoleColor(role: ClubPositionSummary) {
  return role.colorHex ?? DEFAULT_ROLE_COLOR;
}

function getRoleStatusLabel(role: ClubPositionSummary) {
  if (!role.active) {
    return "중지";
  }
  if (role.memberCount === 0) {
    return "미배정";
  }
  return "운영 중";
}

function RoleAvatar({ role }: { role: ClubPositionSummary }) {
  const colorHex = getRoleColor(role);

  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
      style={{ backgroundColor: colorHex }}
    >
      <span className="material-symbols-outlined text-[26px]">{role.iconName ?? "badge"}</span>
    </div>
  );
}

function RoleMetricChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="material-symbols-outlined text-[17px] text-[var(--primary)]">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function RoleOverviewCard({
  clubName,
  stats,
  featureFilter,
  clubId,
  reduceMotion,
}: {
  clubName: string;
  stats: {
    totalRoles: number;
    activeRoles: number;
    assignedMembers: number;
    historyCount: number;
  };
  featureFilter: string;
  clubId: string;
  reduceMotion: boolean;
}) {
  return (
    <motion.section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm" {...staggeredFadeUpMotion(0, reduceMotion)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Role Operations</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">직책, 권한, 보유 이력을 한 흐름으로 관리합니다.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {clubName} 운영진의 현재 직책과 과거 보유 기간을 함께 확인합니다.
          </p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary)]">
          <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <RoleMetricChip icon="badge" label="직책" value={stats.totalRoles} />
        <RoleMetricChip icon="verified_user" label="활성" value={stats.activeRoles} />
        <RoleMetricChip icon="group" label="배정" value={stats.assignedMembers} />
        <RoleMetricChip icon="history" label="이력" value={stats.historyCount} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <RouterLink
          href={`/clubs/${clubId}/admin/more/roles/assignments`}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
        >
          <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
          멤버별 배정
        </RouterLink>
        {featureFilter ? (
          <RouterLink
            href={`/clubs/${clubId}/admin/more/roles`}
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-2 text-xs font-bold text-[var(--primary)]"
          >
            <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
            기능 필터 해제
          </RouterLink>
        ) : null}
      </div>
    </motion.section>
  );
}

function RoleTabBar({
  activeTab,
  onChange,
  reduceMotion,
}: {
  activeTab: RolePageTab;
  onChange: (tab: RolePageTab) => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.section className="rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm" {...staggeredFadeUpMotion(1, reduceMotion)}>
      <div className="grid grid-cols-3 gap-2">
        {ROLE_PAGE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[18px] px-2 text-sm font-bold transition ${
              activeTab === tab.key
                ? "bg-[#ec5b13] text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </motion.section>
  );
}

function RoleCard({
  role,
  permissionLabels,
  index,
  onOpenSheet,
  reduceMotion,
}: {
  role: ClubPositionSummary;
  permissionLabels: string[];
  index: number;
  onOpenSheet: (role: ClubPositionSummary, tab: RoleSheetTab) => void;
  reduceMotion: boolean;
}) {
  const colorHex = getRoleColor(role);
  const previewLabels = permissionLabels.slice(0, 3);
  const remainingPermissionCount = Math.max(0, permissionLabels.length - previewLabels.length);

  return (
    <motion.article
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
      {...staggeredFadeUpMotion(index + 2, reduceMotion)}
    >
      <div className="flex items-start gap-4">
        <RoleAvatar role={role} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-extrabold tracking-tight text-slate-900">{role.displayName}</h3>
              <p className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {role.positionCode}
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ backgroundColor: `${colorHex}18`, color: colorHex }}
            >
              {getRoleStatusLabel(role)}
            </span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
            {role.description ?? "이 직책의 설명이 아직 없습니다."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">배정 멤버</p>
          <p className="mt-1 text-lg font-extrabold">{role.memberCount}명</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">권한</p>
          <p className="mt-1 text-lg font-extrabold">{role.permissionCount}개</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {previewLabels.length > 0 ? (
          previewLabels.map((label) => (
            <span key={`${role.clubPositionId}-${label}`} className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-[var(--primary)]">
              {label}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">권한 없음</span>
        )}
        {remainingPermissionCount > 0 ? (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
            +{remainingPermissionCount}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onOpenSheet(role, "overview")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          설정
        </button>
        <button
          type="button"
          onClick={() => onOpenSheet(role, "members")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          배정
        </button>
      </div>
    </motion.article>
  );
}

function EmptyRoleState({ clubId, reduceMotion }: { clubId: string; reduceMotion: boolean }) {
  return (
    <motion.section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm" {...staggeredFadeUpMotion(2, reduceMotion)}>
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary)]">
        <span className="material-symbols-outlined text-[30px]">add_moderator</span>
      </div>
      <h3 className="mt-4 text-lg font-bold">아직 만든 직책이 없습니다.</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">회장, 총무, 경기운영 같은 운영 직책을 먼저 등록하세요.</p>
      <RouterLink
        href={`/clubs/${clubId}/admin/more/roles/new`}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-5 py-3 text-sm font-bold text-white"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        직책 만들기
      </RouterLink>
    </motion.section>
  );
}

function PermissionGroupCard({
  group,
  roles,
  index,
  reduceMotion,
}: {
  group: ClubPermissionGroup;
  roles: ClubPositionSummary[];
  index: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm" {...staggeredFadeUpMotion(index + 2, reduceMotion)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{group.featureKey}</p>
          <h3 className="mt-2 text-lg font-extrabold text-slate-900">{group.displayName}</h3>
          {group.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{group.description}</p> : null}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
          {group.permissions.length}개
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {group.permissions.map((permission) => {
          const assignedRoles = roles.filter((role) => role.permissionKeys.includes(permission.permissionKey));
          return (
            <div key={permission.permissionKey} className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{permission.displayName}</p>
                  <p className="mt-1 break-all text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {permission.permissionKey}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[var(--primary)]">
                  {assignedRoles.length}
                </span>
              </div>
              {assignedRoles.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignedRoles.slice(0, 4).map((role) => (
                    <span key={`${permission.permissionKey}-${role.clubPositionId}`} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      {role.displayName}
                    </span>
                  ))}
                  {assignedRoles.length > 4 ? (
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
                      +{assignedRoles.length - 4}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </motion.article>
  );
}

function RoleHistoryCard({
  history,
  index,
  onDeleteRequest,
  reduceMotion,
}: {
  history: ClubPositionHistoryItem;
  index: number;
  onDeleteRequest: (history: ClubPositionHistoryItem) => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm" {...staggeredFadeUpMotion(index + 2, reduceMotion)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900">{history.memberDisplayName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-[var(--primary)]">
              {history.positionDisplayName}
            </span>
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${history.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {history.active ? "보유 중" : "종료"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDeleteRequest(history)}
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition active:scale-95"
          aria-label={`${history.memberDisplayName} 직책 보유 이력 삭제`}
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
      <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
        <span className="font-semibold text-slate-400">시작</span>
        <span className="font-bold text-slate-700">{history.startedAtLabel ?? "기록 없음"}</span>
        <span className="font-semibold text-slate-400">종료</span>
        <span className="font-bold text-slate-700">{history.endedAtLabel ?? "현재"}</span>
      </div>
      <p className="mt-4 break-all text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {history.positionCode}
      </p>
    </motion.article>
  );
}

export function ClubAdminRolesClient({ clubId, initialData }: ClubAdminRolesClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useAppToast();
  const featureFilter = searchParams.get("feature")?.trim().toUpperCase() ?? "";
  const requestedEditPositionId = Number(searchParams.get("editPositionId") ?? "");
  const requestedEditTab = normalizeRoleSheetTab(searchParams.get("tab"));
  const roleManagementQuery = useQuery({
    ...adminRoleManagementQueryOptions(clubId),
    initialData,
  });
  const roleHistoryQuery = useQuery(adminRoleHistoryQueryOptions(clubId));
  const deleteHistoryMutation = useMutation(deleteRoleHistoryMutationOptions(clubId));
  const [roleManagementState, setRoleManagement] = useState<ClubAdminRoleManagementResponse | null>(null);
  const [activeTab, setActiveTab] = useState<RolePageTab>("ROLES");
  const [pendingDeleteHistory, setPendingDeleteHistory] = useState<ClubPositionHistoryItem | null>(null);
  const [selectedSheetState, setSelectedSheetState] = useState<{
    positionId: number;
    tab: RoleSheetTab;
  } | null>(null);
  const roleManagement = roleManagementState ?? roleManagementQuery.data;
  const histories = roleHistoryQuery.data?.histories ?? [];

  const permissionLabelMap = useMemo(
    () =>
      new Map(
        roleManagement.permissionGroups.flatMap((group) =>
          group.permissions.map((permission) => [permission.permissionKey, permission.displayName] as const),
        ),
      ),
    [roleManagement.permissionGroups],
  );

  const permissionKeysByFeature = useMemo(
    () =>
      new Map(
        roleManagement.permissionGroups.map((group) => [
          group.featureKey,
          new Set(group.permissions.map((permission) => permission.permissionKey)),
        ]),
      ),
    [roleManagement.permissionGroups],
  );

  const stats = useMemo(
    () => ({
      totalRoles: roleManagement.positions.length,
      activeRoles: roleManagement.positions.filter((role) => role.active).length,
      assignedMembers: roleManagement.positions.reduce((sum, role) => sum + role.memberCount, 0),
      historyCount: histories.length,
    }),
    [histories.length, roleManagement.positions],
  );

  const sortedRoles = useMemo(() => {
    const roles = [...roleManagement.positions];
    if (featureFilter) {
      const targetPermissionKeys = permissionKeysByFeature.get(featureFilter);
      if (targetPermissionKeys) {
        roles.sort((left, right) => {
          const leftMatched = left.permissionKeys.some((permissionKey) => targetPermissionKeys.has(permissionKey));
          const rightMatched = right.permissionKeys.some((permissionKey) => targetPermissionKeys.has(permissionKey));
          if (leftMatched !== rightMatched) {
            return leftMatched ? -1 : 1;
          }
          return 0;
        });
      }
    }
    roles.sort((left, right) => {
      if (left.active !== right.active) {
        return left.active ? -1 : 1;
      }
      if (right.permissionCount !== left.permissionCount) {
        return right.permissionCount - left.permissionCount;
      }
      return right.memberCount - left.memberCount;
    });
    return roles;
  }, [featureFilter, permissionKeysByFeature, roleManagement.positions]);

  const selectedEditRole = useMemo(() => {
    if (selectedSheetState != null) {
      return roleManagement.positions.find((position) => position.clubPositionId === selectedSheetState.positionId) ?? null;
    }
    if (Number.isFinite(requestedEditPositionId) && requestedEditPositionId > 0) {
      return roleManagement.positions.find((position) => position.clubPositionId === requestedEditPositionId) ?? null;
    }
    return null;
  }, [requestedEditPositionId, roleManagement.positions, selectedSheetState]);

  const selectedEditTab = selectedSheetState?.tab ?? requestedEditTab;

  const updateSheetSearchParams = (positionId: number | null, tab?: RoleSheetTab) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (positionId == null) {
      nextParams.delete("editPositionId");
      nextParams.delete("tab");
    } else {
      nextParams.set("editPositionId", String(positionId));
      nextParams.set("tab", tab ?? "overview");
    }
    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const refreshRoleManagement = async () => {
    try {
      const result = await queryClient.fetchQuery(adminRoleManagementQueryOptions(clubId));
      setRoleManagement(result);
      await queryClient.invalidateQueries({ queryKey: roleQueryKeys.adminRoleHistory(clubId) });
      return true;
    } catch {
      return false;
    }
  };

  const handleOpenRoleSheet = (role: ClubPositionSummary, tab: RoleSheetTab) => {
    setSelectedSheetState({
      positionId: role.clubPositionId,
      tab,
    });
    updateSheetSearchParams(role.clubPositionId, tab);
  };

  const handleCloseRoleSheet = () => {
    setSelectedSheetState(null);
    if (searchParams.has("editPositionId")) {
      updateSheetSearchParams(null);
    }
  };

  const handleConfirmDeleteHistory = async () => {
    if (!pendingDeleteHistory) {
      return;
    }
    try {
      await deleteHistoryMutation.mutateAsync(pendingDeleteHistory.positionHistoryId);
      await queryClient.invalidateQueries({ queryKey: roleQueryKeys.adminRoleHistory(clubId) });
      showToast("직책 보유 이력을 삭제했습니다.", "success");
      setPendingDeleteHistory(null);
    } catch {
      showToast("직책 보유 이력을 삭제하지 못했습니다.", "error");
    }
  };

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
      <div className="min-h-screen bg-[#f8f6f6]">
        <ClubPageHeader
          title="직책 관리"
          subtitle={roleManagement.clubName}
          icon="admin_panel_settings"
          theme="admin"
          containerClassName="max-w-md"
          rightSlot={
            <div className="flex size-9 items-center justify-center rounded-full bg-orange-50 text-xs font-extrabold text-[var(--primary)]">
              {makeInitials(roleManagement.clubName, "AD")}
            </div>
          }
        />

        <main className="semo-nav-bottom-space mx-auto w-full max-w-md space-y-4 px-4 pt-4">
          <RoleOverviewCard
            clubName={roleManagement.clubName}
            stats={stats}
            featureFilter={featureFilter}
            clubId={clubId}
            reduceMotion={reduceMotion}
          />
          <RoleTabBar activeTab={activeTab} reduceMotion={reduceMotion} onChange={setActiveTab} />

          {activeTab === "ROLES" ? (
            <section className="space-y-4">
              {sortedRoles.length > 0 ? (
                sortedRoles.map((role, index) => {
                  const permissionLabels = role.permissionKeys.map(
                    (permissionKey) => permissionLabelMap.get(permissionKey) ?? permissionKey,
                  );
                  return (
                    <RoleCard
                      key={role.clubPositionId}
                      role={role}
                      permissionLabels={permissionLabels}
                      index={index}
                      reduceMotion={reduceMotion}
                      onOpenSheet={handleOpenRoleSheet}
                    />
                  );
                })
              ) : (
                <EmptyRoleState clubId={clubId} reduceMotion={reduceMotion} />
              )}
            </section>
          ) : null}

          {activeTab === "PERMISSIONS" ? (
            <section className="space-y-4">
              {roleManagement.permissionGroups.map((group, index) => (
                <PermissionGroupCard
                  key={group.featureKey}
                  group={group}
                  roles={roleManagement.positions}
                  index={index}
                  reduceMotion={reduceMotion}
                />
              ))}
            </section>
          ) : null}

          {activeTab === "HISTORY" ? (
            <section className="space-y-4">
              {roleHistoryQuery.isPending ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                  직책 보유 이력을 불러오는 중입니다.
                </div>
              ) : roleHistoryQuery.isError ? (
                <div className="rounded-[28px] border border-rose-100 bg-rose-50 p-5 text-sm font-semibold text-rose-600">
                  직책 보유 이력을 불러오지 못했습니다.
                </div>
              ) : histories.length === 0 ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                  아직 기록된 직책 보유 이력이 없습니다.
                </div>
              ) : (
                histories.map((history, index) => (
                  <RoleHistoryCard
                    key={history.positionHistoryId}
                    history={history}
                    index={index}
                    reduceMotion={reduceMotion}
                    onDeleteRequest={setPendingDeleteHistory}
                  />
                ))
              )}
            </section>
          ) : null}
        </main>

        <RouterLink
          href={`/clubs/${clubId}/admin/more/roles/new`}
          aria-label="직책 만들기"
          className={`fixed ${FAB_RIGHT_OFFSET_CLASS_NAME} ${getActionFabBottomClass(true)} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#ec5b13] text-white transition-transform active:scale-95`}
          style={{ boxShadow: "0 6px 16px rgba(236, 91, 19, 0.32)" }}
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </RouterLink>

        {pendingDeleteHistory ? (
          <ScheduleActionConfirmModal
            title="직책 보유 이력을 삭제할까요?"
            description="삭제하면 활동 로그의 직책 필터 기준에서도 제외됩니다. 현재 직책 배정은 멤버별 배정 화면에서 별도로 조정해야 합니다."
            confirmLabel="이력 삭제"
            busyLabel="삭제 중..."
            busy={deleteHistoryMutation.isPending}
            onCancel={() => {
              if (!deleteHistoryMutation.isPending) {
                setPendingDeleteHistory(null);
              }
            }}
            onConfirm={() => void handleConfirmDeleteHistory()}
          />
        ) : null}

        <AnimatePresence>
          {selectedEditRole ? (
            <RoleEditSheet
              key={`role-edit-${selectedEditRole.clubPositionId}-${selectedEditTab}`}
              clubId={clubId}
              role={selectedEditRole}
              initialTab={selectedEditTab}
              onClose={handleCloseRoleSheet}
              onRolesChanged={refreshRoleManagement}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
