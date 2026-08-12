"use client";

import { useDeferredValue, useMemo, useState } from "react";

import type { ClubPermissionGroup } from "@/app/lib/clubs";
import {
  applyLatestFeaturePolicy,
  getFeatureAccessSelection,
  replaceFeatureAccessLevel,
  toggleFeatureSensitivePermission,
  type RoleFeatureGrantValue,
} from "../utils/roleUtils";

type RoleAccessMatrixProps = {
  groups: ClubPermissionGroup[];
  featureGrants: RoleFeatureGrantValue[];
  onChange: (featureGrants: RoleFeatureGrantValue[]) => void;
  disabled?: boolean;
};

function isFeatureDelegated(group: ClubPermissionGroup, featureGrants: RoleFeatureGrantValue[]) {
  return featureGrants.some((grant) => grant.featureKey === group.featureKey);
}

function RoleAccessRow({
  group,
  featureGrants,
  onChange,
  disabled,
}: {
  group: ClubPermissionGroup;
  featureGrants: RoleFeatureGrantValue[];
  onChange: (featureGrants: RoleFeatureGrantValue[]) => void;
  disabled: boolean;
}) {
  const selection = getFeatureAccessSelection(group, featureGrants);
  const needsPolicyAdoption = selection.grant?.status === "POLICY_UPDATE_AVAILABLE"
    || selection.grant?.status === "LEGACY_DERIVED";
  const sensitivePermissions = group.permissions.filter((permission) => permission.sensitive);
  const selectedSensitiveCount = sensitivePermissions.filter((permission) =>
    selection.selectedSensitiveKeys.includes(permission.permissionKey),
  ).length;
  const selectedDescription = selection.custom
    ? "이전에 저장된 세부 조합입니다. 다른 수준을 선택하기 전까지 그대로 유지됩니다."
    : selection.accessLevel?.description ?? "맡길 업무 수준을 선택하세요.";

  return (
    <article className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-orange-50 text-[var(--primary)]">
          <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{group.iconName}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">{group.displayName}</h3>
              {group.description ? (
                <p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p>
              ) : null}
            </div>
            {selection.custom ? (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                기존 맞춤
              </span>
            ) : null}
            {needsPolicyAdoption ? (
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                {selection.grant?.status === "LEGACY_DERIVED" ? "기존 권한 가져옴" : "정책 업데이트"}
              </span>
            ) : null}
          </div>

          <fieldset className="mt-4">
            <legend className="sr-only">{group.displayName} 업무 수준</legend>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {group.accessLevels.map((level) => {
                const checked = !selection.custom && selection.accessLevel?.accessLevel === level.accessLevel;
                return (
                  <label
                    key={level.accessLevel}
                    className={`flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border px-3 py-2 text-center text-xs font-bold transition ${
                      checked
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`feature-access-${group.featureKey}`}
                      value={level.accessLevel}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onChange(replaceFeatureAccessLevel(group, featureGrants, level))}
                      className="sr-only"
                    />
                    {level.displayName}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <p className={`mt-3 text-xs leading-5 ${selection.custom ? "text-amber-700" : "text-slate-500"}`}>
            {selectedDescription}
          </p>

          {needsPolicyAdoption ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] bg-sky-50 px-4 py-3">
              <p className="text-xs leading-5 text-sky-800">
                {selection.grant?.status === "LEGACY_DERIVED"
                  ? "기존 세부 권한을 같은 운영 수준으로 인식했습니다. 확인 전까지 원래 권한을 그대로 유지합니다."
                  : "이 직책은 이전 정책을 유지하고 있습니다. 적용 전까지 권한은 자동으로 늘어나지 않습니다."}
              </p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(applyLatestFeaturePolicy(group, featureGrants))}
                className="min-h-10 rounded-[var(--radius-control)] bg-white px-3 text-xs font-bold text-sky-700 ring-1 ring-sky-200 disabled:opacity-50"
              >
                {selection.grant?.status === "LEGACY_DERIVED" ? "표준 정책으로 전환" : "최신 정책 적용"}
              </button>
            </div>
          ) : null}

          {sensitivePermissions.length > 0 ? (
            <details className="group mt-4 rounded-[var(--radius-control)] bg-amber-50/70 px-4 py-3" open={selectedSensitiveCount > 0 ? true : undefined}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold text-amber-800 marker:hidden">
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">verified_user</span>
                  추가 승인 권한 {selectedSensitiveCount > 0 ? `${selectedSensitiveCount}개 선택` : "선택 안 함"}
                </span>
                <span className="material-symbols-outlined text-[18px] transition-transform group-open:rotate-180" aria-hidden="true">
                  expand_more
                </span>
              </summary>
              <p className="mt-2 text-xs leading-5 text-amber-700">
                승인, 지급, 내보내기, 마감처럼 영향이 큰 업무만 별도로 부여합니다.
              </p>
              <div className="mt-3 space-y-2">
                {sensitivePermissions.map((permission) => {
                  const checked = selection.selectedSensitiveKeys.includes(permission.permissionKey);
                  const sensitiveDisabled = disabled
                    || selection.custom
                    || selection.grant == null
                    || needsPolicyAdoption;
                  return (
                    <label
                      key={permission.permissionKey}
                      className={`flex items-start gap-3 rounded-[var(--radius-control)] bg-white px-3 py-3 text-sm text-slate-700 ${
                        sensitiveDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={sensitiveDisabled}
                        onChange={() =>
                          onChange(toggleFeatureSensitivePermission(group, featureGrants, permission.permissionKey))
                        }
                        className="mt-0.5 size-4 accent-[var(--primary)]"
                      />
                      <span>
                        <span className="block font-bold text-slate-900">{permission.displayName}</span>
                        {permission.description ? (
                          <span className="mt-1 block text-xs leading-5 text-slate-500">{permission.description}</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function RoleAccessMatrix({
  groups,
  featureGrants,
  onChange,
  disabled = false,
}: RoleAccessMatrixProps) {
  const [query, setQuery] = useState("");
  const [delegatedOnly, setDelegatedOnly] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const delegatedFeatureCount = groups.filter((group) => isFeatureDelegated(group, featureGrants)).length;
  const visibleGroups = useMemo(
    () =>
      groups.filter((group) => {
        if (delegatedOnly && !isFeatureDelegated(group, featureGrants)) {
          return false;
        }
        if (!deferredQuery) {
          return true;
        }
        return `${group.displayName} ${group.description ?? ""} ${group.featureKey}`
          .toLowerCase()
          .includes(deferredQuery);
      }),
    [deferredQuery, delegatedOnly, featureGrants, groups],
  );

  return (
    <section className="space-y-4">
      <div className="sticky top-[68px] z-20 rounded-[var(--radius-card)] border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400" aria-hidden="true">
              search
            </span>
            <span className="sr-only">기능 검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="기능 이름으로 찾기"
              className="h-11 w-full rounded-[var(--radius-control)] bg-slate-100 pl-10 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={delegatedOnly}
              onClick={() => setDelegatedOnly((current) => !current)}
              className={`semo-control flex-1 px-4 text-sm font-bold lg:flex-none ${
                delegatedOnly ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              맡긴 기능만 {delegatedFeatureCount}
            </button>
            <button
              type="button"
              disabled={disabled || delegatedFeatureCount === 0}
              onClick={() => onChange([])}
              className="semo-control flex-1 bg-white px-4 text-sm font-bold text-slate-600 ring-1 ring-slate-200 disabled:opacity-40 lg:flex-none"
            >
              전체 해제
            </button>
          </div>
        </div>
      </div>

      {visibleGroups.length > 0 ? (
        <div className="space-y-3">
          {visibleGroups.map((group) => (
            <RoleAccessRow
              key={group.featureKey}
              group={group}
              featureGrants={featureGrants}
              onChange={onChange}
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
          조건에 맞는 기능이 없습니다.
        </div>
      )}
    </section>
  );
}
