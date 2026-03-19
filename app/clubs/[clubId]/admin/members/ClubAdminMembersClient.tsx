"use client";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { AppAlertModal } from "@/app/components/AppAlertModal";
import { useAppAlert } from "@/app/hooks/useAppAlert";
import {
  approveClubAdminMember,
  updateClubAdminMemberRole,
  updateClubAdminMemberStatus,
  type ClubAdminMember,
} from "@/app/lib/clubs";
import { overlayFadeMotion, popInMotion, staggeredFadeUpMotion } from "@/app/lib/motion";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ROLE_OPTIONS = [
  { code: "OWNER", label: "오너" },
  { code: "ADMIN", label: "어드민" },
  { code: "MEMBER", label: "회원" },
] as const;

const STATUS_FILTERS = ["전체", "활동 중", "휴면", "가입대기"] as const;
const STATUS_OPTIONS = [
  { code: "ACTIVE", label: "활동 중" },
  { code: "DORMANT", label: "휴면" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

type ClubAdminMembersClientProps = {
  clubId: string;
  clubName: string;
  initialMembers: ClubAdminMember[];
};

function getRoleLabel(roleCode: string) {
  return ROLE_OPTIONS.find((option) => option.code === roleCode)?.label ?? roleCode;
}

function getStatusLabel(membershipStatus: string) {
  return (
    {
      ACTIVE: "활동 중",
      DORMANT: "휴면",
      PENDING: "가입대기",
    }[membershipStatus] ?? membershipStatus
  );
}

function getStatusBadgeClassName(membershipStatus: string) {
  switch (membershipStatus) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "DORMANT":
      return "bg-slate-100 text-slate-600";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getRoleAccentClassName(roleCode: string) {
  switch (roleCode) {
    case "OWNER":
      return "text-[var(--primary)]";
    case "ADMIN":
      return "text-orange-500";
    default:
      return "text-slate-500";
  }
}

function buildMockAttendance(member: ClubAdminMember) {
  const seed = member.clubMemberId % 100;
  return {
    attendanceRate: 48 + (seed % 45),
    recentCount: 2 + (seed % 5),
    streak: 1 + (seed % 4),
  };
}

function MemberAvatar({ member }: { member: ClubAdminMember }) {
  if (member.avatarImageUrl) {
    return (
      <div
        className="h-14 w-14 rounded-full bg-cover bg-center ring-2 ring-[var(--primary)]/10"
        style={{ backgroundImage: `url('${member.avatarImageUrl}')` }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)] ring-2 ring-[var(--primary)]/10">
      {member.displayName.slice(0, 2)}
    </div>
  );
}

function MemberManageModal({
  member,
  saving,
  onDismiss,
  onSave,
}: {
  member: ClubAdminMember;
  saving: boolean;
  onDismiss: () => void;
  onSave: (nextRoleCode: string, nextMembershipStatus: "ACTIVE" | "DORMANT") => Promise<void>;
}) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const mockAttendance = useMemo(() => buildMockAttendance(member), [member]);
  const [roleCode, setRoleCode] = useState(member.roleCode);
  const [membershipStatus, setMembershipStatus] = useState<"ACTIVE" | "DORMANT">(
    member.membershipStatus === "DORMANT" ? "DORMANT" : "ACTIVE",
  );

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm" {...overlayFadeMotion(reduceMotion)} />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
        {...popInMotion(reduceMotion)}
      >
        <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <MemberAvatar member={member} />
              <div>
                <p className="text-lg font-bold text-slate-900">{member.displayName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  가입일 {member.joinedAtLabel ?? "가입 대기"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              aria-label="관리 모달 닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">출석률</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{mockAttendance.attendanceRate}%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">최근 참석</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{mockAttendance.recentCount}회</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">연속 참석</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{mockAttendance.streak}주</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <section>
              <p className="mb-2 text-sm font-bold text-slate-900">권한</p>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setRoleCode(option.code)}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                      roleCode === option.code
                        ? "bg-[var(--primary)] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-2 text-sm font-bold text-slate-900">회원 상태</p>
              {member.membershipStatus === "PENDING" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  가입대기 멤버는 카드의 승인 버튼으로 처리합니다.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => setMembershipStatus(option.code)}
                      className={`rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                        membershipStatus === option.code
                          ? "bg-[var(--secondary)] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={saving || member.membershipStatus === "PENDING"}
              onClick={() => void onSave(roleCode, membershipStatus)}
              className="flex-1 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ClubAdminMembersClient({
  clubId,
  clubName,
  initialMembers,
}: ClubAdminMembersClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [members, setMembers] = useState(initialMembers);
  const [selectedMember, setSelectedMember] = useState<ClubAdminMember | null>(null);
  const [saving, setSaving] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { alertState, showAlert, closeAlert } = useAppAlert();

  const filteredMembers = useMemo(() => {
    const baseMembers = members.filter((member) => {
      const matchesQuery =
        deferredQuery.length === 0 ||
        member.displayName.toLowerCase().includes(deferredQuery) ||
        getRoleLabel(member.roleCode).toLowerCase().includes(deferredQuery);

      const matchesStatus =
        statusFilter === "전체" ? true : getStatusLabel(member.membershipStatus) === statusFilter;

      return matchesQuery && matchesStatus;
    });

    return [...baseMembers].sort((left, right) => {
      const leftPriority = statusFilter === "전체" && left.membershipStatus === "PENDING" ? 0 : 1;
      const rightPriority = statusFilter === "전체" && right.membershipStatus === "PENDING" ? 0 : 1;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.displayName.localeCompare(right.displayName, "ko-KR");
    });
  }, [deferredQuery, members, statusFilter]);

  const replaceMember = (nextMember: ClubAdminMember) => {
    setMembers((current) =>
      current.map((member) =>
        member.clubMemberId === nextMember.clubMemberId ? nextMember : member,
      ),
    );
    setSelectedMember((current) =>
      current?.clubMemberId === nextMember.clubMemberId ? nextMember : current,
    );
  };

  const handleApprove = async (member: ClubAdminMember) => {
    if (!member.canApprove) {
      return;
    }
    setSaving(true);
    const result = await approveClubAdminMember(clubId, member.clubMemberId);
    setSaving(false);
    if (!result.ok || !result.data) {
      showAlert({
        title: "가입 승인 실패",
        message: result.message ?? "가입 승인에 실패했습니다.",
        tone: "danger",
      });
      return;
    }
    replaceMember(result.data);
  };

  const handleManageSave = async (
    nextRoleCode: string,
    nextMembershipStatus: "ACTIVE" | "DORMANT",
  ) => {
    if (!selectedMember) {
      return;
    }

    let currentMember = selectedMember;
    setSaving(true);

    if (currentMember.roleCode !== nextRoleCode) {
      const roleResult = await updateClubAdminMemberRole(clubId, currentMember.clubMemberId, {
        roleCode: nextRoleCode,
      });
      if (!roleResult.ok || !roleResult.data) {
        setSaving(false);
        showAlert({
          title: "권한 변경 실패",
          message: roleResult.message ?? "권한 변경에 실패했습니다.",
          tone: "danger",
        });
        return;
      }
      currentMember = roleResult.data;
      replaceMember(currentMember);
    }

    if (
      currentMember.membershipStatus !== "PENDING" &&
      currentMember.membershipStatus !== nextMembershipStatus
    ) {
      const statusResult = await updateClubAdminMemberStatus(clubId, currentMember.clubMemberId, {
        membershipStatus: nextMembershipStatus,
      });
      if (!statusResult.ok || !statusResult.data) {
        setSaving(false);
        showAlert({
          title: "회원 상태 변경 실패",
          message: statusResult.message ?? "회원 상태 변경에 실패했습니다.",
          tone: "danger",
        });
        return;
      }
      currentMember = statusResult.data;
      replaceMember(currentMember);
    }

    setSaving(false);
    setSelectedMember(null);
  };

  return (
    <div
      className={`${plusJakartaSans.className} min-h-screen bg-[#f6f6f8] text-slate-900`}
      style={
        {
          "--primary": "#f97316",
          "--secondary": "#135bec",
        } as CSSProperties
      }
    >
      <div className="min-h-screen bg-[#f6f6f8]">
        <ClubPageHeader
          title="회원 관리"
          subtitle={clubName}
          icon="groups"
          theme="admin"
          containerClassName="max-w-5xl"
        />

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 pb-4">
            <label className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400">search</span>
              <input
                type="text"
                value={query}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => setQuery(nextValue));
                }}
                placeholder="멤버 이름 또는 권한 검색"
                className="h-11 w-full rounded-xl border-none bg-slate-100 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </label>
          </div>

          <div className="mx-auto w-full max-w-5xl overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2">
              {STATUS_FILTERS.map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[var(--primary)] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <main className="semo-nav-bottom-space mx-auto w-full max-w-5xl space-y-3 px-4 py-3">
          <motion.div
            className="flex items-center justify-between px-1"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {statusFilter} ({filteredMembers.length})
            </p>
          </motion.div>

          {filteredMembers.map((member, index) => (
            <motion.article
              key={member.clubMemberId}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              {...staggeredFadeUpMotion(index + 1, reduceMotion)}
            >
              <div className="flex items-center gap-4">
                <MemberAvatar member={member} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-bold">{member.displayName}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusBadgeClassName(member.membershipStatus)}`}
                    >
                      {getStatusLabel(member.membershipStatus)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    가입일: {member.joinedAtLabel ?? "가입 대기"}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
                    <span className={getRoleAccentClassName(member.roleCode)}>
                      {getRoleLabel(member.roleCode)}
                    </span>
                    {member.lastActivityAtLabel ? (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">최근 활동 {member.lastActivityAtLabel}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    showAlert({
                      title: "메시지 기능",
                      message: "메시지 기능은 작업중입니다.",
                      tone: "warning",
                    });
                  }}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
                >
                  메시지
                </button>
                {member.canManage ? (
                  <button
                    type="button"
                    onClick={() => setSelectedMember(member)}
                    className="rounded-lg bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
                  >
                    관리
                  </button>
                ) : null}
                {member.canApprove ? (
                  <button
                    type="button"
                    onClick={() => void handleApprove(member)}
                    disabled={saving}
                    className="rounded-lg bg-[var(--secondary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--secondary)] transition-colors hover:bg-[var(--secondary)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving && selectedMember?.clubMemberId === member.clubMemberId ? "처리 중..." : "가입 승인"}
                  </button>
                ) : null}
              </div>
            </motion.article>
          ))}
        </main>

        <AnimatePresence>
          {selectedMember ? (
            <MemberManageModal
              member={selectedMember}
              saving={saving}
              onDismiss={() => setSelectedMember(null)}
              onSave={handleManageSave}
            />
          ) : null}
        </AnimatePresence>
        <AppAlertModal
          open={alertState.open}
          title={alertState.title}
          message={alertState.message}
          tone={alertState.tone}
          confirmLabel={alertState.confirmLabel}
          onClose={closeAlert}
        />
      </div>
    </div>
  );
}
