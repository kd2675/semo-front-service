"use client";

import {
  ACTIVITY_CATEGORY_OPTIONS,
  AFFILIATION_TYPE_OPTIONS,
  filterCompatibleActivityTags,
  getActivityTagOptionsByCategory,
  type ActivityCategoryKey,
  type ActivityTagKey,
  type AffiliationTypeKey,
} from "@/app/lib/club-classification";

type ClubClassificationFieldValue = {
  activityCategory: ActivityCategoryKey | null;
  activityTags: ActivityTagKey[];
  affiliationType: AffiliationTypeKey | null;
};

type ClubClassificationFieldProps = {
  value: ClubClassificationFieldValue;
  onChange: (nextValue: ClubClassificationFieldValue) => void;
  disabled?: boolean;
};

export function ClubClassificationField({
  value,
  onChange,
  disabled = false,
}: ClubClassificationFieldProps) {
  const activityTagOptions = getActivityTagOptionsByCategory(value.activityCategory);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">활동 카테고리</p>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_CATEGORY_OPTIONS.map((option) => {
            const isActive = option.key === value.activityCategory;
            return (
              <button
                key={option.key}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    ...value,
                    activityCategory: option.key,
                    activityTags: filterCompatibleActivityTags(option.key, value.activityTags),
                  })
                }
                className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[var(--primary)] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {ACTIVITY_CATEGORY_OPTIONS.find((option) => option.key === value.activityCategory)?.description ??
            "모임의 큰 활동 분류를 먼저 선택해 주세요."}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">활동 태그</p>
          <p className="text-[11px] font-medium text-slate-400">최대 5개</p>
        </div>
        {activityTagOptions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activityTagOptions.map((option) => {
              const isActive = value.activityTags.includes(option.key);
              const reachedLimit = value.activityTags.length >= 5 && !isActive;
              return (
                <button
                  key={option.key}
                  type="button"
                  disabled={disabled || reachedLimit}
                  onClick={() =>
                    onChange({
                      ...value,
                      activityTags: isActive
                        ? value.activityTags.filter((activityTag) => activityTag !== option.key)
                        : [...value.activityTags, option.key],
                    })
                  }
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            활동 카테고리를 먼저 고르면 관련 태그를 선택할 수 있습니다.
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">소속 유형</p>
        <div className="grid grid-cols-2 gap-2">
          {AFFILIATION_TYPE_OPTIONS.map((option) => {
            const isActive = value.affiliationType === option.key;
            return (
              <button
                key={option.key}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, affiliationType: option.key })}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  isActive
                    ? "border-[var(--primary)] bg-[var(--primary)]/8"
                    : "border-slate-200 bg-white"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <p className="text-sm font-bold text-slate-900">{option.label}</p>
                <p className="mt-1 text-xs text-slate-500">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
