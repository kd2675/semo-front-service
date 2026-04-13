"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ClubScheduleEventSummary } from "@/app/lib/clubs";
import { getShareTargetBadges } from "@/app/lib/contentBadge";

type BoardScheduleManageCardProps = {
  event: ClubScheduleEventSummary;
  readCount?: number;
  canEdit: boolean;
  canDelete: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenReadStatus?: () => void;
  showBoardShareBadge?: boolean;
};

function getEventSecondaryText(event: ClubScheduleEventSummary) {
  const parts = [event.dateLabel, event.timeLabel, event.locationLabel].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "세부 안내 없음";
}

function getEventVisual(event: ClubScheduleEventSummary) {
  if (event.feeRequired) {
    return {
      icon: "paid",
      iconClassName: "text-amber-500",
      iconSurfaceClassName: "bg-amber-500/10",
    };
  }
  if (event.locationLabel) {
    return {
      icon: "event",
      iconClassName: "text-[var(--primary)]",
      iconSurfaceClassName: "bg-[var(--primary)]/10",
    };
  }
  return {
    icon: "calendar_month",
    iconClassName: "text-slate-500",
    iconSurfaceClassName: "bg-slate-100",
  };
}

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

export function BoardScheduleManageCard({
  event,
  readCount = 0,
  canEdit,
  canDelete,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
  onOpenReadStatus,
  showBoardShareBadge = false,
}: BoardScheduleManageCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const visual = getEventVisual(event);
  const manageable = canEdit || canDelete;
  const shareBadges = getShareTargetBadges({
    postedToBoard: event.postedToBoard,
    postedToCalendar: event.postedToCalendar,
    includeBoard: showBoardShareBadge,
  });

  return (
    <div className="relative overflow-visible rounded-[8px] border border-slate-100 bg-white shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(eventKey) => {
          if (eventKey.key === "Enter" || eventKey.key === " ") {
            eventKey.preventDefault();
            onOpen();
          }
        }}
        className="block cursor-pointer px-4 py-4 text-left transition hover:bg-slate-50"
        aria-label={`${event.title} 일정 자세히 보기`}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${visual.iconSurfaceClassName} ${visual.iconClassName}`}
            >
              <span className="material-symbols-outlined">{visual.icon}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-600">일정</span>
              {event.pinned ? (
                <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-600">고정</span>
              ) : null}
              {shareBadges.map((shareBadge) => (
                <span
                  key={shareBadge.label}
                  className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${shareBadge.className}`}
                >
                  {shareBadge.label}
                </span>
              ))}
            </div>
          </div>
          <span className="shrink-0 text-xs text-slate-400">{event.timeLabel ?? event.dateLabel}</span>
        </div>
        <h2 className="mb-2 line-clamp-1 text-base font-bold text-slate-900">{event.title}</h2>
        <p className="line-clamp-2 text-sm leading-6 text-slate-500">{getEventSecondaryText(event)}</p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <BoardAuthorMeta
              name={event.authorDisplayName}
              avatarUrl={event.authorAvatarThumbnailUrl ?? event.authorAvatarImageUrl}
            />
            {onOpenReadStatus ? (
              <button
                type="button"
                onClick={(targetEvent) => {
                  targetEvent.stopPropagation();
                  onOpenReadStatus();
                }}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                읽음 {readCount}명
              </button>
            ) : null}
          </div>
          {manageable ? (
            <div className="relative">
              <button
                type="button"
                aria-label={`${event.title} 관리 메뉴`}
                onClick={(targetEvent) => {
                  targetEvent.stopPropagation();
                  onOpenChange(!open);
                }}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
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
                        <span className="material-symbols-outlined text-[18px]">edit</span>
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
                        <span className="material-symbols-outlined text-[18px]">delete</span>
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
    </div>
  );
}
