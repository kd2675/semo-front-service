"use client";

import Image from "next/image";
import { A11y, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { ClubBoardFeedItem } from "@/app/lib/clubs";
import { getLinkedContentBadge, getShareTargetBadges } from "@/app/lib/contentBadge";
import { getTournamentFormatLabel, getTournamentStatusLabel } from "@/app/lib/tournament";
import { getVoteLifecycleLabel } from "@/app/lib/voteStatus";

type PinnedBoardCarouselProps = {
  items: ClubBoardFeedItem[];
  onOpenItem: (item: ClubBoardFeedItem) => void;
};

function getPinnedSurface(useImageBackground: boolean) {
  if (useImageBackground) {
    return {
      cardClassName: "bg-slate-900 text-white border-transparent",
      metaClassName: "text-white/70",
      summaryClassName: "text-white/80",
      avatarSurfaceClassName: "border border-white/20 bg-white/10",
    };
  }

  return {
    cardClassName: "bg-white text-slate-900 border border-slate-100",
    metaClassName: "text-slate-400",
    summaryClassName: "text-slate-500",
    avatarSurfaceClassName: "border border-slate-200 bg-slate-100",
  };
}

function getBoardItemMeta(item: ClubBoardFeedItem) {
  if (item.contentType === "NOTICE" && item.notice) {
    const badge = getLinkedContentBadge(item.notice.linkedTargetType);
    return {
      title: item.notice.title,
      summary: item.notice.summary,
      dateLabel: item.notice.publishedAtLabel,
      typeLabel: badge.label,
      typeBadgeClassName: badge.className,
      shareBadges: getShareTargetBadges({
        postedToBoard: item.notice.postedToBoard,
        postedToCalendar: item.notice.postedToCalendar,
        includeBoard: true,
      }),
      authorDisplayName: item.notice.authorDisplayName,
      authorRoleCode: item.notice.authorRoleCode ?? "공지 작성자",
      avatarUrl: item.notice.authorAvatarThumbnailUrl ?? item.notice.authorAvatarImageUrl,
      imageUrl: item.notice.imageUrl,
    };
  }

  if (item.contentType === "SCHEDULE_EVENT" && item.event) {
    return {
      title: item.event.title,
      summary: [item.event.dateLabel, item.event.timeLabel, item.event.locationLabel].filter(Boolean).join(" · ") || "일정 세부 안내",
      dateLabel: item.event.startDate,
      typeLabel: "일정",
      typeBadgeClassName: "bg-amber-50 text-amber-600",
      shareBadges: getShareTargetBadges({
        postedToBoard: item.event.postedToBoard,
        postedToCalendar: item.event.postedToCalendar,
        includeBoard: true,
      }),
      authorDisplayName: item.event.authorDisplayName,
      authorRoleCode: item.event.participationEnabled ? "참석 응답 가능" : "일정 운영",
      avatarUrl: item.event.authorAvatarThumbnailUrl ?? item.event.authorAvatarImageUrl,
      imageUrl: null,
    };
  }

  if (item.contentType === "SCHEDULE_VOTE" && item.vote) {
    return {
      title: item.vote.title,
      summary: `${item.vote.votePeriodLabel}${item.vote.voteTimeLabel ? ` · ${item.vote.voteTimeLabel}` : ""}`,
      dateLabel: getVoteLifecycleLabel(item.vote.voteStatus),
      typeLabel: "투표",
      typeBadgeClassName: "bg-violet-50 text-violet-600",
      shareBadges: getShareTargetBadges({
        postedToBoard: item.vote.postedToBoard,
        postedToCalendar: item.vote.postedToCalendar,
        includeBoard: true,
      }),
      authorDisplayName: item.vote.authorDisplayName,
      authorRoleCode: item.vote.totalResponses > 0 ? `${item.vote.totalResponses}명 참여` : "응답 대기",
      avatarUrl: item.vote.authorAvatarThumbnailUrl ?? item.vote.authorAvatarImageUrl,
      imageUrl: null,
    };
  }

  if (item.contentType === "TOURNAMENT" && item.tournament) {
    return {
      title: item.tournament.title,
      summary:
        item.tournament.summaryText
        ?? [
          getTournamentFormatLabel(item.tournament.matchFormat),
          item.tournament.tournamentPeriodLabel,
          item.tournament.locationLabel,
        ].filter(Boolean).join(" · "),
      dateLabel: getTournamentStatusLabel(item.tournament.tournamentStatus),
      typeLabel: "대회",
      typeBadgeClassName: "bg-emerald-50 text-emerald-700",
      shareBadges: getShareTargetBadges({
        postedToBoard: item.tournament.postedToBoard,
        postedToCalendar: item.tournament.postedToCalendar,
        includeBoard: true,
      }),
      authorDisplayName: item.tournament.authorDisplayName,
      authorRoleCode: getTournamentFormatLabel(item.tournament.matchFormat),
      avatarUrl: item.tournament.authorAvatarThumbnailUrl ?? item.tournament.authorAvatarImageUrl,
      imageUrl: null,
    };
  }
  return null;
}

export function PinnedBoardCarousel({
  items,
  onOpenItem,
}: PinnedBoardCarouselProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden">
      <Swiper
        modules={[Pagination, A11y]}
        spaceBetween={12}
        slidesPerView={1.08}
        pagination={{ clickable: true }}
        className="[&_.swiper-pagination]:!static [&_.swiper-pagination]:mt-4 [&_.swiper-pagination-bullet]:bg-slate-300 [&_.swiper-pagination-bullet-active]:!bg-[var(--primary)]"
      >
        {items.map((item) => {
          const meta = getBoardItemMeta(item);
          if (!meta) {
            return null;
          }
          const useImageBackground = item.contentType === "NOTICE" && Boolean(meta.imageUrl);
          const surface = getPinnedSurface(useImageBackground);
          return (
            <SwiperSlide key={`${item.contentType}-${item.boardItemId}`}>
              <button
                type="button"
                onClick={() => onOpenItem(item)}
                className={`relative block min-h-[204px] w-full overflow-hidden rounded-[12px] p-5 text-left shadow-sm transition-transform active:scale-[0.985] ${surface.cardClassName}`}
                aria-label={`${meta.title} 자세히 보기`}
              >
                {useImageBackground && meta.imageUrl ? (
                  <>
                    <div className="absolute inset-0">
                      <Image
                        src={meta.imageUrl}
                        alt={meta.title}
                        fill
                        sizes="280px"
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.2)_0%,rgba(15,23,42,0.58)_100%)]" />
                  </>
                ) : null}
                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`${meta.typeBadgeClassName} rounded px-2 py-0.5 text-[11px] font-bold uppercase`}>
                        {meta.typeLabel}
                      </span>
                      <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-600">
                        중요
                      </span>
                      {meta.shareBadges.map((shareBadge) => (
                        <span
                          key={shareBadge.label}
                          className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${shareBadge.className}`}
                        >
                          {shareBadge.label}
                        </span>
                      ))}
                    </div>
                    <span className={`shrink-0 text-[10px] ${surface.metaClassName}`}>{meta.dateLabel}</span>
                  </div>

                  {!useImageBackground && meta.imageUrl ? (
                    <div className="relative mb-4 h-24 overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={meta.imageUrl}
                        alt={meta.title}
                        fill
                        sizes="280px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <h3 className="mb-2 line-clamp-1 text-base font-bold">{meta.title}</h3>
                  <p className={`line-clamp-2 text-xs leading-5 ${surface.summaryClassName}`}>{meta.summary}</p>

                  <div className={`mt-auto flex items-center gap-3 border-t pt-4 ${useImageBackground ? "border-white/15" : "border-slate-100"}`}>
                    {meta.avatarUrl ? (
                      <div className={`relative h-8 w-8 overflow-hidden rounded-full ${surface.avatarSurfaceClassName}`}>
                        <Image
                          src={meta.avatarUrl}
                          alt={meta.authorDisplayName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${useImageBackground ? "text-white" : "text-[var(--primary)]"} ${surface.avatarSurfaceClassName}`}>
                        {meta.authorDisplayName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{meta.authorDisplayName}</p>
                      <p className={`truncate text-[10px] ${surface.metaClassName}`}>{meta.authorRoleCode}</p>
                    </div>
                  </div>
                </div>
              </button>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
