"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { motion, useReducedMotion } from "motion/react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { type ClubNoticeDetailResponse } from "@/app/lib/clubs";
import { getLinkedContentBadge, getShareTargetBadges } from "@/app/lib/contentBadge";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { noticeDetailQueryOptions } from "@/app/lib/react-query/board/queries";
import { ClubDetailLoadingShell } from "../../ClubRouteLoadingShells";

type ClubNoticeDetailClientProps = {
  clubId: string;
  noticeId: string;
  presentation?: "page" | "modal";
  basePath?: string;
  onRequestClose?: () => void;
};

type NoticeDetailBodyProps = {
  payload: ClubNoticeDetailResponse | null;
  error: string | null;
  reduceMotion: boolean;
};
function NoticeDetailBody({ payload, error, reduceMotion }: NoticeDetailBodyProps) {
  const badge = getLinkedContentBadge(payload?.linkedTargetType);
  const shareBadges = getShareTargetBadges({
    postedToBoard: payload?.postedToBoard,
    postedToCalendar: payload?.postedToCalendar,
  });

  return (
    <>
      {error ? (
        <motion.div
          className="mx-4 mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
          {...staggeredFadeUpMotion(1, reduceMotion)}
        >
          {error}
        </motion.div>
      ) : null}

      {payload ? (
        <>
          <motion.section
            className="border-b border-slate-100 px-4 py-6"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}>
                {badge.label}
              </span>
              {payload.pinned ? (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  핀 고정
                </span>
              ) : null}
              {shareBadges.map((shareBadge) => (
                <span
                  key={shareBadge.label}
                  className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${shareBadge.className}`}
                >
                  {shareBadge.label}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{payload.title}</h1>
            <div className="mt-4 space-y-1 text-sm text-slate-500">
              <p>{payload.authorDisplayName}</p>
              <p>Published {payload.publishedAtLabel}</p>
              <p>Updated {payload.updatedAtLabel}</p>
            </div>
          </motion.section>

          {payload.imageUrl ? (
            <motion.section className="px-4 pt-5" {...staggeredFadeUpMotion(3, reduceMotion)}>
              <div className="overflow-hidden rounded-[1.4rem] border border-slate-100 bg-white shadow-sm">
                <div className="relative h-60 w-full">
                  <Image
                    src={payload.imageUrl}
                    alt={payload.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-cover"
                  />
                </div>
              </div>
            </motion.section>
          ) : null}

          {payload.scheduleAtLabel || payload.locationLabel ? (
            <motion.section className="px-4 pt-5" {...staggeredFadeUpMotion(4, reduceMotion)}>
              <div className="rounded-2xl bg-[var(--primary)]/5 px-4 py-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  Scheduled
                </div>
                {payload.scheduleAtLabel ? (
                  <p className="text-sm text-slate-700">
                    {payload.scheduleAtLabel}
                    {payload.scheduleEndAtLabel ? ` - ${payload.scheduleEndAtLabel}` : ""}
                  </p>
                ) : null}
                {payload.locationLabel ? (
                  <p className="mt-1 text-sm text-slate-600">{payload.locationLabel}</p>
                ) : null}
              </div>
            </motion.section>
          ) : null}

          <motion.section className="px-4 py-6" {...staggeredFadeUpMotion(5, reduceMotion)}>
            <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
              {payload.content}
            </div>
          </motion.section>
        </>
      ) : null}
    </>
  );
}

export function ClubNoticeDetailClient({
  clubId,
  noticeId,
  presentation = "page",
  basePath,
  onRequestClose,
}: ClubNoticeDetailClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const {
    data: queryPayload,
    isPending: loading,
    error: queryError,
  } = useQuery(noticeDetailQueryOptions(clubId, noticeId));
  const error = queryError
    ? getQueryErrorMessage(queryError, "공지 상세를 불러오지 못했습니다.")
    : null;
  const payload = queryPayload ?? null;

  if (loading && !payload && !error) {
    return <ClubDetailLoadingShell />;
  }

  if (presentation === "modal") {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <ClubPageHeader
          title="공지 상세"
          subtitle={payload?.clubName}
          icon="campaign"
          containerClassName="max-w-md"
          leftSlot={
            <button
              type="button"
              onClick={onRequestClose}
              className="flex size-10 items-center justify-start text-slate-900"
              aria-label="공지 상세 닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          }
        />

        <main className="semo-nav-bottom-space flex-1 overflow-y-auto">
          <NoticeDetailBody payload={payload} error={error} reduceMotion={reduceMotion} />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-full max-w-md flex-col bg-white">
        <ClubPageHeader
          title="공지 상세"
          subtitle={payload?.clubName}
          icon="campaign"
          containerClassName="max-w-md"
          leftSlot={
            <RouterLink
              href={basePath ?? `/clubs/${clubId}/more/notices`}
              className="flex size-10 items-center justify-start text-slate-900"
              aria-label="공지 목록으로 돌아가기"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </RouterLink>
          }
        />

        <main className="semo-nav-bottom-space flex-1">
          <NoticeDetailBody payload={payload} error={error} reduceMotion={reduceMotion} />
        </main>

        {payload?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
      </div>
    </div>
  );
}
