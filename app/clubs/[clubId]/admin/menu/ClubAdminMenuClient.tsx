"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouterLink } from "@/app/components/RouterLink";
import { useAppToast } from "@/app/hooks/useAppToast";
import { motion, useReducedMotion } from "motion/react";
import { startTransition, useEffect, useMemo, useState } from "react";
import {
  type ApplyClubOperationTemplateResponse,
  type ClubFeatureSummary,
} from "@/app/lib/clubs";
import { getFeatureDisplayName } from "@/app/lib/featureLabels";
import {
  buildAdminMoreNavigation,
  buildUserMoreNavigation,
  type MoreNavigationItem,
} from "@/app/lib/featureNavigation";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import {
  applyClubOperationTemplateMutationOptions,
  applyClubPresetMutationOptions,
  updateClubFeaturesMutationOptions,
} from "@/app/lib/react-query/club/mutations";
import { clubOperationsCatalogQueryOptions } from "@/app/lib/react-query/club/queries";
import { invalidateClubQueries } from "@/app/lib/react-query/common";

function extractEnabledFeatureKeys(features: ClubFeatureSummary[]) {
  return features
    .filter((feature) => feature.enabled)
    .map((feature) => feature.featureKey);
}

function cloneFeatures(features: ClubFeatureSummary[]) {
  return features.map((feature) => ({ ...feature }));
}

function getFeatureDescription(feature: ClubFeatureSummary) {
  return feature.description ?? "";
}

function getFeatureName(featureKey: string, features: ClubFeatureSummary[]) {
  const feature = features.find((item) => item.featureKey === featureKey);
  return feature ? getFeatureDisplayName(feature) : featureKey;
}

function collectRequiredFeatureKeys(featureKey: string, features: ClubFeatureSummary[], collected = new Set<string>()) {
  const feature = features.find((item) => item.featureKey === featureKey);
  for (const requiredFeatureKey of feature?.requiredFeatureKeys ?? []) {
    if (collected.has(requiredFeatureKey)) continue;
    collected.add(requiredFeatureKey);
    collectRequiredFeatureKeys(requiredFeatureKey, features, collected);
  }
  return collected;
}

function collectDependentFeatureKeys(featureKey: string, features: ClubFeatureSummary[], collected = new Set<string>()) {
  for (const feature of features) {
    if (!(feature.requiredFeatureKeys ?? []).includes(featureKey) || collected.has(feature.featureKey)) continue;
    collected.add(feature.featureKey);
    collectDependentFeatureKeys(feature.featureKey, features, collected);
  }
  return collected;
}

function sortByEnabledState(features: ClubFeatureSummary[]) {
  return [
    ...features.filter((feature) => feature.enabled),
    ...features.filter((feature) => !feature.enabled),
  ];
}

type ClubAdminMenuClientProps = {
  clubId: string;
  clubName: string;
  initialFeatures: ClubFeatureSummary[];
  canPersist?: boolean;
};

type EnabledFeatureCardProps = {
  feature: ClubFeatureSummary;
  features: ClubFeatureSummary[];
  activeFeatureKey: string | null;
  onToggle: (featureKey: string) => void;
};

function EnabledFeatureCard({
  feature,
  features,
  activeFeatureKey,
  onToggle,
}: EnabledFeatureCardProps) {
  const requiredFeatureNames = (feature.requiredFeatureKeys ?? [])
    .map((featureKey) => getFeatureName(featureKey, features));
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.featureKey });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative flex min-h-[88px] items-start gap-3 rounded-xl border bg-white px-4 py-4 shadow-sm transition-colors sm:items-center ${
        activeFeatureKey != null && activeFeatureKey !== feature.featureKey
          ? "border-[var(--primary)]/35"
          : "border-slate-200"
      } ${isDragging ? "z-20 opacity-0" : ""}`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        className="flex size-11 touch-none shrink-0 cursor-grab items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        aria-label={`${getFeatureDisplayName(feature)} 순서 변경 핸들`}
        title="드래그해서 순서를 바꿀 수 있습니다."
      >
        <span className="font-mono text-sm font-bold tracking-[-0.2em]">::</span>
      </button>
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
        <span className="material-symbols-outlined" aria-hidden="true">{feature.iconName}</span>
      </div>
      <div className="min-w-0 flex flex-1 flex-col">
        <p className="text-base font-bold">{getFeatureDisplayName(feature)}</p>
        <p className="text-sm text-slate-500">{getFeatureDescription(feature)}</p>
        {feature.mandatory ? (
          <p className="mt-2 inline-flex w-fit items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">lock</span>
            {feature.mandatoryReason ?? "현재 클럽 정책에서 필수입니다."}
          </p>
        ) : requiredFeatureNames.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-slate-500">
            함께 사용: {requiredFeatureNames.join(" · ")}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onToggle(feature.featureKey)}
        disabled={feature.mandatory}
        className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-[var(--primary)]/10 px-4 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        {feature.mandatory ? "필수 사용" : "비활성화"}
      </button>
    </article>
  );
}

function EnabledFeatureOverlayCard({ feature }: { feature: ClubFeatureSummary }) {
  return (
    <article className="pointer-events-none w-[min(calc(100vw-2rem),64rem)] rounded-xl border border-[var(--primary)]/35 bg-white px-4 py-4 shadow-[0_20px_44px_rgba(15,23,42,0.2)] ring-2 ring-[var(--primary)]/20">
      <div className="flex min-h-[88px] items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <span className="font-mono text-sm font-bold tracking-[-0.2em]">::</span>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
          <span className="material-symbols-outlined" aria-hidden="true">{feature.iconName}</span>
        </div>
        <div className="flex flex-1 flex-col">
          <p className="text-base font-bold">{getFeatureDisplayName(feature)}</p>
          <p className="text-sm text-slate-500">{getFeatureDescription(feature)}</p>
        </div>
        <div className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-xs font-bold text-[var(--primary)]">
          비활성화
        </div>
      </div>
    </article>
  );
}

function NavigationPreview({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: MoreNavigationItem[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={item.key} className="flex items-center gap-3 text-sm text-slate-700">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">
                {index + 1}
              </span>
              <span className="material-symbols-outlined text-[18px] text-[var(--primary)]" aria-hidden="true">
                {item.iconName}
              </span>
              <span className="font-semibold">{item.label}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function ClubAdminMenuClient({
  clubId,
  clubName,
  initialFeatures,
  canPersist = true,
}: ClubAdminMenuClientProps) {
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [features, setFeatures] = useState(() => cloneFeatures(initialFeatures));
  const [savedFeatures, setSavedFeatures] = useState(() => cloneFeatures(initialFeatures));
  const [savedEnabledFeatureKeys, setSavedEnabledFeatureKeys] = useState<string[]>(
    () => extractEnabledFeatureKeys(initialFeatures),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [applyingPresetKey, setApplyingPresetKey] = useState<string | null>(null);
  const [applyingTemplateKey, setApplyingTemplateKey] = useState<string | null>(null);
  const [lastTemplateResult, setLastTemplateResult] = useState<ApplyClubOperationTemplateResponse | null>(null);
  const [activeFeatureKey, setActiveFeatureKey] = useState<string | null>(null);
  const { showToast, clearToast } = useAppToast();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setFeatures(cloneFeatures(initialFeatures));
    setSavedFeatures(cloneFeatures(initialFeatures));
    setSavedEnabledFeatureKeys(extractEnabledFeatureKeys(initialFeatures));
  }, [initialFeatures]);

  const enabledFeatures = useMemo(
    () => features.filter((feature) => feature.enabled),
    [features],
  );
  const disabledFeatures = useMemo(
    () => features.filter((feature) => !feature.enabled),
    [features],
  );
  const userMoreItems = useMemo(
    () => buildUserMoreNavigation(features, clubId),
    [clubId, features],
  );
  const adminNavigationItems = useMemo(
    () => buildAdminMoreNavigation(features, clubId),
    [clubId, features],
  );
  const representativeItems = useMemo(
    () => adminNavigationItems.filter((item) => item.group === "CONTENT"),
    [adminNavigationItems],
  );
  const adminMoreItems = useMemo(
    () => adminNavigationItems.filter((item) => item.group !== "CONTENT"),
    [adminNavigationItems],
  );
  const currentEnabledFeatureKeys = useMemo(
    () => enabledFeatures.map((feature) => feature.featureKey),
    [enabledFeatures],
  );
  const activeFeature = useMemo(
    () => enabledFeatures.find((feature) => feature.featureKey === activeFeatureKey) ?? null,
    [activeFeatureKey, enabledFeatures],
  );
  const isDirty = useMemo(
    () =>
      savedEnabledFeatureKeys.length !== currentEnabledFeatureKeys.length ||
      savedEnabledFeatureKeys.some((featureKey, index) => featureKey !== currentEnabledFeatureKeys[index]),
    [currentEnabledFeatureKeys, savedEnabledFeatureKeys],
  );
  const saveFeaturesMutation = useMutation(updateClubFeaturesMutationOptions(clubId));
  const applyPresetMutation = useMutation(applyClubPresetMutationOptions(clubId));
  const applyTemplateMutation = useMutation(applyClubOperationTemplateMutationOptions(clubId));
  const operationsCatalogQuery = useQuery({
    ...clubOperationsCatalogQueryOptions(clubId),
    enabled: canPersist,
  });

  const handleToggle = (featureKey: string) => {
    const target = features.find((feature) => feature.featureKey === featureKey);
    if (!target) return;
    if (target.available === false) {
      showToast(target.unavailableReason ?? "현재 클럽 정책에서는 사용할 수 없는 기능입니다.", "info");
      return;
    }
    if (target.enabled && target.mandatory) {
      showToast(target.mandatoryReason ?? "현재 클럽 정책에서 필수인 기능입니다.", "info");
      return;
    }

    const affectedFeatureKeys = target.enabled
      ? collectDependentFeatureKeys(featureKey, features)
      : collectRequiredFeatureKeys(featureKey, features);
    startTransition(() => {
      setFeatures((current) => {
        const toggled = current.map((feature) => {
          if (feature.featureKey === featureKey) {
            return { ...feature, enabled: !target.enabled };
          }
          if (affectedFeatureKeys.has(feature.featureKey)) {
            return { ...feature, enabled: !target.enabled };
          }
          return feature;
        });
        return sortByEnabledState(toggled);
      });
    });

    if (affectedFeatureKeys.size > 0) {
      const affectedNames = Array.from(affectedFeatureKeys)
        .map((key) => getFeatureName(key, features))
        .join(" · ");
      showToast(
        target.enabled
          ? `${getFeatureDisplayName(target)} 비활성화에 따라 ${affectedNames}도 함께 비활성화했습니다.`
          : `${getFeatureDisplayName(target)} 사용에 필요한 ${affectedNames}도 함께 활성화했습니다.`,
        "info",
      );
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveFeatureKey(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over?.id == null ? null : String(event.over.id);
    if (overId == null || activeId === overId) {
      return;
    }

    startTransition(() => {
      setFeatures((current) => {
        const currentEnabled = current.filter((feature) => feature.enabled);
        const currentDisabled = current.filter((feature) => !feature.enabled);
        const fromIndex = currentEnabled.findIndex((feature) => feature.featureKey === activeId);
        const toIndex = currentEnabled.findIndex((feature) => feature.featureKey === overId);
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
          return current;
        }

        return [...arrayMove(currentEnabled, fromIndex, toIndex), ...currentDisabled];
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveFeatureKey(null);
    const activeId = String(event.active.id);
    const overId = event.over?.id == null ? null : String(event.over.id);
    if (overId == null || activeId === overId) {
      return;
    }
  };

  const handleSave = async () => {
    if (!canPersist) {
      showToast("모의 모드에서는 저장되지 않습니다.", "info");
      return;
    }

    setIsSaving(true);
    clearToast();
    const result = await saveFeaturesMutation.mutateAsync(
      features
        .filter((feature) => feature.enabled)
        .map((feature) => feature.featureKey),
    );
    setIsSaving(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "기능 설정 저장에 실패했습니다.", "error");
      return;
    }

    setFeatures(cloneFeatures(result.data));
    setSavedFeatures(cloneFeatures(result.data));
    setSavedEnabledFeatureKeys(extractEnabledFeatureKeys(result.data));
    void invalidateClubQueries(queryClient, clubId);
    showToast("기능 설정이 저장되었습니다.", "success");
    window.dispatchEvent(new Event("semo:club-features-updated"));
  };

  const handleReset = () => {
    setActiveFeatureKey(null);
    setFeatures(cloneFeatures(savedFeatures));
    showToast("변경 사항을 되돌렸습니다.", "info");
  };

  const handleApplyPreset = async (presetKey: string) => {
    if (!canPersist) {
      showToast("모의 모드에서는 프리셋이 적용되지 않습니다.", "info");
      return;
    }
    setApplyingPresetKey(presetKey);
    clearToast();
    const result = await applyPresetMutation.mutateAsync({ presetKey, applyMode: "MERGE" });
    setApplyingPresetKey(null);
    if (!result.ok || !result.data) {
      showToast(result.message ?? "클럽 프리셋 적용에 실패했습니다.", "error");
      return;
    }
    setFeatures(cloneFeatures(result.data.features));
    setSavedFeatures(cloneFeatures(result.data.features));
    setSavedEnabledFeatureKeys(extractEnabledFeatureKeys(result.data.features));
    setLastTemplateResult(null);
    void operationsCatalogQuery.refetch();
    void invalidateClubQueries(queryClient, clubId);
    window.dispatchEvent(new Event("semo:club-features-updated"));
    const positionMessage = result.data.createdPositionNames.length > 0
      ? ` · ${result.data.createdPositionNames.join(", ")} 직책 생성`
      : "";
    showToast(`${result.data.displayName} 프리셋을 기존 설정에 추가했습니다${positionMessage}.`, "success");
  };

  const handleApplyTemplate = async (templateKey: string) => {
    if (!canPersist) {
      showToast("모의 모드에서는 템플릿이 적용되지 않습니다.", "info");
      return;
    }
    setApplyingTemplateKey(templateKey);
    clearToast();
    const result = await applyTemplateMutation.mutateAsync({ templateKey });
    setApplyingTemplateKey(null);
    if (!result.ok || !result.data) {
      showToast(result.message ?? "운영 템플릿 적용에 실패했습니다.", "error");
      return;
    }
    setLastTemplateResult(result.data);
    void invalidateClubQueries(queryClient, clubId);
    showToast(`${result.data.displayName} 업무와 체크리스트를 만들었습니다.`, "success");
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)] text-slate-900">
      <div className="relative min-h-screen bg-[#f8f6f6]">
        <ClubPageHeader
          title="기능 설정"
          subtitle={`모임 기능 • ${clubName}`}
          icon="tune"
          theme="admin"
          containerClassName="semo-page-admin"
          rightSlot={
            <div className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[var(--primary)] shadow-sm">
              {enabledFeatures.length}개 활성화
            </div>
          }
        />

        <main className="semo-page-admin semo-nav-bottom-space">
          <motion.section className="p-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">dashboard</span>
              <h2 className="text-lg font-bold">기능 개요</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] to-orange-300" />
                <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      활성화 기능
                    </p>
                    <h3 className="mt-3 text-2xl font-bold">
                      {enabledFeatures.length === 0
                        ? "아직 활성화된 기능이 없습니다."
                        : `${enabledFeatures.length}개 기능 사용 중`}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      활성화된 기능은 유저 더보기 메뉴에서 사용되고, 관리자 더보기 메뉴에서는 설정 화면으로 연결됩니다.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-orange-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
                        유저 더보기
                      </p>
                      <p className="mt-2 text-xl font-bold text-[var(--primary)]">
                        {userMoreItems.length}
                      </p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
                        대표 화면
                      </p>
                      <p className="mt-2 text-xl font-bold text-blue-700">
                        {representativeItems.length}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        관리자 도구
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {adminMoreItems.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section className="px-4 py-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">auto_awesome</span>
              <div>
                <h2 className="text-lg font-bold">클럽 프리셋</h2>
                <p className="mt-0.5 text-xs text-slate-500">현재 설정을 지우지 않고 추천 기능·홈 위젯·위임 직책을 추가합니다.</p>
              </div>
            </div>
            {!canPersist ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-center text-sm text-slate-500">
                실제 서버 연결 모드에서 프리셋과 템플릿을 적용할 수 있습니다.
              </div>
            ) : operationsCatalogQuery.isPending ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
                운영 프리셋을 불러오는 중입니다.
              </div>
            ) : operationsCatalogQuery.error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                운영 프리셋을 불러오지 못했습니다. 기능 설정은 계속 직접 편집할 수 있습니다.
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-3">
                {operationsCatalogQuery.data?.presets.map((preset) => (
                  <article key={preset.presetKey} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                        <span className="material-symbols-outlined" aria-hidden="true">{preset.iconName}</span>
                      </div>
                      {preset.includedInCurrentConfiguration ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">구성 포함</span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 text-lg font-black text-slate-900">{preset.displayName}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{preset.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {preset.featureDisplayNames.slice(0, 6).map((featureName) => (
                        <span key={featureName} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                          {featureName}
                        </span>
                      ))}
                      {preset.featureDisplayNames.length > 6 ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                          +{preset.featureDisplayNames.length - 6}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      위임 직책: {preset.delegatedPositionNames.join(" · ") || "없음"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset.presetKey)}
                      disabled={applyingPresetKey !== null || isSaving}
                      className="mt-auto w-full pt-5 disabled:opacity-50"
                    >
                      <span className="block w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800">
                        {applyingPresetKey === preset.presetKey ? "적용 중..." : "추천 구성 추가"}
                      </span>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section className="px-4 py-4" {...staggeredFadeUpMotion(2, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">checklist</span>
              <div>
                <h2 className="text-lg font-bold">운영 템플릿</h2>
                <p className="mt-0.5 text-xs text-slate-500">담당 업무와 표준 체크리스트를 즉시 생성합니다.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {operationsCatalogQuery.data?.templates.map((template) => {
                const missingFeatureKeys = template.requiredFeatureKeys.filter(
                  (featureKey) => !currentEnabledFeatureKeys.includes(featureKey),
                );
                return (
                  <article key={template.templateKey} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-[var(--primary)]">
                        <span className="material-symbols-outlined" aria-hidden="true">{template.iconName}</span>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                        {template.recurrenceFrequency === "WEEKLY"
                          ? "매주"
                          : template.recurrenceFrequency === "MONTHLY"
                            ? "매월"
                            : `기본 ${template.defaultDueDays}일`}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-black text-slate-900">{template.displayName}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{template.description}</p>
                    <ol className="mt-4 space-y-2">
                      {template.checklistItems.slice(0, 3).map((item, index) => (
                        <li key={item} className="flex gap-2 text-xs leading-5 text-slate-600">
                          <span className="font-black text-[var(--primary)]">{index + 1}</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                    {missingFeatureKeys.length > 0 ? (
                      <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                        먼저 활성화: {missingFeatureKeys.join(" · ")}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(template.templateKey)}
                      disabled={missingFeatureKeys.length > 0 || applyingTemplateKey !== null || isSaving}
                      className="mt-4 w-full rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-4 py-3 text-sm font-black text-[var(--primary)] transition hover:bg-[var(--primary)]/15 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {applyingTemplateKey === template.templateKey ? "업무 생성 중..." : "업무로 만들기"}
                    </button>
                  </article>
                );
              })}
            </div>
            {lastTemplateResult ? (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-emerald-900">{lastTemplateResult.displayName} 생성 완료</p>
                  <p className="mt-1 text-xs text-emerald-700">체크리스트 {lastTemplateResult.checklistItemCount}개가 포함되었습니다.</p>
                </div>
                <RouterLink href={lastTemplateResult.targetPath} className="semo-control bg-emerald-700 px-4 py-2.5 text-center text-xs font-black text-white">
                  할 일에서 확인
                </RouterLink>
              </div>
            ) : null}
          </motion.section>

          <motion.section className="px-4 py-4" {...staggeredFadeUpMotion(3, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">preview</span>
              <h2 className="text-lg font-bold">실제 메뉴 미리보기</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <NavigationPreview title="사용자 더보기" emptyLabel="사용자에게 표시할 독립 기능이 없습니다." items={userMoreItems} />
              <NavigationPreview title="관리자 운영 도구" emptyLabel="관리자 운영 도구가 없습니다." items={adminMoreItems} />
            </div>
            {representativeItems.length > 0 ? (
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="text-xs font-bold text-blue-700">대표 화면</p>
                <p className="mt-1 text-sm text-blue-900">
                  {representativeItems.map((item) => item.label).join(" · ")}
                </p>
              </div>
            ) : null}
          </motion.section>

          <motion.section className="px-4 py-4" {...staggeredFadeUpMotion(3, reduceMotion)}>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-orange-700" aria-hidden="true">account_tree</span>
                <div>
                  <h2 className="text-sm font-black text-orange-950">기능 조합 기준</h2>
                  <p className="mt-1 text-xs leading-5 text-orange-900/75">
                    출석은 일정과, 인수인계는 직책·권한과 함께 사용합니다. 대회–재정, 대진표–대회, 업무·재정·결정의 일정 연결은 선택 연동이므로 필요한 기능만 켤 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section className="px-4 py-4" {...staggeredFadeUpMotion(2, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">view_quilt</span>
              <h2 className="text-lg font-bold">활성화된 기능</h2>
            </div>
            <div className="flex flex-col gap-3">
              {enabledFeatures.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  아직 활성화된 기능이 없습니다.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDragCancel={() => {
                    setActiveFeatureKey(null);
                  }}
                >
                  <SortableContext
                    items={enabledFeatures.map((feature) => feature.featureKey)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-3">
                      {enabledFeatures.map((feature, index) => (
                        <EnabledFeatureCard
                          key={`${feature.featureKey || feature.adminPath || feature.userPath || "feature"}-${index}`}
                          feature={feature}
                          features={features}
                          activeFeatureKey={activeFeatureKey}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay dropAnimation={null}>
                    {activeFeature ? <EnabledFeatureOverlayCard feature={activeFeature} /> : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          </motion.section>

          <motion.section className="mb-8 px-4 py-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500" aria-hidden="true">add_box</span>
              <h2 className="text-lg font-bold">사용 가능 기능</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {disabledFeatures.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  현재 추가 가능한 기능이 더 없습니다.
                </div>
              ) : (
                disabledFeatures.map((feature, index) => (
                  <motion.article
                    key={`${feature.featureKey || feature.adminPath || feature.userPath || "feature"}-${index}`}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 shadow-sm transition-all hover:border-slate-300"
                    {...staggeredFadeUpMotion(index + 5, reduceMotion)}
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                        {feature.iconName}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{getFeatureDisplayName(feature)}</p>
                      <p className="line-clamp-2 text-xs text-slate-500">{getFeatureDescription(feature)}</p>
                      {(feature.requiredFeatureKeys ?? []).length > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          함께 활성화: {(feature.requiredFeatureKeys ?? []).map((key) => getFeatureName(key, features)).join(" · ")}
                        </p>
                      ) : feature.unavailableReason ? (
                        <p className="mt-1 text-xs font-semibold text-amber-700">{feature.unavailableReason}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(feature.featureKey)}
                      disabled={feature.available === false}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-xl bg-slate-200 px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">{feature.available === false ? "lock" : "add"}</span>
                      {feature.available === false ? "정책 필요" : "활성화"}
                    </button>
                  </motion.article>
                ))
              )}
            </div>
          </motion.section>
        </main>

        {isDirty ? (
          <div className="pointer-events-none fixed bottom-[76px] left-0 right-0 z-30 p-4">
            <div className="semo-page-admin pointer-events-auto">
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving}
                  aria-label="변경 사항 되돌리기"
                  title="변경 사항 되돌리기"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">restart_alt</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-[0_18px_36px_rgba(236,91,19,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {isSaving ? "progress_activity" : "save"}
                  </span>
                  {isSaving ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
