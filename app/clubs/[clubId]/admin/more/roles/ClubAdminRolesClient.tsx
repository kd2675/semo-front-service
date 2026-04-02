"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type {
  ClubAdminRoleManagementResponse,
  ClubPositionSummary,
} from "@/app/lib/clubs";
import { getClubAdminRoleManagement } from "@/app/lib/clubs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Manrope, Inter } from "next/font/google";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { RoleEditSheet } from "./RoleEditSheet";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type ClubAdminRolesClientProps = {
  clubId: string;
  initialData: ClubAdminRoleManagementResponse;
};

function makeInitials(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "AD";
  }
  return cleaned.slice(0, 2).toUpperCase();
}

function RoleStatusPill({ active, colorHex }: { active: boolean; colorHex: string | null }) {
  const style = active && colorHex
    ? ({
        backgroundColor: `${colorHex}1A`,
        color: colorHex,
      } as CSSProperties)
    : undefined;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] ${
        active ? "bg-[var(--secondary)]/10 text-[var(--secondary)]" : "bg-slate-200 text-slate-500"
      }`}
      style={style}
    >
      {active ? "Active" : "Paused"}
    </span>
  );
}

function buildRoleLevel(role: ClubPositionSummary, index: number) {
  const levelValue = Math.min(10, Math.max(1, Math.round(role.permissionCount / 2) + (role.active ? 2 : 0)));
  const category =
    role.permissionCount >= 8 ? "Super Admin" : role.permissionCount >= 5 ? "Technical" : "Operational";
  return {
    label: `Level ${String(levelValue).padStart(2, "0")}`,
    category,
    sortIndex: index,
  };
}

function buildRoleBadges(permissionLabels: string[], role: ClubPositionSummary) {
  const badges = permissionLabels.slice(0, 2);
  if (badges.length === 0) {
    badges.push(role.active ? "Active Role" : "Paused Role");
  }
  return badges;
}

function buildAvatarTokens(role: ClubPositionSummary) {
  const parts = role.displayName.split(/\s+/).filter(Boolean);
  const base = parts.length > 0 ? parts : ["Role"];
  const desired = Math.min(role.memberCount, 3);
  return Array.from({ length: desired }, (_, index) => {
    const tokenSource = base[index % base.length] ?? "R";
    return tokenSource.slice(0, 1).toUpperCase();
  });
}

function RoleMemberStack({
  role,
  colorHex,
}: {
  role: ClubPositionSummary;
  colorHex: string;
}) {
  const tokens = buildAvatarTokens(role);
  const remaining = Math.max(0, role.memberCount - tokens.length);

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {tokens.length > 0 ? (
          tokens.map((token, index) => (
            <div
              key={`${role.clubPositionId}-${token}-${index}`}
              className="flex size-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-sm"
              style={{ backgroundColor: index === 0 ? colorHex : `${colorHex}CC` }}
            >
              {token}
            </div>
          ))
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-500">
            0
          </div>
        )}
        {remaining > 0 ? (
          <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600 shadow-sm">
            +{remaining}
          </div>
        ) : null}
      </div>
      <div className="text-xs font-bold text-slate-500">
        {role.memberCount} Active {role.memberCount === 1 ? "Member" : "Members"}
      </div>
    </div>
  );
}

function AdminRoleCard({
  clubId,
  role,
  permissionLabels,
  emphasize = false,
  index,
  onOpenSheet,
}: {
  clubId: string;
  role: ClubPositionSummary;
  permissionLabels: string[];
  emphasize?: boolean;
  index: number;
  onOpenSheet: (role: ClubPositionSummary, tab: RoleSheetTab) => void;
}) {
  const colorHex = role.colorHex ?? "var(--secondary)";
  const level = buildRoleLevel(role, index);
  const badges = buildRoleBadges(permissionLabels, role);

  return (
    <article
      className={`flex h-full flex-col rounded-[24px] border-l-4 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)] ${
        emphasize ? "lg:col-span-2" : ""
      }`}
      style={{ borderLeftColor: colorHex }}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div
          className={`flex items-center justify-center rounded-[18px] text-white shadow-sm ${emphasize ? "size-14 text-[30px]" : "size-12 text-[26px]"}`}
          style={{ backgroundColor: colorHex }}
        >
          <span className="material-symbols-outlined">{role.iconName ?? "badge"}</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white"
            style={{ backgroundColor: colorHex }}
          >
            {level.label}
          </span>
          <span className="text-[11px] font-medium text-slate-500">{level.category}</span>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className={`${manrope.className} text-xl font-extrabold tracking-tight text-slate-900`}>
            {role.displayName}
          </h3>
          <RoleStatusPill active={role.active} colorHex={role.colorHex} />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {role.description ?? `${role.permissionCount}개 권한과 ${role.memberCount}명의 멤버가 연결된 직책입니다.`}
        </p>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{role.positionCode}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={`${role.clubPositionId}-${badge}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#f5f1eb] px-3 py-1.5 text-[11px] font-semibold text-slate-700"
            >
              <span className="material-symbols-outlined text-sm" style={{ color: colorHex }}>
                verified_user
              </span>
              {badge}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f5f1eb] px-3 py-1.5 text-[11px] font-semibold text-slate-700">
            <span className="material-symbols-outlined text-sm" style={{ color: colorHex }}>
              rule_folder
            </span>
            {role.permissionCount} Permissions
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <RouterLink
          href={`/clubs/${clubId}/admin/more/roles?editPositionId=${role.clubPositionId}&tab=overview`}
          onClick={(event) => {
            event.preventDefault();
            onOpenSheet(role, "overview");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-bold transition"
          style={{ backgroundColor: `${colorHex}18`, color: colorHex }}
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit
        </RouterLink>
        <button
          type="button"
          onClick={() => onOpenSheet(role, "members")}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Assign
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <RoleMemberStack role={role} colorHex={colorHex} />
      </div>
    </article>
  );
}

function EmptyTemplateCard({ clubId }: { clubId: string }) {
  return (
    <RouterLink
      href={`/clubs/${clubId}/admin/more/roles/new`}
      className="flex min-h-[250px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-white/60 p-6 text-center transition hover:border-[var(--secondary)] hover:bg-white"
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#fef0e4] text-[var(--secondary)] transition">
        <span className="material-symbols-outlined text-[30px]">add_moderator</span>
      </div>
      <h3 className={`${manrope.className} text-lg font-bold text-slate-900`}>New Template</h3>
      <p className="mt-1 max-w-[200px] text-sm text-slate-500">
        새 직책을 만들거나 기존 권한 구성을 기반으로 확장하세요.
      </p>
    </RouterLink>
  );
}

type RoleSheetTab = "overview" | "permissions" | "members";

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

export function ClubAdminRolesClient({ clubId, initialData }: ClubAdminRolesClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const featureFilter = searchParams.get("feature")?.trim().toUpperCase() ?? "";
  const requestedEditPositionId = Number(searchParams.get("editPositionId") ?? "");
  const requestedEditTab = normalizeRoleSheetTab(searchParams.get("tab"));
  const [roleManagement, setRoleManagement] = useState(initialData);
  const [selectedSheetState, setSelectedSheetState] = useState<{
    positionId: number;
    tab: RoleSheetTab;
  } | null>(null);

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
    }),
    [roleManagement.positions],
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
    const result = await getClubAdminRoleManagement(clubId);
    if (!result.ok || !result.data) {
      return false;
    }
    setRoleManagement(result.data);
    return true;
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

  return (
    <div
      className={`${inter.className} min-h-screen bg-[#f7fafc] text-slate-900`}
      style={
        {
          "--secondary": "#904e00",
          "--secondary-soft": "#ffdcc2",
        } as CSSProperties
      }
    >
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,220,194,0.7),_transparent_28%),linear-gradient(180deg,_#f7fafc_0%,_#f2f5f7_100%)] pb-28">
        <header className="sticky top-0 z-40 border-b border-[#f0dfcf] bg-[#faf7f2]/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[28px] text-[var(--secondary)]">
                admin_panel_settings
              </span>
              <div>
                <p className={`${manrope.className} text-xl font-black tracking-tight text-[var(--secondary)]`}>
                  SEMO Admin
                </p>
              </div>
            </div>

            <nav className="hidden items-center gap-6 md:flex">
              <RouterLink
                href={`/clubs/${clubId}/admin/more/roles`}
                className={`${manrope.className} rounded-xl px-3 py-1 text-sm font-bold text-[var(--secondary)]`}
              >
                Permissions
              </RouterLink>
              <RouterLink
                href={`/clubs/${clubId}/admin/members`}
                className="rounded-xl px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-[#fff1e4]"
              >
                Members
              </RouterLink>
              <RouterLink
                href={`/clubs/${clubId}/admin/stats`}
                className="rounded-xl px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-[#fff1e4]"
              >
                Stats
              </RouterLink>
            </nav>

            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--secondary-soft)] text-sm font-bold text-[var(--secondary)]">
              {makeInitials(initialData.clubName)}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <motion.section
            className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div>
              <h2 className={`${manrope.className} text-4xl font-extrabold tracking-tight text-slate-900`}>
                Role Management
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">
                활성화된 more 기능 기준으로 직책 권한을 구성하고, 직책 생성과 배정을 한 화면에서
                조망할 수 있게 재구성했습니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {featureFilter ? (
                <RouterLink
                  href={`/clubs/${clubId}/admin/more/roles`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-[#f7f1ea]"
                >
                  <span className="material-symbols-outlined text-xl">filter_alt_off</span>
                  Clear Filter
                </RouterLink>
              ) : null}
              <RouterLink
                href={`/clubs/${clubId}/admin/more/roles/new`}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--secondary)] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[rgba(144,78,0,0.22)] transition active:scale-[0.98]"
              >
                <span className="material-symbols-outlined">add</span>
                Create New Role
              </RouterLink>
            </div>
          </motion.section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedRoles.length > 0 ? (
              sortedRoles.map((role, index) => {
                const permissionLabels = role.permissionKeys.map(
                  (permissionKey) => permissionLabelMap.get(permissionKey) ?? permissionKey,
                );
                return (
                  <motion.div
                    key={role.clubPositionId}
                    className={index === 0 ? "lg:col-span-2" : undefined}
                    {...staggeredFadeUpMotion(index + 1, reduceMotion)}
                  >
                    <AdminRoleCard
                      clubId={clubId}
                      role={role}
                      permissionLabels={permissionLabels}
                      emphasize={index === 0}
                      index={index}
                      onOpenSheet={handleOpenRoleSheet}
                    />
                  </motion.div>
                );
              })
            ) : (
              <motion.div className="lg:col-span-3" {...staggeredFadeUpMotion(2, reduceMotion)}>
                <EmptyTemplateCard clubId={clubId} />
              </motion.div>
            )}

            {sortedRoles.length > 0 && sortedRoles.length < 6 ? (
              <motion.div {...staggeredFadeUpMotion(5, reduceMotion)}>
                <EmptyTemplateCard clubId={clubId} />
              </motion.div>
            ) : null}
          </div>

          <motion.section
            className="mt-10 grid gap-4 sm:grid-cols-3"
            {...staggeredFadeUpMotion(6, reduceMotion)}
          >
            {[
              { label: "Configured Roles", value: stats.totalRoles },
              { label: "Active Roles", value: stats.activeRoles },
              { label: "Assigned Members", value: stats.assignedMembers },
            ].map((stat) => (
              <article key={stat.label} className="rounded-[24px] bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                <p className={`${manrope.className} mt-3 text-4xl font-black tracking-tight text-slate-900`}>
                  {stat.value}
                </p>
              </article>
            ))}
          </motion.section>
        </main>
      </div>

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
  );
}
