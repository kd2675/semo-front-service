"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { Plus_Jakarta_Sans } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { startTransition, useDeferredValue, useState } from "react";
import type { CSSProperties } from "react";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type AdminMemberRole = "Admin" | "Moderator" | "Member";
type AdminMemberStatus = "활동 중" | "휴면";

type AdminMember = {
  id: string;
  name: string;
  joinedAt: string;
  attendanceRate: number;
  role: AdminMemberRole;
  status: AdminMemberStatus;
  avatarUrl: string;
};

type ClubAdminMembersClientProps = {
  clubId: string;
  clubName: string;
  members: AdminMember[];
};

const ROLE_ACCENT_CLASS: Record<AdminMemberRole, string> = {
  Admin: "text-primary",
  Moderator: "text-orange-500",
  Member: "text-slate-500",
};

const STATUS_BADGE_CLASS: Record<AdminMemberStatus, string> = {
  "활동 중": "bg-green-100 text-green-700",
  휴면: "bg-slate-100 text-slate-600",
};

export function ClubAdminMembersClient({
  clubId,
  clubName,
  members,
}: ClubAdminMembersClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"전체" | AdminMemberStatus>("전체");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredMembers = members.filter((member) => {
    const matchesQuery =
      deferredQuery.length === 0 ||
      member.name.toLowerCase().includes(deferredQuery) ||
      member.role.toLowerCase().includes(deferredQuery);
    const matchesStatus = statusFilter === "전체" || member.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

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
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <RouterLink
                href={`/clubs/${clubId}/admin`}
                className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="관리자 홈으로 돌아가기"
              >
                <span className="material-symbols-outlined block">arrow_back</span>
              </RouterLink>
              <div>
                <h1 className="text-lg font-bold tracking-tight">회원 관리</h1>
                <p className="text-xs text-slate-500">{clubName}</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10"
              aria-label="회원 관리 설정"
            >
              <span className="material-symbols-outlined block">settings</span>
            </button>
          </div>

          <div className="px-4 pb-4">
            <label className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400">search</span>
              <input
                type="text"
                value={query}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => setQuery(nextValue));
                }}
                placeholder="멤버 이름 또는 역할 검색"
                className="h-11 w-full rounded-xl border-none bg-slate-100 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </label>
          </div>

          <div className="overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2">
              {(["전체", "활동 중", "휴면"] as const).map((filter) => {
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
        </header>

        <main className="space-y-3 px-4 py-3 pb-28">
          <motion.div
            className="flex items-center justify-between px-1"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              전체 멤버 ({filteredMembers.length})
            </p>
          </motion.div>

          {filteredMembers.map((member, index) => (
            <motion.article
              key={member.id}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              {...staggeredFadeUpMotion(index + 1, reduceMotion)}
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-full bg-cover bg-center ring-2 ring-[var(--primary)]/10"
                  style={{ backgroundImage: `url('${member.avatarUrl}')` }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-bold">{member.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE_CLASS[member.status]}`}
                    >
                      {member.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">가입일: {member.joinedAt}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[var(--primary)]">
                    <span className="material-symbols-outlined text-[14px]">
                      {member.attendanceRate >= 70 ? "trending_up" : "trending_flat"}
                    </span>
                    출석률 {member.attendanceRate}%
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <span className={ROLE_ACCENT_CLASS[member.role]}>{member.role}</span>
                    <span className="material-symbols-outlined text-sm text-slate-500">expand_more</span>
                  </button>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
                >
                  관리
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
                >
                  메시지
                </button>
              </div>
            </motion.article>
          ))}
        </main>
      </div>
    </div>
  );
}
