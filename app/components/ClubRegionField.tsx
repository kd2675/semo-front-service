"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import {
  getRegionDepth1,
  getRegionDepth2List,
  getRegionLabel,
  KOREA_REGIONS,
  REGION_SCOPE_OPTIONS,
  type RegionScope,
} from "@/app/lib/regions";

type ClubRegionFieldValue = {
  regionScope: RegionScope;
  regionDepth1Code: string | null;
  regionDepth2Code: string | null;
};

type ClubRegionFieldProps = {
  value: ClubRegionFieldValue;
  onChange: (nextValue: ClubRegionFieldValue) => void;
  disabled?: boolean;
  helperText?: string;
};

export function ClubRegionField({
  value,
  onChange,
  disabled = false,
  helperText,
}: ClubRegionFieldProps) {
  const [depth2Query, setDepth2Query] = useState("");
  const deferredDepth2Query = useDeferredValue(depth2Query.trim());
  const selectedDepth1 = useMemo(
    () => getRegionDepth1(value.regionDepth1Code),
    [value.regionDepth1Code],
  );
  const depth2Options = useMemo(
    () => getRegionDepth2List(value.regionDepth1Code),
    [value.regionDepth1Code],
  );
  const filteredDepth2Options = useMemo(() => {
    if (!deferredDepth2Query) {
      return depth2Options;
    }
    return depth2Options.filter((depth2) => depth2.depth2Name.includes(deferredDepth2Query));
  }, [deferredDepth2Query, depth2Options]);
  const regionLabel = getRegionLabel(value.regionScope, value.regionDepth1Code, value.regionDepth2Code);

  const handleScopeChange = (regionScope: RegionScope) => {
    if (disabled || regionScope === value.regionScope) {
      return;
    }
    onChange({
      regionScope,
      regionDepth1Code: regionScope === "OFFLINE" ? value.regionDepth1Code : null,
      regionDepth2Code: regionScope === "OFFLINE" ? value.regionDepth2Code : null,
    });
    setDepth2Query("");
  };

  const handleDepth1Change = (regionDepth1Code: string) => {
    if (disabled) {
      return;
    }
    onChange({
      regionScope: value.regionScope,
      regionDepth1Code,
      regionDepth2Code:
        value.regionDepth1Code === regionDepth1Code ? value.regionDepth2Code : null,
    });
    setDepth2Query("");
  };

  const handleDepth2Change = (regionDepth2Code: string) => {
    if (disabled) {
      return;
    }
    onChange({
      regionScope: value.regionScope,
      regionDepth1Code: value.regionDepth1Code,
      regionDepth2Code,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Region Scope
        </p>
        <div className="grid grid-cols-3 gap-2">
          {REGION_SCOPE_OPTIONS.map((option) => {
            const isActive = value.regionScope === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => handleScopeChange(option.value)}
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

      {value.regionScope === "OFFLINE" ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              시도
            </p>
            <div className="mt-3 flex max-h-52 flex-wrap gap-2 overflow-y-auto pr-1">
              {KOREA_REGIONS.map((region) => {
                const isActive = region.depth1Code === value.regionDepth1Code;
                return (
                  <button
                    key={region.depth1Code}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDepth1Change(region.depth1Code)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[var(--primary)] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {region.depth1Name}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDepth1 ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  시군구
                </p>
                <input
                  value={depth2Query}
                  disabled={disabled}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => setDepth2Query(nextValue));
                  }}
                  placeholder="시군구 검색"
                  className="h-10 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
                {filteredDepth2Options.map((depth2) => {
                  const isActive = depth2.depth2Code === value.regionDepth2Code;
                  return (
                    <button
                      key={depth2.depth2Code}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleDepth2Change(depth2.depth2Code)}
                      className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {depth2.depth2Name}
                    </button>
                  );
                })}
              </div>
              {filteredDepth2Options.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">검색 결과가 없습니다.</p>
              ) : null}
              <p className="mt-3 text-xs text-slate-400">
                시군구는 선택 사항입니다. 광역 단위 모임이면 시도까지만 선택해도 됩니다.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">먼저 시도를 선택해 주세요.</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
          {value.regionScope === "ONLINE"
            ? "온라인 중심 모임으로 저장됩니다."
            : "전국 단위 모임으로 저장됩니다."}
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Current</p>
        <p className="mt-2 text-base font-bold text-slate-900">
          {regionLabel ?? "활동 권역을 선택해 주세요."}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {helperText ?? "멤버가 모임 성격을 빠르게 이해할 수 있도록 대표 활동 권역을 저장합니다."}
        </p>
      </div>
    </div>
  );
}
