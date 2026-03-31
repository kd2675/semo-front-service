"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { DatePopoverField } from "@/app/components/DatePopoverField";
import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useId, useRef, useState, type UIEvent } from "react";
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
  const [postToBoard, setPostToBoard] = useState(true);
  const [postToCalendar, setPostToCalendar] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [clubName, setClubName] = useState(initialClubName ?? "일정 스튜디오");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [canEdit, setCanEdit] = useState(!isEdit);
  const [canDelete, setCanDelete] = useState(false);
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
    setPostToCalendar(payload.postedToCalendar);
    setPinned(payload.pinned);
    setCanEdit(payload.canEdit);
    setCanDelete(payload.canDelete);
  });

  useEffect(() => {
    if (!isEdit) {
      return;
    }
    void loadDetail();
  }, [isEdit]);

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (isEdit && !canEdit) {
      setError("이 일정을 수정할 권한이 없습니다.");
      return;
    }
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
      postToCalendar,
      pinned,
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
    ? "sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur"
    : "fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur";

  const handleDelete = async () => {
    if (!eventId) {
      return;
    }
    if (!canDelete) {
      setError("이 일정을 삭제할 권한이 없습니다.");
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
            : "relative mx-auto flex min-h-screen max-w-md flex-col bg-[var(--background-light)] shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
        }
      >
        <div
          className={`sticky top-0 z-10 bg-[var(--background-light)]/92 backdrop-blur ${
            isModal ? "px-4 pt-4" : ""
          }`}
        >
          <ClubPageHeader
            title={isEdit ? "일정 수정" : "일정 생성"}
            subtitle={clubName}
            icon="edit_calendar"
            sticky={false}
            className="border-[var(--primary)]/10"
            containerClassName={isModal ? "max-w-none px-0" : "max-w-md"}
            leftSlot={
              isModal && onRequestClose ? (
                <button
                  type="button"
                  onClick={onRequestClose}
                  className="flex size-10 shrink-0 items-center justify-center text-slate-900"
                  aria-label={isEdit ? "일정 수정 닫기" : "일정 작성 닫기"}
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
              )
            }
          />

          <div className={`mx-auto flex w-full max-w-md flex-col gap-2 px-4 pb-4 ${isModal ? "max-w-none px-0" : ""}`}>
            <p className="text-sm font-medium text-slate-700">일정 정보 입력</p>
            <p className="text-xs text-slate-500">{clubName}</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--primary)]/10">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-200"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>
        </div>

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
                    <DatePopoverField
                      value={startDate}
                      onChange={handleStartDateChange}
                      buttonClassName="h-11 rounded-xl border-[var(--primary)]/20 px-3"
                      placeholder="시작 날짜를 선택하세요"
                      iconName="calendar_today"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-700">종료 날짜</span>
                    <DatePopoverField
                      value={scheduleDateMode === "range" ? endDate : ""}
                      minDate={startDate}
                      onChange={setEndDate}
                      buttonClassName={`h-11 rounded-xl border-[var(--primary)]/20 px-3 ${
                        scheduleDateMode === "single" ? "cursor-not-allowed opacity-45" : ""
                      }`}
                      disabled={scheduleDateMode === "single"}
                      placeholder="종료 날짜를 선택하세요"
                      iconName="event"
                    />
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
                      <span className="block text-sm font-semibold text-slate-900">게시판에도 공유</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {postToBoard ? "사용 중 · 게시판 메인에도 함께 노출됩니다" : "미사용"}
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

                <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/5 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--primary)]">calendar_month</span>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">캘린더에도 공유</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {postToCalendar ? "사용 중 · 캘린더 메인에도 함께 노출됩니다" : "미사용"}
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      checked={postToCalendar}
                      className="peer sr-only"
                      type="checkbox"
                      onChange={(event) => setPostToCalendar(event.target.checked)}
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-[var(--primary)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/5 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--primary)]">push_pin</span>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">핀 고정</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {pinned ? "사용 중 · 게시판 중요 고정 게시물로 우선 노출됩니다" : "미사용"}
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      checked={pinned}
                      className="peer sr-only"
                      type="checkbox"
                      onChange={(event) => setPinned(event.target.checked)}
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

        {(!isEdit || canEdit || canDelete) ? (
          <div className={actionBarClassName}>
            <div className="flex gap-3">
              {isEdit && canDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting || saving}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 text-base font-bold text-white shadow-lg shadow-rose-500/25 transition-all hover:bg-rose-600 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
              ) : null}
              {!isEdit || canEdit ? (
                <button
                  type="submit"
                  form={formId}
                  disabled={saving || deleting}
                  className={`h-14 rounded-xl bg-[var(--primary)] font-bold text-white shadow-lg shadow-[var(--primary)]/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60 ${
                    isEdit && canDelete ? "flex-[2]" : "w-full"
                  }`}
                >
                  {submitLabel}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
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
    </div>
  );
}
