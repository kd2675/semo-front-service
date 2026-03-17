"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useState } from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { getClubNoticeDetail, type ClubNoticeDetailResponse } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { ClubDetailLoadingShell } from "../../ClubRouteLoadingShells";

type ClubNoticeDetailClientProps = {
  clubId: string;
  noticeId: string;
  presentation?: "page" | "modal";
  onRequestClose?: () => void;
};

type NoticeDetailBodyProps = {
  clubId: string;
  payload: ClubNoticeDetailResponse | null;
  error: string | null;
  reduceMotion: boolean;
};

function getLinkedTargetHref(clubId: string, payload: ClubNoticeDetailResponse) {
  if (payload.linkedTargetType === "SCHEDULE_EVENT" && payload.linkedTargetId != null) {
    return `/clubs/${clubId}/schedule/${payload.linkedTargetId}`;
  }
  if (payload.linkedTargetType === "SCHEDULE_VOTE" && payload.linkedTargetId != null) {
    return `/clubs/${clubId}/schedule/votes/${payload.linkedTargetId}`;
  }
  return null;
}

function getLinkedTargetLabel(payload: ClubNoticeDetailResponse) {
  if (payload.linkedTargetType === "SCHEDULE_EVENT") {
    return "연결된 일정 바로 보기";
  }
  if (payload.linkedTargetType === "SCHEDULE_VOTE") {
    return "연결된 투표 바로 보기";
  }
  return null;
}

function NoticeDetailBody({ clubId, payload, error, reduceMotion }: NoticeDetailBodyProps) {
  const linkedTargetHref = payload ? getLinkedTargetHref(clubId, payload) : null;
  const linkedTargetLabel = payload ? getLinkedTargetLabel(payload) : null;

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
              <span className="rounded-full bg-[var(--primary)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                {payload.categoryLabel}
              </span>
              {payload.pinned ? (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Pinned
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{payload.title}</h1>
            <div className="mt-4 space-y-1 text-sm text-slate-500">
              <p>{payload.authorDisplayName}</p>
              <p>Published {payload.publishedAtLabel}</p>
              <p>Updated {payload.updatedAtLabel}</p>
            </div>
          </motion.section>

          {payload.scheduleAtLabel || payload.locationLabel ? (
            <motion.section className="px-4 pt-5" {...staggeredFadeUpMotion(3, reduceMotion)}>
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

          <motion.section className="px-4 py-6" {...staggeredFadeUpMotion(4, reduceMotion)}>
            <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
              {payload.content}
            </div>
          </motion.section>

          {linkedTargetHref && linkedTargetLabel ? (
            <motion.section className="px-4 pb-6" {...staggeredFadeUpMotion(5, reduceMotion)}>
              <RouterLink
                href={linkedTargetHref}
                className="flex items-center justify-between rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/[0.04] px-4 py-4 transition-colors hover:bg-[var(--primary)]/[0.08]"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{linkedTargetLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    공지와 연결된 원본 {payload.linkedTargetType === "SCHEDULE_EVENT" ? "일정" : "투표"} 상세로 이동합니다.
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </RouterLink>
            </motion.section>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export function ClubNoticeDetailClient({
  clubId,
  noticeId,
  presentation = "page",
  onRequestClose,
}: ClubNoticeDetailClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [payload, setPayload] = useState<ClubNoticeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useEffectEvent(async () => {
    setLoading(true);
    setError(null);
    const result = await getClubNoticeDetail(clubId, noticeId);
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "공지 상세를 불러오지 못했습니다.");
      return;
    }
    setPayload(result.data);
  });

  useEffect(() => {
    void loadDetail();
  }, [clubId, noticeId]);

  if (loading && !payload && !error) {
    return <ClubDetailLoadingShell />;
  }

  if (presentation === "modal") {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={onRequestClose}
            className="flex size-10 items-center justify-start text-slate-900"
            aria-label="공지 상세 닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight">Notice</h2>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto pb-8">
          <NoticeDetailBody clubId={clubId} payload={payload} error={error} reduceMotion={reduceMotion} />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <RouterLink
            href={`/clubs/${clubId}/board`}
            className="flex size-10 items-center justify-start text-slate-900"
            aria-label="공지 목록으로 돌아가기"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </RouterLink>
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight">Notice</h2>
          <div className="w-10" />
        </header>

        <main className="flex-1 pb-28">
          <NoticeDetailBody clubId={clubId} payload={payload} error={error} reduceMotion={reduceMotion} />
        </main>

        {payload?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
      </div>
    </div>
  );
}
