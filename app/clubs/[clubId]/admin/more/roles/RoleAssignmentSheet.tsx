"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { useAppToast } from "@/app/hooks/useAppToast";
import { bottomSheetMotion, overlayFadeMotion } from "@/app/lib/motion";
import {
  getClubAdminMembers,
  updateClubAdminMemberPositions,
  type ClubAdminMember,
  type ClubAdminMembersResponse,
  type ClubPositionSummary,
} from "@/app/lib/clubs";
import { motion, useReducedMotion } from "motion/react";
import { Inter, Manrope } from "next/font/google";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const EMPTY_MEMBERS: ClubAdminMember[] = [];

type RoleAssignmentSheetProps = {
  clubId: string;
  role: ClubPositionSummary;
  permissionLabels: string[];
  onClose: () => void;
};

function makeInitials(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 2).toUpperCase() : "MB";
}

function getRoleSubtitle(member: ClubAdminMember) {
  return member.tagline?.trim() || member.roleCode;
}

function roleTone(member: ClubAdminMember) {
  switch (member.roleCode) {
    case "OWNER":
      return "bg-amber-100 text-amber-800";
    case "ADMIN":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function MemberCard({
  member,
  role,
  assigned,
  busy,
  onToggle,
}: {
  member: ClubAdminMember;
  role: ClubPositionSummary;
  assigned: boolean;
  busy: boolean;
  onToggle: (member: ClubAdminMember, shouldAssign: boolean) => void;
}) {
  const relatedPositions = member.positions.filter(
    (position) => position.clubPositionId !== role.clubPositionId,
  );
  const buttonLabel = assigned ? "해제" : "부여";

  return (
    <article
      className={`rounded-[26px] border p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition ${
        assigned
          ? "border-[rgba(144,78,0,0.16)] bg-[linear-gradient(180deg,#fffaf3_0%,#ffffff_100%)]"
          : "border-slate-200/80 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {member.avatarImageUrl ? (
            <div
              className="size-12 shrink-0 rounded-2xl bg-cover bg-center shadow-sm"
              style={{ backgroundImage: `url('${member.avatarImageUrl}')` }}
            />
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#efe6d8] text-sm font-black text-[#8b4b00] shadow-sm">
              {makeInitials(member.displayName)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">{member.displayName}</p>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${roleTone(member)}`}>
                {member.roleCode}
              </span>
              {member.self ? (
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                  ME
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">{getRoleSubtitle(member)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggle(member, !assigned)}
          disabled={busy || !member.canManage}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
            assigned
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "bg-[var(--secondary)] text-white shadow-[0_12px_30px_rgba(144,78,0,0.22)] hover:bg-[#7d4300]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {assigned ? "person_remove" : "person_add"}
          </span>
          {busy ? "처리 중" : buttonLabel}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5efe7] px-3 py-1.5 text-[11px] font-semibold text-[#7d4300]">
          <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
          {assigned ? `${role.displayName} 연결됨` : "직책 미연결"}
        </span>
        {member.joinedAtLabel ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            {member.joinedAtLabel}
          </span>
        ) : null}
        {!member.canManage ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            변경 불가
          </span>
        ) : null}
      </div>

      {relatedPositions.length > 0 ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Other Positions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {relatedPositions.map((position) => (
              <span
                key={`${member.clubMemberId}-${position.clubPositionId}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600"
              >
                <span className="material-symbols-outlined text-[15px]" style={{ color: position.colorHex ?? "#904e00" }}>
                  {position.iconName ?? "badge"}
                </span>
                {position.displayName}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function RoleAssignmentSheet({
  clubId,
  role,
  permissionLabels,
  onClose,
}: RoleAssignmentSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [memberPayload, setMemberPayload] = useState<ClubAdminMembersResponse | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [pendingMemberId, setPendingMemberId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { showToast } = useAppToast(2400);
  const colorHex = role.colorHex ?? "#904e00";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleRetryMembers = async () => {
    setLoadingMembers(true);
    setLoadError(null);

    const result = await getClubAdminMembers(clubId);
    if (!result.ok || !result.data) {
      setLoadError(result.message ?? "멤버 목록을 불러오지 못했습니다.");
      setLoadingMembers(false);
      return;
    }

    setMemberPayload(result.data);
    setLoadingMembers(false);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getClubAdminMembers(clubId);
      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setLoadError(result.message ?? "멤버 목록을 불러오지 못했습니다.");
        setLoadingMembers(false);
        return;
      }

      setMemberPayload(result.data);
      setLoadingMembers(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId]);

  const members = memberPayload?.members ?? EMPTY_MEMBERS;

  const filteredMembers = useMemo(() => {
    if (!deferredQuery) {
      return members;
    }
    return members.filter((member) => {
      const positionText = member.positions.map((position) => position.displayName.toLowerCase()).join(" ");
      return (
        member.displayName.toLowerCase().includes(deferredQuery) ||
        member.roleCode.toLowerCase().includes(deferredQuery) ||
        (member.tagline?.toLowerCase().includes(deferredQuery) ?? false) ||
        positionText.includes(deferredQuery)
      );
    });
  }, [deferredQuery, members]);

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

  const totalAssigned = useMemo(
    () =>
      members.filter((member) =>
        member.positions.some((position) => position.clubPositionId === role.clubPositionId),
      ).length,
    [members, role.clubPositionId],
  );

  const handleAssignToggle = async (member: ClubAdminMember, shouldAssign: boolean) => {
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
      showToast(result.message ?? "직책 변경을 저장하지 못했습니다.", "error");
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
    showToast(shouldAssign ? "직책을 부여했습니다." : "직책을 해제했습니다.");
  };

  return (
    <>
      <motion.button
        key="role-assignment-sheet-backdrop"
        type="button"
        aria-label="직책 배정 시트 닫기"
        className="fixed inset-0 z-[70] bg-slate-950/52 backdrop-blur-sm"
        onClick={onClose}
        {...overlayFadeMotion(reduceMotion)}
      />
      <motion.section
        key={`role-assignment-sheet-${role.clubPositionId}`}
        role="dialog"
        aria-modal="true"
        className={`${inter.className} fixed inset-x-0 bottom-0 z-[71] mx-auto flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,249,241,0.98)_0%,rgba(250,251,253,0.98)_100%)] shadow-[0_-24px_90px_rgba(15,23,42,0.28)]`}
        style={{ "--secondary": colorHex } as CSSProperties}
        {...bottomSheetMotion(reduceMotion)}
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(255,220,194,0.95),_transparent_64%)]" />
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
                  <span className="material-symbols-outlined text-[30px]">{role.iconName ?? "badge"}</span>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#8b4b00]">
                    Live Assignment Console
                  </p>
                  <h2 className={`${manrope.className} mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl`}>
                    {role.displayName}
                  </h2>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                {role.description ?? "멤버를 즉시 연결하거나 해제할 수 있습니다. 변경은 저장 버튼 없이 바로 반영됩니다."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <RouterLink
                href={`/clubs/${clubId}/admin/more/roles/${role.clubPositionId}/edit`}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-[#fff7ef]"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </RouterLink>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-11 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 border-b border-[#eadfd2] px-5 py-4 sm:grid-cols-4 sm:px-7">
            {[
              { label: "Assigned Now", value: totalAssigned, icon: "groups" },
              { label: "Permissions", value: role.permissionCount, icon: "rule_folder" },
              { label: "Filtered Members", value: filteredMembers.length, icon: "manage_search" },
              { label: "Mode", value: role.active ? "LIVE" : "PAUSED", icon: "toggle_on" },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: colorHex }}>
                    {item.icon}
                  </span>
                </div>
                <p className={`${manrope.className} mt-3 text-3xl font-black tracking-tight text-slate-900`}>
                  {item.value}
                </p>
              </article>
            ))}
          </div>

          <div className="border-b border-[#eadfd2] px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex max-w-3xl flex-wrap gap-2">
                {permissionLabels.length > 0 ? (
                  permissionLabels.slice(0, 6).map((label) => (
                    <span
                      key={`${role.clubPositionId}-${label}`}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                      style={{ backgroundColor: `${colorHex}14`, color: colorHex }}
                    >
                      <span className="material-symbols-outlined text-[15px]">verified_user</span>
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                    <span className="material-symbols-outlined text-[15px]">info</span>
                    연결된 세부 권한이 없습니다.
                  </span>
                )}
              </div>

              <div className="group relative w-full max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[var(--secondary)]">
                  search
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => setQuery(nextValue));
                  }}
                  placeholder="멤버 이름, 기본 역할, 직책으로 검색"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[rgba(144,78,0,0.22)]"
                />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
            {loadingMembers ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`role-assignment-loading-${index}`}
                    className="h-40 animate-pulse rounded-[26px] border border-slate-200 bg-white/70"
                  />
                ))}
              </div>
            ) : loadError ? (
              <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
                <p className={`${manrope.className} text-xl font-bold text-rose-700`}>멤버 목록을 불러오지 못했습니다.</p>
                <p className="mt-2 text-sm leading-6 text-rose-600">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void handleRetryMembers()}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  다시 시도
                </button>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className={`${manrope.className} text-xl font-black tracking-tight text-slate-900`}>
                        Assigned Members
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">현재 이 직책을 갖고 있는 멤버입니다.</p>
                    </div>
                    <span
                      className="rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]"
                      style={{ backgroundColor: `${colorHex}16`, color: colorHex }}
                    >
                      {assignedMembers.length} Visible
                    </span>
                  </div>
                  <div className="space-y-4">
                    {assignedMembers.length > 0 ? (
                      assignedMembers.map((member) => (
                        <MemberCard
                          key={`assigned-${member.clubMemberId}`}
                          member={member}
                          role={role}
                          assigned
                          busy={pendingMemberId === member.clubMemberId}
                          onToggle={handleAssignToggle}
                        />
                      ))
                    ) : (
                      <div className="rounded-[26px] border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">
                        조건에 맞는 배정 멤버가 없습니다.
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className={`${manrope.className} text-xl font-black tracking-tight text-slate-900`}>
                        Ready To Assign
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">즉시 연결 가능한 멤버입니다.</p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white">
                      {availableMembers.length} Candidates
                    </span>
                  </div>
                  <div className="space-y-4">
                    {availableMembers.length > 0 ? (
                      availableMembers.map((member) => (
                        <MemberCard
                          key={`candidate-${member.clubMemberId}`}
                          member={member}
                          role={role}
                          assigned={false}
                          busy={pendingMemberId === member.clubMemberId}
                          onToggle={handleAssignToggle}
                        />
                      ))
                    ) : (
                      <div className="rounded-[26px] border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">
                        추가로 연결할 수 있는 멤버가 없습니다.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="border-t border-[#eadfd2] bg-white/80 px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  변경 즉시 저장
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">
                  <span className="material-symbols-outlined text-[16px]">touch_app</span>
                  버튼 클릭 시 바로 반영됩니다.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <RouterLink
                  href={`/clubs/${clubId}/admin/members`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  Members
                </RouterLink>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[18px]">done</span>
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
