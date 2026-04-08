"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { DiscoverClubModal } from "@/app/home/DiscoverClubModal";
import { DiscoverSection } from "@/app/home/DiscoverSection";
import { RouterLink } from "@/app/components/RouterLink";
import { useAppToast } from "@/app/hooks/useAppToast";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useDeferredValue,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { clearAccessToken, logout, normalizeRole } from "@/app/lib/auth";
import {
  getAffiliationTypeLabel,
  getPrimaryClubActivityLabel,
} from "@/app/lib/clubClassification";
import {
  type ClubDiscoverSummary,
} from "@/app/lib/clubs";
import { overlayFadeMotion, popInMotion, staggeredFadeUpMotion } from "@/app/lib/motion";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { cancelClubJoinMutationOptions, submitClubJoinMutationOptions } from "@/app/lib/react-query/home/mutations";
import { discoverClubsQueryOptions, myClubsQueryOptions } from "@/app/lib/react-query/home/queries";
import type { AuthUser } from "@/app/types/auth";
import { useAppAlert } from "@/app/hooks/useAppAlert";
import { useAppSelector } from "@/app/redux/hooks";

function createProfileLabel(user: AuthUser | null): string {
  const source = user?.username?.trim();
  if (!source) {
    return "S";
  }

  return source.slice(0, 1).toUpperCase();
}

export default function Home() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const user = useAppSelector((state) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubDiscoverSummary | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const { showAlert } = useAppAlert();
  const { showToast } = useAppToast();
  const myClubsQuery = useQuery(myClubsQueryOptions());
  const discoverQuery = useQuery(discoverClubsQueryOptions(deferredSearchQuery));
  const submitJoinMutation = useMutation(submitClubJoinMutationOptions());
  const cancelJoinMutation = useMutation(cancelClubJoinMutationOptions());

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      if (!reduceMotion) {
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }
      await logout();
    } catch {
      // Ignore logout API failure and clear the local session regardless.
    } finally {
      clearAccessToken();
      router.replace("/login");
    }
  };

  const roleLabel = normalizeRole(user?.role) ?? "GUEST";
  const profileLabel = createProfileLabel(user);
  const userName = user?.username ?? "익명 사용자";
  const myClubs = myClubsQuery.data ?? [];
  const isLoadingMyClubs = myClubsQuery.isPending;
  const myClubsError = myClubsQuery.isError
    ? getQueryErrorMessage(myClubsQuery.error, "내 클럽을 불러오지 못했습니다.")
    : null;
  const discoverPayload = discoverQuery.data ?? null;
  const isLoadingDiscover = discoverQuery.isPending;
  const discoverError = discoverQuery.isError
    ? getQueryErrorMessage(discoverQuery.error, "클럽 탐색 목록을 불러오지 못했습니다.")
    : null;
  const isSubmittingJoinAction = submitJoinMutation.isPending;
  const pendingJoinClubId = cancelJoinMutation.isPending
    ? cancelJoinMutation.variables?.clubId ?? null
    : null;

  const refreshHomeData = async () => {
    const [, discoverResult] = await Promise.all([
      myClubsQuery.refetch(),
      discoverQuery.refetch(),
    ]);

    if (discoverResult.error) {
      throw discoverResult.error;
    }
  };

  const handleOpenClubAction = (club: ClubDiscoverSummary) => {
    setSelectedClub(club);
    setRequestMessage("");
  };

  const handleSubmitJoinAction = async () => {
    if (!selectedClub) {
      return;
    }

    const targetClub = selectedClub;

    try {
      const result = await submitJoinMutation.mutateAsync({
        clubId: targetClub.clubId,
        requestMessage:
          targetClub.membershipPolicy === "APPROVAL" ? requestMessage.trim() || null : null,
      });

      setSelectedClub(null);
      setRequestMessage("");

      try {
        await refreshHomeData();
        showToast(
          result.actionType === "JOINED"
            ? `${targetClub.name}에 가입했습니다.`
            : `${targetClub.name} 가입 신청을 보냈습니다.`,
        );
      } catch {
        showAlert({
          title: "화면 갱신 실패",
          message: "가입 상태를 다시 불러오지 못했습니다.",
          tone: "danger",
        });
      }
    } catch (error) {
      showAlert({
        title: "가입 처리 실패",
        message: getQueryErrorMessage(error, "가입 처리에 실패했습니다."),
        tone: "danger",
      });
    }
  };

  const handleCancelJoinRequest = async (club: ClubDiscoverSummary) => {
    try {
      await cancelJoinMutation.mutateAsync({ clubId: club.clubId });
    } catch (error) {
      showAlert({
        title: "가입 신청 취소 실패",
        message: getQueryErrorMessage(error, "가입 신청을 취소하지 못했습니다."),
        tone: "danger",
      });
      return;
    }

    try {
      await refreshHomeData();
      showToast(`${club.name} 가입 신청을 취소했습니다.`, "info");
    } catch {
      showAlert({
        title: "화면 갱신 실패",
        message: "가입 상태를 다시 불러오지 못했습니다.",
        tone: "danger",
      });
    }
  };

  const discoverClubs = discoverPayload?.clubs ?? [];
  const discoverTitle = deferredSearchQuery.length > 0 ? "검색 결과" : "추천 클럽";
  const discoverSubtitle =
    deferredSearchQuery.length > 0
      ? `"${deferredSearchQuery}" 검색 결과`
      : discoverPayload?.recommendationLabel ?? "최근 개설된 공개 클럽";

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900 antialiased">
      <AnimatePresence>
        {isSigningOut ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-white/55 backdrop-blur-sm"
              {...overlayFadeMotion(reduceMotion)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
              {...popInMotion(reduceMotion)}
            >
              <div className="semo-panel w-full max-w-sm px-6 py-7 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
                  SIGNING OUT
                </p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight">로그아웃 중입니다.</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  세션을 정리하고 로그인 화면으로 이동합니다.
                </p>
                <div className="mt-5 semo-loading-bar" />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="relative flex min-h-screen w-full flex-col">
        <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-white pb-24 shadow-xl">
          <motion.header
            className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-4 pb-2"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div
              className="flex size-10 shrink-0 items-center overflow-hidden rounded-full ring-2 ring-[var(--primary)]/20"
              title={`${userName} · ${roleLabel}`}
              aria-label={`${userName} ${roleLabel}`}
            >
              <div className="flex size-10 items-center justify-center bg-gradient-to-br from-[var(--primary)] to-blue-600 text-sm font-bold text-white">
                {profileLabel}
              </div>
            </div>
            <h2 className="ml-3 flex-1 text-xl font-bold leading-tight tracking-tight text-slate-900">SEMO</h2>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                aria-label="알림"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <motion.button
                type="button"
                onClick={handleSignOut}
                className="flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                aria-label="로그아웃"
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                animate={
                  isSigningOut && !reduceMotion
                    ? { scale: [1, 0.96, 1], opacity: [1, 0.85, 1] }
                    : undefined
                }
              >
                로그아웃
              </motion.button>
            </div>
          </motion.header>

          <motion.section className="px-4 pb-2" {...staggeredFadeUpMotion(2, reduceMotion)}>
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-[var(--primary)] to-blue-600 p-4 shadow-lg shadow-[var(--primary)]/20">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Create Club</h3>
                <p className="mt-0.5 text-xs text-blue-100">Start your own community today</p>
                <p className="mt-1 text-[10px] font-medium text-blue-100/70">클럽 만들기</p>
              </div>
              <RouterLink
                href="/clubs/create"
                className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-[var(--primary)] shadow-sm transition-transform active:scale-95"
              >
                Get Started
              </RouterLink>
            </div>
          </motion.section>

          <motion.section
            className="flex items-center justify-between px-4 pb-2 pt-4"
            {...staggeredFadeUpMotion(3, reduceMotion)}
          >
            <div className="flex flex-col">
              <h2 className="text-lg font-bold leading-none text-slate-900">My Clubs</h2>
              <span className="mt-1 text-[10px] font-medium text-slate-400">내 클럽</span>
            </div>
            <span className="text-sm font-semibold text-[var(--primary)]">
              {myClubs.length.toLocaleString("ko-KR")}개
            </span>
          </motion.section>

          <motion.section className="px-4 pb-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
            {isLoadingMyClubs ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">내 클럽을 불러오는 중입니다.</p>
                <p className="mt-1 text-xs text-slate-500">가입한 모임을 확인하고 있습니다.</p>
              </div>
            ) : myClubs.length > 0 ? (
              <div className="hide-scrollbar flex overflow-x-auto pb-1">
                <div className="flex items-stretch gap-4">
                  {myClubs.map((club, index) => (
                    <motion.div
                      key={club.clubId}
                      className="min-w-[240px]"
                      {...staggeredFadeUpMotion(index + 4, reduceMotion)}
                    >
                      <RouterLink
                        href={`/clubs/${club.clubId}`}
                        className="flex h-full min-w-[240px] flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 shadow-sm transition-transform hover:-translate-y-0.5"
                      >
                        <div
                          className="aspect-[16/9] w-full rounded-lg bg-slate-200 bg-cover bg-center"
                          style={club.imageUrl ? { backgroundImage: `url("${club.imageUrl}")` } : undefined}
                        >
                          {!club.imageUrl ? (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 to-blue-100 text-[var(--primary)]">
                              <span className="material-symbols-outlined text-4xl">groups</span>
                            </div>
                          ) : null}
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-base font-bold text-slate-900">{club.name}</p>
                            {club.admin ? (
                              <span className="rounded-full bg-[var(--primary)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                                Admin
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">
                            {club.summary ?? club.description ?? "클럽 소개가 아직 없습니다."}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
                            <span className="material-symbols-outlined text-sm text-[var(--primary)]">group</span>
                            <span>{club.roleCode}</span>
                            <span>· {getPrimaryClubActivityLabel(club.activityTags, club.activityCategory, club.categoryKey)}</span>
                            {club.affiliationType ? <span>· {getAffiliationTypeLabel(club.affiliationType)}</span> : null}
                            {club.regionLabel ? <span>· {club.regionLabel}</span> : null}
                          </div>
                        </div>
                      </RouterLink>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">아직 가입한 클럽이 없습니다.</p>
                <p className="mt-1 text-xs text-slate-500">
                  {myClubsError ?? "추천 클럽을 둘러보고 원하는 모임에 가입해 보세요."}
                </p>
              </div>
            )}
          </motion.section>

          <DiscoverSection
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            discoverTitle={discoverTitle}
            discoverSubtitle={discoverSubtitle}
            discoverClubs={discoverClubs}
            isLoadingDiscover={isLoadingDiscover}
            discoverError={discoverError}
            hasSearchQuery={deferredSearchQuery.length > 0}
            pendingJoinClubId={pendingJoinClubId}
            reduceMotion={reduceMotion}
            onOpenClub={handleOpenClubAction}
            onCancelJoinRequest={handleCancelJoinRequest}
          />

          <motion.div
            className="fixed bottom-6 right-[max(1.5rem,calc(50%-180px))] z-20 flex size-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-2xl transition-transform active:scale-90"
            {...staggeredFadeUpMotion(8, reduceMotion)}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          >
            <RouterLink
              href="/clubs/create"
              aria-label="클럽 만들기"
              className="flex size-full items-center justify-center"
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </RouterLink>
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {selectedClub ? (
          <DiscoverClubModal
            club={selectedClub}
            requestMessage={requestMessage}
            isSubmitting={isSubmittingJoinAction}
            onClose={() => {
              setSelectedClub(null);
              setRequestMessage("");
            }}
            onRequestMessageChange={setRequestMessage}
            onSubmit={handleSubmitJoinAction}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
