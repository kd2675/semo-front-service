"use client";

import { Manrope } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { useAppToast } from "@/app/hooks/useAppToast";
import {
  updateClubAdminMemberDirectorySettings,
  type ClubAdminMemberDirectorySettingsResponse,
  type ClubMemberDirectoryMember,
  type ClubMemberDirectorySettings,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["700", "800"],
});

type ClubAdminMemberDirectoryClientProps = {
  clubId: string;
  initialData: ClubAdminMemberDirectorySettingsResponse;
};

type VisibilityItem = {
  key: keyof ClubMemberDirectorySettings;
  title: string;
  description: string;
  icon: string;
  impact: string;
  hint: string;
};

type PreviewTone = {
  railClassName: string;
  avatarClassName: string;
  labelClassName: string;
  label: string;
};

const VISIBILITY_ITEMS: VisibilityItem[] = [
  {
    key: "showPositions",
    title: "직책 노출",
    description: "회원 카드에서 직책 칩을 보여줍니다.",
    icon: "badge",
    impact: "탐색성 상승",
    hint: "운영진과 역할 보유 멤버를 빠르게 찾을 수 있습니다.",
  },
  {
    key: "showTagline",
    title: "한줄소개 노출",
    description: "회원이 작성한 짧은 소개 문구를 보여줍니다.",
    icon: "short_text",
    impact: "개성 강조",
    hint: "멤버의 관심사와 분위기를 카드 한 장에서 전달합니다.",
  },
  {
    key: "showRecentActivity",
    title: "최근 활동 노출",
    description: "가장 최근 활동 로그 1건을 카드에 함께 노출합니다.",
    icon: "history",
    impact: "맥락 제공",
    hint: "지금 어떤 멤버가 움직이고 있는지 카드에서 바로 읽힙니다.",
  },
];

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#9b7b62]">
      {children}
    </p>
  );
}

function DirectoryStatChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`${manrope.className} mt-2 text-xl font-extrabold tracking-tight text-slate-950`}>
        {value}
      </p>
    </article>
  );
}

function SettingToggleButton({
  checked,
  disabled = false,
  label,
  onClick,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative mt-1 inline-flex h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-[#ec5b13]" : "bg-slate-200"
      } ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
      aria-label={label}
      aria-pressed={checked}
    >
      <span
        className={`absolute left-0 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function VisibilitySettingCard({
  item,
  enabled,
  disabled = false,
  onToggle,
}: {
  item: VisibilityItem;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f9fafb_100%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${
        disabled ? "opacity-80" : ""
      }`}
    >
      <div
        className={`absolute inset-y-4 left-0 w-1 rounded-r-full ${
          enabled ? "bg-[#ec5b13]" : "bg-slate-200"
        }`}
      />

      <div className="flex items-start gap-3 pl-2">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-[18px] ${
            enabled ? "bg-[#fff1e4] text-[#ec5b13]" : "bg-slate-100 text-slate-400"
          }`}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{item.title}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                enabled ? "bg-[#ec5b13]/10 text-[#b4541a]" : "bg-slate-100 text-slate-500"
              }`}
            >
              {enabled ? "ON" : "OFF"}
            </span>
          </div>
          <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                enabled ? "bg-[#fff1e4] text-[#b4541a]" : "bg-slate-100 text-slate-500"
              }`}
            >
              {item.impact}
            </span>
            <p className="text-[11px] leading-5 text-slate-400">{item.hint}</p>
          </div>
          <p className="mt-3 text-[11px] font-semibold text-slate-400">
            현재 상태: {enabled ? "노출" : "숨김"}
          </p>
        </div>

        <SettingToggleButton
          checked={enabled}
          disabled={disabled}
          label={`${item.title} ${enabled ? "끄기" : "켜기"}`}
          onClick={onToggle}
        />
      </div>
    </article>
  );
}

function VisibilityInsightCard({
  enabledCount,
  totalCount,
}: {
  enabledCount: number;
  totalCount: number;
}) {
  const hiddenCount = Math.max(totalCount - enabledCount, 0);

  return (
    <article className="relative overflow-hidden rounded-[32px] border border-[#f1d8c4] bg-[linear-gradient(150deg,#fff2e7_0%,#fff9f3_60%,#f3f7fb_100%)] p-5 shadow-[0_18px_42px_rgba(236,91,19,0.1)]">
      <div className="absolute -right-6 bottom-0 text-[72px] font-black tracking-[-0.08em] text-[#ec5b13]/8">
        SEMO
      </div>

      <div className="relative">
        <SectionEyebrow>Privacy vs. Engagement</SectionEyebrow>
        <div className="mt-2 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[18px] bg-white text-[#ec5b13] shadow-sm">
            <span className="material-symbols-outlined">visibility</span>
          </div>

          <div>
            <h3 className={`${manrope.className} text-xl font-extrabold tracking-tight text-slate-950`}>
              공개 범위가 넓을수록 멤버 참여와 발견은 쉬워집니다.
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              직책과 최근 활동은 디렉터리를 더 풍부하게 만들고, 소개를 줄이면 카드 밀도는 더 단정해집니다.
              프리뷰에서 공개 범위와 카드 호흡의 균형을 먼저 확인한 뒤 저장하세요.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <DirectoryStatChip label="노출 설정" value={`${enabledCount}개`} />
          <DirectoryStatChip label="숨김 설정" value={`${hiddenCount}개`} />
        </div>
      </div>
    </article>
  );
}

function getPreviewTone(
  member: ClubMemberDirectoryMember,
  settings: ClubMemberDirectorySettings,
): PreviewTone {
  if (settings.showPositions && member.roleLabel === "오너") {
    return {
      railClassName: "from-slate-950 via-slate-700 to-[#135bec]",
      avatarClassName: "from-slate-900 to-[#135bec]",
      labelClassName: "bg-slate-900 text-white",
      label: "핵심 운영",
    };
  }

  if (settings.showPositions && member.roleLabel === "어드민") {
    return {
      railClassName: "from-[#135bec] via-blue-500 to-sky-400",
      avatarClassName: "from-[#135bec] to-sky-500",
      labelClassName: "bg-[#135bec]/10 text-[#135bec]",
      label: "운영 멤버",
    };
  }

  if (settings.showPositions && member.positions.length > 0) {
    return {
      railClassName: "from-sky-500 via-cyan-400 to-blue-300",
      avatarClassName: "from-sky-500 to-cyan-400",
      labelClassName: "bg-sky-50 text-sky-700",
      label: "직책 보유",
    };
  }

  if (settings.showRecentActivity && member.recentActivity) {
    return {
      railClassName: "from-emerald-500 via-teal-400 to-cyan-300",
      avatarClassName: "from-emerald-500 to-teal-400",
      labelClassName: "bg-emerald-50 text-emerald-700",
      label: "최근 활동",
    };
  }

  return {
    railClassName: "from-slate-300 via-slate-200 to-slate-100",
    avatarClassName: "from-slate-500 to-slate-400",
    labelClassName: "bg-slate-100 text-slate-600",
    label: "멤버 카드",
  };
}

function MemberAvatar({
  member,
  avatarClassName,
}: {
  member: ClubMemberDirectoryMember;
  avatarClassName: string;
}) {
  if (member.avatarImageUrl) {
    return (
      <div
        className="size-14 shrink-0 rounded-[22px] bg-cover bg-center shadow-[0_14px_28px_rgba(15,23,42,0.14)] ring-2 ring-white/90"
        style={{
          backgroundImage: `url('${member.avatarImageUrl}')`,
        }}
      />
    );
  }

  return (
    <div
      className={`flex size-14 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br ${avatarClassName} text-sm font-black text-white shadow-[0_16px_28px_rgba(15,23,42,0.14)] ring-2 ring-white/90`}
    >
      {member.displayName.slice(0, 2)}
    </div>
  );
}

function AdminPreviewCard({
  member,
  settings,
}: {
  member: ClubMemberDirectoryMember;
  settings: ClubMemberDirectorySettings;
}) {
  const tone = getPreviewTone(member, settings);

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
      <div className={`h-1.5 bg-gradient-to-r ${tone.railClassName}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <MemberAvatar member={member} avatarClassName={tone.avatarClassName} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`${manrope.className} truncate text-lg font-extrabold tracking-tight text-slate-950`}>
                {member.displayName}
              </h3>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${tone.labelClassName}`}
              >
                {tone.label}
              </span>
            </div>

            {settings.showTagline && member.tagline ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">{member.tagline}</p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {settings.showTagline ? "한줄소개 없음" : "한줄소개 숨김"}
              </p>
            )}
          </div>
        </div>

        {settings.showPositions ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {member.positions.length > 0 ? (
              member.positions.map((position) => (
                <span
                  key={`${member.clubProfileId}-${position.clubPositionId}`}
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: position.colorHex ? `${position.colorHex}1A` : "#f1f5f9",
                    color: position.colorHex ?? "#475569",
                  }}
                >
                  {position.displayName}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                {member.roleLabel}
              </span>
            )}
          </div>
        ) : null}

        <div className="mt-4 rounded-[22px] border border-slate-200/80 bg-slate-50/80 px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Recent Activity
            </p>
            <span className="material-symbols-outlined text-[18px] text-slate-300">history</span>
          </div>

          {settings.showRecentActivity && member.recentActivity ? (
            <>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {member.recentActivity.detail}
              </p>
              <p className="mt-1 text-xs text-slate-500">{member.recentActivity.createdAtLabel}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              {settings.showRecentActivity ? "최근 활동 없음" : "최근 활동 숨김"}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ClubAdminMemberDirectoryClient({
  clubId,
  initialData,
}: ClubAdminMemberDirectoryClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [settings, setSettings] = useState(initialData.settings);
  const [savedSettings, setSavedSettings] = useState(initialData.settings);
  const [saving, setSaving] = useState(false);
  const { showToast, clearToast } = useAppToast();

  const previewMembers = useMemo(() => initialData.previewMembers.slice(0, 3), [initialData.previewMembers]);
  const enabledVisibilityCount = useMemo(
    () => VISIBILITY_ITEMS.filter((item) => settings[item.key]).length,
    [settings],
  );
  const hasPendingChanges = useMemo(
    () => VISIBILITY_ITEMS.some((item) => settings[item.key] !== savedSettings[item.key]),
    [savedSettings, settings],
  );

  const handleToggle = (key: keyof ClubMemberDirectorySettings) => {
    if (saving) {
      return;
    }
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleSave = async () => {
    if (saving || !hasPendingChanges) {
      return;
    }

    setSaving(true);
    clearToast();
    const result = await updateClubAdminMemberDirectorySettings(clubId, {
      showPositions: settings.showPositions,
      showTagline: settings.showTagline,
      showRecentActivity: settings.showRecentActivity,
    });
    setSaving(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "회원 디렉터리 설정을 저장하지 못했습니다.", "error");
      return;
    }

    setSettings(result.data.settings);
    setSavedSettings(result.data.settings);
    showToast("회원 디렉터리 설정을 저장했습니다.", "success");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f2_0%,#f8f6f6_46%,#eef2f6_100%)] text-slate-900">
      <div className="mx-auto min-h-screen max-w-md bg-[linear-gradient(180deg,rgba(255,248,242,0.68)_0%,rgba(248,246,246,0.94)_26%,#f8f6f6_100%)] pb-40">
        <ClubPageHeader
          title="회원 디렉터리 설정"
          subtitle={initialData.clubName}
          icon="groups"
          theme="admin"
          containerClassName="max-w-md"
          className="bg-[#f8f6f6]/88"
        />

        <main className="semo-nav-bottom-space space-y-5 px-4 pt-4">
          <motion.section
            className="relative overflow-hidden rounded-[32px] border border-[#f3d8c6] bg-[linear-gradient(160deg,#fff8f2_0%,#fffdf9_52%,#eef3f8_100%)] p-6 shadow-[0_22px_60px_rgba(236,91,19,0.08)]"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="absolute -right-8 -top-10 size-32 rounded-full bg-[#ec5b13]/10 blur-3xl" />
            <div className="absolute -bottom-10 left-6 size-24 rounded-full bg-[#135bec]/8 blur-3xl" />

            <div className="relative">
              <SectionEyebrow>Admin Console</SectionEyebrow>
              <h2 className={`${manrope.className} mt-3 text-[2rem] font-extrabold leading-[1.05] tracking-tight text-slate-950`}>
                공개 범위와 카드 구성을
                <br />
                한 번에 조정합니다.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                회원용 More 화면에 보이는 프로필 요소를 조정합니다. 현재 활성 회원{" "}
                {initialData.totalMemberCount}명에게 같은 규칙이 적용됩니다.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <DirectoryStatChip
                  label="활성 컨트롤"
                  value={`${enabledVisibilityCount}/${VISIBILITY_ITEMS.length}`}
                />
                <DirectoryStatChip label="반영 대상" value={`${initialData.totalMemberCount}명`} />
              </div>
            </div>
          </motion.section>

          <motion.section
            className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="border-b border-slate-200/80 px-5 py-4">
              <SectionEyebrow>Visibility Controls</SectionEyebrow>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div>
                  <h3 className={`${manrope.className} text-xl font-extrabold tracking-tight text-slate-950`}>
                    컨트롤 카드
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    직책, 소개, 활동 노출 기준을 회원 카드 단위로 설정합니다.
                  </p>
                </div>
                <span className="rounded-full bg-[#fff1e4] px-3 py-1 text-[11px] font-bold text-[#b4541a]">
                  즉시 미리보기
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4">
              {VISIBILITY_ITEMS.map((item, index) => (
                <motion.div
                  key={item.key}
                  {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                >
                  <VisibilitySettingCard
                    item={item}
                    enabled={settings[item.key]}
                    disabled={saving}
                    onToggle={() => handleToggle(item.key)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section {...staggeredFadeUpMotion(5, reduceMotion)}>
            <VisibilityInsightCard
              enabledCount={enabledVisibilityCount}
              totalCount={VISIBILITY_ITEMS.length}
            />
          </motion.section>

          <motion.section
            className="overflow-hidden rounded-[32px] border border-slate-200 bg-[#fffdfb] shadow-[0_20px_44px_rgba(15,23,42,0.07)]"
            {...staggeredFadeUpMotion(6, reduceMotion)}
          >
            <div className="border-b border-slate-200/80 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionEyebrow>Live Preview</SectionEyebrow>
                  <h3 className={`${manrope.className} mt-2 text-xl font-extrabold tracking-tight text-slate-950`}>
                    회원용 카드 미리보기
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    토글 상태에 따라 카드 정보가 바로 바뀝니다.
                  </p>
                </div>

                <div className="rounded-[20px] border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Preview
                  </p>
                  <p className={`${manrope.className} mt-1 text-2xl font-extrabold tracking-tight text-slate-950`}>
                    {previewMembers.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-[linear-gradient(180deg,#fffdfb_0%,#f5f8fb_100%)] p-4">
              {previewMembers.map((member) => (
                <AdminPreviewCard
                  key={member.clubProfileId}
                  member={member}
                  settings={settings}
                />
              ))}
            </div>
          </motion.section>
        </main>

        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-40 px-4">
          <div className="pointer-events-auto mx-auto max-w-md rounded-[28px] border border-slate-200/80 bg-white/92 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.14)] backdrop-blur">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !hasPendingChanges}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#ec5b13] px-4 py-4 text-sm font-bold text-white shadow-[0_18px_30px_rgba(236,91,19,0.28)] transition hover:bg-[#d85211] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {saving ? "저장 중..." : hasPendingChanges ? "회원 디렉터리 설정 저장" : "변경사항 없음"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
