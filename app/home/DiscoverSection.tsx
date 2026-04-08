"use client";

import { motion } from "motion/react";
import {
  startTransition,
} from "react";
import {
  getAffiliationTypeLabel,
  getPrimaryClubActivityLabel,
} from "@/app/lib/clubClassification";
import { type ClubDiscoverSummary } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type DiscoverSectionProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  discoverTitle: string;
  discoverSubtitle: string;
  discoverClubs: ClubDiscoverSummary[];
  isLoadingDiscover: boolean;
  discoverError: string | null;
  hasSearchQuery: boolean;
  pendingJoinClubId: number | null;
  reduceMotion: boolean;
  onOpenClub: (club: ClubDiscoverSummary) => void;
  onCancelJoinRequest: (club: ClubDiscoverSummary) => Promise<void>;
};

function getMembershipPolicyLabel(membershipPolicy: string) {
  return membershipPolicy === "OPEN" ? "바로 가입" : "승인 후 가입";
}

function getJoinStatusLabel(joinStatus: string) {
  return (
    {
      PENDING: "신청 대기",
      REJECTED: "재신청 가능",
      CANCELED: "신청 취소됨",
    }[joinStatus] ?? null
  );
}

function getJoinActionLabel(club: ClubDiscoverSummary) {
  if (club.joinStatus === "PENDING") {
    return "신청 취소";
  }
  if (club.membershipPolicy === "OPEN") {
    return "바로 가입";
  }
  if (club.joinStatus === "REJECTED") {
    return "다시 신청";
  }
  return "가입 신청";
}

function getJoinActionTone(club: ClubDiscoverSummary) {
  if (club.joinStatus === "PENDING") {
    return "secondary";
  }
  return club.membershipPolicy === "OPEN" ? "primary" : "default";
}

export function DiscoverSection({
  searchQuery,
  onSearchQueryChange,
  discoverTitle,
  discoverSubtitle,
  discoverClubs,
  isLoadingDiscover,
  discoverError,
  hasSearchQuery,
  pendingJoinClubId,
  reduceMotion,
  onOpenClub,
  onCancelJoinRequest,
}: DiscoverSectionProps) {
  return (
    <>
      <motion.div className="px-4 py-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
        <label className="flex w-full flex-col">
          <div className="flex h-12 w-full items-stretch rounded-xl border border-transparent bg-slate-100 transition-all focus-within:border-[var(--primary)]/50">
            <div className="flex items-center justify-center pl-4 text-slate-500">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              className="form-input flex w-full border-none bg-transparent px-3 text-base font-normal text-slate-900 placeholder:text-slate-500 focus:ring-0"
              placeholder="클럽 이름이나 소개를 검색해 보세요."
              value={searchQuery}
              onChange={(event) => {
                const nextValue = event.target.value;
                startTransition(() => onSearchQueryChange(nextValue));
              }}
            />
          </div>
        </label>
      </motion.div>

      <motion.section className="px-4 pb-3 pt-6" {...staggeredFadeUpMotion(6, reduceMotion)}>
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-bold text-slate-900">{discoverTitle}</h2>
          <span className="text-[10px] font-medium text-slate-400">클럽 찾기/가입신청</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{discoverSubtitle}</p>
      </motion.section>

      <section className="flex flex-1 flex-col gap-4 px-4 pb-20">
        {isLoadingDiscover ? (
          <motion.div
            className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center"
            {...staggeredFadeUpMotion(7, reduceMotion)}
          >
            <p className="text-sm font-semibold text-slate-700">클럽을 탐색하는 중입니다.</p>
            <p className="mt-1 text-xs text-slate-500">공개 클럽과 가입 상태를 확인하고 있습니다.</p>
          </motion.div>
        ) : discoverClubs.length > 0 ? (
          discoverClubs.map((club, index) => {
            const joinStatusLabel = getJoinStatusLabel(club.joinStatus);
            const actionTone = getJoinActionTone(club);
            return (
              <motion.article
                key={club.clubId}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                {...staggeredFadeUpMotion(index + 7, reduceMotion)}
              >
                <div className="flex gap-4">
                  <div
                    className="size-20 shrink-0 rounded-2xl bg-slate-100 bg-cover bg-center"
                    style={club.imageUrl ? { backgroundImage: `url("${club.imageUrl}")` } : undefined}
                  >
                    {!club.imageUrl ? (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--primary)]/12 to-blue-100 text-[var(--primary)]">
                        <span className="material-symbols-outlined text-3xl">groups</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-slate-900">{club.name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        {getPrimaryClubActivityLabel(club.activityTags, club.activityCategory, club.categoryKey)}
                      </span>
                      {club.recommendedByTags || club.recommendedByCategory ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600">
                          추천
                        </span>
                      ) : null}
                      {joinStatusLabel ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                          {joinStatusLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                      {club.summary ?? club.description ?? "클럽 소개가 아직 없습니다."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        멤버 {club.activeMemberCount.toLocaleString("ko-KR")}명
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        {getMembershipPolicyLabel(club.membershipPolicy)}
                      </span>
                      {club.affiliationType ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          {getAffiliationTypeLabel(club.affiliationType)}
                        </span>
                      ) : null}
                      {club.regionLabel ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">{club.regionLabel}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenClub(club)}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    소개 보기
                  </button>
                  {club.joinStatus === "PENDING" ? (
                    <button
                      type="button"
                      disabled={pendingJoinClubId === club.clubId}
                      onClick={() => void onCancelJoinRequest(club)}
                      className="rounded-xl bg-[var(--secondary)]/10 px-4 py-2 text-sm font-bold text-[var(--secondary)] transition-colors hover:bg-[var(--secondary)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pendingJoinClubId === club.clubId ? "처리 중..." : "신청 취소"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenClub(club)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                        actionTone === "primary"
                          ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                          : actionTone === "secondary"
                            ? "bg-[var(--secondary)] text-white hover:bg-[var(--secondary)]/90"
                            : "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
                      }`}
                    >
                      {getJoinActionLabel(club)}
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })
        ) : (
          <motion.div
            className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center"
            {...staggeredFadeUpMotion(7, reduceMotion)}
          >
            <p className="text-sm font-semibold text-slate-700">
              {discoverError ?? "표시할 공개 클럽이 없습니다."}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {hasSearchQuery
                ? "검색어를 바꾸거나 다른 키워드로 다시 찾아보세요."
                : "새 클럽이 등록되면 이 영역에 추천이 표시됩니다."}
            </p>
          </motion.div>
        )}
      </section>
    </>
  );
}
