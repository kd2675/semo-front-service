"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useId, useRef, useState, type ReactNode, type UIEvent } from "react";
import {
  createClubScheduleEvent,
  deleteClubScheduleEvent,
  getClubScheduleEventDetail,
  updateClubScheduleEvent,
  type ClubScheduleEventDetailResponse,
} from "@/app/lib/clubs";
import { ClubEditorLoadingShell } from "../ClubRouteLoadingShells";
import { ScheduleActionConfirmModal } from "./ScheduleActionConfirmModal";

type ClubScheduleEditorClientProps = {
  clubId: string;
  eventId?: string;
  clubName?: string;
  presentation?: "page" | "modal";
  initialEventDate?: string;
  onRequestClose?: () => void;
  onSaved?: (eventId: number) => void;
  onDeleted?: () => void;
};

type ScheduleDateMode = "single" | "range";

type SettingSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

function SettingSwitch({ checked, onChange, disabled = false }: SettingSwitchProps) {
  return (
    <label
      className={`relative inline-flex h-[31px] w-[51px] items-center rounded-full p-0.5 transition-colors ${
        checked ? "bg-[var(--primary)]" : "bg-slate-200"
      } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
    >
      <input
        checked={checked}
        className="sr-only"
        disabled={disabled}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      <div
        className={`h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </label>
  );
}

type EditRowProps = {
  label: string;
  children: ReactNode;
  withBorder?: boolean;
};

function EditRow({ label, children, withBorder = true }: EditRowProps) {
  return (
    <div
      className={`flex min-h-[56px] items-center justify-between gap-4 bg-white px-4 ${
        withBorder ? "border-b border-slate-50" : ""
      }`}
    >
      <p className="flex-1 text-base font-medium text-slate-900">{label}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export function ClubScheduleEditorClient({
  clubId,
  eventId,
  clubName: initialClubName,
  presentation = "page",
  initialEventDate,
  onRequestClose,
  onSaved,
  onDeleted,
}: ClubScheduleEditorClientProps) {
  const router = useRouter();
  const formId = useId();
  const mainRef = useRef<HTMLElement | null>(null);
  const isEdit = Boolean(eventId);
  const isModal = presentation === "modal";
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(initialEventDate ?? getTodayDateValue());
  const [scheduleDateMode, setScheduleDateMode] = useState<ScheduleDateMode>("single");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attendeeLimit, setAttendeeLimit] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [participationConditionText, setParticipationConditionText] = useState("");
  const [participationEnabled, setParticipationEnabled] = useState(false);
  const [feeRequired, setFeeRequired] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");
  const [feeAmountUndecided, setFeeAmountUndecided] = useState(false);
  const [feeNWaySplit, setFeeNWaySplit] = useState(false);
  const [postToBoard, setPostToBoard] = useState(false);
  const [clubName, setClubName] = useState(initialClubName ?? "일정 스튜디오");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressWidth, setProgressWidth] = useState(0);
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
    setStartDate(payload.startDate);
    setScheduleDateMode(payload.endDate ? "range" : "single");
    setEndDate(payload.endDate ?? "");
    setStartTime(payload.startTime ?? "");
    setEndTime(payload.endTime ?? "");
    setAttendeeLimit(payload.attendeeLimit ? String(payload.attendeeLimit) : "");
    setLocationLabel(payload.locationLabel ?? "");
    setParticipationConditionText(payload.participationConditionText ?? "");
    setParticipationEnabled(payload.participationEnabled);
    setFeeRequired(payload.feeRequired);
    setFeeAmount(payload.feeAmount ? String(payload.feeAmount) : "");
    setFeeAmountUndecided(payload.feeAmountUndecided);
    setFeeNWaySplit(payload.feeNWaySplit);
    setPostToBoard(payload.postedToBoard);
  });

  useEffect(() => {
    if (!isEdit) {
      return;
    }
    void loadDetail();
  }, [isEdit]);

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setSaving(true);
    setError(null);

    const request = {
      title,
      startDate,
      endDate: endDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      attendeeLimit: participationEnabled && attendeeLimit ? Number(attendeeLimit) : null,
      locationLabel: locationLabel.trim() || null,
      participationConditionText: participationEnabled ? participationConditionText.trim() || null : null,
      participationEnabled,
      feeRequired,
      feeAmount: feeRequired && !feeAmountUndecided && feeAmount ? Number(feeAmount) : null,
      feeAmountUndecided: feeRequired && feeAmountUndecided,
      feeNWaySplit: feeRequired && participationEnabled && feeNWaySplit,
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

    if (onSaved) {
      onSaved(result.data.eventId);
      return;
    }

    router.replace(`/clubs/${clubId}/schedule/${result.data.eventId}`);
  };

  const handleScheduleDateModeChange = (nextMode: ScheduleDateMode) => {
    setScheduleDateMode(nextMode);
    if (nextMode === "single") {
      setEndDate("");
      return;
    }
    setEndDate((current) => current || startDate);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (scheduleDateMode !== "range") {
      return;
    }
    setEndDate((current) => {
      if (!current || current < value) {
        return value;
      }
      return current;
    });
  };

  const handleFeeRequiredChange = (checked: boolean) => {
    setFeeRequired(checked);
    if (!checked) {
      setFeeAmountUndecided(false);
      setFeeNWaySplit(false);
    }
  };

  const handleParticipationEnabledChange = (checked: boolean) => {
    setParticipationEnabled(checked);
    if (!checked) {
      setFeeNWaySplit(false);
    }
  };

  const submitLabel = saving ? "저장 중..." : isEdit ? "수정 저장" : "저장하기";
  const actionBarClassName = isModal
    ? "sticky bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur"
    : "fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 p-4 backdrop-blur";

  const handleDelete = async () => {
    if (!eventId) {
      return;
    }

    setDeleting(true);
    setError(null);
    const result = await deleteClubScheduleEvent(clubId, eventId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message ?? "일정 삭제에 실패했습니다.");
      return;
    }

    setShowDeleteModal(false);
    if (onDeleted) {
      onDeleted();
      return;
    }
    router.replace(`/clubs/${clubId}/schedule`);
  };

  const updateProgressWidth = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
    const maxScrollTop = scrollHeight - clientHeight;
    const ratio = maxScrollTop <= 0 ? 0 : scrollTop / maxScrollTop;
    const nextProgressWidth = Math.min(100, ratio * 100);

    setProgressWidth((current) => Math.max(current, nextProgressWidth));
  };

  const syncProgressFromWindow = useEffectEvent(() => {
    updateProgressWidth(
      window.scrollY ?? window.pageYOffset ?? 0,
      document.documentElement.scrollHeight,
      window.innerHeight,
    );
  });

  const handleMainScroll = (event: UIEvent<HTMLElement>) => {
    updateProgressWidth(
      event.currentTarget.scrollTop,
      event.currentTarget.scrollHeight,
      event.currentTarget.clientHeight,
    );
  };

  useEffect(() => {
    if (isModal) {
      return;
    }

    const handleWindowScroll = () => {
      syncProgressFromWindow();
    };

    syncProgressFromWindow();
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    window.addEventListener("resize", handleWindowScroll);

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      window.removeEventListener("resize", handleWindowScroll);
    };
  }, [isModal]);

  useEffect(() => {
    if (!isModal) {
      syncProgressFromWindow();
      return;
    }

    const mainElement = mainRef.current;
    if (!mainElement) {
      return;
    }

    updateProgressWidth(
      mainElement.scrollTop,
      mainElement.scrollHeight,
      mainElement.clientHeight,
    );
  }, [isModal, loading, scheduleDateMode, participationEnabled, feeRequired, error]);

  if (loading) {
    return <ClubEditorLoadingShell presentation={presentation} />;
  }

  if (isEdit) {
    return (
      <div className="bg-[var(--background-light)] font-display text-slate-900">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col overflow-hidden bg-white shadow-xl">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-4 pb-2">
            {isModal && onRequestClose ? (
              <button
                type="button"
                onClick={onRequestClose}
                className="flex size-12 shrink-0 items-center text-slate-900"
                aria-label="일정 수정 닫기"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            ) : (
              <RouterLink
                href={backHref}
                replace={isModal}
                className="flex size-12 shrink-0 items-center text-slate-900"
                aria-label="일정으로 돌아가기"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </RouterLink>
            )}
            <h2 className="flex-1 text-lg font-bold leading-tight tracking-tight text-slate-900">일정 수정</h2>
          </header>

          <main
            className={`flex flex-1 flex-col gap-1 ${
              isModal ? "overflow-y-auto pb-24" : "semo-nav-bottom-space"
            }`}
          >
            <form id={formId} onSubmit={handleSubmit}>
              <div className="flex flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex min-w-40 flex-1 flex-col">
                  <p className="pb-2 text-base font-medium leading-normal text-slate-900">일정 제목</p>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-14 w-full rounded-lg border border-slate-200 bg-white p-[15px] text-base font-normal leading-normal text-slate-900 outline-none transition focus:ring-2 focus:ring-[var(--primary)]/50"
                    placeholder="제목을 입력하세요"
                    required
                  />
                </label>
              </div>

              <div className="flex px-4 py-3">
                <div className="flex h-12 flex-1 items-center justify-center rounded-lg bg-slate-100 p-1">
                  <label className="flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-semibold text-slate-500 transition-all has-[:checked]:bg-white has-[:checked]:text-[var(--primary)] has-[:checked]:shadow-sm">
                    <span className="truncate">날짜 지정</span>
                    <input
                      checked={scheduleDateMode === "single"}
                      className="invisible w-0"
                      name="date-type"
                      type="radio"
                      onChange={() => handleScheduleDateModeChange("single")}
                    />
                  </label>
                  <label className="flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-semibold text-slate-500 transition-all has-[:checked]:bg-white has-[:checked]:text-[var(--primary)] has-[:checked]:shadow-sm">
                    <span className="truncate">기간 설정</span>
                    <input
                      checked={scheduleDateMode === "range"}
                      className="invisible w-0"
                      name="date-type"
                      type="radio"
                      onChange={() => handleScheduleDateModeChange("range")}
                    />
                  </label>
                </div>
              </div>

              {scheduleDateMode === "single" ? (
                <EditRow label="날짜">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => handleStartDateChange(event.target.value)}
                      className="rounded-md border-none bg-transparent px-0 text-base text-slate-600 outline-none focus:ring-0"
                      required
                    />
                    <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                  </div>
                </EditRow>
              ) : (
                <>
                  <EditRow label="시작 날짜">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => handleStartDateChange(event.target.value)}
                        className="rounded-md border-none bg-transparent px-0 text-base text-slate-600 outline-none focus:ring-0"
                        required
                      />
                      <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                    </div>
                  </EditRow>
                  <EditRow label="종료 날짜">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="rounded-md border-none bg-transparent px-0 text-base text-slate-600 outline-none focus:ring-0"
                        required
                      />
                      <span className="material-symbols-outlined text-sm text-slate-400">event</span>
                    </div>
                  </EditRow>
                </>
              )}

              <EditRow label="시작 시간">
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="rounded-md border-none bg-transparent px-0 text-base font-semibold text-[var(--primary)] outline-none focus:ring-0"
                />
              </EditRow>

              <EditRow label="종료 시간">
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="rounded-md border-none bg-transparent px-0 text-base text-slate-600 outline-none focus:ring-0"
                />
              </EditRow>

              <div className="mt-2 flex flex-col gap-1">
                <EditRow label="장소">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg text-[var(--primary)]">location_on</span>
                    <input
                      value={locationLabel}
                      onChange={(event) => setLocationLabel(event.target.value)}
                      className="w-44 rounded-md border-none bg-transparent px-0 text-right text-base text-slate-600 outline-none focus:ring-0"
                      placeholder="장소를 입력하세요"
                    />
                  </div>
                </EditRow>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <EditRow label="게시판에 공유" withBorder={false}>
                  <SettingSwitch checked={postToBoard} onChange={setPostToBoard} />
                </EditRow>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <EditRow label="참가비" withBorder={!feeRequired}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">금액 또는 미정</span>
                    <SettingSwitch
                      checked={feeRequired}
                      onChange={handleFeeRequiredChange}
                    />
                  </div>
                </EditRow>

                {feeRequired ? (
                  <>
                    <EditRow label="참가비 금액">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={feeAmount}
                          onChange={(event) => setFeeAmount(event.target.value)}
                          disabled={feeAmountUndecided}
                          className="w-24 rounded-md border-none bg-transparent px-0 text-right text-base font-bold text-[var(--primary)] outline-none focus:ring-0 disabled:cursor-not-allowed disabled:text-slate-400"
                          placeholder="금액"
                        />
                        <span className="text-slate-400">원</span>
                      </div>
                    </EditRow>

                    <EditRow label="금액 미정">
                      <SettingSwitch checked={feeAmountUndecided} onChange={setFeeAmountUndecided} />
                    </EditRow>

                  </>
                ) : null}
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <EditRow label="참가 신청 여부" withBorder={!participationEnabled}>
                  <SettingSwitch checked={participationEnabled} onChange={handleParticipationEnabledChange} />
                </EditRow>

                {participationEnabled ? (
                  <>
                    <EditRow label="참가 인원 제한">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={attendeeLimit}
                          onChange={(event) => setAttendeeLimit(event.target.value)}
                          className="w-16 rounded-md border-none bg-transparent px-0 text-right text-base font-bold text-[var(--primary)] outline-none focus:ring-0"
                          placeholder="0"
                        />
                        <span className="text-slate-400">명</span>
                      </div>
                    </EditRow>

                    <EditRow label="참가 조건" withBorder={false}>
                      <input
                        value={participationConditionText}
                        onChange={(event) => setParticipationConditionText(event.target.value)}
                        className="w-44 rounded-md border-none bg-transparent px-0 text-right text-base text-slate-600 outline-none focus:ring-0"
                        placeholder="참가 조건 입력"
                      />
                    </EditRow>
                  </>
                ) : null}
              </div>

              {feeRequired && participationEnabled ? (
                <div className="mt-2 flex flex-col gap-1">
                  <EditRow label="1/n 정산" withBorder={false}>
                    <SettingSwitch
                      checked={feeNWaySplit}
                      onChange={setFeeNWaySplit}
                    />
                  </EditRow>
                </div>
              ) : null}

              {error ? (
                <div className="px-4 py-3">
                  <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>
                </div>
              ) : null}
            </form>
          </main>

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] border-t border-slate-100 bg-white p-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={deleting || saving}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 text-base font-bold text-white shadow-lg shadow-rose-500/25 transition-all hover:bg-rose-600 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
                {deleting ? "삭제 중..." : "삭제"}
              </button>
              <button
                type="submit"
                form={formId}
                disabled={saving || deleting}
                className="h-14 flex-[2] rounded-xl bg-[var(--primary)] text-base font-bold text-white shadow-lg shadow-[var(--primary)]/25 transition-all hover:bg-[var(--primary)]/90 disabled:opacity-60"
              >
                {saving ? "수정 중..." : "수정 완료"}
              </button>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {showDeleteModal ? (
            <ScheduleActionConfirmModal
              title="일정을 삭제할까요?"
              description="삭제한 일정은 되돌릴 수 없고, 연결된 참여 응답도 함께 정리됩니다."
              confirmLabel="일정 삭제"
              busyLabel="삭제 중..."
              busy={deleting}
              onCancel={() => {
                if (!deleting) {
                  setShowDeleteModal(false);
                }
              }}
              onConfirm={handleDelete}
            />
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className={
        isModal
          ? "flex min-h-0 flex-1 flex-col font-display text-slate-900"
          : "bg-[var(--background-light)] font-display text-slate-900"
      }
    >
      <div
        className={
          isModal
            ? "flex min-h-0 flex-1 flex-col bg-[var(--background-light)]"
            : "relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden bg-[var(--background-light)] shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
        }
      >
        <header
          className={`sticky top-0 z-10 ${
            isModal ? "bg-[var(--background-light)]/92 px-4 pt-4 backdrop-blur" : "bg-[var(--background-light)]/92 backdrop-blur"
          }`}
        >
          <div className={`border-b border-[var(--primary)]/10 ${isModal ? "" : "px-4 pt-4"}`}>
            <div className="flex items-center justify-between pb-4">
              {isModal && onRequestClose ? (
                <button
                  type="button"
                  onClick={onRequestClose}
                  className="flex size-10 shrink-0 items-center justify-center text-slate-900"
                  aria-label="일정 작성 닫기"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              ) : (
                <RouterLink
                  href={backHref}
                  replace={isModal}
                  className="flex size-10 shrink-0 items-center justify-center text-slate-900"
                  aria-label="일정으로 돌아가기"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </RouterLink>
              )}
              <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight text-slate-900">
                {isEdit ? "일정 수정" : "일정 생성"}
              </h2>
              <div className="size-10 shrink-0" />
            </div>
          </div>

          <div className={`flex flex-col gap-2 p-4 ${isModal ? "px-0" : ""}`}>
            <p className="text-sm font-medium text-slate-700">일정 정보 입력</p>
            <p className="text-xs text-slate-500">{clubName}</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--primary)]/10">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-200"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>
        </header>

        <main
          ref={isModal ? mainRef : undefined}
          onScroll={isModal ? handleMainScroll : undefined}
          className={`flex-1 ${isModal ? "overflow-y-auto pb-6" : "semo-nav-bottom-space"}`}
        >
          <form id={formId} onSubmit={handleSubmit}>
            <section className="space-y-4 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[var(--primary)]">info</span>
                <h3 className="text-base font-bold text-slate-900">필수 항목</h3>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">일정 제목</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-12 w-full rounded-xl border border-[var(--primary)]/20 bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    placeholder="제목을 입력하세요"
                    required
                  />
                </label>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">일정 유형</span>
                  <div className="flex h-11 items-center justify-center rounded-xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-1">
                    <label className="flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-xs font-bold text-slate-500 transition-all has-[:checked]:bg-[var(--primary)] has-[:checked]:text-white">
                      <span className="truncate">날짜 지정</span>
                      <input
                        checked={scheduleDateMode === "single"}
                        className="hidden"
                        name="date_mode"
                        type="radio"
                        onChange={() => handleScheduleDateModeChange("single")}
                      />
                    </label>
                    <label className="flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-xs font-bold text-slate-500 transition-all has-[:checked]:bg-[var(--primary)] has-[:checked]:text-white">
                      <span className="truncate">기간 설정</span>
                      <input
                        checked={scheduleDateMode === "range"}
                        className="hidden"
                        name="date_mode"
                        type="radio"
                        onChange={() => handleScheduleDateModeChange("range")}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-700">
                      {scheduleDateMode === "single" ? "날짜" : "시작 날짜"}
                    </span>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => handleStartDateChange(event.target.value)}
                        className="h-11 w-full rounded-xl border border-[var(--primary)]/20 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        required
                      />
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        calendar_today
                      </span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-700">종료 날짜</span>
                    <div className="relative">
                      <input
                        type="date"
                        value={scheduleDateMode === "range" ? endDate : ""}
                        min={startDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className={`h-11 w-full rounded-xl border border-[var(--primary)]/20 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 ${
                          scheduleDateMode === "single" ? "cursor-not-allowed opacity-45" : ""
                        }`}
                        disabled={scheduleDateMode === "single"}
                        required={scheduleDateMode === "range"}
                      />
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        event
                      </span>
                    </div>
                  </label>
                </div>

                <p className="rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-500 shadow-sm ring-1 ring-slate-200/70">
                  {scheduleDateMode === "single"
                    ? "날짜 지정은 하루 일정으로 저장됩니다."
                    : "기간 설정은 시작일과 종료일 모두 저장됩니다."}
                </p>
              </div>
            </section>

            <div className="h-2 bg-slate-100" />

            <section className="space-y-6 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[var(--primary)]">settings</span>
                <h3 className="text-base font-bold text-slate-900">추가 옵션</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-700">시작 시간</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="h-11 w-full rounded-xl border border-[var(--primary)]/20 bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-700">종료 시간</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="h-11 w-full rounded-xl border border-[var(--primary)]/20 bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">장소 명칭</span>
                  <input
                    value={locationLabel}
                    onChange={(event) => setLocationLabel(event.target.value)}
                    className="h-12 w-full rounded-xl border border-[var(--primary)]/20 bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    placeholder="장소 이름을 입력하세요 (예: 강남역 카페)"
                  />
                </label>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/5 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--primary)]">campaign</span>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">게시판 공지로 등록</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {postToBoard ? "사용 중 · 생성과 함께 공지에 노출" : "미사용"}
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      checked={postToBoard}
                      className="peer sr-only"
                      type="checkbox"
                      onChange={(event) => setPostToBoard(event.target.checked)}
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-[var(--primary)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                  </label>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/5 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--primary)]">payments</span>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">참가비</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {feeRequired ? "사용 중 · 금액 입력 또는 미정 가능" : "미사용"}
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      checked={feeRequired}
                      className="peer sr-only"
                      type="checkbox"
                      onChange={(event) => handleFeeRequiredChange(event.target.checked)}
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-[var(--primary)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                  </label>
                </div>

                {feeRequired ? (
                  <div className="space-y-3 rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/[0.03] p-4 shadow-sm">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">참가비 금액</span>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          value={feeAmount}
                          onChange={(event) => setFeeAmount(event.target.value)}
                          disabled={feeAmountUndecided}
                          className="h-12 w-full rounded-xl border border-[var(--primary)]/20 bg-white px-4 pr-12 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                          placeholder="금액을 입력하세요"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">원</span>
                      </div>
                    </label>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">금액 미정</span>
                        <span className="text-[10px] text-slate-400">아직 금액이 확정되지 않았으면 켜두세요</span>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          checked={feeAmountUndecided}
                          className="peer sr-only"
                          type="checkbox"
                          onChange={(event) => setFeeAmountUndecided(event.target.checked)}
                        />
                        <div className="h-5 w-10 rounded-full bg-slate-200 transition peer-checked:bg-[var(--primary)] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/5 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--primary)]">how_to_reg</span>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">참석 응답 (RSVP)</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {participationEnabled ? "사용 중" : "미사용"}
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      checked={participationEnabled}
                      className="peer sr-only"
                      type="checkbox"
                      onChange={(event) => handleParticipationEnabledChange(event.target.checked)}
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-[var(--primary)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                  </label>
                </div>

                {participationEnabled ? (
                  <div className="space-y-3 rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/[0.03] p-4 shadow-sm">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">참가 인원 제한</span>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          value={attendeeLimit}
                          onChange={(event) => setAttendeeLimit(event.target.value)}
                          className="h-12 w-full rounded-xl border border-[var(--primary)]/20 bg-white px-4 pr-12 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                          placeholder="0"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">명</span>
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">참가 조건</span>
                      <textarea
                        value={participationConditionText}
                        onChange={(event) => setParticipationConditionText(event.target.value)}
                        className="min-h-[100px] w-full rounded-xl border border-[var(--primary)]/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        placeholder="참가 자격이나 조건을 입력하세요"
                      />
                    </label>

                  </div>
                ) : null}
              </div>

              {feeRequired && participationEnabled ? (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/10 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[var(--primary)]">account_balance_wallet</span>
                      <div>
                        <span className="block text-sm font-semibold text-slate-900">1/n 정산</span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          참석 인원 기준으로 참가비를 균등 분할합니다
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        checked={feeNWaySplit}
                        className="peer sr-only"
                        type="checkbox"
                        onChange={(event) => setFeeNWaySplit(event.target.checked)}
                      />
                      <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-[var(--primary)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </div>
              ) : null}
            </section>
          </form>
        </main>

        <div className={actionBarClassName}>
          <button
            type="submit"
            form={formId}
            disabled={saving}
            className="h-14 w-full rounded-xl bg-[var(--primary)] font-bold text-white shadow-lg shadow-[var(--primary)]/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
