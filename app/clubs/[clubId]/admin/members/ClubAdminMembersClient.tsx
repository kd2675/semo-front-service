"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { useAppToast } from "@/app/hooks/useAppToast";
import { useAppAlert } from "@/app/hooks/useAppAlert";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  getClubAdminJoinRequests,
  getClubAdminMembers,
  type ClubAdminJoinRequest,
  type ClubAdminMember,
} from "@/app/lib/clubs";
import { overlayFadeMotion, popInMotion, staggeredFadeUpMotion } from "@/app/lib/motion";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import {
  reviewJoinRequestMutationOptions,
  updateMemberRoleMutationOptions,
  updateMemberStatusMutationOptions,
} from "@/app/lib/react-query/members/mutations";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ROLE_OPTIONS = [
  { code: "OWNER", label: "오너" },
  { code: "ADMIN", label: "어드민" },
  { code: "MEMBER", label: "회원" },
] as const;

const STATUS_FILTERS = ["전체", "활동 중", "휴면"] as const;
const STATUS_OPTIONS = [
  { code: "ACTIVE", label: "활동 중" },
  { code: "DORMANT", label: "휴면" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

type ClubAdminMembersClientProps = {
  clubId: string;
  clubName: string;
  initialMembers: ClubAdminMember[];
  initialJoinRequests: ClubAdminJoinRequest[];
};

function getRoleLabel(roleCode: string) {
  return ROLE_OPTIONS.find((option) => option.code === roleCode)?.label ?? roleCode;
}

function getStatusLabel(membershipStatus: string) {
  return (
    {
      ACTIVE: "활동 중",
      DORMANT: "휴면",
    }[membershipStatus] ?? membershipStatus
  );
}

function getStatusBadgeClassName(membershipStatus: string) {
  switch (membershipStatus) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "DORMANT":
      return "bg-slate-100 text-slate-600";
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

function JoinRequestAvatar({ request }: { request: ClubAdminJoinRequest }) {
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
      style={{ backgroundColor: request.profileColor ?? "#135bec" }}
    >
      {request.displayName.slice(0, 2)}
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
  const [roleCode, setRoleCode] = useState(member.roleCode);
  const [membershipStatus, setMembershipStatus] = useState<"ACTIVE" | "DORMANT">(
    member.membershipStatus === "DORMANT" ? "DORMANT" : "ACTIVE",
  );

  return (
    <AnimatePresence>
      <motion.div
        key="member-manage-backdrop"
        className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm"
        {...overlayFadeMotion(reduceMotion)}
      />
      <motion.div
        key="member-manage-dialog"
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
                  가입일 {member.joinedAtLabel ?? "-"}
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
              disabled={saving}
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
  initialJoinRequests,
}: ClubAdminMembersClientProps) {
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [members, setMembers] = useState(initialMembers);
  const [joinRequests, setJoinRequests] = useState(initialJoinRequests);
  const [selectedMember, setSelectedMember] = useState<ClubAdminMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewingJoinRequestId, setReviewingJoinRequestId] = useState<number | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { showAlert } = useAppAlert();
  const { showToast } = useAppToast();
  const reviewJoinRequestMutation = useMutation(reviewJoinRequestMutationOptions(clubId));
  const updateMemberRoleMutation = useMutation(updateMemberRoleMutationOptions(clubId));
  const updateMemberStatusMutation = useMutation(updateMemberStatusMutationOptions(clubId));

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    setJoinRequests(initialJoinRequests);
  }, [initialJoinRequests]);

  const filteredJoinRequests = useMemo(() => {
    if (deferredQuery.length === 0) {
      return joinRequests;
    }

    return joinRequests.filter((request) => {
      const requestText = `${request.displayName} ${request.tagline ?? ""} ${request.requestMessage ?? ""}`
        .toLowerCase();
      return requestText.includes(deferredQuery);
    });
  }, [deferredQuery, joinRequests]);

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

    return [...baseMembers].sort((left, right) =>
      left.displayName.localeCompare(right.displayName, "ko-KR"),
    );
  }, [deferredQuery, members, statusFilter]);

  const reloadAdminData = async () => {
    const [membersResult, joinRequestsResult] = await Promise.all([
      getClubAdminMembers(clubId),
      getClubAdminJoinRequests(clubId),
    ]);
    if (!membersResult.ok || !membersResult.data || !joinRequestsResult.ok || !joinRequestsResult.data) {
      throw new Error("멤버관리 데이터를 새로고침하지 못했습니다.");
    }
    setMembers(membersResult.data.members);
    setJoinRequests(joinRequestsResult.data.requests);
  };

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

  const handleReviewJoinRequest = async (
    request: ClubAdminJoinRequest,
    requestStatus: "APPROVED" | "REJECTED",
  ) => {
    setReviewingJoinRequestId(request.clubJoinRequestId);
    const result = await reviewJoinRequestMutation.mutateAsync({
      clubJoinRequestId: request.clubJoinRequestId,
      requestStatus,
    });
    if (!result.ok || !result.data) {
      setReviewingJoinRequestId(null);
      showAlert({
        title: requestStatus === "APPROVED" ? "가입 승인 실패" : "가입 반려 실패",
        message: result.message ?? "가입 신청 처리에 실패했습니다.",
        tone: "danger",
      });
      return;
    }

    try {
      await reloadAdminData();
      void invalidateClubQueries(queryClient, clubId);
      showToast(
        requestStatus === "APPROVED"
          ? `${request.displayName} 가입 신청을 승인했습니다.`
          : `${request.displayName} 가입 신청을 반려했습니다.`,
      );
    } catch (error) {
      showAlert({
        title: "목록 새로고침 실패",
        message: error instanceof Error ? error.message : "데이터를 다시 불러오지 못했습니다.",
        tone: "danger",
      });
    } finally {
      setReviewingJoinRequestId(null);
    }
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
      const roleResult = await updateMemberRoleMutation.mutateAsync({
        clubMemberId: currentMember.clubMemberId,
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

    if (currentMember.membershipStatus !== nextMembershipStatus) {
      const statusResult = await updateMemberStatusMutation.mutateAsync({
        clubMemberId: currentMember.clubMemberId,
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
    void invalidateClubQueries(queryClient, clubId);
    showToast(`${currentMember.displayName} 정보를 저장했습니다.`);
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
                placeholder="신청자 이름, 멤버 이름, 메시지 검색"
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

        <main className="semo-nav-bottom-space mx-auto w-full max-w-5xl space-y-6 px-4 py-4">
          <motion.section {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  가입 신청 {filteredJoinRequests.length}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">대기 중인 가입 신청</h2>
              </div>
            </div>

            {filteredJoinRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
                대기 중인 가입 신청이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJoinRequests.map((request, index) => (
                  <motion.article
                    key={request.clubJoinRequestId}
                    className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"
                    {...staggeredFadeUpMotion(index + 1, reduceMotion)}
                  >
                    <div className="flex items-start gap-4">
                      <JoinRequestAvatar request={request} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-bold text-slate-900">{request.displayName}</p>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                            가입 신청
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          신청일: {request.requestedAtLabel ?? "-"}
                        </p>
                        {request.tagline ? (
                          <p className="mt-2 text-sm text-slate-600">{request.tagline}</p>
                        ) : null}
                        <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                          {request.requestMessage?.trim() || "신청 메시지가 없습니다."}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={reviewingJoinRequestId === request.clubJoinRequestId}
                        onClick={() => void handleReviewJoinRequest(request, "APPROVED")}
                        className="rounded-xl bg-[var(--secondary)] px-4 py-2 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {reviewingJoinRequestId === request.clubJoinRequestId ? "처리 중..." : "승인"}
                      </button>
                      <button
                        type="button"
                        disabled={reviewingJoinRequestId === request.clubJoinRequestId}
                        onClick={() => void handleReviewJoinRequest(request, "REJECTED")}
                        className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        반려
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section {...staggeredFadeUpMotion(filteredJoinRequests.length + 2, reduceMotion)}>
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {statusFilter} {filteredMembers.length}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">현재 멤버</h2>
              </div>
            </div>

            <div className="space-y-3">
              {filteredMembers.map((member, index) => (
                <motion.article
                  key={member.clubMemberId}
                  className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                  {...staggeredFadeUpMotion(filteredJoinRequests.length + index + 3, reduceMotion)}
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
                        가입일: {member.joinedAtLabel ?? "-"}
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
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.section>
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
      </div>
    </div>
  );
}
