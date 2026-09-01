"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { RouterLink } from "@/app/components/RouterLink";
import { useAppToast } from "@/app/hooks/useAppToast";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type { ClubPermissionGroup, ClubPositionTemplate } from "@/app/lib/clubs";

import { RoleAccessMatrix } from "./RoleAccessMatrix";
import { RoleTemplatePicker } from "./RoleTemplatePicker";
import {
  applyRoleTemplate,
  buildRoleFormValue,
  createAutoPositionCode,
  DEFAULT_ROLE_COLOR,
  getPositionFeatureAccessLabels,
  ROLE_COLOR_OPTIONS,
  ROLE_ICON_LABELS,
  ROLE_ICON_OPTIONS,
  type RoleFormValue,
} from "../utils/roleUtils";

type RoleEditorFormProps = {
  clubId: string;
  title: string;
  permissionGroups: ClubPermissionGroup[];
  positionTemplates: ClubPositionTemplate[];
  onSubmit: (value: RoleFormValue) => Promise<{ success: boolean; message?: string; nextHref?: string }>;
};

function SectionHeading({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-white">
        {step}
      </span>
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function RoleEditorForm({
  clubId,
  title,
  permissionGroups,
  positionTemplates,
  onSubmit,
}: RoleEditorFormProps) {
  const router = useRouter();
  const reduceMotion = useHydrationSafeReducedMotion();
  const [form, setForm] = useState(() => buildRoleFormValue());
  const [submitting, setSubmitting] = useState(false);
  const { showToast, clearToast } = useAppToast();
  const generatedPositionCode = useMemo(
    () => createAutoPositionCode(form.displayName, clubId),
    [clubId, form.displayName],
  );
  const delegatedLabels = useMemo(
    () => getPositionFeatureAccessLabels(permissionGroups, form.featureGrants),
    [form.featureGrants, permissionGroups],
  );
  const canSubmit = form.displayName.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      showToast("직책 이름을 입력해주세요.", "error");
      return;
    }
    setSubmitting(true);
    clearToast();
    const result = await onSubmit({ ...form, positionCode: generatedPositionCode });
    setSubmitting(false);
    if (!result.success) {
      showToast(result.message ?? "직책을 저장하지 못했습니다.", "error");
      return;
    }
    showToast("직책을 만들었습니다.", "success");
    if (result.nextHref) {
      router.replace(result.nextHref);
    }
  };

  const handleApplyTemplate = (template: ClubPositionTemplate) => {
    setForm((current) => applyRoleTemplate(current, template));
    showToast(`${template.displayName} 구성을 적용했습니다.`);
  };

  return (
    <div className="semo-admin-theme min-h-screen bg-[var(--color-bg)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="semo-page-admin flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <RouterLink
              href={`/clubs/${clubId}/admin/more/roles`}
              className="semo-icon-control bg-slate-100 text-slate-600"
              aria-label="직책 목록으로 돌아가기"
            >
              <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            </RouterLink>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
              <p className="text-xs text-slate-500">필요한 업무만 안전하게 위임하세요</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || submitting}
            className="semo-control hidden bg-[var(--primary)] px-5 text-sm font-bold text-white disabled:opacity-40 sm:inline-flex"
          >
            {submitting ? "저장 중" : "직책 만들기"}
          </button>
        </div>
      </header>

      <main className="semo-page-admin space-y-8 px-4 py-6 pb-32 sm:px-6">
        <motion.section className="space-y-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
          <SectionHeading
            step={1}
            title="시작 구성을 선택하세요"
            description="템플릿은 시작점일 뿐이며 민감 권한은 자동으로 포함하지 않습니다."
          />
          <RoleTemplatePicker templates={positionTemplates} onApply={handleApplyTemplate} disabled={submitting} />
        </motion.section>

        <motion.section className="space-y-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
          <SectionHeading
            step={2}
            title="직책을 설명하세요"
            description="멤버가 맡는 책임을 이름과 설명만 보고도 이해할 수 있게 작성하세요."
          />
          <div className="grid gap-5 rounded-[var(--radius-card)] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">직책 이름</span>
                <input
                  value={form.displayName}
                  maxLength={100}
                  onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                  className="h-12 w-full rounded-[var(--radius-control)] bg-slate-100 px-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/25"
                  placeholder="예: 총무, 경기 운영 담당"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">역할 설명</span>
                <textarea
                  value={form.description}
                  maxLength={255}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-28 w-full rounded-[var(--radius-control)] bg-slate-100 px-4 py-3 text-sm leading-6 outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/25"
                  placeholder="이 직책이 책임지는 업무를 적어주세요."
                />
                <span className="mt-1 block text-right text-xs text-slate-400">{form.description.length}/255</span>
              </label>
            </div>
            <aside className="rounded-[var(--radius-control)] bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-12 items-center justify-center rounded-[var(--radius-control)] text-white"
                  style={{ backgroundColor: form.colorHex || DEFAULT_ROLE_COLOR }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">{form.iconName}</span>
                </span>
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-slate-900">{form.displayName || "새 직책"}</p>
                  <p className="mt-1 text-xs text-slate-500">운영 기능 {delegatedLabels.length}개</p>
                </div>
              </div>
              <p className="mt-4 break-all text-xs leading-5 text-slate-400">내부 코드 {generatedPositionCode}</p>
            </aside>
          </div>
        </motion.section>

        <motion.section className="space-y-4" {...staggeredFadeUpMotion(2, reduceMotion)}>
          <SectionHeading
            step={3}
            title="맡길 업무 범위를 정하세요"
            description="기능이 많아져도 검색하거나 현재 맡긴 기능만 모아볼 수 있습니다."
          />
          <RoleAccessMatrix
            groups={permissionGroups}
            featureGrants={form.featureGrants}
            onChange={(featureGrants) => setForm((current) => ({ ...current, featureGrants }))}
            disabled={submitting}
          />
        </motion.section>

        <motion.section className="space-y-4" {...staggeredFadeUpMotion(3, reduceMotion)}>
          <SectionHeading
            step={4}
            title="표시 방식을 정하세요"
            description="직책 배지에서 사용할 아이콘과 식별 색상입니다."
          />
          <div className="grid gap-6 rounded-[var(--radius-card)] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-slate-700">아이콘</legend>
              <div className="flex flex-wrap gap-2">
                {ROLE_ICON_OPTIONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, iconName }))}
                    aria-label={`대표 아이콘 ${ROLE_ICON_LABELS[iconName]}`}
                    aria-pressed={form.iconName === iconName}
                    className={`flex size-11 items-center justify-center rounded-[var(--radius-control)] transition ${
                      form.iconName === iconName
                        ? "bg-[var(--primary)] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">{iconName}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-slate-700">색상</legend>
              <div className="flex flex-wrap gap-3">
                {ROLE_COLOR_OPTIONS.map((colorHex) => (
                  <button
                    key={colorHex}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, colorHex }))}
                    className={`size-11 rounded-full ${form.colorHex === colorHex ? "ring-2 ring-slate-900/20 ring-offset-2" : ""}`}
                    style={{ backgroundColor: colorHex }}
                    aria-label={`직책 색상 ${colorHex}`}
                    aria-pressed={form.colorHex === colorHex}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </motion.section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md sm:hidden">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit || submitting}
          className="semo-control flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-5 text-sm font-bold text-white disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add_moderator</span>
          {submitting ? "저장 중" : "직책 만들기"}
        </button>
      </div>
    </div>
  );
}
