"use client";

import Image from "next/image";
import { A11y, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { ClubNoticeListItem } from "@/app/lib/clubs";
import { getLinkedContentBadge } from "@/app/lib/contentBadge";

type PinnedNoticeCarouselProps = {
  notices: ClubNoticeListItem[];
  onOpenNotice: (noticeId: number) => void;
};

function getPinnedSurface(index: number) {
  if (index % 2 === 0) {
    return {
      cardClassName: "bg-slate-900 text-white",
      dateClassName: "text-slate-400",
      summaryClassName: "text-slate-300",
      badgeClassName: "bg-red-500 text-white",
    };
  }

  return {
    cardClassName: "bg-[#135bec] text-white",
    dateClassName: "text-blue-100",
    summaryClassName: "text-blue-100",
    badgeClassName: "bg-white/20 text-white",
  };
}

export function PinnedNoticeCarousel({
  notices,
  onOpenNotice,
}: PinnedNoticeCarouselProps) {
  if (notices.length === 0) {
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
        {notices.map((notice, index) => {
          const surface = getPinnedSurface(index);
          const badge = getLinkedContentBadge(notice.linkedTargetType);

          return (
            <SwiperSlide key={notice.noticeId}>
              <button
                type="button"
                onClick={() => onOpenNotice(notice.noticeId)}
                className={`block min-h-[192px] w-full overflow-hidden rounded-[12px] p-5 text-left shadow-md transition-transform active:scale-[0.985] ${surface.cardClassName}`}
                aria-label={`${notice.title} 자세히 보기`}
              >
                <div className="flex h-full flex-col">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {notice.pinned ? (
                        <span className={surface.badgeClassName + " rounded px-2 py-0.5 text-[10px] font-bold"}>
                          중요
                        </span>
                      ) : null}
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className={`shrink-0 text-[10px] ${surface.dateClassName}`}>{notice.publishedAtLabel}</span>
                  </div>

                  {notice.imageUrl ? (
                    <div className="relative mb-4 h-24 overflow-hidden rounded-xl bg-white/10">
                      <Image
                        src={notice.imageUrl}
                        alt={notice.title}
                        fill
                        sizes="280px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <h3 className="mb-2 line-clamp-1 text-base font-bold">{notice.title}</h3>
                  <p className={`line-clamp-2 text-xs leading-5 ${surface.summaryClassName}`}>{notice.summary}</p>

                  <div className="mt-auto flex items-center gap-3 pt-4">
                    {notice.authorAvatarThumbnailUrl ?? notice.authorAvatarImageUrl ? (
                      <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20 bg-white/10">
                        <Image
                          src={notice.authorAvatarThumbnailUrl ?? notice.authorAvatarImageUrl ?? ""}
                          alt={notice.authorDisplayName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-bold">
                        {notice.authorDisplayName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{notice.authorDisplayName}</p>
                      <p className={`truncate text-[10px] ${surface.dateClassName}`}>
                        {notice.authorRoleCode ?? "공지 작성자"}
                      </p>
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
