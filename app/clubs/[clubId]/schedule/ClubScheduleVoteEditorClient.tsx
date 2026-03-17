"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useId, useState } from "react";
import {
  createClubScheduleVote,
  getClubScheduleVoteDetail,
  updateClubScheduleVote,
  type ClubScheduleVoteDetailResponse,
} from "@/app/lib/clubs";
import { ClubEditorLoadingShell } from "../ClubRouteLoadingShells";

type ClubScheduleVoteEditorClientProps = {
  clubId: string;
  voteId?: string;
  clubName?: string;
  presentation?: "page" | "modal";
  onRequestClose?: () => void;
  onSaved?: (voteId: number) => void;
};

export function ClubScheduleVoteEditorClient({
  clubId,
  voteId,
  clubName: initialClubName,
  presentation = "page",
  onRequestClose,
  onSaved,
}: ClubScheduleVoteEditorClientProps) {
  const router = useRouter();
  const formId = useId();
  const isEdit = Boolean(voteId);
  const isModal = presentation === "modal";
  const defaultVoteDate = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [voteStartDate, setVoteStartDate] = useState(defaultVoteDate);
  const [voteEndDate, setVoteEndDate] = useState(defaultVoteDate);
  const [voteStartTime, setVoteStartTime] = useState("");
  const [voteEndTime, setVoteEndTime] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [postToBoard, setPostToBoard] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backHref = isEdit && voteId ? `/clubs/${clubId}/schedule/votes/${voteId}` : `/clubs/${clubId}/schedule`;

  const loadDetail = useEffectEvent(async () => {
    if (!voteId) {
      return;
    }

    setLoading(true);
    setError(null);
    const result = await getClubScheduleVoteDetail(clubId, voteId);
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "투표 정보를 불러오지 못했습니다.");
      return;
    }

    const payload: ClubScheduleVoteDetailResponse = result.data;
    setTitle(payload.title);
    setVoteStartDate(payload.voteStartDate);
    setVoteEndDate(payload.voteEndDate);
    setVoteStartTime(payload.voteStartTime ?? "");
    setVoteEndTime(payload.voteEndTime ?? "");
    setOptions(payload.options.map((option) => option.label));
    setPostToBoard(payload.postedToBoard);
  });

  useEffect(() => {
    if (!isEdit) {
      return;
    }
    void loadDetail();
  }, [isEdit]);

  if (loading) {
    return <ClubEditorLoadingShell presentation={presentation} />;
  }

  const updateOption = (index: number, value: string) => {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  };

  const addOption = () => {
    if (options.length >= 8) {
      return;
    }
    setOptions((current) => [...current, ""]);
  };

  const removeOption = (index: number) => {
    setOptions((current) => (current.length <= 2 ? current : current.filter((_, optionIndex) => optionIndex !== index)));
  };

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setSaving(true);
    setError(null);

    const request = {
      title,
      voteStartDate,
      voteEndDate,
      voteStartTime: voteStartTime || null,
      voteEndTime: voteEndTime || null,
      optionLabels: options.map((option) => option.trim()).filter(Boolean),
      postToBoard,
    };

    const result = isEdit && voteId
      ? await updateClubScheduleVote(clubId, voteId, request)
      : await createClubScheduleVote(clubId, request);

    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "투표 저장에 실패했습니다.");
      return;
    }

    if (onSaved) {
      onSaved(result.data.voteId);
      return;
    }

    router.replace(`/clubs/${clubId}/schedule/votes/${result.data.voteId}`);
  };

  const optionCountLabel = `${options.length}/8`;
  const addOptionDisabled = options.length >= 8;
  const pageClassName = isModal
    ? "flex min-h-0 flex-1 flex-col font-display text-slate-900"
    : "bg-[var(--background-light)] font-display text-slate-900";
  const shellClassName = isModal
    ? "flex min-h-0 flex-1 flex-col bg-white"
    : "relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden bg-white shadow-xl";
  const bottomBarClassName = isModal
    ? "sticky bottom-0 border-t border-slate-200 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
    : "fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-md bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]";
  const submitLabel = saving ? (isEdit ? "수정 중..." : "생성 중...") : isEdit ? "수정 완료" : "투표 생성";
  const helperClubName = initialClubName ?? "SEMO";

  return (
    <div className={pageClassName}>
      <div className={shellClassName}>
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          {isModal && onRequestClose ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="p-1 text-gray-600"
              aria-label="투표 작성 닫기"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : (
            <RouterLink
              href={backHref}
              replace={isModal}
              className="p-1 text-gray-600"
              aria-label="투표로 돌아가기"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </RouterLink>
          )}
          <h1 className="text-lg font-bold">{isEdit ? "투표 수정" : "투표 생성"}</h1>
          <div className="w-8" />
        </header>

        <main className={`bg-white p-4 ${isModal ? "flex-1 overflow-y-auto pb-24" : "pb-28"}`}>
          <form id={formId} className="space-y-8" onSubmit={handleSubmit}>
            <p className="text-xs font-medium text-gray-400">{helperClubName}</p>

            <section>
              <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor={`${formId}-vote-title`}>
                Step 1. 투표 제목
              </label>
              <input
                id={`${formId}-vote-title`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-12 w-full rounded-lg border border-gray-300 px-4 shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                placeholder="투표 제목을 입력해주세요"
                required
              />
            </section>

            <section>
              <h2 className="mb-2 block text-sm font-semibold text-gray-700">Step 2. 투표 기간 설정</h2>
              <div className="grid grid-cols-2 gap-4">
                <label>
                  <span className="mb-1 block text-xs text-gray-500">시작일</span>
                  <input
                    type="date"
                    value={voteStartDate}
                    onChange={(event) => {
                      const nextStartDate = event.target.value;
                      setVoteStartDate(nextStartDate);
                      setVoteEndDate((current) => (!current || current < nextStartDate ? nextStartDate : current));
                    }}
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    required
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-gray-500">종료일</span>
                  <input
                    type="date"
                    value={voteEndDate}
                    min={voteStartDate}
                    onChange={(event) => setVoteEndDate(event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    required
                  />
                </label>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label>
                  <span className="mb-1 block text-xs text-gray-500">시작 시간</span>
                  <input
                    type="time"
                    value={voteStartTime}
                    onChange={(event) => setVoteStartTime(event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-gray-500">종료 시간</span>
                  <input
                    type="time"
                    value={voteEndTime}
                    onChange={(event) => setVoteEndTime(event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </label>
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Step 3. 투표 항목</h2>
                <span className="text-xs text-gray-400">{optionCountLabel}</span>
              </div>

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={`option-${index + 1}`} className="flex items-center gap-2">
                    <input
                      value={option}
                      onChange={(event) => updateOption(index, event.target.value)}
                      className="h-11 flex-1 rounded-lg border border-gray-300 px-4 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                      placeholder="항목 내용을 입력하세요"
                      required={index < 2}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= 2}
                      className="p-2 text-gray-400 transition-colors hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`항목 ${index + 1} 삭제`}
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addOption}
                disabled={addOptionDisabled}
                className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                항목 추가
              </button>
            </section>

            <section className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">Step 4. 게시판 공지 동시 등록</h2>
                  <p className="text-xs text-gray-400">투표 생성 시 자유게시판 상단에 공지로 노출됩니다.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    checked={postToBoard}
                    className="peer sr-only"
                    type="checkbox"
                    onChange={(event) => setPostToBoard(event.target.checked)}
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-[var(--primary)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
              </div>
            </section>

            {error ? (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : null}
          </form>
        </main>

        <div className={bottomBarClassName}>
          <button
            type="submit"
            form={formId}
            disabled={saving}
            className="w-full rounded-xl bg-[var(--primary)] py-4 text-lg font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
