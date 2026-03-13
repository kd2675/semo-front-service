"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import {
  deleteClubScheduleEvent,
  getClubScheduleEventDetail,
  type ClubScheduleEventDetailResponse,
} from "@/app/lib/clubs";

type ClubScheduleDetailClientProps = {
  clubId: string;
  eventId: string;
};

export function ClubScheduleDetailClient({ clubId, eventId }: ClubScheduleDetailClientProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<ClubScheduleEventDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useEffectEvent(async () => {
    setLoading(true);
    setError(null);
    const result = await getClubScheduleEventDetail(clubId, eventId);
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "일정 상세를 불러오지 못했습니다.");
      return;
    }
    setPayload(result.data);
  });

  useEffect(() => {
    void loadDetail();
  }, [clubId, eventId]);

  const handleDelete = async () => {
    if (!window.confirm("이 일정을 삭제하시겠습니까?")) {
      return;
    }
    setDeleting(true);
    const result = await deleteClubScheduleEvent(clubId, eventId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message ?? "일정 삭제에 실패했습니다.");
      return;
    }
    router.replace(`/clubs/${clubId}/schedule`);
  };

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <Link
            href={`/clubs/${clubId}/schedule`}
            className="flex size-10 items-center justify-start text-slate-900"
            aria-label="일정 목록으로 돌아가기"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight">Schedule</h2>
          <div className="flex w-10 items-center justify-end">
            {payload?.canManage ? (
              <Link
                href={`/clubs/${clubId}/schedule/${eventId}/edit`}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"
                aria-label="일정 수정"
              >
                <span className="material-symbols-outlined">edit</span>
              </Link>
            ) : null}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-28">
          {loading ? (
            <div className="flex justify-center p-10 text-sm font-medium text-slate-500">Loading schedule...</div>
          ) : null}

          {error ? (
            <div className="mx-4 mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          {payload ? (
            <>
              <section className="border-b border-slate-100 px-4 py-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--primary)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                    {payload.categoryKey}
                  </span>
                  {payload.postedToBoard ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Posted to Board
                    </span>
                  ) : null}
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{payload.title}</h1>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>{payload.startAtLabel}{payload.endAtLabel ? ` - ${payload.endAtLabel}` : ""}</p>
                  {payload.locationLabel ? <p>{payload.locationLabel}</p> : null}
                </div>
              </section>

              {payload.description ? (
                <section className="px-4 py-6">
                  <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                    {payload.description}
                  </div>
                </section>
              ) : null}

              {payload.linkedNoticeId ? (
                <section className="px-4 pb-4">
                  <Link
                    href={`/clubs/${clubId}/board/${payload.linkedNoticeId}`}
                    className="flex items-center justify-between rounded-2xl bg-[var(--primary)]/5 px-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-[var(--primary)]">공지에도 게시됨</p>
                      <p className="mt-1 text-xs text-slate-600">공지 상세에서 함께 확인할 수 있습니다.</p>
                    </div>
                    <span className="material-symbols-outlined text-[var(--primary)]">chevron_right</span>
                  </Link>
                </section>
              ) : null}

              {payload.canManage ? (
                <section className="px-4 pb-8">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete Schedule"}
                  </button>
                </section>
              ) : null}
            </>
          ) : null}
        </main>

        {payload?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <ClubBottomNav clubId={clubId} isAdmin={payload?.admin ?? false} />
      </div>
    </div>
  );
}
