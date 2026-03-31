"use client";

import Image from "next/image";
import { RouteModal } from "@/app/components/RouteModal";
import type { ItemReadMember } from "@/app/lib/clubs";

type ItemReadStatusModalProps = {
  title: string;
  readCount: number | null;
  readers: ItemReadMember[];
  onClose: () => void;
};

export function ItemReadStatusModal({
  title,
  readCount,
  readers,
  onClose,
}: ItemReadStatusModalProps) {
  return (
    <RouteModal
      onDismiss={onClose}
      contentClassName="max-w-[30rem] rounded-[2rem] sm:rounded-[2rem]"
    >
      <div className="bg-white px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Read Status</p>
            <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              읽은 사람 기준으로 집계합니다. 같은 사람이 여러 번 열어도 1명으로 유지됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="읽음 현황 닫기"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">읽은 사람</h4>
            {readCount != null ? (
              <span className="text-xs font-medium text-slate-500">{readCount}명 확인</span>
            ) : null}
          </div>

          {readers.length > 0 ? (
            <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
              {readers.map((reader) => {
                const avatarUrl = reader.avatarThumbnailUrl ?? reader.avatarImageUrl;
                return (
                  <div
                    key={`${reader.clubProfileId}-${reader.lastReadAtLabel}`}
                    className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3"
                  >
                    {avatarUrl ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                        <Image
                          src={avatarUrl}
                          alt={reader.displayName}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)]">
                        {reader.displayName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{reader.displayName}</p>
                      <p className="truncate text-xs text-slate-500">
                        {reader.roleCode ?? "멤버"}
                        {" · "}
                        {reader.lastReadAtLabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500">
              아직 읽은 사람이 없습니다.
            </div>
          )}
        </div>
      </div>
    </RouteModal>
  );
}
