"use client";

import { RouteModal } from "@/app/components/RouteModal";
import {
  APPLICATION_OPTIONS,
  ASSIGNMENT_OPTIONS,
  type ApplicationFilter,
  type AssignmentFilter,
  getApplicationFilterLabel,
  getAssignmentFilterLabel,
  getStatusFilterLabel,
  STATUS_OPTIONS,
  type StatusFilter,
} from "../utils/todoOptions";

export function TodoFilterModal({
  status,
  assignment,
  application,
  onClose,
  onStatusChange,
  onAssignmentChange,
  onApplicationChange,
  onReset,
  onApply,
}: {
  status: StatusFilter;
  assignment: AssignmentFilter;
  application: ApplicationFilter;
  onClose: () => void;
  onStatusChange: (value: StatusFilter) => void;
  onAssignmentChange: (value: AssignmentFilter) => void;
  onApplicationChange: (value: ApplicationFilter) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <RouteModal ariaLabel="업무 필터 선택" onDismiss={onClose} dismissOnBackdrop={false}>
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">운영 필터</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">운영 필터 선택</h3>
          </div>
          <button
            type="button"
            aria-label="운영 필터 닫기"
            onClick={onClose}
            className="semo-icon-control rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-5">
            <FilterGroup
              title="상태"
              options={STATUS_OPTIONS}
              value={status}
              getLabel={getStatusFilterLabel}
              onChange={onStatusChange}
            />
            <FilterGroup
              title="배정 방식"
              options={ASSIGNMENT_OPTIONS}
              value={assignment}
              getLabel={getAssignmentFilterLabel}
              onChange={onAssignmentChange}
            />
            <FilterGroup
              title="신청 상태"
              options={APPLICATION_OPTIONS}
              value={application}
              getLabel={getApplicationFilterLabel}
              onChange={onApplicationChange}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={onApply}
              className="min-h-12 flex-1 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white"
            >
              적용
            </button>
          </div>
        </div>
      </section>
    </RouteModal>
  );
}


function FilterGroup<T extends string>({
  title,
  options,
  value,
  getLabel,
  onChange,
}: {
  title: string;
  options: readonly T[];
  value: T;
  getLabel: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
              value === option ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {getLabel(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
