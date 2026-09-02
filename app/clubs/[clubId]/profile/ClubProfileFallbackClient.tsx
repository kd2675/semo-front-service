"use client";

import Image from "next/image";
import { startTransition, useRef, useState, type ChangeEvent } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { uploadTempImage } from "@/app/lib/imageUpload";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { getClubRoleLabel, getMembershipStatusLabel } from "@/app/lib/roleLabels";
import { updateClubProfileMutationOptions } from "@/app/lib/react-query/club/mutations";
import { clubProfileQueryOptions } from "@/app/lib/react-query/club/queries";
import { invalidateClubQueries } from "@/app/lib/react-query/common";

import { ClubProfileLoadingShell } from "../ClubRouteLoadingShells";

type ClubProfileFallbackClientProps = {
  clubId: string;
};

function formatProfileDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getClubRecordPresentation(record: { title: string; value: string }) {
  switch (record.title) {
    case "Club Name":
      return { title: "클럽 이름", value: record.value };
    case "Region":
      return { title: "활동 지역", value: record.value };
    case "Membership":
      return { title: "가입 상태", value: getMembershipStatusLabel(record.value) };
    case "Club Role":
      return { title: "클럽 역할", value: getClubRoleLabel(record.value) };
    case "Joined":
      return { title: "가입일", value: formatProfileDate(record.value) };
    default:
      return { title: record.title, value: record.value };
  }
}

export function ClubProfileFallbackClient({ clubId }: ClubProfileFallbackClientProps) {
  const queryClient = useQueryClient();
  const reduceMotion = useHydrationSafeReducedMotion();
  const { data: queryPayload, isPending, isError, error: queryError } = useQuery(
    clubProfileQueryOptions(clubId),
  );
  const [payloadState, setPayload] = useState<typeof queryPayload | null>(null);
  const [displayNameState, setDisplayName] = useState<string | null>(null);
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const updateProfileMutation = useMutation(updateClubProfileMutationOptions(clubId));
  const payload = payloadState ?? queryPayload ?? null;
  const displayName = displayNameState ?? payload?.clubProfile.displayName ?? "";
  const error =
    actionError ?? (isError ? getQueryErrorMessage(queryError, "프로필을 불러오지 못했습니다.") : null);

  const appProfile = payload?.appProfile;
  const clubProfile = payload?.clubProfile;

  const handleSelectAvatar = () => {
    if (savingAvatar) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setSavingAvatar(true);
    setActionError(null);
    const uploadResult = await uploadTempImage(file);
    if (!uploadResult.data?.fileName) {
      setSavingAvatar(false);
      setActionError(uploadResult.error ?? "프로필 사진 업로드에 실패했습니다.");
      return;
    }

    const updateResult = await updateProfileMutation.mutateAsync({
      avatarFileName: uploadResult.data.fileName,
      removeAvatar: false,
    });
    setSavingAvatar(false);
    if (!updateResult.ok || !updateResult.data) {
      setActionError(updateResult.message ?? "프로필 사진 저장에 실패했습니다.");
      return;
    }
    setPayload(updateResult.data);
    void invalidateClubQueries(queryClient, clubId);
  };

  const handleDeleteAvatar = async () => {
    if (!clubProfile?.avatarFileName || savingAvatar) {
      return;
    }
    setSavingAvatar(true);
    setActionError(null);
    const result = await updateProfileMutation.mutateAsync({ removeAvatar: true });
    setSavingAvatar(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "프로필 사진 삭제에 실패했습니다.");
      return;
    }
    setPayload(result.data);
    void invalidateClubQueries(queryClient, clubId);
  };

  const handleSaveDisplayName = async () => {
    if (!payload?.clubProfile || savingDisplayName || savingAvatar) {
      return;
    }
    const normalized = displayName.trim();
    if (!normalized) {
      setActionError("닉네임은 비워둘 수 없습니다.");
      return;
    }
    if (normalized === payload.clubProfile.displayName) {
      return;
    }

    setSavingDisplayName(true);
    setActionError(null);
    const result = await updateProfileMutation.mutateAsync({
      displayName: normalized,
      removeAvatar: false,
    });
    setSavingDisplayName(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "닉네임 저장에 실패했습니다.");
      return;
    }
    setPayload(result.data);
    setDisplayName(result.data.clubProfile.displayName ?? normalized);
    void invalidateClubQueries(queryClient, clubId);
  };

  if (isPending && !payload) {
    return <ClubProfileLoadingShell />;
  }

  return (
    <div className="min-h-full bg-[var(--background-light)] font-display text-slate-900">
      <div className="semo-page-user flex min-h-full flex-col">
        <ClubPageHeader title="내 프로필" icon="person" />

        <main className="semo-nav-bottom-space flex-1 space-y-6 px-4 py-5 md:px-6">
          {error ? (
            <motion.div
              className="rounded-[var(--radius-card)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
              {...staggeredFadeUpMotion(0, reduceMotion)}
            >
              {error}
            </motion.div>
          ) : null}

          <motion.section {...staggeredFadeUpMotion(0, reduceMotion)}>
            <p className="text-xs font-bold tracking-wide text-[var(--primary)]">앱 프로필</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
              {appProfile?.displayName ?? "SEMO 사용자"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {appProfile?.tagline ?? "앱 프로필 정보가 준비 중입니다."}
            </p>
          </motion.section>

          <motion.section className="semo-feature-surface p-5" {...staggeredFadeUpMotion(1, reduceMotion)}>
              <p className="text-xs font-semibold tracking-wide text-slate-500">클럽 프로필</p>
              <h3 className="mt-2 text-xl font-bold">{clubProfile?.displayName ?? payload?.clubName ?? "Club"}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {clubProfile?.tagline ?? clubProfile?.introText ?? "클럽 안에서 사용하는 프로필 정보입니다."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  {getClubRoleLabel(clubProfile?.roleCode)}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {getMembershipStatusLabel(clubProfile?.membershipStatus)}
                </span>
                <span className="text-sm text-slate-500">
                  {clubProfile?.joinedLabel ? formatProfileDate(clubProfile.joinedLabel) : "-"}
                </span>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-xs font-bold text-slate-600">프로필 편집</p>
              </div>
              <div className="mt-4 flex items-start gap-4">
                {clubProfile?.avatarImageUrl ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100 ring-2 ring-[var(--primary)]/10">
                    <Image
                      src={clubProfile.avatarImageUrl}
                      alt={clubProfile.displayName ?? "프로필 사진"}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10 text-base font-bold text-[var(--primary)] ring-2 ring-[var(--primary)]/10">
                    {(clubProfile?.displayName ?? payload?.clubName ?? "SE").slice(0, 2)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAvatar}
                      disabled={savingAvatar}
                      className="min-h-11 rounded-[var(--radius-control)] bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60"
                    >
                      {clubProfile?.avatarFileName ? "사진 변경" : "사진 업로드"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={!clubProfile?.avatarFileName || savingAvatar}
                      className="min-h-11 rounded-[var(--radius-control)] border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition disabled:opacity-50"
                    >
                      사진 삭제
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {savingAvatar ? "프로필 사진을 저장하는 중입니다." : "클럽 안에서 보이는 프로필 사진입니다."}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-400">클럽 닉네임</span>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={displayName}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        startTransition(() => {
                          setDisplayName(nextValue);
                        });
                      }}
                      className="h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[var(--primary)]"
                      placeholder="클럽 안에서 보여줄 닉네임"
                      aria-label="클럽 닉네임"
                      maxLength={100}
                    />
                    <button
                      type="button"
                      onClick={handleSaveDisplayName}
                      disabled={savingDisplayName || savingAvatar}
                      className="h-11 rounded-[var(--radius-control)] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingDisplayName ? "저장 중" : "닉네임 저장"}
                    </button>
                  </div>
                </label>
              </div>
          </motion.section>

          <section className="pb-6">
            <div className="mb-3">
              <h2 className="text-base font-black text-slate-900">가입 정보</h2>
              <p className="mt-1 text-xs text-slate-500">이 클럽에서의 소속과 역할 정보입니다.</p>
            </div>
            <dl className="semo-list">
              {(payload?.clubRecords ?? []).map((record, index) => {
                const presentation = getClubRecordPresentation(record);
                return (
                  <motion.div
                    key={record.id}
                    className="semo-list-row items-start justify-between gap-5"
                    {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                  >
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold tracking-wide text-slate-500">{presentation.title}</dt>
                      <p className="mt-1 text-xs text-slate-500">{record.description}</p>
                    </div>
                    <dd className="max-w-[55%] text-right text-sm font-extrabold text-slate-900">{presentation.value}</dd>
                  </motion.div>
                );
              })}
            </dl>
          </section>
        </main>

        <input
          ref={fileInputRef}
          type="file"
          aria-label="프로필 사진 선택"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFileChange}
        />

      </div>
    </div>
  );
}
