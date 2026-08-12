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
  type ClubPermissionGroup,
  type ClubPositionDetailResponse,
  type ClubPositionSummary,
  type UpdateClubPositionRequest,
} from "@/app/lib/clubs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { RoleMemberIdentity, RoleOtherPositions } from "./RoleMemberParts";
import { RoleAccessMatrix } from "./RoleAccessMatrix";
import {
  buildRoleFormValue,
  DEFAULT_ROLE_COLOR,
  getPositionFeatureAccessLabels,
  hasRoleGrantChanges,
  hasRoleFormChanges,
  ROLE_COLOR_OPTIONS,
  ROLE_ICON_LABELS,
  ROLE_ICON_OPTIONS,
  toFeatureGrantRequests,
  type RoleFormValue,
} from "../utils/roleUtils";

const EMPTY_MEMBERS: ClubAdminMember[] = [];
const EMPTY_PERMISSION_GROUPS: ClubPermissionGroup[] = [];

type RoleSheetTab = "overview" | "permissions" | "members";

type RoleEditSheetProps = {
  clubId: string;
  role: ClubPositionSummary;
  initialTab: RoleSheetTab;
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  onClose: () => void;
  onTabChange: (tab: RoleSheetTab) => void;
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
    <article className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <RoleMemberIdentity member={member} />

        <button
          type="button"
          onClick={() => onToggle(member, !assigned)}
          disabled={busy || !canAssign || !member.canAssignPositions}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] px-4 py-2.5 text-xs font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-orange-800">
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
  onTabChange,
  onRolesChanged,
}: RoleEditSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [detailPayload, setDetailPayload] = useState<ClubPositionDetailResponse | null>(null);
  const [memberPayload, setMemberPayload] = useState<ClubAdminMembersResponse | null>(null);
  const [form, setForm] = useState<RoleFormValue>(buildRoleFormValue(role));
  const [savedForm, setSavedForm] = useState<RoleFormValue>(buildRoleFormValue(role));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [memberLoadError, setMemberLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RoleSheetTab>(initialTab);
  const [submitting, setSubmitting] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState<number | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const deferredMemberQuery = useDeferredValue(memberQuery.trim().toLowerCase());
  const { showToast, clearToast } = useAppToast(2400);
  const colorHex = form.colorHex || DEFAULT_ROLE_COLOR;
  const dirty = hasRoleFormChanges(form, savedForm);
  const requestClose = () => {
    if (canUpdate && dirty && !submitting) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };
  const dialogRef = useDialogFocusManagement({ onDismiss: requestClose });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const detailResult = await getClubAdminRoleDetail(clubId, role.clubPositionId);

      if (cancelled) {
        return;
      }

      if (!detailResult.ok || !detailResult.data) {
        setLoadError(detailResult.message ?? "직책 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setDetailPayload(detailResult.data);
      const nextForm = buildRoleFormValue(detailResult.data.position);
      setForm(nextForm);
      setSavedForm(nextForm);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, role.clubPositionId]);

  useEffect(() => {
    if (activeTab !== "members" || memberPayload || memberLoadError) {
      return;
    }
    let cancelled = false;
    void getClubAdminMembers(clubId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok || !result.data) {
        setMemberLoadError(result.message ?? "멤버 목록을 불러오지 못했습니다.");
      } else {
        setMemberPayload(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, clubId, memberLoadError, memberPayload]);

  const members = memberPayload?.members ?? EMPTY_MEMBERS;
  const permissionGroups = detailPayload?.permissionGroups ?? EMPTY_PERMISSION_GROUPS;

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
  const delegatedFeatureCount = useMemo(
    () => getPositionFeatureAccessLabels(permissionGroups, form.featureGrants).length,
    [form.featureGrants, permissionGroups],
  );

  const canSubmit = form.displayName.trim().length > 0 && form.positionCode.trim().length > 0;

  const performSave = async () => {
    setSubmitting(true);
    const request: UpdateClubPositionRequest = {
      displayName: form.displayName,
      positionCode: form.positionCode,
      description: form.description,
      iconName: form.iconName,
      colorHex: form.colorHex,
      version: form.version,
      active: form.active,
      featureGrants: hasRoleGrantChanges(form, savedForm)
        ? toFeatureGrantRequests(form.featureGrants)
        : undefined,
    };
    const result = await updateClubAdminRole(clubId, role.clubPositionId, request);
    setSubmitting(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "직책 저장에 실패했습니다.", "error");
      return;
    }

    setDetailPayload(result.data);
    const nextForm = buildRoleFormValue(result.data.position);
    setForm(nextForm);
    setSavedForm(nextForm);
    await onRolesChanged();
    showToast("직책 설정을 저장했습니다.");
  };

  const handleSave = () => {
    if (!canUpdate) return;
    if (!canSubmit) {
      showToast("직책 이름을 입력해주세요.", "error");
      return;
    }

    clearToast();
    const currentlyActive = detailPayload?.position.active ?? role.active;
    if (currentlyActive && !form.active) {
      setShowDeactivateConfirm(true);
      return;
    }
    void performSave();
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setSubmitting(true);
    const result = await deleteClubAdminRole(clubId, role.clubPositionId, form.version);
    setSubmitting(false);

    if (!result.ok) {
      showToast(result.message ?? "직책 사용 종료에 실패했습니다.", "error");
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
    { key: "permissions", label: "업무 범위", icon: "rule_folder" },
    { key: "members", label: "멤버", icon: "groups" },
  ];

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-[70] bg-slate-950/52 backdrop-blur-sm"
        onClick={requestClose}
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

          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5 sm:px-7">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="flex size-14 items-center justify-center rounded-[var(--radius-card)] text-white shadow-[var(--shadow-card)]"
                  style={{ backgroundColor: colorHex }}
                >
                  <span className="material-symbols-outlined text-[30px]" aria-hidden="true">{form.iconName}</span>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-800">
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
                onClick={requestClose}
                data-dialog-initial-focus
                aria-label="직책 편집 닫기"
                className="semo-icon-control bg-slate-900 text-white transition hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 px-5 py-3 sm:px-7">
            <div role="tablist" aria-label="직책 설정" className="flex flex-wrap gap-2">
              {tabItems.map((tabItem) => {
                const active = activeTab === tabItem.key;
                return (
                  <button
                    key={tabItem.key}
                    id={`role-sheet-tab-${tabItem.key}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`role-sheet-panel-${tabItem.key}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => {
                      setActiveTab(tabItem.key);
                      onTabChange(tabItem.key);
                    }}
                    onKeyDown={(event) => {
                      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                        return;
                      }
                      event.preventDefault();
                      const currentIndex = tabItems.findIndex((item) => item.key === tabItem.key);
                      const nextIndex = event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? tabItems.length - 1
                          : event.key === "ArrowRight"
                            ? (currentIndex + 1) % tabItems.length
                            : (currentIndex - 1 + tabItems.length) % tabItems.length;
                      const nextTab = tabItems[nextIndex];
                      setActiveTab(nextTab.key);
                      onTabChange(nextTab.key);
                      document.getElementById(`role-sheet-tab-${nextTab.key}`)?.focus();
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-orange-50"
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
                    className="h-40 animate-pulse rounded-[var(--radius-card)] border border-slate-200 bg-white/70"
                  />
                ))}
              </div>
            ) : loadError ? (
              <div className="rounded-[var(--radius-card)] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
                <p className="text-xl font-bold text-rose-700">직책 데이터를 불러오지 못했습니다.</p>
                <p className="mt-2 text-sm leading-6 text-rose-600">{loadError}</p>
              </div>
            ) : (
              <>
                {activeTab === "overview" ? (
                    <div
                      id="role-sheet-panel-overview"
                      role="tabpanel"
                      aria-labelledby="role-sheet-tab-overview"
                      className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
                    >
                    <section className="space-y-6">
                      <article className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid gap-5 md:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-xs font-bold text-slate-500">직책 이름</span>
                            <input
                              value={form.displayName}
                              maxLength={100}
                              disabled={!canUpdate}
                              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                              className="w-full rounded-[var(--radius-control)] bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-[var(--primary)]/25"
                              placeholder="직책 이름"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-xs font-bold text-slate-500">직책 코드</span>
                            <input
                              value={form.positionCode}
                              readOnly
                              className="w-full rounded-[var(--radius-control)] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-200"
                            />
                          </label>
                        </div>

                        <label className="mt-5 block">
                          <span className="mb-2 block text-xs font-bold text-slate-500">설명</span>
                          <textarea
                            value={form.description}
                            maxLength={255}
                            disabled={!canUpdate}
                            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                            className="min-h-[120px] w-full rounded-[var(--radius-control)] bg-slate-50 px-4 py-3 text-sm leading-6 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-[var(--primary)]/25"
                            placeholder="이 직책의 역할과 책임을 정리해주세요."
                          />
                        </label>
                      </article>

                      <article className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-500">직책 상태</p>
                            <p className="mt-2 text-sm text-slate-500">
                              비활성화하면 현재 멤버 배정은 종료되고 운영용 선택지에서 내려갑니다. 과거 보유 이력은 보존됩니다.
                            </p>
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
                      <article className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-6 shadow-sm">
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
                                className={`flex size-12 items-center justify-center rounded-[var(--radius-control)] transition ${
                                  selected
                                    ? "bg-[var(--primary)] text-white shadow-sm ring-2 ring-orange-200 ring-offset-2"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                <span className="material-symbols-outlined" aria-hidden="true">{iconName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </article>

                      <article className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-6 shadow-sm">
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
                            className="flex size-14 items-center justify-center rounded-[var(--radius-control)] text-white shadow-sm"
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
                  <div
                    id="role-sheet-panel-permissions"
                    role="tabpanel"
                    aria-labelledby="role-sheet-tab-permissions"
                    className="space-y-5"
                  >
                    <div className="rounded-[var(--radius-card)] bg-orange-50 p-5 text-sm text-slate-600">
                      기능별로 맡길 업무 범위를 선택합니다. 기존 맞춤 조합은 자동으로 바꾸지 않으며, 운영 수준을 선택할 때만 표준 조합으로 전환됩니다.
                    </div>
                    <RoleAccessMatrix
                      groups={permissionGroups}
                      featureGrants={form.featureGrants}
                      onChange={(featureGrants) =>
                        setForm((current) => ({ ...current, featureGrants }))
                      }
                      disabled={!canUpdate}
                    />
                  </div>
                ) : null}

                {activeTab === "members" ? (
                  <div
                    id="role-sheet-panel-members"
                    role="tabpanel"
                    aria-labelledby="role-sheet-tab-members"
                    className="space-y-6"
                  >
                    {!memberPayload && !memberLoadError ? (
                      <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                        멤버 목록을 불러오는 중입니다.
                      </div>
                    ) : memberLoadError ? (
                      <div className="rounded-[var(--radius-card)] border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
                        <p>{memberLoadError}</p>
                        <button
                          type="button"
                          onClick={() => setMemberLoadError(null)}
                          className="mt-4 rounded-[var(--radius-control)] bg-white px-4 py-2 text-xs font-bold text-rose-700"
                        >
                          다시 시도
                        </button>
                      </div>
                    ) : (
                      <>
                    <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap gap-2">
                        {[
                          { label: "현재 배정", value: totalAssignedMembers, icon: "groups" },
                          { label: "검색 결과", value: filteredMembers.length, icon: "manage_search" },
                          { label: "운영 기능", value: delegatedFeatureCount, icon: "verified_user" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="inline-flex items-center gap-3 rounded-full bg-slate-50 px-3.5 py-2 ring-1 ring-slate-200"
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
                            className="w-full rounded-[var(--radius-control)] border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]/25"
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
                            <div className="rounded-[var(--radius-card)] border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">
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
                            <div className="rounded-[var(--radius-card)] border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">
                              추가로 연결할 수 있는 멤버가 없습니다.
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                      </>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white/80 px-5 py-4 sm:px-7">
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                {canDelete && activeTab !== "members" ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading || submitting}
                    className="semo-control inline-flex items-center gap-2 border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                    사용 종료
                  </button>
                ) : null}
                {canUpdate && activeTab !== "members" ? (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading || submitting}
                    className="semo-control inline-flex items-center gap-2 bg-[var(--primary)] px-5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">done</span>
                    {submitting ? "저장 중..." : "변경사항 저장"}
                  </button>
                ) : null}
                {activeTab === "members" || (!canDelete && !canUpdate) ? (
                  <button type="button" onClick={requestClose} className="semo-control bg-slate-900 px-5 text-sm font-bold text-white">
                    닫기
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {showDeactivateConfirm ? (
          <ScheduleActionConfirmModal
            title="직책 비활성화"
            description="저장하면 현재 멤버 배정이 모두 종료됩니다. 과거 보유 이력과 인수인계 기록은 보존됩니다. 계속할까요?"
            confirmLabel="비활성화하고 저장"
            busyLabel="저장 중..."
            busy={submitting}
            onCancel={() => {
              if (!submitting) {
                setShowDeactivateConfirm(false);
              }
            }}
            onConfirm={() =>
              void performSave().finally(() => {
                setShowDeactivateConfirm(false);
              })
            }
          />
        ) : null}
        {showDeleteConfirm ? (
          <ScheduleActionConfirmModal
            title="직책 사용 종료"
            description="현재 멤버 배정을 종료하고 이 직책을 비활성화할까요? 과거 보유 이력과 인수인계 기록은 보존됩니다."
            confirmLabel="사용 종료"
            busyLabel="종료 중..."
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
        {showDiscardConfirm ? (
          <ScheduleActionConfirmModal
            title="저장하지 않고 닫기"
            description="아직 저장하지 않은 직책 설정이 있습니다. 변경사항을 버리고 닫을까요?"
            confirmLabel="변경사항 버리기"
            busyLabel="닫는 중..."
            busy={false}
            onCancel={() => setShowDiscardConfirm(false)}
            onConfirm={() => {
              setShowDiscardConfirm(false);
              onClose();
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
