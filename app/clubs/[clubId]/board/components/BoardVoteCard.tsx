"use client";

import Image from "next/image";

import { AnimatePresence, motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import type { ClubScheduleVoteSummary } from "@/app/lib/clubs";
import { getShareTargetBadges } from "@/app/lib/contentBadge";
import { getVoteLifecycleLabel } from "@/app/lib/voteStatus";

function BoardAuthorMeta({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatarUrl ? (
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-100">
          <Image src={avatarUrl} alt={name} fill sizes="32px" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
          {name.slice(0, 1)}
        </div>
      )}
      <p className="min-w-0 truncate text-sm font-semibold text-slate-600">{name}</p>
    </div>
  );
}
export function BoardVoteCard({
  vote,
  readCount,
  canEdit,
  canDelete,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
  onOpenReadStatus,
}: {
  vote: ClubScheduleVoteSummary;
  readCount: number;
  canEdit: boolean;
  canDelete: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenReadStatus?: () => void;
}) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const manageable = canEdit || canDelete;
  const shareBadges = getShareTargetBadges({
    postedToBoard: vote.postedToBoard,
    postedToCalendar: vote.postedToCalendar,
    includeBoard: true,
  });

  return (
    <div className="semo-card relative overflow-visible">
      <article className="px-4 py-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-violet-50 px-2 py-0.5 text-xs font-bold uppercase text-violet-600">투표</span>
            {vote.pinned ? (
              <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-bold uppercase text-rose-600">고정</span>
            ) : null}
            {shareBadges.map((shareBadge) => (
              <span
                key={shareBadge.label}
                className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${shareBadge.className}`}
              >
                {shareBadge.label}
              </span>
            ))}
          </div>
          <span className="shrink-0 text-xs text-slate-400">{getVoteLifecycleLabel(vote.voteStatus)}</span>
        </div>
        <h2 className="mb-2 line-clamp-1 text-base font-bold text-slate-900">{vote.title}</h2>
        <p className="line-clamp-2 text-sm leading-6 text-slate-500">
          {vote.votePeriodLabel}
          {vote.voteTimeLabel ? ` · ${vote.voteTimeLabel}` : ""}
          {vote.totalResponses > 0 ? ` · ${vote.totalResponses}명 참여` : ""}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <BoardAuthorMeta
              name={vote.authorDisplayName}
              avatarUrl={vote.authorAvatarThumbnailUrl ?? vote.authorAvatarImageUrl}
            />
            {onOpenReadStatus ? (
              <button
                type="button"
                onClick={(targetEvent) => {
                  targetEvent.stopPropagation();
                  onOpenReadStatus();
                }}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">visibility</span>
                읽음 {readCount}명
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpen}
              className="semo-icon-control text-[var(--primary)] transition hover:bg-[var(--primary)]/8"
              aria-label={`${vote.title} 투표 자세히 보기`}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
            </button>
            {manageable ? (
              <div className="relative">
              <button
                type="button"
                aria-label={`${vote.title} 관리 메뉴`}
                onClick={(targetEvent) => {
                  targetEvent.stopPropagation();
                  onOpenChange(!open);
                }}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">more_horiz</span>
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={false}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: reduceMotion ? 0.1 : 0.16, ease: "easeOut" }}
                    className="absolute right-0 top-10 z-30 w-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
                  >
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={(targetEvent) => {
                          targetEvent.stopPropagation();
                          onOpenChange(false);
                          onEdit();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                        수정
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={(targetEvent) => {
                          targetEvent.stopPropagation();
                          onOpenChange(false);
                          onDelete();
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 ${
                          canEdit ? "border-t border-slate-100" : ""
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                        삭제
                      </button>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}
