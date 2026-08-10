"use client";

import { useAppToast } from "@/app/hooks/useAppToast";
import { useDialogFocusManagement } from "@/app/hooks/useDialogFocusManagement";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/modals/ScheduleActionConfirmModal";
import { bottomSheetMotion, overlayFadeMotion } from "@/app/lib/motion";
import {
  deleteClubAdminRole,
  getClubAdminMembers,
  getClubAdminRoleDetail,
  updateClubAdminMemberPositions,
  updateClubAdminRole,
  type ClubAdminMember,
  type ClubAdminMembersResponse,
  type ClubPositionDetailResponse,
  type ClubPositionSummary,
  type UpdateClubPositionRequest,
} from "@/app/lib/clubs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { RoleMemberIdentity, RoleOtherPositions } from "./RoleMemberParts";
import { RolePermissionToggleCard } from "./RolePermissionToggleCard";
import {
  buildRoleFormValue,
  DEFAULT_ROLE_COLOR,
  ROLE_COLOR_OPTIONS,
  ROLE_ICON_LABELS,
  ROLE_ICON_OPTIONS,
  type RoleFormValue,
} from "../utils/roleUtils";

const EMPTY_MEMBERS: ClubAdminMember[] = [];

type RoleSheetTab = "overview" | "permissions" | "members";

type RoleEditSheetProps = {
  clubId: string;
  role: ClubPositionSummary;
  initialTab: RoleSheetTab;
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  onClose: () => void;
  onRolesChanged: () => Promise<boolean> | boolean;
};

function MemberAssignmentCard({
  member,
  role,
  assigned,
  busy,
  canAssign,
  onToggle,
}: {
  member: ClubAdminMember;
  role: ClubPositionSummary;
  assigned: boolean;
  busy: boolean;
  canAssign: boolean;
  onToggle: (member: ClubAdminMember, shouldAssign: boolean) => void;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <RoleMemberIdentity member={member} />

        <button
          type="button"
          onClick={() => onToggle(member, !assigned)}
          disabled={busy || !canAssign || !member.canManage}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
            assigned
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "bg-[var(--primary)] text-white shadow-sm hover:bg-orange-700"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {assigned ? "person_remove" : "person_add"}
          </span>
          {busy ? "처리 중" : assigned ? "해제" : "부여"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5efe7] px-3 py-1.5 text-[11px] font-semibold text-[#7d4300]">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">workspace_premium</span>
          {assigned ? `${role.displayName} 연결됨` : "직책 미연결"}
        </span>
        {member.joinedAtLabel ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">calendar_month</span>
            {member.joinedAtLabel}
          </span>
        ) : null}
      </div>

      <RoleOtherPositions member={member} currentClubPositionId={role.clubPositionId} />
    </article>
  );
}

export function RoleEditSheet({
  clubId,
  role,
  initialTab,
  canUpdate,
  canDelete,
  canAssign,
  onClose,
  onRolesChanged,
}: RoleEditSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [detailPayload, setDetailPayload] = useState<ClubPositionDetailResponse | null>(null);
  const [memberPayload, setMemberPayload] = useState<ClubAdminMembersResponse | null>(null);
  const [form, setForm] = useState<RoleFormValue>(buildRoleFormValue(role));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RoleSheetTab>(initialTab);
  const [submitting, setSubmitting] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const deferredMemberQuery = useDeferredValue(memberQuery.trim().toLowerCase());
  const { showToast, clearToast } = useAppToast(2400);
  const colorHex = form.colorHex || DEFAULT_ROLE_COLOR;
  const dialogRef = useDialogFocusManagement({ onDismiss: onClose });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [detailResult, memberResult] = await Promise.all([
        getClubAdminRoleDetail(clubId, role.clubPositionId),
        getClubAdminMembers(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!detailResult.ok || !detailResult.data) {
        setLoadError(detailResult.message ?? "직책 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      if (!memberResult.ok || !memberResult.data) {
        setLoadError(memberResult.message ?? "멤버 목록을 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setDetailPayload(detailResult.data);
      setMemberPayload(memberResult.data);
      setForm(buildRoleFormValue(detailResult.data.position));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, role.clubPositionId]);

  const members = memberPayload?.members ?? EMPTY_MEMBERS;
  const permissionGroups = detailPayload?.permissionGroups ?? [];

  const filteredMembers = useMemo(() => {
    if (!deferredMemberQuery) {
      return members;
    }

    return members.filter((member) => {
      const positionText = member.positions.map((position) => position.displayName.toLowerCase()).join(" ");
      return (
        member.displayName.toLowerCase().includes(deferredMemberQuery) ||
        member.roleCode.toLowerCase().includes(deferredMemberQuery) ||
        (member.tagline?.toLowerCase().includes(deferredMemberQuery) ?? false) ||
        positionText.includes(deferredMemberQuery)
      );
    });
  }, [deferredMemberQuery, members]);

  const assignedMembers = useMemo(
    () =>
      filteredMembers.filter((member) =>
        member.positions.some((position) => position.clubPositionId === role.clubPositionId),
      ),
    [filteredMembers, role.clubPositionId],
  );

  const availableMembers = useMemo(
    () =>
      filteredMembers.filter(
        (member) => !member.positions.some((position) => position.clubPositionId === role.clubPositionId),
      ),
    [filteredMembers, role.clubPositionId],
  );

  const totalAssignedMembers = useMemo(
    () =>
      members.filter((member) =>
        member.positions.some((position) => position.clubPositionId === role.clubPositionId),
      ).length,
    [members, role.clubPositionId],
  );

  const canSubmit = form.displayName.trim().length > 0 && form.positionCode.trim().length > 0;

  const togglePermission = (permissionKey: string) => {
    setForm((current) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(permissionKey)
        ? current.permissionKeys.filter((item) => item !== permissionKey)
        : [...current.permissionKeys, permissionKey],
    }));
  };

  const handleSave = async () => {
    if (!canUpdate) return;
    if (!canSubmit) {
      showToast("직책 이름을 입력해주세요.", "error");
      return;
    }

    clearToast();
    setSubmitting(true);
    const request: UpdateClubPositionRequest = {
      displayName: form.displayName,
      positionCode: form.positionCode,
      description: form.description,
      iconName: form.iconName,
      colorHex: form.colorHex,
      active: form.active,
      permissionKeys: form.permissionKeys,
    };
    const result = await updateClubAdminRole(clubId, role.clubPositionId, request);
    setSubmitting(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "직책 저장에 실패했습니다.", "error");
      return;
    }

    setDetailPayload(result.data);
    setForm(buildRoleFormValue(result.data.position));
    await onRolesChanged();
    showToast("직책 설정을 저장했습니다.");
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setSubmitting(true);
    const result = await deleteClubAdminRole(clubId, role.clubPositionId);
    setSubmitting(false);

    if (!result.ok) {
      showToast(result.message ?? "직책 삭제에 실패했습니다.", "error");
      return;
    }

    await onRolesChanged();
    onClose();
  };

  const handleAssignToggle = async (member: ClubAdminMember, shouldAssign: boolean) => {
    if (!canAssign) return;
    const currentIds = member.positions.map((position) => position.clubPositionId);
    const nextIds = shouldAssign
      ? [...new Set([...currentIds, role.clubPositionId])]
      : currentIds.filter((positionId) => positionId !== role.clubPositionId);

    setPendingMemberId(member.clubMemberId);
    const result = await updateClubAdminMemberPositions(clubId, member.clubMemberId, {
      clubPositionIds: nextIds,
    });
    setPendingMemberId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "멤버 직책 변경에 실패했습니다.", "error");
      return;
    }

    setMemberPayload((current) =>
      current
        ? {
            ...current,
            members: current.members.map((item) =>
              item.clubMemberId === result.data?.clubMemberId ? result.data : item,
            ),
          }
        : current,
    );
    await onRolesChanged();
    showToast(shouldAssign ? "멤버를 직책에 연결했습니다." : "멤버를 직책에서 해제했습니다.");
  };

  const tabItems: Array<{ key: RoleSheetTab; label: string; icon: string }> = [
    { key: "overview", label: "기본 정보", icon: "tune" },
    { key: "permissions", label: "권한", icon: "rule_folder" },
    { key: "members", label: "멤버", icon: "groups" },
  ];

  return (
    <>

      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-[70] bg-slate-950/52 backdrop-blur-sm"
        onClick={onClose}
        {...overlayFadeMotion(reduceMotion)}
      />

      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-label={`${role.displayName} 직책 ${canUpdate ? "편집" : "상세"}`}
        className="semo-admin-theme fixed inset-x-0 bottom-0 z-[71] mx-auto flex max-h-[92dvh] w-full max-w-7xl flex-col overflow-hidden rounded-t-[var(--radius-modal)] border border-white/70 bg-[var(--color-bg)] shadow-[var(--shadow-modal)]"
        {...bottomSheetMotion(reduceMotion)}
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex justify-center pb-3 pt-3">
            <div className="h-1.5 w-16 rounded-full bg-slate-300/90" />
          </div>

          <div className="flex items-start justify-between gap-4 border-b border-[#eadfd2] px-5 pb-5 sm:px-7">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="flex size-14 items-center justify-center rounded-[1.25rem] text-white shadow-[0_16px_32px_rgba(144,78,0,0.24)]"
                  style={{ backgroundColor: colorHex }}
                >
                  <span className="material-symbols-outlined text-[30px]" aria-hidden="true">{form.iconName}</span>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#8b4b00]">
                    {canUpdate ? "직책 편집" : "직책 상세"}
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    {form.displayName || role.displayName}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                data-dialog-initial-focus
                aria-label="직책 편집 닫기"
                className="inline-flex size-11 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
              </button>
            </div>
          </div>

          <div className="border-b border-[#eadfd2] px-5 py-3 sm:px-7">
            <div className="flex flex-wrap gap-2">
              {tabItems.map((tabItem) => {
                const active = activeTab === tabItem.key;
                return (
                  <button
                    key={tabItem.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveTab(tabItem.key)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-[#fff5eb]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{tabItem.icon}</span>
                    {tabItem.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
            {loading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`role-edit-loading-${index}`}
                    className="h-40 animate-pulse rounded-[26px] border border-slate-200 bg-white/70"
                  />
                ))}
              </div>
            ) : loadError ? (
              <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
                <p className="text-xl font-bold text-rose-700">직책 데이터를 불러오지 못했습니다.</p>
                <p className="mt-2 text-sm leading-6 text-rose-600">{loadError}</p>
              </div>
            ) : (
              <>
                {activeTab === "overview" ? (
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <section className="space-y-6">
                      <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid gap-5 md:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-xs font-bold text-slate-500">직책 이름</span>
                            <input
                              value={form.displayName}
                              disabled={!canUpdate}
                              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                              className="w-full rounded-xl bg-[#f7fafc] px-4 py-3 text-sm outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-[rgba(144,78,0,0.22)]"
                              placeholder="직책 이름"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-xs font-bold text-slate-500">직책 코드</span>
                            <input
                              value={form.positionCode}
                              readOnly
                              className="w-full rounded-xl bg-[#f7fafc] px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-200"
                            />
                          </label>
                        </div>

                        <label className="mt-5 block">
                          <span className="mb-2 block text-xs font-bold text-slate-500">설명</span>
                          <textarea
                            value={form.description}
                            disabled={!canUpdate}
                            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                            className="min-h-[120px] w-full rounded-xl bg-[#f7fafc] px-4 py-3 text-sm leading-6 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-[rgba(144,78,0,0.22)]"
                            placeholder="이 직책의 역할과 책임을 정리해주세요."
                          />
                        </label>
                      </article>

                      <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-500">직책 상태</p>
                            <p className="mt-2 text-sm text-slate-500">비활성화하면 기존 직책은 유지되지만 운영용 선택지에서 내려갑니다.</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={form.active}
                            aria-label="직책 활성 상태"
                            disabled={!canUpdate}
                            onClick={() => setForm((current) => ({ ...current, active: !current.active }))}
                            className={`relative inline-flex h-11 w-16 items-center rounded-full transition ${
                              form.active ? "bg-[var(--primary)]" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`absolute left-1 size-8 rounded-full bg-white transition-transform ${
                                form.active ? "translate-x-7" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </article>
                    </section>

                    <section className="space-y-6">
                      <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-bold text-slate-500">아이콘</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {ROLE_ICON_OPTIONS.map((iconName) => {
                            const selected = form.iconName === iconName;
                            return (
                              <button
                                key={iconName}
                                type="button"
                                disabled={!canUpdate}
                                onClick={() => setForm((current) => ({ ...current, iconName }))}
                                aria-label={`대표 아이콘 ${ROLE_ICON_LABELS[iconName]}`}
                                aria-pressed={selected}
                                className={`flex size-12 items-center justify-center rounded-xl transition ${
                                  selected
                                    ? "bg-[var(--primary)] text-white shadow-md ring-2 ring-orange-200 ring-offset-2"
                                    : "bg-[#eff4f7] text-slate-500 hover:bg-[#e4ecef]"
                                }`}
                              >
                                <span className="material-symbols-outlined" aria-hidden="true">{iconName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </article>

                      <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-bold text-slate-500">식별 색상</p>
                        <div className="mt-4 flex flex-wrap gap-4">
                          {ROLE_COLOR_OPTIONS.map((optionColor) => {
                            const selected = form.colorHex === optionColor;
                            return (
                              <button
                                key={optionColor}
                                type="button"
                                disabled={!canUpdate}
                                onClick={() => setForm((current) => ({ ...current, colorHex: optionColor }))}
                                className={`size-11 rounded-full ${selected ? "ring-2 ring-slate-900/15 ring-offset-2" : ""}`}
                                style={{ backgroundColor: optionColor }}
                                aria-label={`직책 색상 ${optionColor}`}
                                aria-pressed={selected}
                              />
                            );
                          })}
                        </div>
                      </article>

                      <article className="rounded-[var(--radius-card)] border border-orange-100 bg-orange-50 p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div
                            className="flex size-14 items-center justify-center rounded-[18px] text-white shadow-sm"
                            style={{ backgroundColor: colorHex }}
                          >
                            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">{form.iconName}</span>
                          </div>
                          <div>
                            <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                              {form.displayName || "직책"}
                            </p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              직책 코드 · {form.positionCode}
                            </p>
                          </div>
                        </div>
                      </article>
                    </section>
                  </div>
                ) : null}

                {activeTab === "permissions" ? (
                  <div className="space-y-5">
                    <div className="rounded-[var(--radius-card)] bg-orange-50 p-5 text-sm text-slate-600">
                      활성 기능에 연결된 권한만 토글 대상에 포함됩니다. 변경 내용은 저장 버튼을 눌렀을 때 반영됩니다.
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {permissionGroups.map((group) => (
                        <RolePermissionToggleCard
                          key={group.featureKey}
                          group={group}
                          selectedKeys={form.permissionKeys}
                          onToggle={togglePermission}
                          disabled={!canUpdate}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeTab === "members" ? (
                  <div className="space-y-6">
                    <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap gap-2">
                        {[
                          { label: "현재 배정", value: totalAssignedMembers, icon: "groups" },
                          { label: "검색 결과", value: filteredMembers.length, icon: "manage_search" },
                          { label: "권한", value: form.permissionKeys.length, icon: "verified_user" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="inline-flex items-center gap-3 rounded-full bg-[#f7fafc] px-3.5 py-2 ring-1 ring-slate-200"
                          >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true" style={{ color: colorHex }}>
                              {item.icon}
                            </span>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                              <p className="text-lg font-black tracking-tight text-slate-900">
                              {item.value}
                              </p>
                            </div>
                          </div>
                        ))}
                        </div>

                        <div className="group relative w-full xl:max-w-sm">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[var(--primary)]" aria-hidden="true">
                            search
                          </span>
                          <input
                            type="text"
                            aria-label="직책 멤버 검색"
                            value={memberQuery}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              startTransition(() => setMemberQuery(nextValue));
                            }}
                            placeholder="멤버 이름, 기본 역할, 다른 직책 검색"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[rgba(144,78,0,0.22)]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <section>
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-black tracking-tight text-slate-900">
                              배정된 멤버
                            </h3>
                          </div>
                          <span
                            className="rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]"
                            style={{ backgroundColor: `${colorHex}16`, color: colorHex }}
                          >
                            {assignedMembers.length}명 표시
                          </span>
                        </div>
                        <div className="space-y-4">
                          {assignedMembers.length > 0 ? (
                            assignedMembers.map((member) => (
                              <MemberAssignmentCard
                                key={`assigned-${member.clubMemberId}`}
                                member={member}
                                role={role}
                                assigned
                                busy={pendingMemberId === member.clubMemberId}
                                canAssign={canAssign}
                                onToggle={handleAssignToggle}
                              />
                            ))
                          ) : (
                            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">
                              조건에 맞는 배정 멤버가 없습니다.
                            </div>
                          )}
                        </div>
                      </section>

                      <section>
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-black tracking-tight text-slate-900">
                              배정 가능한 멤버
                            </h3>
                          </div>
                          <span className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white">
                            {availableMembers.length}명
                          </span>
                        </div>
                        <div className="space-y-4">
                          {availableMembers.length > 0 ? (
                            availableMembers.map((member) => (
                              <MemberAssignmentCard
                                key={`candidate-${member.clubMemberId}`}
                                member={member}
                                role={role}
                                assigned={false}
                                busy={pendingMemberId === member.clubMemberId}
                                canAssign={canAssign}
                                onToggle={handleAssignToggle}
                              />
                            ))
                          ) : (
                            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">
                              추가로 연결할 수 있는 멤버가 없습니다.
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="border-t border-[#eadfd2] bg-white/80 px-5 py-4 sm:px-7">
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading || submitting}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                    삭제
                  </button>
                ) : null}
                {canUpdate ? (
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={loading || submitting}
                    className="semo-control inline-flex items-center gap-2 bg-[var(--primary)] px-5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">done</span>
                    {submitting ? "저장 중..." : "변경사항 저장"}
                  </button>
                ) : null}
                {!canDelete && !canUpdate ? (
                  <button type="button" onClick={onClose} className="semo-control bg-slate-900 px-5 text-sm font-bold text-white">
                    닫기
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {showDeleteConfirm ? (
          <ScheduleActionConfirmModal
            title="직책 삭제"
            description="이 직책을 삭제할까요?"
            confirmLabel="직책 삭제"
            busyLabel="삭제 중..."
            busy={submitting}
            onCancel={() => {
              if (!submitting) {
                setShowDeleteConfirm(false);
              }
            }}
            onConfirm={() =>
              void handleDelete().finally(() => {
                setShowDeleteConfirm(false);
              })
            }
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
