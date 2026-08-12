"use client";

import type { ClubPositionTemplate } from "@/app/lib/clubs";

type RoleTemplatePickerProps = {
  templates: ClubPositionTemplate[];
  onApply: (template: ClubPositionTemplate) => void;
  disabled?: boolean;
};

export function RoleTemplatePicker({ templates, onApply, disabled = false }: RoleTemplatePickerProps) {
  if (templates.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="role-template-heading">
      <div className="mb-3">
        <h2 id="role-template-heading" className="text-lg font-bold text-slate-900">빠른 시작</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          현재 클럽에서 사용하는 기능만 적용됩니다. 선택 후 업무 범위를 자유롭게 조정할 수 있습니다.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <button
            key={template.templateKey}
            type="button"
            disabled={disabled}
            onClick={() => onApply(template)}
            className="group rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-200 hover:bg-orange-50/40 disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-white"
                style={{ backgroundColor: template.colorHex }}
              >
                <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{template.iconName}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{template.displayName}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                    기능 {template.featureCount}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{template.description}</span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
