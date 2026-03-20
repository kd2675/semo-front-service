"use client";

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
import { Public_Sans } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { startTransition, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  updateClubFeatures,
  type ClubFeatureSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

function extractEnabledFeatureKeys(features: ClubFeatureSummary[]) {
  return features
    .filter((feature) => feature.enabled)
    .map((feature) => feature.featureKey);
}

function cloneFeatures(features: ClubFeatureSummary[]) {
  return features.map((feature) => ({ ...feature }));
}

function getFeatureDisplayName(feature: ClubFeatureSummary) {
  return feature.displayName;
}

function getFeatureDescription(feature: ClubFeatureSummary) {
  return feature.description ?? "";
}

type ClubAdminMenuClientProps = {
  clubId: string;
  clubName: string;
  initialFeatures: ClubFeatureSummary[];
  canPersist?: boolean;
};

type EnabledFeatureCardProps = {
  feature: ClubFeatureSummary;
  activeFeatureKey: string | null;
  onToggle: (featureKey: string) => void;
};

function EnabledFeatureCard({
  feature,
  activeFeatureKey,
  onToggle,
}: EnabledFeatureCardProps) {
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
      className={`relative flex min-h-[88px] items-center gap-3 rounded-xl border bg-white px-4 py-4 shadow-sm transition-colors ${
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
        className="flex size-8 touch-none shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        aria-label={`${getFeatureDisplayName(feature)} 순서 변경 핸들`}
        title="드래그해서 순서를 바꿀 수 있습니다."
      >
        <span className="font-mono text-sm font-bold tracking-[-0.2em]">::</span>
      </button>
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
        <span className="material-symbols-outlined">{feature.iconName}</span>
      </div>
      <div className="flex flex-1 flex-col">
        <p className="text-base font-bold">{getFeatureDisplayName(feature)}</p>
        <p className="text-sm text-slate-500">{getFeatureDescription(feature)}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggle(feature.featureKey)}
        className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/20"
      >
        비활성화
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
          <span className="material-symbols-outlined">{feature.iconName}</span>
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

export function ClubAdminMenuClient({
  clubId,
  clubName,
  initialFeatures,
  canPersist = true,
}: ClubAdminMenuClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [features, setFeatures] = useState(() => cloneFeatures(initialFeatures));
  const [savedFeatures, setSavedFeatures] = useState(() => cloneFeatures(initialFeatures));
  const [savedEnabledFeatureKeys, setSavedEnabledFeatureKeys] = useState<string[]>(
    () => extractEnabledFeatureKeys(initialFeatures),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [activeFeatureKey, setActiveFeatureKey] = useState<string | null>(null);
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

  useEffect(() => {
    if (!alertMessage) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setAlertMessage(null);
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [alertMessage]);

  const enabledFeatures = useMemo(
    () => features.filter((feature) => feature.enabled),
    [features],
  );
  const disabledFeatures = useMemo(
    () => features.filter((feature) => !feature.enabled),
    [features],
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

  const handleToggle = (featureKey: string) => {
    startTransition(() => {
      setFeatures((current) => {
        const toggled = current.map((feature) =>
          feature.featureKey === featureKey
            ? { ...feature, enabled: !feature.enabled }
            : feature,
        );
        const nextEnabled = toggled.filter((feature) => feature.enabled);
        const nextDisabled = toggled.filter((feature) => !feature.enabled);
        return [...nextEnabled, ...nextDisabled];
      });
    });
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
      setFeedback("모의 모드에서는 저장되지 않습니다.");
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    setAlertMessage(null);
    const result = await updateClubFeatures(clubId, {
      enabledFeatureKeys: features
        .filter((feature) => feature.enabled)
        .map((feature) => feature.featureKey),
    });
    setIsSaving(false);

    if (!result.ok || !result.data) {
      setFeedback(result.message ?? "기능 설정 저장에 실패했습니다.");
      return;
    }

    setFeatures(cloneFeatures(result.data));
    setSavedFeatures(cloneFeatures(result.data));
    setSavedEnabledFeatureKeys(extractEnabledFeatureKeys(result.data));
    setFeedback(null);
    setAlertMessage("기능 설정이 저장되었습니다.");
    window.dispatchEvent(new Event("semo:club-features-updated"));
  };

  const handleReset = () => {
    setActiveFeatureKey(null);
    setFeatures(cloneFeatures(savedFeatures));
    setFeedback("변경 사항을 되돌렸습니다.");
  };

  return (
    <div
      className={`${publicSans.className} min-h-screen bg-[#f8f6f6] text-slate-900`}
      style={
        {
          "--primary": "#ec5b13",
          "--background-light": "#f8f6f6",
        } as CSSProperties
      }
    >
      <div className="relative min-h-screen bg-[#f8f6f6]">
        <ClubPageHeader
          title="기능 설정"
          subtitle={`모임 기능 • ${clubName}`}
          icon="tune"
          theme="admin"
          containerClassName="max-w-5xl"
          rightSlot={
            <div className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[var(--primary)] shadow-sm">
              {enabledFeatures.length}개 활성화
            </div>
          }
        />

        <main className="semo-nav-bottom-space mx-auto w-full max-w-5xl">
          <motion.section className="p-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">dashboard</span>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-orange-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
                        유저 더보기
                      </p>
                      <p className="mt-2 text-xl font-bold text-[var(--primary)]">
                        {enabledFeatures.length}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        비활성
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {disabledFeatures.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section className="px-4 py-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">view_quilt</span>
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
                      {enabledFeatures.map((feature) => (
                        <EnabledFeatureCard
                          key={feature.featureKey}
                          feature={feature}
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
              <span className="material-symbols-outlined text-slate-500">add_box</span>
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
                    key={feature.featureKey}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 shadow-sm transition-all hover:border-slate-300"
                    {...staggeredFadeUpMotion(index + 5, reduceMotion)}
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                      <span className="material-symbols-outlined text-[22px]">
                        {feature.iconName}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{getFeatureDisplayName(feature)}</p>
                      <p className="line-clamp-2 text-xs text-slate-500">{getFeatureDescription(feature)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(feature.featureKey)}
                      className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-300"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      활성화
                    </button>
                  </motion.article>
                ))
              )}
            </div>
          </motion.section>
        </main>

        {isDirty ? (
          <div className="pointer-events-none fixed bottom-[76px] left-0 right-0 z-30 p-4">
            <div className="pointer-events-auto mx-auto max-w-5xl">
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving}
                  aria-label="변경 사항 되돌리기"
                  title="변경 사항 되돌리기"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-[0_18px_36px_rgba(236,91,19,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined">
                    {isSaving ? "progress_activity" : "save"}
                  </span>
                  {isSaving ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>
              {feedback ? (
                <p className="mt-3 text-center text-xs font-medium text-slate-500">
                  {feedback}
                </p>
              ) : null}
            </div>
          </div>
        ) : feedback ? (
          <div className="pointer-events-none fixed bottom-[92px] left-0 right-0 z-30 p-4">
            <p className="pointer-events-auto mx-auto max-w-xl rounded-full bg-white/90 px-4 py-2 text-center text-xs font-medium text-slate-500 shadow-sm backdrop-blur-sm">
              {feedback}
            </p>
          </div>
        ) : null}
      </div>
      {alertMessage ? (
        <div className="pointer-events-none fixed inset-x-0 top-5 z-[70] flex justify-center px-4">
          <div className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {alertMessage}
          </div>
        </div>
      ) : null}
    </div>
  );
}
