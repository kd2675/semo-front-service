"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { DiscoverClubModal } from "@/app/home/DiscoverClubModal";
import { DiscoverSection } from "@/app/home/DiscoverSection";
import { ClubGrowthCoreMark } from "@/app/components/ClubGrowthCoreMark";
import { RouterLink } from "@/app/components/RouterLink";
import { SemoBrandMark } from "@/app/components/SemoBrandMark";
import { useAppToast } from "@/app/hooks/useAppToast";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useDeferredValue,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/lib/auth";
import { normalizeRole } from "@/app/lib/authPolicy";
import {
  getAffiliationTypeLabel,
  getPrimaryClubActivityLabel,
} from "@/app/lib/clubClassification";
import {
  type ClubDiscoverSummary,
} from "@/app/lib/clubs";
import { overlayFadeMotion, popInMotion, staggeredFadeUpMotion } from "@/app/lib/motion";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { getClubRoleLabel } from "@/app/lib/roleLabels";
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
      // The auth helper clears the local session even if the server request fails.
    } finally {
      router.replace("/login");
    }
  };

  const normalizedRole = normalizeRole(user?.role);
  const roleLabel = normalizedRole === "ADMIN"
    ? "플랫폼 관리자"
    : normalizedRole === "USER"
      ? "사용자"
      : "게스트";
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
  const discoverTitle = deferredSearchQuery.length > 0 ? "검색 결과" : "추천 모임";
  const discoverSubtitle =
    deferredSearchQuery.length > 0
      ? `"${deferredSearchQuery}" 검색 결과`
      : discoverPayload?.recommendationLabel ?? "최근 개설된 공개 모임";

  return (
    <div className="semo-user-theme semo-app-shell font-display antialiased">
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
                  로그아웃 처리
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
        <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-x-hidden pb-28">
          <motion.header
            className="semo-sticky-surface sticky top-0 z-20 flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="flex min-w-0 items-center gap-3">
              <SemoBrandMark className="size-11 shrink-0 text-[var(--primary)]" label="SEMO" />
              <div className="min-w-0">
                <h1 className="text-xl font-black leading-tight tracking-tight text-slate-950">SEMO</h1>
                <p className="truncate text-xs font-semibold text-slate-500">모임의 운영과 기록을 이어가는 공간</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white ring-2 ring-[var(--primary)]/15"
                title={`${userName} · ${roleLabel}`}
                aria-label={`${userName} ${roleLabel}`}
              >
                {profileLabel}
              </div>
              <motion.button
                type="button"
                onClick={handleSignOut}
                className="flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
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

          <motion.section className="px-4 pb-2 pt-6 sm:px-6" {...staggeredFadeUpMotion(2, reduceMotion)}>
            <div className="relative flex flex-col items-start gap-4 overflow-hidden rounded-[var(--radius-card)] bg-slate-950 p-5 text-white shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
              <SemoBrandMark className="pointer-events-none absolute -right-3 -top-7 size-28 text-white opacity-[0.08]" />
              <div className="flex-1">
                <p className="text-xs font-bold tracking-[0.18em] text-blue-200">NEW SEMO</p>
                <h2 className="mt-1 text-lg font-black text-white">새 모임의 첫 세모 만들기</h2>
                <p className="mt-1 text-sm leading-5 text-slate-300">모임이 만들어지는 순간 작은 세모와 원석 코어가 함께 시작됩니다.</p>
              </div>
              <RouterLink
                href="/clubs/create"
                className="relative inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-white px-4 text-sm font-black text-slate-950 shadow-sm transition-transform active:scale-95 sm:ml-4 sm:w-auto"
              >
                시작하기
              </RouterLink>
            </div>
          </motion.section>

          <motion.section
            className="flex items-center justify-between px-4 pb-2 pt-6 sm:px-6"
            {...staggeredFadeUpMotion(3, reduceMotion)}
          >
            <div className="flex flex-col">
              <h2 className="text-lg font-black leading-none text-slate-900">내 모임</h2>
              <span className="mt-1 text-xs font-medium text-slate-500">참여 중인 모임과 현재 세모</span>
            </div>
            <span className="text-sm font-semibold text-[var(--primary)]">
              {myClubs.length.toLocaleString("ko-KR")}개
            </span>
          </motion.section>

          <motion.section className="px-4 pb-4 sm:px-6" {...staggeredFadeUpMotion(4, reduceMotion)}>
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
                        className="semo-card semo-card-interactive flex h-full min-w-[240px] flex-col gap-3 p-3 sm:min-w-[280px]"
                      >
                        <div
                          className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-200 bg-cover bg-center"
                          style={club.imageUrl ? { backgroundImage: `url("${club.imageUrl}")` } : undefined}
                        >
                          {!club.imageUrl ? (
                            <div className="flex h-full w-full items-center justify-center bg-[var(--primary)]/8 text-[var(--primary)]">
                              <SemoBrandMark className="size-16 opacity-55" />
                            </div>
                          ) : null}
                          <div className="absolute bottom-2 right-2 flex size-16 items-center justify-center rounded-xl border border-white/80 bg-white/90 shadow-md backdrop-blur-sm">
                            <ClubGrowthCoreMark growthCore={club.growthCore} size={60} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-base font-bold text-slate-900">{club.name}</p>
                            {club.admin ? (
                              <span className="rounded-full bg-[var(--primary)]/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                                관리자
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">
                            {club.summary ?? club.description ?? "모임 소개가 아직 없습니다."}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
                            <span className="material-symbols-outlined text-sm text-[var(--primary)]" aria-hidden="true">group</span>
                            <span>{getClubRoleLabel(club.roleCode)}</span>
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
                <p className="text-sm font-semibold text-slate-700">아직 참여 중인 모임이 없습니다.</p>
                <p className="mt-1 text-xs text-slate-500">
                  {myClubsError ?? "공개 모임을 둘러보고 원하는 모임에 참여해 보세요."}
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
            className="fixed bottom-6 right-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] z-20 flex size-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-floating)] transition-transform active:scale-90"
            {...staggeredFadeUpMotion(8, reduceMotion)}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          >
            <RouterLink
              href="/clubs/create"
              aria-label="새 모임 만들기"
              className="flex size-full items-center justify-center"
            >
              <span className="material-symbols-outlined text-3xl" aria-hidden="true">add</span>
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
