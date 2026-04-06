"use client";

import { Public_Sans } from "next/font/google";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { CSSProperties } from "react";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubRegionField } from "@/app/components/ClubRegionField";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import { updateClubSettings, type MyClubSummary } from "@/app/lib/clubs";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ClubAdminSettingsClientProps = {
  clubId: string;
  initialClub: MyClubSummary;
};

export function ClubAdminSettingsClient({ clubId, initialClub }: ClubAdminSettingsClientProps) {
  const router = useRouter();
  const [club, setClub] = useState(initialClub);
  const [regionScope, setRegionScope] = useState(initialClub.regionScope);
  const [regionDepth1Code, setRegionDepth1Code] = useState(initialClub.regionDepth1Code);
  const [regionDepth2Code, setRegionDepth2Code] = useState(initialClub.regionDepth2Code);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { toast, showToast } = useEphemeralToast();

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const result = await updateClubSettings(clubId, {
        regionScope,
        regionDepth1Code,
        regionDepth2Code,
      });

      if (!result.ok || !result.data) {
        setFeedback(result.message ?? "모임 기본 정보 저장에 실패했습니다.");
        return;
      }
      const updatedClub = result.data;

      startTransition(() => {
        setClub(updatedClub);
        setRegionScope(updatedClub.regionScope);
        setRegionDepth1Code(updatedClub.regionDepth1Code);
        setRegionDepth2Code(updatedClub.regionDepth2Code);
      });
      showToast("활동 지역을 저장했습니다.");
    } finally {
      setIsSaving(false);
    }
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
      <ClubPageHeader
        title="기본 정보"
        subtitle={club.name}
        icon="tune"
        theme="admin"
        containerClassName="max-w-3xl"
        leftSlot={(
          <button
            type="button"
            onClick={() => router.push(`/clubs/${clubId}/admin`)}
            className="flex size-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
            aria-label="관리자 홈으로 돌아가기"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
      />

      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Club Region</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">대표 활동 권역</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                모임의 대표 활동 지역을 저장합니다. 공지나 일정의 개별 장소와는 별도로 관리됩니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Current</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{club.regionLabel ?? "전국"}</p>
            </div>
          </div>

          <div className="mt-6">
            <ClubRegionField
              value={{ regionScope, regionDepth1Code, regionDepth2Code }}
              onChange={(nextValue) => {
                setRegionScope(nextValue.regionScope);
                setRegionDepth1Code(nextValue.regionDepth1Code);
                setRegionDepth2Code(nextValue.regionDepth2Code);
              }}
              disabled={isSaving}
              helperText="클럽 카드, 가입 모달, 탐색 화면에 공통으로 노출되는 기본 지역입니다."
            />
          </div>
        </section>

        {feedback ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {feedback}
          </section>
        ) : null}

        <section className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/clubs/${clubId}/admin`)}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200"
          >
            돌아가기
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--primary)]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </section>
      </main>

      <EphemeralToast toastId={toast?.id ?? null} message={toast?.message ?? null} tone={toast?.tone} />
    </div>
  );
}
