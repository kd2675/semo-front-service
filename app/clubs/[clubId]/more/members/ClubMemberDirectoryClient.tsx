"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import {
  type ClubMemberDirectoryActivity,
  type ClubMemberDirectoryMember,
  type ClubMemberDirectoryResponse,
  type ClubMemberDirectorySettings,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubMemberDirectoryClientProps = {
  clubId: string;
  initialData: ClubMemberDirectoryResponse;
  isAdmin: boolean;
};

type MemberFilterKey = "all" | "leaders" | "positions" | "recent";

type MemberFilterOption = {
  key: MemberFilterKey;
  label: string;
  count: number;
};

function getActivityBadge(activity: ClubMemberDirectoryActivity | null) {
  const subject = activity?.subject ?? "";
  switch (subject) {
    case "공지관리":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
    case "일정관리":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
    case "출석관리":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    case "투표관리":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
    case "멤버관리":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
}

function getMemberSearchText(
  member: ClubMemberDirectoryMember,
  settings: ClubMemberDirectorySettings,
) {
  const searchableFields = [member.displayName];

  if (settings.showPositions) {
    searchableFields.push(member.roleLabel ?? "");
    searchableFields.push(member.positions.map((position) => position.displayName).join(" "));
  }

  if (settings.showTagline) {
    searchableFields.push(member.tagline ?? "");
  }

  if (settings.showRecentActivity) {
    searchableFields.push(member.recentActivity?.subject ?? "");
    searchableFields.push(member.recentActivity?.detail ?? "");
  }

  return searchableFields.join(" ").toLowerCase();
}

function isLeaderMember(member: ClubMemberDirectoryMember) {
  return member.roleLabel === "오너" || member.roleLabel === "어드민";
}

function matchesFilter(member: ClubMemberDirectoryMember, filter: MemberFilterKey) {
  switch (filter) {
    case "leaders":
      return isLeaderMember(member);
    case "positions":
      return member.positions.length > 0;
    case "recent":
      return member.recentActivity !== null;
    default:
      return true;
  }
}

function getMemberTone(
  member: ClubMemberDirectoryMember,
  settings: ClubMemberDirectorySettings,
) {
  if (settings.showPositions && member.roleLabel === "오너") {
    return {
      rail: "from-slate-900 via-slate-700 to-[#135bec]",
      glow: "from-[#135bec]/18 via-blue-100/80 to-transparent",
      avatar: "from-slate-900 to-[#135bec]",
      badge: "bg-slate-900 text-white",
      label: "핵심 운영",
    };
  }
  if (settings.showPositions && member.roleLabel === "어드민") {
    return {
      rail: "from-[#135bec] via-blue-500 to-sky-400",
      glow: "from-[#135bec]/16 via-blue-100/75 to-transparent",
      avatar: "from-[#135bec] to-blue-500",
      badge: "bg-[#135bec]/10 text-[#135bec]",
      label: "운영 멤버",
    };
  }
  if (settings.showPositions && member.positions.length > 0) {
    return {
      rail: "from-sky-500 via-cyan-400 to-blue-300",
      glow: "from-sky-100/90 via-white to-transparent",
      avatar: "from-sky-500 to-cyan-400",
      badge: "bg-sky-50 text-sky-700",
      label: "직책 보유",
    };
  }
  if (settings.showRecentActivity && member.recentActivity) {
    return {
      rail: "from-emerald-500 via-teal-400 to-cyan-300",
      glow: "from-emerald-100/90 via-white to-transparent",
      avatar: "from-emerald-500 to-cyan-400",
      badge: "bg-emerald-50 text-emerald-700",
      label: "최근 활동",
    };
  }
  return {
    rail: "from-slate-300 via-slate-200 to-slate-100",
    glow: "from-slate-100/90 via-white to-transparent",
    avatar: "from-slate-500 to-slate-400",
    badge: "bg-slate-100 text-slate-600",
    label: "멤버 카드",
  };
}

function MemberAvatar({
  member,
  size = "large",
  gradientClassName,
}: {
  member: ClubMemberDirectoryMember;
  size?: "small" | "large";
  gradientClassName: string;
}) {
  const sizeClassName = size === "small" ? "size-10" : "size-16";
  const textClassName = size === "small" ? "text-xs" : "text-sm";

  if (member.avatarImageUrl) {
    return (
      <div
        className={`${sizeClassName} overflow-hidden rounded-[20px] bg-slate-200 shadow-[0_10px_28px_rgba(15,23,42,0.14)] ring-2 ring-white/90`}
        style={{ backgroundImage: `url('${member.avatarImageUrl}')`, backgroundPosition: "center", backgroundSize: "cover" }}
      />
    );
  }

  return (
    <div
      className={`${sizeClassName} flex items-center justify-center rounded-[20px] bg-gradient-to-br ${gradientClassName} ${textClassName} font-black text-white shadow-[0_12px_28px_rgba(19,91,236,0.18)] ring-2 ring-white/90`}
    >
      {member.displayName.slice(0, 2)}
    </div>
  );
}

function MemberFilterChip({
  active,
  option,
  onClick,
}: {
  active: boolean;
  option: MemberFilterOption;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
        active
          ? "bg-[var(--primary)] text-white shadow-[0_12px_24px_rgba(19,91,236,0.24)]"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {option.label}
      <span className={`ml-1.5 ${active ? "text-white/80" : "text-slate-400"}`}>{option.count}</span>
    </button>
  );
}

function DirectoryMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/72 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

export function ClubMemberDirectoryClient({
  clubId,
  initialData,
  isAdmin,
}: ClubMemberDirectoryClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<MemberFilterKey>("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { members, settings } = initialData;

  const leaderCount = useMemo(() => members.filter(isLeaderMember).length, [members]);
  const positionCount = useMemo(
    () => members.filter((member) => member.positions.length > 0).length,
    [members],
  );
  const recentActivityCount = useMemo(
    () => members.filter((member) => member.recentActivity !== null).length,
    [members],
  );
  const heroMembers = useMemo(() => members.slice(0, 3), [members]);
  const heroMemberNames =
    heroMembers.length > 0
      ? heroMembers.map((member) => member.displayName).join(" · ")
      : "첫 멤버가 연결되면 여기에 표시됩니다.";

  const filterOptions = useMemo<MemberFilterOption[]>(() => {
    const options: MemberFilterOption[] = [
      {
        key: "all",
        label: "전체 멤버",
        count: members.length,
      },
    ];

    if (settings.showPositions && leaderCount > 0) {
      options.push({
        key: "leaders",
        label: "운영진",
        count: leaderCount,
      });
    }

    if (settings.showPositions && positionCount > 0) {
      options.push({
        key: "positions",
        label: "직책 보유",
        count: positionCount,
      });
    }

    if (settings.showRecentActivity && recentActivityCount > 0) {
      options.push({
        key: "recent",
        label: "최근 활동",
        count: recentActivityCount,
      });
    }

    return options;
  }, [leaderCount, members.length, positionCount, recentActivityCount, settings.showPositions, settings.showRecentActivity]);

  const resolvedFilter = filterOptions.some((option) => option.key === activeFilter) ? activeFilter : "all";

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (!matchesFilter(member, resolvedFilter)) {
        return false;
      }
      if (!deferredQuery) {
        return true;
      }
      return getMemberSearchText(member, settings).includes(deferredQuery);
    });
  }, [deferredQuery, members, resolvedFilter, settings]);

  const hasFilterState = query.length > 0 || resolvedFilter !== "all";

  return (
    <div className="min-h-full bg-[var(--background-light)] text-slate-900">
      <div className="mx-auto flex min-h-full max-w-md flex-col bg-[var(--background-light)]">
        <ClubPageHeader
          title="회원 디렉터리"
          subtitle={initialData.clubName}
          icon="groups"
          className="border-[#135bec]/10 bg-white/85 backdrop-blur-md"
        />

        <main className="semo-nav-bottom-space space-y-4 px-4 pt-4">
          <motion.section
            className="relative overflow-hidden rounded-[32px] border border-[#135bec]/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.96)_0%,rgba(244,248,255,0.96)_55%,rgba(232,240,255,0.92)_100%)] p-5 shadow-[0_22px_55px_rgba(19,91,236,0.14)]"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-[#135bec]/12 blur-3xl" />
            <div className="absolute bottom-0 left-[-2rem] h-28 w-28 rounded-full bg-blue-100/70 blur-3xl" />

            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
                Member Directory
              </p>
              <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-slate-900">
                함께 활동하는 멤버를
                <br />
                한 화면에서 찾으세요.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                레퍼런스의 카드 밀도는 가져오되, `semo` 사용자 화면 톤에 맞게 직책, 소개, 최근 활동을
                차분하게 정리했습니다.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center">
                  {heroMembers.map((member, index) => (
                    <div
                      key={`hero-member-${member.clubProfileId}`}
                      className={index === 0 ? "" : "-ml-3"}
                    >
                      <MemberAvatar
                        member={member}
                        size="small"
                        gradientClassName={getMemberTone(member, settings).avatar}
                      />
                    </div>
                  ))}
                  <div className="ml-3 min-w-0">
                    <p className="text-xs font-semibold text-slate-500">지금 연결된 네트워크</p>
                    <p className="truncate text-sm font-bold text-slate-900">
                      {heroMemberNames}
                    </p>
                  </div>
                </div>

                <div className="w-full rounded-[24px] bg-slate-900 px-4 py-3 text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)] sm:w-auto">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Members</p>
                  <p className="mt-1 text-2xl font-black tracking-tight">
                    {initialData.totalMemberCount}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <DirectoryMetric
                  label="운영진"
                  value={settings.showPositions ? `${leaderCount}` : "비공개"}
                  detail={
                    settings.showPositions
                      ? "오너와 어드민 멤버를 바로 구분합니다."
                      : "운영 설정에서 직책 공개가 꺼져 있습니다."
                  }
                />
                <DirectoryMetric
                  label="최근 활동"
                  value={settings.showRecentActivity ? `${recentActivityCount}` : "비공개"}
                  detail={
                    settings.showRecentActivity
                      ? "최근 기록이 보이는 멤버 수입니다."
                      : "운영 설정에서 최근 활동 공개가 꺼져 있습니다."
                  }
                />
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <label className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-3 transition focus-within:border-[var(--primary)]/30 focus-within:bg-white">
              <span className="material-symbols-outlined text-slate-400">search</span>
              <input
                value={query}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => {
                    setQuery(nextValue);
                  });
                }}
                aria-label="회원 검색"
                placeholder="이름, 소개, 직책, 활동으로 검색"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div aria-live="polite">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">필터</p>
                <p className="mt-1 text-sm font-bold text-slate-900">현재 {filteredMembers.length}명 표시 중</p>
              </div>
              {hasFilterState ? (
                <button
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setQuery("");
                      setActiveFilter("all");
                    });
                  }}
                  className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                >
                  초기화
                </button>
              ) : null}
            </div>

            <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
              {filterOptions.map((option) => (
                <MemberFilterChip
                  key={option.key}
                  active={resolvedFilter === option.key}
                  option={option}
                  onClick={() => {
                    startTransition(() => {
                      setActiveFilter(option.key);
                    });
                  }}
                />
              ))}
            </div>
          </motion.section>

          {filteredMembers.length === 0 ? (
            <motion.section
              className="rounded-[28px] border border-dashed border-slate-300 bg-white/92 px-5 py-10 text-center shadow-sm"
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <span className="material-symbols-outlined text-[28px]">person_search</span>
              </div>
              <p className="mt-4 text-base font-black tracking-tight text-slate-900">조건에 맞는 회원이 없습니다.</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                검색어를 줄이거나 필터를 전체 멤버로 돌려서 다시 확인해보세요.
              </p>
            </motion.section>
          ) : (
            filteredMembers.map((member, index) => {
              const tone = getMemberTone(member, settings);

              return (
                <motion.article
                  key={member.clubProfileId}
                  className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur"
                  {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                >
                  <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${tone.glow}`} />
                  <div className={`absolute bottom-0 left-0 top-0 w-1.5 bg-gradient-to-b ${tone.rail}`} />

                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <MemberAvatar member={member} gradientClassName={tone.avatar} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-xl font-black tracking-[-0.03em] text-slate-900">
                                {member.displayName}
                              </h3>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone.badge}`}>
                                {tone.label}
                              </span>
                            </div>

                            {settings.showPositions && member.roleLabel ? (
                              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                {member.roleLabel}
                              </p>
                            ) : null}
                          </div>

                          {settings.showRecentActivity && member.recentActivity ? (
                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${getActivityBadge(member.recentActivity)}`}
                            >
                              {member.recentActivity.subject}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 rounded-[24px] border border-white/80 bg-slate-50/75 px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            한줄소개
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {settings.showTagline
                              ? member.tagline ?? "아직 등록된 한줄소개가 없습니다."
                              : "한줄소개는 운영 설정에 따라 비공개입니다."}
                          </p>
                        </div>

                        {settings.showPositions ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {member.positions.length > 0 ? (
                              member.positions.map((position) => (
                                <span
                                  key={`${member.clubProfileId}-${position.clubPositionId}`}
                                  className="rounded-full px-3 py-1.5 text-xs font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]"
                                  style={{
                                    backgroundColor: position.colorHex ? `${position.colorHex}1A` : "#f1f5f9",
                                    color: position.colorHex ?? "#475569",
                                  }}
                                >
                                  {position.displayName}
                                </span>
                              ))
                            ) : member.roleLabel ? (
                              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                                {member.roleLabel}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                                공개된 직책이 없습니다.
                              </span>
                            )}
                          </div>
                        ) : null}

                        <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-4 py-4">
                          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                            <span className="material-symbols-outlined text-[18px] text-[var(--primary)]">
                              monitoring
                            </span>
                            최근 활동
                          </div>

                          {settings.showRecentActivity && member.recentActivity ? (
                            <>
                              <p className="mt-3 text-sm font-bold leading-6 text-slate-900">
                                {member.recentActivity.detail}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {member.recentActivity.createdAtLabel ?? "최근 활동 시각 정보 없음"}
                              </p>
                            </>
                          ) : (
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                              {settings.showRecentActivity
                                ? "아직 기록된 최근 활동이 없습니다."
                                : "최근 활동은 운영 설정에 따라 비공개입니다."}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </main>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
      </div>
    </div>
  );
}
