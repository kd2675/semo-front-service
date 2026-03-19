"use client";

import Image from "next/image";
import { AnimatePresence } from "motion/react";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useId, useState } from "react";
import { getNoticeAccentClasses } from "@/app/lib/notice-category";
import { uploadTempImage } from "@/app/lib/imageUpload";
import {
  createClubNotice,
  deleteClubNotice,
  getClubNoticeDetail,
  getNoticeCategoryOptions,
  updateClubNotice,
  type ClubNoticeDetailResponse,
  type NoticeCategoryOption,
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

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  return value.slice(0, 16);
}

const DEFAULT_NOTICE_CATEGORY: NoticeCategoryOption = {
  categoryKey: "ANNOUNCEMENT",
  displayName: "Announcement",
  iconName: "campaign",
  accentTone: "blue",
};

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
  const [categoryKey, setCategoryKey] = useState("ANNOUNCEMENT");
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<NoticeCategoryOption[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [scheduleAt, setScheduleAt] = useState(initialScheduleAt ?? "");
  const [scheduleEndAt, setScheduleEndAt] = useState(initialScheduleEndAt ?? "");
  const [postToSchedule, setPostToSchedule] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [clubName, setClubName] = useState("Notice");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    setCategoryKey(payload.categoryKey);
    setLocationLabel(payload.locationLabel ?? "");
    setScheduleAt(toDateTimeLocalValue(payload.scheduleAt));
    setScheduleEndAt(toDateTimeLocalValue(payload.scheduleEndAt));
    setPostToSchedule(Boolean(payload.scheduleAt));
    setPinned(payload.pinned);
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getNoticeCategoryOptions(clubId);
      if (cancelled || !result.ok || !result.data) {
        return;
      }
      const options = result.data;
      setCategoryOptions(options);
      setCategoryKey((current) => current || options[0]?.categoryKey || "ANNOUNCEMENT");
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId]);

  useEffect(() => {
    if (!isEdit) {
      return;
    }
    void loadDetail();
  }, [isEdit]);

  if (loading) {
    return <ClubEditorLoadingShell presentation={presentation} />;
  }

  const availableCategoryOptions = categoryOptions.length > 0 ? categoryOptions : [DEFAULT_NOTICE_CATEGORY];
  const selectedCategory =
    availableCategoryOptions.find((option) => option.categoryKey === categoryKey) ?? availableCategoryOptions[0];
  const selectedCategoryAccent = getNoticeAccentClasses(selectedCategory.accentTone);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const request = {
      title,
      content,
      categoryKey,
      fileName,
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
                <span className="mb-1.5 block text-sm font-medium text-slate-700">공지 카테고리</span>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-[var(--primary)]/30 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex size-11 items-center justify-center rounded-2xl ${selectedCategoryAccent.icon}`}>
                      <span className="material-symbols-outlined">{selectedCategory.iconName}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">{selectedCategory.displayName}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">카테고리를 선택해 공지 성격을 구분합니다</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">expand_more</span>
                </button>
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
                    <span className="material-symbols-outlined text-[var(--primary)]">event_upcoming</span>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">일정에도 올리기</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {postToSchedule ? "사용 중 · 공지와 함께 일정이 연결됩니다" : "미사용"}
                      </span>
                    </div>
                  </div>
                  <SettingSwitch checked={postToSchedule} onChange={setPostToSchedule} />
                </div>

                {postToSchedule ? (
                  <div className="space-y-3 rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/[0.03] p-4 shadow-sm">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">일정 시작 일시</span>
                      <input
                        type="datetime-local"
                        value={scheduleAt}
                        onChange={(event) => setScheduleAt(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">일정 종료 일시</span>
                      <input
                        type="datetime-local"
                        value={scheduleEndAt}
                        onChange={(event) => setScheduleEndAt(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                      />
                    </label>
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
                    <span className="block text-sm font-semibold text-slate-900">상단 고정</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {pinned ? "사용 중 · 공지 목록 상단에 우선 노출" : "미사용"}
                    </span>
                  </div>
                </div>
                <SettingSwitch checked={pinned} onChange={setPinned} />
              </div>

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

        {isEdit ? (
          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-slate-100 bg-white p-4">
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
        ) : null}
      </div>

      {showCategoryModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-[0_20px_80px_rgba(15,23,42,0.28)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">카테고리 선택</h3>
                <p className="mt-1 text-sm text-slate-500">공지의 성격에 맞는 카테고리를 골라주세요.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="카테고리 선택 닫기"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              {availableCategoryOptions.map((option) => {
                const accent = getNoticeAccentClasses(option.accentTone);
                const isSelected = option.categoryKey === categoryKey;
                return (
                  <button
                    key={option.categoryKey}
                    type="button"
                    onClick={() => {
                      setCategoryKey(option.categoryKey);
                      setShowCategoryModal(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-[var(--primary)]/30 bg-[var(--primary)]/5 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex size-11 items-center justify-center rounded-2xl ${accent.icon}`}>
                        <span className="material-symbols-outlined">{option.iconName}</span>
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-slate-900">{option.displayName}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{option.categoryKey}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${accent.badge}`}>선택됨</span>
                      ) : null}
                      <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {showDeleteModal ? (
          <ScheduleActionConfirmModal
            title="공지를 삭제할까요?"
            description="삭제한 공지는 되돌릴 수 없고, 연결된 일정도 함께 정리될 수 있습니다."
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
