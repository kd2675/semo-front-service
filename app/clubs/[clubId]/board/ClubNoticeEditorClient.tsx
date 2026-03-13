"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import {
  createClubNotice,
  getClubNoticeDetail,
  updateClubNotice,
  type ClubNoticeDetailResponse,
} from "@/app/lib/clubs";

type ClubNoticeEditorClientProps = {
  clubId: string;
  noticeId?: string;
  presentation?: "page" | "modal";
  initialScheduleAt?: string;
  initialScheduleEndAt?: string;
  onRequestClose?: () => void;
};

const CATEGORY_OPTIONS = [
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "TOURNAMENT", label: "Tournament" },
  { value: "MATCH", label: "Match" },
  { value: "SOCIAL", label: "Social" },
];

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  return value.slice(0, 16);
}

export function ClubNoticeEditorClient({
  clubId,
  noticeId,
  presentation = "page",
  initialScheduleAt,
  initialScheduleEndAt,
  onRequestClose,
}: ClubNoticeEditorClientProps) {
  const router = useRouter();
  const isEdit = Boolean(noticeId);
  const isModal = presentation === "modal";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryKey, setCategoryKey] = useState("ANNOUNCEMENT");
  const [locationLabel, setLocationLabel] = useState("");
  const [scheduleAt, setScheduleAt] = useState(initialScheduleAt ?? "");
  const [scheduleEndAt, setScheduleEndAt] = useState(initialScheduleEndAt ?? "");
  const [postToSchedule, setPostToSchedule] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [clubName, setClubName] = useState("Notice");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backHref = isEdit && noticeId ? `/clubs/${clubId}/board/${noticeId}` : `/clubs/${clubId}/board`;

  const loadDetail = useEffectEvent(async () => {
    if (!noticeId) {
      return;
    }
    setLoading(true);
    const result = await getClubNoticeDetail(clubId, noticeId);
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "공지 정보를 불러오지 못했습니다.");
      return;
    }
    const payload: ClubNoticeDetailResponse = result.data;
    setClubName(payload.clubName);
    setTitle(payload.title);
    setContent(payload.content);
    setCategoryKey(payload.categoryKey);
    setLocationLabel(payload.locationLabel ?? "");
    setScheduleAt(toDateTimeLocalValue(payload.scheduleAt));
    setScheduleEndAt(toDateTimeLocalValue(payload.scheduleEndAt));
    setPostToSchedule(Boolean(payload.scheduleAt));
    setPinned(payload.pinned);
  });

  useEffect(() => {
    if (!isEdit) {
      return;
    }
    void loadDetail();
  }, [isEdit]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const request = {
      title,
      content,
      categoryKey,
      locationLabel: locationLabel.trim() || null,
      scheduleAt: postToSchedule ? scheduleAt || null : null,
      scheduleEndAt: postToSchedule ? scheduleEndAt || null : null,
      postToSchedule,
      pinned,
    };
    const result = isEdit && noticeId
      ? await updateClubNotice(clubId, noticeId, request)
      : await createClubNotice(clubId, request);
    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "공지 저장에 실패했습니다.");
      return;
    }
    router.replace(`/clubs/${clubId}/board/${result.data.noticeId}`, { scroll: !isModal });
  };

  return (
    <div
      className={
        isModal
          ? "flex min-h-0 flex-1 flex-col font-display text-slate-900"
          : "bg-[var(--background-light)] font-display text-slate-900"
      }
    >
      <div className={isModal ? "flex min-h-0 flex-1 flex-col" : "mx-auto flex min-h-screen max-w-md flex-col bg-white"}>
        <header
          className={`sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 ${
            isModal ? "bg-white/92 px-5 py-4 backdrop-blur" : "bg-white p-4"
          }`}
        >
          {isModal && onRequestClose ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="flex size-10 items-center justify-start text-slate-900"
              aria-label="공지 작성 닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          ) : (
            <Link
              href={backHref}
              replace={isModal}
              scroll={!isModal}
              className="flex size-10 items-center justify-start text-slate-900"
              aria-label="공지 목록으로 돌아가기"
            >
              <span className="material-symbols-outlined">{isModal ? "close" : "arrow_back"}</span>
            </Link>
          )}
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight">
            {isEdit ? "Edit Notice" : "Write Notice"}
          </h2>
          <div className="w-10" />
        </header>

        <main className={`flex-1 overflow-y-auto px-4 py-5 ${isModal ? "pb-6" : "pb-10"}`}>
          {loading ? (
            <div className="flex justify-center p-8 text-sm font-medium text-slate-500">Loading notice...</div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-800">{clubName}</p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  placeholder="Enter a notice title"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Category</span>
                <select
                  value={categoryKey}
                  onChange={(event) => setCategoryKey(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Content</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="min-h-52 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  placeholder="Write your notice"
                  required
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={postToSchedule}
                  onChange={(event) => setPostToSchedule(event.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className="text-sm font-medium text-slate-700">일정에도 올리기</span>
              </label>
              {postToSchedule ? (
                <div className="grid grid-cols-1 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">Schedule Start</span>
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(event) => setScheduleAt(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">Schedule End</span>
                    <input
                      type="datetime-local"
                      value={scheduleEndAt}
                      onChange={(event) => setScheduleEndAt(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    />
                  </label>
                </div>
              ) : null}
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Location</span>
                <input
                  value={locationLabel}
                  onChange={(event) => setLocationLabel(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  placeholder="Optional location"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(event) => setPinned(event.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className="text-sm font-medium text-slate-700">Pin this notice</span>
              </label>
              {error ? (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-[var(--primary)] px-4 py-4 text-sm font-bold text-white transition hover:bg-[var(--primary)]/90 disabled:opacity-60"
              >
                {saving ? "Saving..." : isEdit ? "Save Notice" : "Publish Notice"}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
