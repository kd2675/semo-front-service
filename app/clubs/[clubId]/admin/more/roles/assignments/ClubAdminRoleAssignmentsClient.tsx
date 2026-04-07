"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { useAppAlert } from "@/app/hooks/useAppAlert";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import {
  updateClubAdminMemberPositions,
  type ClubAdminMember,
  type ClubAdminMembersResponse,
} from "@/app/lib/clubs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Inter, Manrope } from "next/font/google";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import type { CSSProperties } from "react";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type ClubAdminRoleAssignmentsClientProps = {
  clubId: string;
  initialData: ClubAdminMembersResponse;
};

function makeInitials(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 2).toUpperCase() : "MB";
}

function getRoleSubtitle(member: ClubAdminMember) {
  return member.tagline?.trim() || member.roleCode;
}

export function ClubAdminRoleAssignmentsClient({
  clubId,
  initialData,
}: ClubAdminRoleAssignmentsClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [members, setMembers] = useState(initialData.members);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(
    initialData.availablePositions[0]?.clubPositionId ?? null,
  );
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { showAlert } = useAppAlert();

  const selectedRole = useMemo(
    () =>
      initialData.availablePositions.find((position) => position.clubPositionId === selectedRoleId) ??
      initialData.availablePositions[0] ??
      null,
    [initialData.availablePositions, selectedRoleId],
  );

  const filteredMembers = useMemo(() => {
    if (deferredQuery.length === 0) {
      return members;
    }
    return members.filter((member) => {
      const positionText = member.positions.map((position) => position.displayName.toLowerCase()).join(" ");
      return (
        member.displayName.toLowerCase().includes(deferredQuery) ||
        member.roleCode.toLowerCase().includes(deferredQuery) ||
        positionText.includes(deferredQuery)
      );
    });
  }, [deferredQuery, members]);

  const assignedMembers = useMemo(() => {
    if (!selectedRole) {
      return [];
    }
    return filteredMembers.filter((member) =>
      member.positions.some((position) => position.clubPositionId === selectedRole.clubPositionId),
    );
  }, [filteredMembers, selectedRole]);

  const availableMembers = useMemo(() => {
    if (!selectedRole) {
      return [];
    }
    return filteredMembers.filter(
      (member) => !member.positions.some((position) => position.clubPositionId === selectedRole.clubPositionId),
    );
  }, [filteredMembers, selectedRole]);

  const handleAssignToggle = async (member: ClubAdminMember, shouldAssign: boolean) => {
    if (!selectedRole) {
      return;
    }
    const currentIds = member.positions.map((position) => position.clubPositionId);
    const nextIds = shouldAssign
      ? [...new Set([...currentIds, selectedRole.clubPositionId])]
      : currentIds.filter((positionId) => positionId !== selectedRole.clubPositionId);

    setSaving(true);
    const result = await updateClubAdminMemberPositions(clubId, member.clubMemberId, {
      clubPositionIds: nextIds,
    });
    setSaving(false);

    if (!result.ok || !result.data) {
      showAlert({
        title: shouldAssign ? "직책 부여 실패" : "직책 해제 실패",
        message: result.message ?? "직책 변경을 저장하지 못했습니다.",
        tone: "danger",
      });
      return;
    }

    setMembers((current) =>
      current.map((item) => (item.clubMemberId === result.data?.clubMemberId ? result.data : item)),
    );
  };

  if (!selectedRole) {
    return (
      <div className={`${inter.className} min-h-screen bg-[#f7fafc] px-4 py-16 text-center text-slate-500`}>
        생성된 직책이 없습니다. 먼저 직책을 생성해주세요.
      </div>
    );
  }

  return (
    <div
      className={`${inter.className} min-h-screen bg-[#f7fafc] text-slate-900`}
      style={{ "--secondary": "#904e00" } as CSSProperties}
    >
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,220,194,0.6),_transparent_34%),linear-gradient(180deg,_#f7fafc_0%,_#f1f5f7_100%)] pb-32">
        <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center bg-[#fff5eb]/90 px-4 shadow-sm backdrop-blur-md">
          <div className="flex w-full items-center gap-4">
            <RouterLink
              href={`/clubs/${clubId}/admin/more/roles`}
              className="rounded-full p-2 text-[var(--secondary)] transition hover:bg-[#fff1e4]"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </RouterLink>
            <h1 className={`flex-grow ${manrope.className} text-lg font-bold tracking-tight text-[var(--secondary)]`}>
              Assign Members
            </h1>
            <RouterLink
              href={`/clubs/${clubId}/admin/more/roles/${selectedRole.clubPositionId}/edit`}
              className="rounded-full p-2 text-[var(--secondary)] transition hover:bg-[#fff1e4]"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </RouterLink>
          </div>
        </header>

        <main className="px-4 pt-20 md:mx-auto md:max-w-4xl">
          <motion.section
            className="relative mb-8 overflow-hidden rounded-[24px] bg-[#ffdcc2] p-6"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="absolute -right-4 -top-4 size-32 rounded-full bg-[var(--secondary)] opacity-10 blur-3xl" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-[var(--secondary)]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shield_person
                </span>
                <span className={`${manrope.className} text-xs font-extrabold uppercase tracking-[0.24em] text-[#8b4b00]`}>
                  Administrative Role
                </span>
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-xl">
                  <h2 className={`${manrope.className} text-3xl font-extrabold text-[#623300]`}>
                    {selectedRole.displayName}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[#7d4300]">
                    {selectedRole.description ?? "선택한 직책에 멤버를 연결하고 권한 구조를 운영합니다."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {initialData.availablePositions.map((position) => {
                    const active = selectedRole.clubPositionId === position.clubPositionId;
                    return (
                      <button
                        key={position.clubPositionId}
                        type="button"
                        onClick={() => setSelectedRoleId(position.clubPositionId)}
                        className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                          active
                            ? "bg-[var(--secondary)] text-white shadow-sm"
                            : "bg-white/75 text-[#8b4b00] hover:bg-white"
                        }`}
                      >
                        {position.displayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.div className="mb-6" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="group relative">
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
                placeholder="Search available members..."
                className="w-full rounded-2xl bg-white px-10 py-3 text-sm outline-none shadow-sm ring-1 ring-slate-200 transition focus:ring-2 focus:ring-[rgba(144,78,0,0.25)]"
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <motion.section {...staggeredFadeUpMotion(2, reduceMotion)}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={`${manrope.className} text-lg font-bold text-slate-900`}>Active Members</h3>
                <span className="rounded-full bg-[var(--secondary)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--secondary)]">
                  {assignedMembers.length} Assigned
                </span>
              </div>
              <div className="space-y-3">
                {assignedMembers.length > 0 ? (
                  assignedMembers.map((member) => (
                    <div
                      key={member.clubMemberId}
                      className="flex items-center justify-between rounded-[20px] border-l-4 border-[var(--secondary)] bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {member.avatarImageUrl ? (
                          <div
                            className="size-10 rounded-full bg-cover bg-center"
                            style={{ backgroundImage: `url('${member.avatarImageUrl}')` }}
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-full bg-[#eff4f7] text-sm font-bold text-slate-500">
                            {makeInitials(member.displayName)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{member.displayName}</p>
                          <p className="text-xs text-slate-500">{getRoleSubtitle(member)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAssignToggle(member, false)}
                        disabled={saving || !member.canManage}
                        className="flex size-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-xl">person_remove</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] bg-white p-5 text-sm text-slate-500 shadow-sm">
                    아직 이 직책에 배정된 멤버가 없습니다.
                  </div>
                )}
              </div>
            </motion.section>

            <motion.section {...staggeredFadeUpMotion(3, reduceMotion)}>
              <div className="mb-4">
                <h3 className={`${manrope.className} text-lg font-bold text-slate-900`}>Available Members</h3>
              </div>
              <div className="space-y-3">
                {availableMembers.length > 0 ? (
                  availableMembers.map((member) => (
                    <div
                      key={member.clubMemberId}
                      className="group flex items-center justify-between rounded-[20px] bg-[#eff4f7] p-4 transition hover:bg-[#e8eff2]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                          {member.avatarImageUrl ? (
                            <div
                              className="size-10 rounded-full bg-cover bg-center"
                              style={{ backgroundImage: `url('${member.avatarImageUrl}')` }}
                            />
                          ) : (
                            <span className="material-symbols-outlined">person</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{member.displayName}</p>
                          <p className="text-xs text-slate-500">{getRoleSubtitle(member)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAssignToggle(member, true)}
                        disabled={saving || !member.canManage}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[var(--secondary)] shadow-sm transition hover:bg-[var(--secondary)] hover:text-white active:scale-95 disabled:opacity-40"
                      >
                        Assign
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] bg-white p-5 text-sm text-slate-500 shadow-sm">
                    추가로 배정할 수 있는 멤버가 없습니다.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  showAlert({
                    title: "초대 기능 준비중",
                    message: "새 멤버 초대는 아직 연결되지 않았습니다.",
                    tone: "warning",
                  })
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-white"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Invite New Member
              </button>
            </motion.section>
          </div>
        </main>

        <div className="fixed bottom-20 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-6">
          <div className="flex w-full items-center justify-center gap-3 rounded-full bg-[var(--secondary)] py-4 text-base font-extrabold text-white shadow-xl">
            Save Changes
            <span className="material-symbols-outlined">done_all</span>
          </div>
        </div>

        <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl bg-white/85 px-6 pb-4 pt-2 shadow-[0_-4px_24px_rgba(43,52,55,0.08)] backdrop-blur-xl">
          {[
            { label: "Dashboard", icon: "dashboard", href: `/clubs/${clubId}/admin` },
            { label: "Members", icon: "group", href: `/clubs/${clubId}/admin/members` },
            { label: "Roles", icon: "shield_person", href: `/clubs/${clubId}/admin/more/roles/assignments`, active: true },
            { label: "Settings", icon: "settings", href: `/clubs/${clubId}/admin/menu` },
          ].map((item) => (
            <RouterLink
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 ${
                item.active
                  ? "bg-orange-100 text-orange-900"
                  : "text-stone-500 transition hover:text-orange-600"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
            </RouterLink>
          ))}
        </nav>

        <AnimatePresence />
      </div>
    </div>
  );
}
