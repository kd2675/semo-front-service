"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import {
  createClubScheduleEvent,
  getClubScheduleEventDetail,
  updateClubScheduleEvent,
  type ClubScheduleEventDetailResponse,
} from "@/app/lib/clubs";

type ClubScheduleEditorClientProps = {
  clubId: string;
  eventId?: string;
  presentation?: "page" | "modal";
  initialStartAt?: string;
  initialEndAt?: string;
  onRequestClose?: () => void;
};

const CATEGORY_OPTIONS = [
  { value: "GENERAL", label: "General" },
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

export function ClubScheduleEditorClient({
  clubId,
  eventId,
  presentation = "page",
  initialStartAt,
  initialEndAt,
  onRequestClose,
}: ClubScheduleEditorClientProps) {
  const router = useRouter();
  const isEdit = Boolean(eventId);
  const isModal = presentation === "modal";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryKey, setCategoryKey] = useState("GENERAL");
  const [locationLabel, setLocationLabel] = useState("");
  const [startAt, setStartAt] = useState(initialStartAt ?? "");
  const [endAt, setEndAt] = useState(initialEndAt ?? "");
  const [postToBoard, setPostToBoard] = useState(true);
  const [clubName, setClubName] = useState("Schedule");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backHref = isEdit && eventId ? `/clubs/${clubId}/schedule/${eventId}` : `/clubs/${clubId}/schedule`;

  const loadDetail = useEffectEvent(async () => {
    if (!eventId) {
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getClubScheduleEventDetail(clubId, eventId);
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "일정 정보를 불러오지 못했습니다.");
      return;
    }

    const payload: ClubScheduleEventDetailResponse = result.data;
    setClubName(payload.clubName);
    setTitle(payload.title);
    setDescription(payload.description ?? "");
    setCategoryKey(payload.categoryKey);
    setLocationLabel(payload.locationLabel ?? "");
    setStartAt(toDateTimeLocalValue(payload.startAt));
    setEndAt(toDateTimeLocalValue(payload.endAt));
    setPostToBoard(payload.postedToBoard);
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
      description: description.trim() || null,
      categoryKey,
      locationLabel: locationLabel.trim() || null,
      startAt,
      endAt: endAt || null,
      postToBoard,
    };

    const result = isEdit && eventId
      ? await updateClubScheduleEvent(clubId, eventId, request)
      : await createClubScheduleEvent(clubId, request);

    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "일정 저장에 실패했습니다.");
      return;
    }

    router.replace(`/clubs/${clubId}/schedule/${result.data.eventId}`, { scroll: !isModal });
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
              aria-label="일정 작성 닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          ) : (
            <Link
              href={backHref}
              replace={isModal}
              scroll={!isModal}
              className="flex size-10 items-center justify-start text-slate-900"
              aria-label="일정 목록으로 돌아가기"
            >
              <span className="material-symbols-outlined">{isModal ? "close" : "arrow_back"}</span>
            </Link>
          )}
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight">
            {isEdit ? "Edit Schedule" : "Create Schedule"}
          </h2>
          <div className="w-10" />
        </header>

        <main className={`flex-1 overflow-y-auto px-4 py-5 ${isModal ? "pb-6" : "pb-10"}`}>
          {loading ? (
            <div className="flex justify-center p-8 text-sm font-medium text-slate-500">Loading schedule...</div>
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
                  placeholder="Enter an event title"
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
                <span className="mb-2 block text-sm font-bold text-slate-700">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  placeholder="Write schedule details"
                />
              </label>
              <div className="grid grid-cols-1 gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Start Time</span>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(event) => setStartAt(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">End Time</span>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(event) => setEndAt(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  />
                </label>
              </div>
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
                  checked={postToBoard}
                  onChange={(event) => setPostToBoard(event.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className="text-sm font-medium text-slate-700">공지에도 올리기</span>
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
                {saving ? "Saving..." : isEdit ? "Save Schedule" : "Create Schedule"}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
