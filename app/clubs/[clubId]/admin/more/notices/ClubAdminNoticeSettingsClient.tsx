"use client";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import {
  updateClubAdminNoticeSettings,
  type ClubAdminNoticeSettingsResponse,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type ClubAdminNoticeSettingsClientProps = {
  clubId: string;
  initialData: ClubAdminNoticeSettingsResponse;
};

type NoticePermissionKey = "allowMemberCreate" | "allowMemberUpdate" | "allowMemberDelete";

type NoticePermissionCardProps = {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (next: boolean) => void;
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

function NoticePermissionCard({
  icon,
  title,
  description,
  enabled,
  onChange,
}: NoticePermissionCardProps) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            <p className="mt-3 text-xs font-semibold text-[var(--primary)]">
              {enabled ? "허용됨" : "허용 안 함"}
            </p>
          </div>
        </div>
        <SettingSwitch checked={enabled} onChange={onChange} />
      </div>
    </article>
  );
}

export function ClubAdminNoticeSettingsClient({
  clubId,
  initialData,
}: ClubAdminNoticeSettingsClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [draft, setDraft] = useState(initialData);
  const [saved, setSaved] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, clearToast } = useEphemeralToast();

  useEffect(() => {
    setDraft(initialData);
    setSaved(initialData);
  }, [initialData]);

  const isDirty = useMemo(
    () =>
      draft.allowMemberCreate !== saved.allowMemberCreate ||
      draft.allowMemberUpdate !== saved.allowMemberUpdate ||
      draft.allowMemberDelete !== saved.allowMemberDelete,
    [draft, saved],
  );

  const handleToggle = (key: NoticePermissionKey, next: boolean) => {
    setDraft((current) => ({
      ...current,
      [key]: next,
    }));
  };

  const handleReset = () => {
    setDraft(saved);
    showToast("변경 사항을 되돌렸습니다.", "info");
  };

  const handleSave = async () => {
    setSaving(true);
    clearToast();
    const result = await updateClubAdminNoticeSettings(clubId, {
      allowMemberCreate: draft.allowMemberCreate,
      allowMemberUpdate: draft.allowMemberUpdate,
      allowMemberDelete: draft.allowMemberDelete,
    });
    setSaving(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "공지 권한 설정 저장에 실패했습니다.", "error");
      return;
    }

    setDraft(result.data);
    setSaved(result.data);
    showToast("공지 권한 설정이 저장되었습니다.", "success");
  };

  return (
    <div
      className="min-h-screen bg-[#f8f6f6] text-slate-900"
      style={{ "--primary": "#ec5b13" } as CSSProperties}
    >
      <div className="mx-auto min-h-screen max-w-md bg-[#f8f6f6] pb-40">
        <ClubPageHeader
          title="공지 권한 설정"
          subtitle={draft.clubName}
          icon="campaign"
          theme="admin"
          containerClassName="max-w-md"
          className="bg-[#f8f6f6]/90"
        />

        <main className="semo-nav-bottom-space space-y-4 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Notice Permission Policy
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">멤버 공지 작업 범위를 조정합니다.</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              아래 설정은 일반 멤버에게만 적용됩니다. 관리자와 오너는 이 설정과 무관하게 공지를
              계속 생성, 수정, 삭제할 수 있습니다.
            </p>
          </motion.section>

          <motion.section {...staggeredFadeUpMotion(1, reduceMotion)}>
            <NoticePermissionCard
              icon="edit_square"
              title="멤버 공지 생성 허용"
              description="사용자가 자기 공지를 새로 작성할 수 있게 합니다."
              enabled={draft.allowMemberCreate}
              onChange={(next) => handleToggle("allowMemberCreate", next)}
            />
          </motion.section>

          <motion.section {...staggeredFadeUpMotion(2, reduceMotion)}>
            <NoticePermissionCard
              icon="edit"
              title="멤버 본인 공지 수정 허용"
              description="사용자가 본인이 작성한 공지만 수정할 수 있게 합니다."
              enabled={draft.allowMemberUpdate}
              onChange={(next) => handleToggle("allowMemberUpdate", next)}
            />
          </motion.section>

          <motion.section {...staggeredFadeUpMotion(3, reduceMotion)}>
            <NoticePermissionCard
              icon="delete"
              title="멤버 본인 공지 삭제 허용"
              description="사용자가 본인이 작성한 공지를 직접 삭제할 수 있게 합니다."
              enabled={draft.allowMemberDelete}
              onChange={(next) => handleToggle("allowMemberDelete", next)}
            />
          </motion.section>

        </main>

        {isDirty ? (
          <div className="pointer-events-none fixed bottom-[76px] left-0 right-0 z-30 p-4">
            <div className="pointer-events-auto mx-auto max-w-md">
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  aria-label="변경 사항 되돌리기"
                  title="변경 사항 되돌리기"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSave();
                  }}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-[0_18px_36px_rgba(236,91,19,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined">
                    {saving ? "progress_activity" : "save"}
                  </span>
                  {saving ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <EphemeralToast message={toast?.message ?? null} tone={toast?.tone} />
      </div>
    </div>
  );
}
