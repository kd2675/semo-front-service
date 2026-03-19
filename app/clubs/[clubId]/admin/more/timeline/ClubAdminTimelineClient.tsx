"use client";

import { RouterLink } from "@/app/components/RouterLink";
import {
  updateClubAdminTimeline,
  type ClubAdminTimelineResponse,
} from "@/app/lib/clubs";
import { getNoticeAccentClasses } from "@/app/lib/notice-category";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubAdminTimelineClientProps = {
  clubId: string;
  initialData: ClubAdminTimelineResponse;
};

export function ClubAdminTimelineClient({
  clubId,
  initialData,
}: ClubAdminTimelineClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [categories, setCategories] = useState(initialData.categories);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const visibleCount = useMemo(
    () => categories.filter((category) => category.visibleInTimeline).length,
    [categories],
  );
  const initialVisibleKeys = useMemo(
    () =>
      initialData.categories
        .filter((category) => category.visibleInTimeline)
        .map((category) => category.categoryKey)
        .sort(),
    [initialData.categories],
  );
  const currentVisibleKeys = useMemo(
    () =>
      categories
        .filter((category) => category.visibleInTimeline)
        .map((category) => category.categoryKey)
        .sort(),
    [categories],
  );
  const isDirty = useMemo(
    () =>
      initialVisibleKeys.length !== currentVisibleKeys.length ||
      initialVisibleKeys.some((key, index) => key !== currentVisibleKeys[index]),
    [currentVisibleKeys, initialVisibleKeys],
  );

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    const result = await updateClubAdminTimeline(clubId, {
      visibleCategoryKeys: categories
        .filter((category) => category.visibleInTimeline)
        .map((category) => category.categoryKey),
    });
    setSaving(false);

    if (!result.ok || !result.data) {
      setFeedback(result.message ?? "타임라인 설정 저장에 실패했습니다.");
      return;
    }

    setCategories(result.data.categories);
    setFeedback("타임라인 카테고리 노출 설정을 저장했습니다.");
  };

  return (
    <div className="min-h-screen bg-[#f8f6f6] text-slate-900">
      <div className="mx-auto min-h-screen max-w-md bg-[#f8f6f6] pb-28">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f8f6f6]/90 backdrop-blur-md">
          <div className="flex items-center justify-between p-4">
            <RouterLink
              href={`/clubs/${clubId}/admin`}
              className="flex size-10 items-center justify-center rounded-full text-slate-900 transition hover:bg-white"
              aria-label="관리자 홈으로 돌아가기"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </RouterLink>
            <h1 className="flex-1 text-center text-lg font-bold tracking-tight">타임라인 설정</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="semo-nav-bottom-space space-y-4 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              노출 카테고리
            </p>
            <h2 className="mt-3 text-2xl font-bold">{visibleCount}개</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              타임라인 피드는 공지 데이터를 그대로 사용합니다. 여기서는 어떤 공지 카테고리를
              타임라인에서 보여줄지만 정합니다.
            </p>
          </motion.section>

          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="space-y-3">
              {categories.map((category, index) => {
                const accent = getNoticeAccentClasses(category.accentTone);
                return (
                  <motion.label
                    key={category.categoryKey}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                    {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${accent.icon}`}>
                        <span className="material-symbols-outlined">{category.iconName}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {category.displayName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {category.visibleInTimeline ? "타임라인에 노출 중" : "타임라인에서 숨김"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCategories((current) =>
                          current.map((item) =>
                            item.categoryKey === category.categoryKey
                              ? { ...item, visibleInTimeline: !item.visibleInTimeline }
                              : item,
                          ),
                        )
                      }
                      className={`relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full p-0.5 transition-colors ${
                        category.visibleInTimeline ? "bg-[#ec5b13]" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`h-full w-[27px] rounded-full bg-white shadow-md transition-transform ${
                          category.visibleInTimeline ? "translate-x-[20px]" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </motion.label>
                );
              })}
            </div>
          </motion.section>
        </main>

        {isDirty ? (
          <div className="pointer-events-none fixed bottom-[76px] left-0 right-0 z-30 p-4">
            <div className="pointer-events-auto mx-auto max-w-md">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ec5b13] py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-[0_18px_36px_rgba(236,91,19,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="material-symbols-outlined">
                  {saving ? "progress_activity" : "save"}
                </span>
                {saving ? "저장 중..." : "변경사항 저장"}
              </button>
              {feedback ? (
                <p className="mt-3 text-center text-xs font-medium text-slate-500">
                  {feedback}
                </p>
              ) : null}
            </div>
          </div>
        ) : feedback ? (
          <div className="pointer-events-none fixed bottom-[92px] left-0 right-0 z-30 p-4">
            <p className="pointer-events-auto mx-auto max-w-md rounded-full bg-white/90 px-4 py-2 text-center text-xs font-medium text-slate-500 shadow-sm backdrop-blur-sm">
              {feedback}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
