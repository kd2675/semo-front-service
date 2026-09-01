"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouterLink } from "@/app/components/RouterLink";
import { FAB_RIGHT_OFFSET_CLASS_NAME, getActionFabBottomClass } from "@/app/lib/fab";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type {
  ClubAdminRoleManagementResponse,
  ClubPermissionGroup,
  ClubPositionHistoryItem,
  ClubPositionSummary,
} from "@/app/lib/clubs";
import {
  adminRoleHistoryQueryOptions,
  adminRoleManagementQueryOptions,
  roleQueryKeys,
} from "@/app/lib/react-query/roles/queries";

import { RoleEditSheet } from "./components/RoleEditSheet";
import {
  DEFAULT_ROLE_COLOR,
  getFeatureAccessSelection,
  getPositionFeatureAccessLabels,
  makeInitials,
} from "./utils/roleUtils";

type ClubAdminRolesClientProps = {
  clubId: string;
  initialData: ClubAdminRoleManagementResponse;
};

type RoleSheetTab = "overview" | "permissions" | "members";

type RolePageTab = "ROLES" | "PERMISSIONS" | "HISTORY";
type RoleStatusFilter = "ACTIVE" | "INACTIVE" | "ALL";

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
      className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-card)] text-white shadow-sm"
      style={{ backgroundColor: colorHex }}
    >
      <span className="material-symbols-outlined text-[26px]" aria-hidden="true">{role.iconName ?? "badge"}</span>
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
    <div className="rounded-[var(--radius-card)] bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="material-symbols-outlined text-[17px] text-[var(--primary)]" aria-hidden="true">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function RoleOverviewCard({
  stats,
  featureFilter,
  clubId,
  reduceMotion,
}: {
  stats: {
    totalRoles: number;
    activeRoles: number;
    assignedMembers: number;
    unassignedRoles: number;
  };
  featureFilter: string;
  clubId: string;
  reduceMotion: boolean;
}) {
  return (
    <motion.section className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-5 shadow-sm" {...staggeredFadeUpMotion(0, reduceMotion)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-slate-400">업무 위임</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">직책과 기능 권한을 함께 관리합니다.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            OWNER·ADMIN은 항상 전체 운영 권한을 갖습니다. 일반 회원에게 필요한 업무만 직책으로 위임하고 보유 이력을 남깁니다.
          </p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-orange-50 text-[var(--primary)]">
          <span className="material-symbols-outlined text-[26px]" aria-hidden="true">admin_panel_settings</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <RoleMetricChip icon="badge" label="직책" value={stats.totalRoles} />
        <RoleMetricChip icon="verified_user" label="활성" value={stats.activeRoles} />
        <RoleMetricChip icon="group" label="배정 멤버" value={stats.assignedMembers} />
        <RoleMetricChip icon="person_off" label="미배정 직책" value={stats.unassignedRoles} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {featureFilter ? (
          <RouterLink
            href={`/clubs/${clubId}/admin/more/roles`}
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-2 text-xs font-bold text-[var(--primary)]"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">filter_alt_off</span>
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
    <motion.section className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-2 shadow-sm" {...staggeredFadeUpMotion(1, reduceMotion)}>
      <div role="tablist" aria-label="직책 관리 보기" className="grid grid-cols-3 gap-2">
        {ROLE_PAGE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-control)] px-2 text-sm font-bold transition ${
              activeTab === tab.key
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </motion.section>
  );
}

function RoleCard({
  role,
  accessLabels,
  index,
  onOpenSheet,
  reduceMotion,
}: {
  role: ClubPositionSummary;
  accessLabels: string[];
  index: number;
  onOpenSheet: (role: ClubPositionSummary, tab: RoleSheetTab) => void;
  reduceMotion: boolean;
}) {
  const colorHex = getRoleColor(role);
  const previewLabels = accessLabels.slice(0, 3);
  const remainingAccessCount = Math.max(0, accessLabels.length - previewLabels.length);

  return (
    <motion.article
      className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-5 shadow-sm"
      {...staggeredFadeUpMotion(index + 2, reduceMotion)}
    >
      <div className="flex items-start gap-4">
        <RoleAvatar role={role} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-extrabold tracking-tight text-slate-900">{role.displayName}</h3>
              <p className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                직책 코드 · {role.positionCode}
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
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
        <div className="rounded-[var(--radius-card)] bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">배정 멤버</p>
          <p className="mt-1 text-lg font-extrabold">{role.memberCount}명</p>
        </div>
        <div className="rounded-[var(--radius-card)] bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">운영 기능</p>
          <p className="mt-1 text-lg font-extrabold">{accessLabels.length}개</p>
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
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">위임 업무 없음</span>
        )}
        {remainingAccessCount > 0 ? (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
            +{remainingAccessCount}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onOpenSheet(role, "overview")}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
          설정
        </button>
        <button
          type="button"
          onClick={() => onOpenSheet(role, "members")}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span>
          배정
        </button>
      </div>
    </motion.article>
  );
}

function EmptyRoleState({ clubId, reduceMotion }: { clubId: string; reduceMotion: boolean }) {
  return (
    <motion.section className="rounded-[var(--radius-card)] border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm" {...staggeredFadeUpMotion(2, reduceMotion)}>
      <div className="mx-auto flex size-14 items-center justify-center rounded-[var(--radius-card)] bg-orange-50 text-[var(--primary)]">
        <span className="material-symbols-outlined text-[30px]" aria-hidden="true">add_moderator</span>
      </div>
      <h3 className="mt-4 text-lg font-bold">아직 만든 직책이 없습니다.</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">회장, 총무, 경기운영 같은 운영 직책을 먼저 등록하세요.</p>
      <RouterLink
        href={`/clubs/${clubId}/admin/more/roles/new`}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
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
  const standardLevels = group.accessLevels.filter((level) => level.accessLevel !== "NONE");
  const customRoles = roles.filter((role) => getFeatureAccessSelection(group, role.featureGrants).custom);
  const sensitivePermissions = group.permissions.filter((permission) => permission.sensitive);

  return (
    <motion.article className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-5 shadow-sm" {...staggeredFadeUpMotion(index + 2, reduceMotion)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{group.featureKey}</p>
          <h3 className="mt-2 text-lg font-extrabold text-slate-900">{group.displayName}</h3>
          {group.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{group.description}</p> : null}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
          {standardLevels.length}개 수준
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {standardLevels.map((level) => {
          const assignedRoles = roles.filter(
            (role) => getFeatureAccessSelection(group, role.featureGrants).accessLevel?.accessLevel === level.accessLevel,
          );
          return (
            <div key={level.accessLevel} className="rounded-[var(--radius-card)] bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{level.displayName}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{level.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-[var(--primary)]">
                  {assignedRoles.length}
                </span>
              </div>
              {assignedRoles.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignedRoles.slice(0, 4).map((role) => (
                    <span key={`${level.accessLevel}-${role.clubPositionId}`} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                      {role.displayName}
                    </span>
                  ))}
                  {assignedRoles.length > 4 ? (
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                      +{assignedRoles.length - 4}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
        {customRoles.length > 0 ? (
          <div className="rounded-[var(--radius-card)] bg-amber-50 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-amber-900">기존 맞춤 설정</p>
                <p className="mt-1 text-xs leading-5 text-amber-700">
                  세부 권한 방식으로 저장된 직책입니다. 편집 시 표준 운영 수준으로 전환할 수 있습니다.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-amber-700">
                {customRoles.length}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {customRoles.map((role) => (
                <span key={`custom-${group.featureKey}-${role.clubPositionId}`} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                  {role.displayName}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {sensitivePermissions.length > 0 ? (
          <div className="border-t border-slate-200 pt-4">
            <p className="mb-3 text-xs font-bold text-slate-500">추가 승인 권한</p>
            <div className="space-y-3">
              {sensitivePermissions.map((permission) => {
                const assignedRoles = roles.filter((role) =>
                  role.featureGrants.some((grant) =>
                    grant.featureKey === group.featureKey
                    && grant.sensitivePermissionKeys.includes(permission.permissionKey),
                  ),
                );
                return (
                  <div key={permission.permissionKey} className="rounded-[var(--radius-card)] bg-amber-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{permission.displayName}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{permission.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-amber-700">
                        {assignedRoles.length}
                      </span>
                    </div>
                    {assignedRoles.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {assignedRoles.map((role) => (
                          <span key={`${permission.permissionKey}-${role.clubPositionId}`} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                            {role.displayName}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

function RoleHistoryCard({
  history,
  index,
  reduceMotion,
}: {
  history: ClubPositionHistoryItem;
  index: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.article className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-5 shadow-sm" {...staggeredFadeUpMotion(index + 2, reduceMotion)}>
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
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
          변경 불가
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
        <span className="font-semibold text-slate-400">시작</span>
        <span className="font-bold text-slate-700">{history.startedAtLabel ?? "기록 없음"}</span>
        <span className="font-semibold text-slate-400">종료</span>
        <span className="font-bold text-slate-700">{history.endedAtLabel ?? "현재"}</span>
      </div>
      <p className="mt-4 break-all text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        직책 코드 · {history.positionCode}
      </p>
    </motion.article>
  );
}

export function ClubAdminRolesClient({ clubId, initialData }: ClubAdminRolesClientProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const featureFilter = searchParams.get("feature")?.trim().toUpperCase() ?? "";
  const requestedEditPositionId = Number(searchParams.get("editPositionId") ?? "");
  const requestedEditTab = normalizeRoleSheetTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<RolePageTab>("ROLES");
  const [roleQuery, setRoleQuery] = useState("");
  const [roleStatusFilter, setRoleStatusFilter] = useState<RoleStatusFilter>("ACTIVE");
  const deferredRoleQuery = useDeferredValue(roleQuery.trim().toLowerCase());
  const roleManagementQuery = useQuery({
    ...adminRoleManagementQueryOptions(clubId),
    initialData,
  });
  const roleHistoryQuery = useQuery({
    ...adminRoleHistoryQueryOptions(clubId),
    enabled: activeTab === "HISTORY",
  });
  const [roleManagementState, setRoleManagement] = useState<ClubAdminRoleManagementResponse | null>(null);
  const [selectedSheetState, setSelectedSheetState] = useState<{
    positionId: number;
    tab: RoleSheetTab;
  } | null>(null);
  const roleManagement = roleManagementState ?? roleManagementQuery.data;
  const histories = roleHistoryQuery.data?.histories ?? [];

  const stats = useMemo(
    () => ({
      totalRoles: roleManagement.positions.length,
      activeRoles: roleManagement.positions.filter((role) => role.active).length,
      assignedMembers: roleManagement.assignedMemberCount
        ?? roleManagement.positions.reduce((sum, role) => sum + role.memberCount, 0),
      unassignedRoles: roleManagement.positions.filter((role) => role.active && role.memberCount === 0).length,
    }),
    [roleManagement.assignedMemberCount, roleManagement.positions],
  );

  const sortedRoles = useMemo(() => {
    const roles = roleManagement.positions.filter((role) => {
      if (roleStatusFilter === "ACTIVE" && !role.active) return false;
      if (roleStatusFilter === "INACTIVE" && role.active) return false;
      if (featureFilter && !role.featureGrants.some((grant) => grant.featureKey === featureFilter)) {
        return false;
      }
      if (!deferredRoleQuery) return true;
      return `${role.displayName} ${role.description ?? ""} ${role.positionCode}`
        .toLowerCase()
        .includes(deferredRoleQuery);
    });
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
  }, [deferredRoleQuery, featureFilter, roleManagement.positions, roleStatusFilter]);

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

  const handleRoleSheetTabChange = (tab: RoleSheetTab) => {
    if (!selectedEditRole) return;
    setSelectedSheetState({ positionId: selectedEditRole.clubPositionId, tab });
    updateSheetSearchParams(selectedEditRole.clubPositionId, tab);
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)] text-slate-900">
      <div className="min-h-screen bg-[var(--color-bg)]">
        <ClubPageHeader
          title="직책·권한"
          subtitle={roleManagement.clubName}
          icon="admin_panel_settings"
          theme="admin"
          containerClassName="semo-page-admin"
          rightSlot={
            <div className="flex size-9 items-center justify-center rounded-full bg-orange-50 text-xs font-extrabold text-[var(--primary)]">
              {makeInitials(roleManagement.clubName, "AD")}
            </div>
          }
        />

        <main className="semo-page-admin semo-nav-bottom-space space-y-4 px-4 pt-4">
          <RoleOverviewCard
            stats={stats}
            featureFilter={featureFilter}
            clubId={clubId}
            reduceMotion={reduceMotion}
          />
          <RoleTabBar activeTab={activeTab} reduceMotion={reduceMotion} onChange={setActiveTab} />

          {activeTab === "ROLES" ? (
            <section role="tabpanel" className="space-y-4">
              <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-3 shadow-sm">
                <label className="relative block">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400" aria-hidden="true">search</span>
                  <span className="sr-only">직책 검색</span>
                  <input
                    value={roleQuery}
                    onChange={(event) => setRoleQuery(event.target.value)}
                    placeholder="직책 이름이나 설명 검색"
                    className="h-11 w-full rounded-[var(--radius-control)] bg-slate-100 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  />
                </label>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {([
                    ["ACTIVE", "사용 중"],
                    ["INACTIVE", "사용 종료"],
                    ["ALL", "전체"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={roleStatusFilter === value}
                      onClick={() => setRoleStatusFilter(value)}
                      className={`min-h-11 rounded-[var(--radius-control)] px-3 text-sm font-bold ${
                        roleStatusFilter === value
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {sortedRoles.length > 0 ? (
                sortedRoles.map((role, index) => {
                  const accessLabels = getPositionFeatureAccessLabels(
                    roleManagement.permissionGroups,
                    role.featureGrants,
                  );
                  return (
                    <RoleCard
                      key={role.clubPositionId}
                      role={role}
                      accessLabels={accessLabels}
                      index={index}
                      reduceMotion={reduceMotion}
                      onOpenSheet={handleOpenRoleSheet}
                    />
                  );
                })
              ) : (
                roleManagement.positions.length === 0 ? (
                  <EmptyRoleState clubId={clubId} reduceMotion={reduceMotion} />
                ) : (
                  <div className="rounded-[var(--radius-card)] border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
                    검색 조건에 맞는 직책이 없습니다.
                  </div>
                )
              )}
            </section>
          ) : null}

          {activeTab === "PERMISSIONS" ? (
            <section role="tabpanel" className="space-y-4">
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
            <section role="tabpanel" className="space-y-4">
              {roleHistoryQuery.isPending ? (
                <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                  직책 보유 이력을 불러오는 중입니다.
                </div>
              ) : roleHistoryQuery.isError ? (
                <div className="rounded-[var(--radius-card)] border border-rose-100 bg-rose-50 p-5 text-sm font-semibold text-rose-600">
                  직책 보유 이력을 불러오지 못했습니다.
                </div>
              ) : histories.length === 0 ? (
                <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                  아직 기록된 직책 보유 이력이 없습니다.
                </div>
              ) : (
                histories.map((history, index) => (
                  <RoleHistoryCard
                    key={history.positionHistoryId}
                    history={history}
                    index={index}
                    reduceMotion={reduceMotion}
                  />
                ))
              )}
            </section>
          ) : null}
        </main>

        {roleManagement.canCreate ? (
          <RouterLink
            href={`/clubs/${clubId}/admin/more/roles/new`}
            aria-label="직책 만들기"
            className={`fixed ${FAB_RIGHT_OFFSET_CLASS_NAME} ${getActionFabBottomClass(true)} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-card)] transition-transform active:scale-95`}
          >
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">add</span>
          </RouterLink>
        ) : null}

        <AnimatePresence>
          {selectedEditRole ? (
            <RoleEditSheet
              key={`role-edit-${selectedEditRole.clubPositionId}-${selectedEditTab}`}
              clubId={clubId}
              role={selectedEditRole}
              initialTab={selectedEditTab}
              canUpdate={roleManagement.canUpdate}
              canDelete={roleManagement.canDelete}
              canAssign={roleManagement.canAssign}
              onClose={handleCloseRoleSheet}
              onTabChange={handleRoleSheetTabChange}
              onRolesChanged={refreshRoleManagement}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
