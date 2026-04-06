"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { AppAlertModal } from "@/app/components/AppAlertModal";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { RouteModal } from "@/app/components/RouteModal";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { clearAccessToken, getUserFromToken, logout, normalizeRole } from "@/app/lib/auth";
import { onAuthChanged } from "@/app/lib/authEvents";
import {
  getActivityCategoryLabel,
  getAffiliationTypeLabel,
  getPrimaryClubActivityLabel,
} from "@/app/lib/club-classification";
import {
  cancelClubJoinRequest,
  getDiscoverClubs,
  getMyClubs,
  submitClubJoinRequest,
  type ClubDiscoverResponse,
  type ClubDiscoverSummary,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { overlayFadeMotion, popInMotion, staggeredFadeUpMotion } from "@/app/lib/motion";
import type { AuthUser } from "@/app/types/auth";
import { useAppAlert } from "@/app/hooks/useAppAlert";

function createProfileLabel(user: AuthUser | null): string {
  const source = user?.username?.trim();
  if (!source) {
    return "S";
  }

  return source.slice(0, 1).toUpperCase();
}

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

function DiscoverClubModal({
  club,
  requestMessage,
  isSubmitting,
  onClose,
  onRequestMessageChange,
  onSubmit,
}: {
  club: ClubDiscoverSummary;
  requestMessage: string;
  isSubmitting: boolean;
  onClose: () => void;
  onRequestMessageChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}) {
  const actionLabel = getJoinActionLabel(club);
  const showRequestMessage = club.membershipPolicy === "APPROVAL";

  return (
    <RouteModal onDismiss={onClose} contentClassName="max-w-[30rem] rounded-[2rem] sm:rounded-[2rem]">
      <div className="overflow-y-auto bg-white px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">{club.name}</h3>
              {club.recommendedByTags || club.recommendedByCategory ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600">
                  추천
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {club.description ?? club.summary ?? "클럽 소개가 아직 없습니다."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"
            aria-label="가입 신청 모달 닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">CATEGORY</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {getPrimaryClubActivityLabel(club.activityTags, club.activityCategory, club.categoryKey)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">TYPE</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {[
                getActivityCategoryLabel(club.activityCategory),
                getAffiliationTypeLabel(club.affiliationType),
              ]
                .filter(Boolean)
                .join(" · ") || "기타 · 독립"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">JOIN RULE</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{getMembershipPolicyLabel(club.membershipPolicy)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">VISIBILITY</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {club.visibilityStatus === "PUBLIC" ? "공개 클럽" : "비공개 클럽"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">MEMBERS</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{club.activeMemberCount.toLocaleString("ko-KR")}명</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">REGION</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{club.regionLabel ?? "전국"}</p>
          </div>
        </div>

        {showRequestMessage ? (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-900">가입 메시지</label>
            <textarea
              value={requestMessage}
              onChange={(event) => onRequestMessageChange(event.target.value)}
              placeholder="모임에 관심 있는 이유나 활동 계획을 남겨 주세요."
              className="form-input min-h-28 w-full resize-none rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--primary)]/40"
            />
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isSubmitting ? "처리 중..." : actionLabel}
          </button>
        </div>
      </div>
    </RouteModal>
  );
}

export default function Home() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [user, setUser] = useState<AuthUser | null>(() => getUserFromToken());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [myClubs, setMyClubs] = useState<MyClubSummary[]>([]);
  const [isLoadingMyClubs, setIsLoadingMyClubs] = useState(true);
  const [myClubsError, setMyClubsError] = useState<string | null>(null);
  const [discoverPayload, setDiscoverPayload] = useState<ClubDiscoverResponse | null>(null);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(true);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<ClubDiscoverSummary | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmittingJoinAction, setIsSubmittingJoinAction] = useState(false);
  const [pendingJoinClubId, setPendingJoinClubId] = useState<number | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const { alertState, showAlert, closeAlert } = useAppAlert();
  const { toast, showToast } = useEphemeralToast();

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

  const refreshHomeData = async (query: string) => {
    const [myClubsResult, discoverResult] = await Promise.all([
      getMyClubs(),
      getDiscoverClubs(query),
    ]);

    if (!myClubsResult.ok || !myClubsResult.data) {
      setMyClubs([]);
      setMyClubsError(myClubsResult.message ?? "내 클럽을 불러오지 못했습니다.");
    } else {
      setMyClubsError(null);
      setMyClubs(myClubsResult.data);
    }

    if (!discoverResult.ok || !discoverResult.data) {
      setDiscoverPayload(null);
      setDiscoverError(discoverResult.message ?? "클럽 탐색 목록을 불러오지 못했습니다.");
      throw new Error(discoverResult.message ?? "클럽 탐색 목록을 불러오지 못했습니다.");
    }

    setDiscoverError(null);
    setDiscoverPayload(discoverResult.data);
  };

  useEffect(() => {
    const unsubscribe = onAuthChanged(() => {
      setUser(getUserFromToken());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoadingMyClubs(true);
      setMyClubsError(null);
      const result = await getMyClubs();
      if (cancelled) {
        return;
      }
      if (!result.ok || !result.data) {
        setMyClubs([]);
        setMyClubsError(result.message ?? "내 클럽을 불러오지 못했습니다.");
        setIsLoadingMyClubs(false);
        return;
      }

      setMyClubs(result.data);
      setIsLoadingMyClubs(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoadingDiscover(true);
      setDiscoverError(null);
      const result = await getDiscoverClubs(deferredSearchQuery);
      if (cancelled) {
        return;
      }
      if (!result.ok || !result.data) {
        setDiscoverPayload(null);
        setDiscoverError(result.message ?? "클럽 탐색 목록을 불러오지 못했습니다.");
        setIsLoadingDiscover(false);
        return;
      }

      setDiscoverPayload(result.data);
      setIsLoadingDiscover(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [deferredSearchQuery]);

  const handleOpenClubAction = (club: ClubDiscoverSummary) => {
    setSelectedClub(club);
    setRequestMessage("");
  };

  const handleSubmitJoinAction = async () => {
    if (!selectedClub) {
      return;
    }

    setIsSubmittingJoinAction(true);
    const result = await submitClubJoinRequest(selectedClub.clubId, {
      requestMessage:
        selectedClub.membershipPolicy === "APPROVAL" ? requestMessage.trim() || null : null,
    });
    setIsSubmittingJoinAction(false);

    if (!result.ok || !result.data) {
      showAlert({
        title: "가입 처리 실패",
        message: result.message ?? "가입 처리에 실패했습니다.",
        tone: "danger",
      });
      return;
    }

    setSelectedClub(null);
    setRequestMessage("");

    try {
      await refreshHomeData(deferredSearchQuery);
      showToast(
        result.data.actionType === "JOINED"
          ? `${selectedClub.name}에 가입했습니다.`
          : `${selectedClub.name} 가입 신청을 보냈습니다.`,
      );
    } catch {
      showAlert({
        title: "화면 갱신 실패",
        message: "가입 상태를 다시 불러오지 못했습니다.",
        tone: "danger",
      });
    }
  };

  const handleCancelJoinRequest = async (club: ClubDiscoverSummary) => {
    setPendingJoinClubId(club.clubId);
    const result = await cancelClubJoinRequest(club.clubId);
    setPendingJoinClubId(null);

    if (!result.ok || !result.data) {
      showAlert({
        title: "가입 신청 취소 실패",
        message: result.message ?? "가입 신청을 취소하지 못했습니다.",
        tone: "danger",
      });
      return;
    }

    try {
      await refreshHomeData(deferredSearchQuery);
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
                    startTransition(() => setSearchQuery(nextValue));
                  }}
                />
              </div>
            </label>
          </motion.div>

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
                        onClick={() => handleOpenClubAction(club)}
                        className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        소개 보기
                      </button>
                      {club.joinStatus === "PENDING" ? (
                        <button
                          type="button"
                          disabled={pendingJoinClubId === club.clubId}
                          onClick={() => void handleCancelJoinRequest(club)}
                          className="rounded-xl bg-[var(--secondary)]/10 px-4 py-2 text-sm font-bold text-[var(--secondary)] transition-colors hover:bg-[var(--secondary)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {pendingJoinClubId === club.clubId ? "처리 중..." : "신청 취소"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenClubAction(club)}
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
                  {deferredSearchQuery.length > 0
                    ? "검색어를 바꾸거나 다른 키워드로 다시 찾아보세요."
                    : "새 클럽이 등록되면 이 영역에 추천이 표시됩니다."}
                </p>
              </motion.div>
            )}
          </section>

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
      <EphemeralToast toastId={toast?.id ?? null} message={toast?.message ?? null} tone={toast?.tone} />
      <AppAlertModal
        open={alertState.open}
        title={alertState.title}
        message={alertState.message}
        tone={alertState.tone}
        confirmLabel={alertState.confirmLabel}
        onClose={closeAlert}
      />
    </div>
  );
}
