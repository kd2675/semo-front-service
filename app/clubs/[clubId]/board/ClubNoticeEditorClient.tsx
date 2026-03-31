"use client";

import Image from "next/image";
import { AnimatePresence } from "motion/react";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { DatePopoverField } from "@/app/components/DatePopoverField";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useId, useState } from "react";
import { uploadTempImage } from "@/app/lib/imageUpload";
import {
  createClubNotice,
  deleteClubNotice,
  getClubNoticeDetail,
  updateClubNotice,
  type ClubNoticeDetailResponse,
} from "@/app/lib/clubs";
import { ClubEditorLoadingShell } from "../ClubRouteLoadingShells";
import { ScheduleActionConfirmModal } from "../schedule/ScheduleActionConfirmModal";

type ClubNoticeEditorClientProps = {
  clubId: string;
  noticeId?: string;
  presentation?: "page" | "modal";
  basePath?: string;
  initialScheduleAt?: string;
  initialScheduleEndAt?: string;
  onRequestClose?: () => void;
  onSaved?: (noticeId: number) => void;
  onDeleted?: () => void;
};

type NoticeScheduleDateMode = "single" | "range";

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  return value.slice(0, 16);
}

function toDatePart(value: string | null | undefined) {
  return toDateTimeLocalValue(value).slice(0, 10);
}

function toTimePart(value: string | null | undefined) {
  const normalized = toDateTimeLocalValue(value);
  return normalized.length >= 16 ? normalized.slice(11, 16) : "";
}

function combineDateTimeValue(dateValue: string, timeValue: string) {
  if (!dateValue) {
    return "";
  }
  return `${dateValue}T${timeValue || "00:00"}`;
}

function SettingSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`relative inline-flex h-[31px] w-[51px] cursor-pointer items-center rounded-full p-0.5 transition-colors ${
        checked ? "bg-[var(--primary)]" : "bg-slate-200"
      }`}
    >
      <input
        checked={checked}
        className="sr-only"
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

export function ClubNoticeEditorClient({
  clubId,
  noticeId,
  presentation = "page",
  basePath,
  initialScheduleAt,
  initialScheduleEndAt,
  onRequestClose,
  onSaved,
  onDeleted,
}: ClubNoticeEditorClientProps) {
  const router = useRouter();
  const formId = useId();
  const isEdit = Boolean(noticeId);
  const isModal = presentation === "modal";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [scheduleAtDate, setScheduleAtDate] = useState(toDatePart(initialScheduleAt));
  const [scheduleAtTime, setScheduleAtTime] = useState(toTimePart(initialScheduleAt));
  const [scheduleEndAtDate, setScheduleEndAtDate] = useState(toDatePart(initialScheduleEndAt));
  const [scheduleEndAtTime, setScheduleEndAtTime] = useState(toTimePart(initialScheduleEndAt));
  const [scheduleDateMode, setScheduleDateMode] = useState<NoticeScheduleDateMode>(
    initialScheduleAt && initialScheduleEndAt && toDatePart(initialScheduleAt) !== toDatePart(initialScheduleEndAt)
      ? "range"
      : "single",
  );
  const [scheduleTimeEnabled, setScheduleTimeEnabled] = useState(false);
  const [postToBoard, setPostToBoard] = useState(true);
  const [postToCalendar, setPostToCalendar] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [clubName, setClubName] = useState("Notice");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [canEdit, setCanEdit] = useState(!isEdit);
  const [canDelete, setCanDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedBasePath = basePath ?? `/clubs/${clubId}/more/notices`;
  const backHref = isEdit && noticeId ? `${resolvedBasePath}/${noticeId}` : resolvedBasePath;

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
    setFileName(payload.fileName);
    setImageUrl(payload.imageUrl);
    setThumbnailUrl(payload.thumbnailUrl);
    setLocationLabel(payload.locationLabel ?? "");
    setScheduleAtDate(toDatePart(payload.scheduleAt));
    setScheduleAtTime(toTimePart(payload.scheduleAt));
    setScheduleEndAtDate(toDatePart(payload.scheduleEndAt));
    setScheduleEndAtTime(toTimePart(payload.scheduleEndAt));
    setScheduleDateMode(
      payload.scheduleAt && payload.scheduleEndAt && toDatePart(payload.scheduleAt) !== toDatePart(payload.scheduleEndAt)
        ? "range"
        : "single",
    );
    setScheduleTimeEnabled(payload.scheduleTimeEnabled);
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

  if (loading) {
    return <ClubEditorLoadingShell presentation={presentation} />;
  }

  const handleScheduleDateModeChange = (nextMode: NoticeScheduleDateMode) => {
    setScheduleDateMode(nextMode);
    if (nextMode === "single") {
      setScheduleEndAtDate("");
      return;
    }
    setScheduleEndAtDate((current) => current || scheduleAtDate);
  };

  const handleScheduleStartDateChange = (value: string) => {
    setScheduleAtDate(value);
    if (scheduleDateMode !== "range") {
      return;
    }
    setScheduleEndAtDate((current) => {
      if (!current || current < value) {
        return value;
      }
      return current;
    });
  };

  const handleScheduleTimeEnabledChange = (checked: boolean) => {
    setScheduleTimeEnabled(checked);
    if (!checked) {
      setScheduleAtTime("");
      setScheduleEndAtTime("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEdit && !canEdit) {
      setError("공지 수정 권한이 없습니다.");
      return;
    }
    if (postToCalendar && (!scheduleAtDate || !scheduleEndAtDate)) {
      setError("캘린더 공유 공지는 시작 날짜와 종료 날짜를 모두 입력해야 합니다.");
      return;
    }
    const resolvedScheduleEndAtDate = scheduleDateMode === "range" ? scheduleEndAtDate : scheduleAtDate;
    setSaving(true);
    setError(null);
    const request = {
      title,
      content,
      fileName,
      locationLabel: locationLabel.trim() || null,
      scheduleAt: postToCalendar ? combineDateTimeValue(scheduleAtDate, scheduleTimeEnabled ? scheduleAtTime : "") || null : null,
      scheduleEndAt: postToCalendar
        ? combineDateTimeValue(resolvedScheduleEndAtDate, scheduleTimeEnabled ? scheduleEndAtTime : "")
          || null
        : null,
      scheduleTimeEnabled: postToCalendar ? scheduleTimeEnabled : false,
      postToBoard,
      postToCalendar,
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
    if (onSaved) {
      onSaved(result.data.noticeId);
      return;
    }
    router.replace(`${resolvedBasePath}/${result.data.noticeId}`);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setUploadingImage(true);
    setError(null);
    const uploadResult = await uploadTempImage(selectedFile);
    setUploadingImage(false);
    event.target.value = "";

    if (!uploadResult.data) {
      setError(uploadResult.error ?? "이미지 업로드에 실패했습니다.");
      return;
    }

    setFileName(uploadResult.data.fileName);
    setImageUrl(uploadResult.data.imageUrl);
    setThumbnailUrl(uploadResult.data.thumbnailUrl);
  };

  const handleDelete = async () => {
    if (!noticeId) {
      return;
    }
    if (!canDelete) {
      setError("공지 삭제 권한이 없습니다.");
      return;
    }
    setDeleting(true);
    setError(null);
    const result = await deleteClubNotice(clubId, noticeId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message ?? "공지 삭제에 실패했습니다.");
      return;
    }
    setShowDeleteModal(false);
    if (onDeleted) {
      onDeleted();
      return;
    }
    router.replace(resolvedBasePath);
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
        <ClubPageHeader
          title={isEdit ? "공지 수정" : "공지 작성"}
          subtitle={clubName}
          icon="edit_square"
          containerClassName="max-w-md"
          leftSlot={
            isModal && onRequestClose ? (
              <button
                type="button"
                onClick={onRequestClose}
                className="flex size-10 items-center justify-start text-slate-900"
                aria-label="공지 작성 닫기"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            ) : (
              <RouterLink
                href={backHref}
                replace={isModal}
                className="flex size-10 items-center justify-start text-slate-900"
                aria-label="공지 목록으로 돌아가기"
              >
                <span className="material-symbols-outlined">{isModal ? "close" : "arrow_back"}</span>
              </RouterLink>
            )
          }
        />

        <main
          className={`flex-1 ${isModal ? "overflow-y-auto pb-24" : "semo-nav-bottom-space"}`}
        >
          <form id={formId} className="space-y-0" onSubmit={handleSubmit}>
            <section className="space-y-4 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[var(--primary)]">edit_square</span>
                <h3 className="text-base font-bold text-slate-900">필수 항목</h3>
              </div>

              <p className="text-sm font-bold text-slate-800">{clubName}</p>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">공지 제목</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  placeholder="공지 제목을 입력하세요"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">공지 내용</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="min-h-52 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  placeholder="공지 내용을 입력하세요"
                  required
                />
              </label>

              <div className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">대표 이미지</span>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {imageUrl ? (
                    <div className="relative h-52 w-full">
                      <Image
                        src={thumbnailUrl ?? imageUrl}
                        alt="공지 대표 이미지"
                        fill
                        sizes="(max-width: 768px) 100vw, 448px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-400">
                      <div className="text-center">
                        <span className="material-symbols-outlined text-[34px]">image</span>
                        <p className="mt-2 text-xs font-medium">대표 이미지를 등록하면 공지 카드에 함께 노출됩니다.</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--primary)]/10 px-3 py-2 text-xs font-bold text-[var(--primary)]">
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                      {uploadingImage ? "업로드 중..." : imageUrl ? "이미지 변경" : "이미지 업로드"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                    {imageUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFileName(null);
                          setImageUrl(null);
                          setThumbnailUrl(null);
                        }}
                        className="text-xs font-semibold text-slate-500"
                      >
                        이미지 제거
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <div className="h-2 bg-slate-100" />

            <section className="space-y-4 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[var(--primary)]">settings</span>
                <h3 className="text-base font-bold text-slate-900">추가 옵션</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/5 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--primary)]">leaderboard</span>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">게시판에도 공유</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {postToBoard ? "사용 중 · 게시판 메인에도 함께 노출됩니다" : "미사용"}
                      </span>
                    </div>
                  </div>
                  <SettingSwitch checked={postToBoard} onChange={setPostToBoard} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/5 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--primary)]">event_upcoming</span>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">캘린더에도 공유</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {postToCalendar ? "사용 중 · 캘린더 메인에도 함께 노출됩니다" : "미사용"}
                      </span>
                    </div>
                  </div>
                  <SettingSwitch checked={postToCalendar} onChange={setPostToCalendar} />
                </div>

                {postToCalendar ? (
                  <div className="space-y-4 rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/[0.03] p-4 shadow-sm">
                    <div>
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">일정 유형</span>
                      <div className="flex h-11 items-center justify-center rounded-xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-1">
                        <label className="flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-xs font-bold text-slate-500 transition-all has-[:checked]:bg-[var(--primary)] has-[:checked]:text-white">
                          <span className="truncate">날짜 지정</span>
                          <input
                            checked={scheduleDateMode === "single"}
                            className="hidden"
                            name="notice_date_mode"
                            type="radio"
                            onChange={() => handleScheduleDateModeChange("single")}
                          />
                        </label>
                        <label className="flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-xs font-bold text-slate-500 transition-all has-[:checked]:bg-[var(--primary)] has-[:checked]:text-white">
                          <span className="truncate">기간 설정</span>
                          <input
                            checked={scheduleDateMode === "range"}
                            className="hidden"
                            name="notice_date_mode"
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
                          value={scheduleAtDate}
                          onChange={handleScheduleStartDateChange}
                          buttonClassName="rounded-2xl border-slate-200 px-4 py-3"
                          placeholder="시작 날짜를 선택하세요"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-700">종료 날짜</span>
                        <DatePopoverField
                          value={scheduleDateMode === "range" ? scheduleEndAtDate : ""}
                          onChange={setScheduleEndAtDate}
                          minDate={scheduleAtDate || undefined}
                          buttonClassName={`rounded-2xl border-slate-200 px-4 py-3 ${
                            scheduleDateMode === "single" ? "cursor-not-allowed opacity-45" : ""
                          }`}
                          disabled={scheduleDateMode === "single"}
                          placeholder="종료 날짜를 선택하세요"
                        />
                      </label>
                    </div>

                    <p className="rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-500 shadow-sm ring-1 ring-slate-200/70">
                      {scheduleDateMode === "single"
                        ? "날짜 지정은 하루 공지로 저장됩니다."
                        : "기간 설정은 시작일과 종료일이 함께 저장됩니다."}
                    </p>

                    <div className="space-y-3 border-t border-[var(--primary)]/10 pt-4">
                      <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/10 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[var(--primary)]">schedule</span>
                          <div>
                            <span className="block text-sm font-semibold text-slate-900">시간 입력</span>
                            <span className="mt-0.5 block text-[11px] text-slate-500">
                              {scheduleTimeEnabled ? "사용 중 · 시작/종료 시간을 함께 저장합니다" : "미사용 · 날짜만 저장합니다"}
                            </span>
                          </div>
                        </div>
                        <SettingSwitch checked={scheduleTimeEnabled} onChange={handleScheduleTimeEnabledChange} />
                      </div>

                      {scheduleTimeEnabled ? (
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-slate-700">시작 시간</span>
                            <input
                              type="time"
                              value={scheduleAtTime}
                              onChange={(event) => setScheduleAtTime(event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-slate-700">종료 시간</span>
                            <input
                              type="time"
                              value={scheduleEndAtTime}
                              onChange={(event) => setScheduleEndAtTime(event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                            />
                          </label>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">장소</span>
                <input
                  value={locationLabel}
                  onChange={(event) => setLocationLabel(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  placeholder="필요하면 장소를 입력하세요"
                />
              </label>

              <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/5 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[var(--primary)]">keep</span>
                  <div>
                    <span className="block text-sm font-semibold text-slate-900">핀 고정</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {pinned ? "사용 중 · 공지 목록에서 핀 고정으로 노출" : "미사용"}
                    </span>
                  </div>
                </div>
                <SettingSwitch checked={pinned} onChange={setPinned} />
              </div>

              {isEdit && (!canEdit || !canDelete) ? (
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                  {!canEdit && !canDelete
                    ? "이 공지는 현재 수정과 삭제가 모두 제한되어 있습니다."
                    : !canEdit
                      ? "현재 권한으로는 삭제만 가능합니다."
                      : "현재 권한으로는 수정만 가능합니다."}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </div>
              ) : null}

              {!isEdit ? (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-[var(--primary)] px-4 py-4 text-sm font-bold text-white transition hover:bg-[var(--primary)]/90 disabled:opacity-60"
                >
                  {saving ? "저장 중..." : "공지 등록하기"}
                </button>
              ) : null}
            </section>
          </form>
        </main>

        {isEdit && (canEdit || canDelete) ? (
          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-slate-100 bg-white p-4">
            <div className="flex gap-3">
              {canDelete ? (
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
              {canEdit ? (
                <button
                  type="submit"
                  form={formId}
                  disabled={saving || deleting}
                  className="h-14 flex-[2] rounded-xl bg-[var(--primary)] text-base font-bold text-white shadow-lg shadow-[var(--primary)]/25 transition-all hover:bg-[var(--primary)]/90 disabled:opacity-60"
                >
                  {saving ? "수정 중..." : "수정 완료"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {showDeleteModal ? (
          <ScheduleActionConfirmModal
            title="공지를 삭제할까요?"
            description="삭제한 공지는 되돌릴 수 없습니다."
            confirmLabel="공지 삭제"
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
