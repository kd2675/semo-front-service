"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { useAppToast } from "@/app/hooks/useAppToast";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/modals/ScheduleActionConfirmModal";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type {
  ClubPermissionGroup,
  ClubPositionDetailResponse,
  ClubPositionSummary,
} from "@/app/lib/clubs";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RolePermissionToggleCard } from "./RolePermissionToggleCard";
import {
  buildRoleFormValue,
  createAutoPositionCode,
  DEFAULT_ROLE_COLOR,
  ROLE_COLOR_OPTIONS,
  ROLE_ICON_LABELS,
  ROLE_ICON_OPTIONS,
  type RoleFormValue,
} from "../utils/roleUtils";

type RoleEditorFormProps = {
  clubId: string;
  clubName: string;
  title: string;
  mode: "create" | "edit";
  permissionGroups: ClubPermissionGroup[];
  initialPosition?: ClubPositionSummary | null;
  onSubmit: (value: RoleFormValue) => Promise<{ success: boolean; nextHref?: string }>;
  onDelete?: () => Promise<boolean>;
};

export function RoleEditorForm({
  clubId,
  title,
  mode,
  permissionGroups,
  initialPosition,
  onSubmit,
  onDelete,
}: RoleEditorFormProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [form, setForm] = useState(() => buildRoleFormValue(initialPosition));
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { showToast, clearToast } = useAppToast();

  const generatedPositionCode = useMemo(
    () => createAutoPositionCode(form.displayName, clubId),
    [clubId, form.displayName],
  );

  const submittedPositionCode = mode === "create" ? generatedPositionCode : form.positionCode;

  const canSubmit = useMemo(() => {
    if (mode === "create") {
      return form.displayName.trim().length > 0;
    }
    return form.displayName.trim().length > 0 && form.positionCode.trim().length > 0;
  }, [form.displayName, form.positionCode, mode]);

  const togglePermission = (permissionKey: string) => {
    setForm((current) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(permissionKey)
        ? current.permissionKeys.filter((item) => item !== permissionKey)
        : [...current.permissionKeys, permissionKey],
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      showToast(mode === "create" ? "직책 이름을 입력해주세요." : "직책 이름과 코드를 입력해주세요.", "error");
      return;
    }
    setSubmitting(true);
    clearToast();
    const result = await onSubmit({
      ...form,
      positionCode: submittedPositionCode,
    });
    setSubmitting(false);
    if (!result.success) {
      showToast("저장에 실패했습니다.", "error");
      return;
    }
    showToast("직책 저장이 완료되었습니다.", "success");
    if (result.nextHref) {
      router.replace(result.nextHref);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }
    setSubmitting(true);
    const success = await onDelete();
    setSubmitting(false);
    if (!success) {
      showToast("직책 삭제에 실패했습니다.", "error");
      return;
    }
    router.replace(`/clubs/${clubId}/admin/more/roles`);
  };

  if (mode === "create") {
    return (
      <div className="semo-admin-theme min-h-screen bg-[var(--color-bg)] text-slate-900">
        <div className="min-h-screen pb-20">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
            <div className="semo-page-admin flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <RouterLink
                  href={`/clubs/${clubId}/admin/more/roles`}
                  className="semo-icon-control hover:bg-slate-100"
                  aria-label="직책 목록으로 돌아가기"
                >
                  <span className="material-symbols-outlined text-slate-500" aria-hidden="true">arrow_back</span>
                </RouterLink>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  {title}
                </h1>
              </div>
              <div className="text-sm font-bold text-[var(--primary)]">클럽 관리</div>
            </div>
          </header>

          <main className="semo-page-admin space-y-8 p-4 sm:p-6">
            <motion.section className="space-y-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">badge</span>
                <h2 className="text-xl font-bold text-slate-900">직책 기본 정보</h2>
              </div>
              <div className="space-y-6 rounded-[22px] bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-500">직책 이름</span>
                    <input
                      value={form.displayName}
                      onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                      className="w-full rounded-xl bg-[#eff4f7] px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:bg-white focus:shadow-[0_0_0_2px_rgba(144,78,0,0.22)]"
                      placeholder="예: 운영 총괄"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-500">내부 코드</span>
                    <input
                      value={submittedPositionCode}
                      readOnly
                      className="w-full rounded-xl bg-[#eff4f7] px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                      placeholder="ROLE_CODE"
                    />
                    <span className="text-[11px] leading-5 text-slate-400">직책 이름을 기준으로 시스템이 자동 생성합니다.</span>
                  </label>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-500">설명</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-[120px] w-full rounded-xl bg-[#eff4f7] px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:bg-white focus:shadow-[0_0_0_2px_rgba(144,78,0,0.22)]"
                    placeholder="이 직책의 핵심 역할과 책임을 정리해주세요."
                  />
                </label>
              </div>
            </motion.section>

            <motion.section className="space-y-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">security</span>
                <h2 className="text-xl font-bold text-slate-900">권한 설정</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {permissionGroups.map((group) => (
                  <RolePermissionToggleCard
                    key={group.featureKey}
                    group={group}
                    selectedKeys={form.permissionKeys}
                    onToggle={togglePermission}
                  />
                ))}
              </div>
            </motion.section>

            <motion.section className="space-y-4" {...staggeredFadeUpMotion(2, reduceMotion)}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">palette</span>
                <h2 className="text-xl font-bold text-slate-900">직책 표시</h2>
              </div>
              <div className="grid grid-cols-1 gap-8 rounded-[22px] bg-white p-6 shadow-sm md:grid-cols-2">
                <div>
                  <label className="mb-4 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    대표 아이콘
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {ROLE_ICON_OPTIONS.map((iconName) => {
                      const selected = form.iconName === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, iconName }))}
                          aria-label={`대표 아이콘 ${ROLE_ICON_LABELS[iconName]}`}
                          aria-pressed={selected}
                          className={`flex size-12 items-center justify-center rounded-xl transition ${
                            selected
                              ? "bg-[var(--primary)] text-white shadow-md ring-2 ring-orange-200 ring-offset-2"
                              : "bg-[#eff4f7] text-slate-500 hover:bg-[#e4ecef]"
                          }`}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">{iconName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-4 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    직책 식별 색상
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {ROLE_COLOR_OPTIONS.map((colorHex) => {
                      const selected = form.colorHex === colorHex;
                      return (
                        <button
                          key={colorHex}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, colorHex }))}
                          className={`size-11 rounded-full ${selected ? "ring-2 ring-slate-900/15 ring-offset-2" : ""}`}
                          style={{ backgroundColor: colorHex }}
                          aria-label={`직책 색상 ${colorHex}`}
                          aria-pressed={selected}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.div className="rounded-[24px] bg-white p-6 shadow-sm" {...staggeredFadeUpMotion(3, reduceMotion)}>
              <div className="flex items-center gap-4">
                <div
                  className="flex size-14 items-center justify-center rounded-[18px] text-white shadow-sm"
                  style={{ backgroundColor: form.colorHex || DEFAULT_ROLE_COLOR }}
                >
                  <span className="material-symbols-outlined text-[28px]" aria-hidden="true">{form.iconName}</span>
                </div>
                <div>
                  <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {form.displayName || "새 직책"}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    {submittedPositionCode}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div className="pb-12 pt-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="semo-control flex w-full items-center justify-center gap-3 bg-[var(--primary)] px-5 text-base font-bold text-white shadow-[var(--shadow-floating)] transition active:scale-[0.99] disabled:opacity-60"
              >
                <span className="material-symbols-outlined" aria-hidden="true">add_moderator</span>
                {submitting ? "직책 생성 중..." : "직책 만들기"}
              </button>
            </motion.div>
          </main>

          {showDeleteConfirm && onDelete ? (
            <ScheduleActionConfirmModal
              title="직책 삭제"
              description="이 직책을 삭제할까요?"
              confirmLabel="직책 삭제"
              busyLabel="삭제 중..."
              busy={submitting}
              onCancel={() => {
                if (!submitting) {
                  setShowDeleteConfirm(false);
                }
              }}
              onConfirm={() =>
                void handleDelete().finally(() => {
                  setShowDeleteConfirm(false);
                })
              }
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="semo-admin-theme min-h-screen bg-[var(--color-bg)] text-slate-900">
      <div className="min-h-screen pb-24">
        <header className="sticky top-0 z-50 border-b border-[#f0dfcf] bg-[#faf7f2]/85 shadow-sm backdrop-blur-md">
          <div className="semo-page-admin flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <RouterLink
                href={`/clubs/${clubId}/admin/more/roles`}
                className="semo-icon-control hover:bg-orange-50"
                aria-label="직책 목록으로 돌아가기"
              >
                <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">arrow_back</span>
              </RouterLink>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                직책 권한 편집
              </h1>
            </div>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="semo-control bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-60"
            >
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </header>

        <main className="semo-page-admin space-y-8 px-4 pb-32 pt-6 sm:px-6">
          <motion.section
            className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div>
              <span className="text-xs font-extrabold tracking-wide text-[var(--primary)]">
                직책 설정
              </span>
              <h2 className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                직책과 권한
              </h2>
              <p className="mt-2 max-w-lg text-sm text-slate-500">
                {form.displayName || "선택한 직책"} 권한을 기능별 토글로 제어합니다. 필요한 동작만 켜고 바로 저장할 수 있습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <RouterLink
                href={`/clubs/${clubId}/admin/more/roles`}
                className="rounded-xl bg-[#eff4f7] px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-[#e2e9ed]"
              >
                취소
              </RouterLink>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="semo-control bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-60"
              >
                {submitting ? "저장 중..." : "변경사항 저장"}
              </button>
            </div>
          </motion.section>

          <motion.section className="space-y-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">info</span>
              <h3 className="text-sm font-bold text-slate-500">
                직책 개요
              </h3>
            </div>

            <div className="rounded-[28px] bg-[#eff4f7] p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                <div className="md:col-span-4">
                  <div className="rounded-[24px] border-l-4 border-[var(--primary)] bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div
                        className="flex size-14 items-center justify-center rounded-[18px] text-white shadow-sm"
                        style={{ backgroundColor: form.colorHex }}
                      >
                        <span className="material-symbols-outlined text-[30px]" aria-hidden="true">{form.iconName}</span>
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                          {form.displayName || "직책"}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          {form.positionCode}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      {form.description || "직책 설명을 입력하면 이 영역에 표시됩니다."}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-8">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-slate-500">직책 이름</span>
                      <input
                        value={form.displayName}
                        onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                        className="w-full rounded-xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-[rgba(144,78,0,0.22)]"
                        placeholder="직책 이름"
                      />
                    </label>
                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-xs text-orange-800">
                      &quot;{form.positionCode}&quot; 코드를 사용하는 직책입니다.
                    </div>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-xs font-bold text-slate-500">설명</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      className="min-h-[120px] w-full rounded-xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-[rgba(144,78,0,0.22)]"
                      placeholder="직책 설명"
                    />
                  </label>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section className="space-y-4" {...staggeredFadeUpMotion(2, reduceMotion)}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">rule_folder</span>
              <h3 className="text-sm font-bold text-slate-500">
                권한 목록
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {permissionGroups.map((group) => (
              <div key={group.featureKey}>
                <RolePermissionToggleCard
                  group={group}
                  selectedKeys={form.permissionKeys}
                  onToggle={togglePermission}
                />
              </div>
              ))}
            </div>
          </motion.section>

          <motion.section className="mt-8" {...staggeredFadeUpMotion(3, reduceMotion)}>
            <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-orange-50 p-6">
              <span className="material-symbols-outlined pointer-events-none absolute -right-4 -top-4 text-9xl text-[var(--primary)]/10" aria-hidden="true">
                shield
              </span>
              <div className="relative z-10">
                <p className="mb-2 text-lg font-extrabold leading-tight text-orange-950">
                  권한 변경 사항을 저장 전에 다시 확인하세요
                </p>
                <p className="text-sm text-[#8b4b00]">
                  활성 기능에 연결된 권한만 토글 대상에 포함됩니다. 저장 시 현재 화면 상태 그대로 직책 권한에 반영됩니다.
                </p>
              </div>
            </div>
          </motion.section>

          {onDelete ? (
            <motion.div className="flex justify-end" {...staggeredFadeUpMotion(4, reduceMotion)}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={submitting}
                className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm disabled:opacity-60"
              >
                삭제
              </button>
            </motion.div>
          ) : null}
        </main>

        {showDeleteConfirm && onDelete ? (
          <ScheduleActionConfirmModal
            title="직책 삭제"
            description="이 직책을 삭제할까요?"
            confirmLabel="직책 삭제"
            busyLabel="삭제 중..."
            busy={submitting}
            onCancel={() => {
              if (!submitting) {
                setShowDeleteConfirm(false);
              }
            }}
            onConfirm={() =>
              void handleDelete().finally(() => {
                setShowDeleteConfirm(false);
              })
            }
          />
        ) : null}
      </div>
    </div>
  );
}

export function buildRoleEditorInitialPosition(detail: ClubPositionDetailResponse) {
  return detail.position;
}
