"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { startTransition, useRef, useState, type ChangeEvent } from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { uploadTempImage } from "@/app/lib/imageUpload";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { getQueryErrorMessage } from "@/app/lib/query-utils";
import { updateClubProfileMutationOptions } from "@/app/lib/react-query/club/mutations";
import { clubProfileQueryOptions } from "@/app/lib/react-query/club/queries";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import { ClubProfileLoadingShell } from "../ClubRouteLoadingShells";

type ClubProfileFallbackClientProps = {
  clubId: string;
};

export function ClubProfileFallbackClient({ clubId }: ClubProfileFallbackClientProps) {
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
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
      <div className="mx-auto flex min-h-full max-w-md flex-col bg-white shadow-xl">
        <ClubPageHeader title="내 프로필" icon="person" />

        <main className="semo-nav-bottom-space flex-1">
          {error ? (
            <motion.div
              className="mx-4 mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
              {...staggeredFadeUpMotion(0, reduceMotion)}
            >
              {error}
            </motion.div>
          ) : null}

          <motion.section className="px-4 py-6" {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">App Profile</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                {appProfile?.displayName ?? "SEMO User"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {appProfile?.tagline ?? "앱 프로필 정보가 준비 중입니다."}
              </p>
            </div>
          </motion.section>

          <motion.section className="px-4 pb-6" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Club Profile</p>
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
                      className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {clubProfile?.avatarFileName ? "사진 변경" : "사진 업로드"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={!clubProfile?.avatarFileName || savingAvatar}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50"
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
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Club Nickname</span>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={displayName}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        startTransition(() => {
                          setDisplayName(nextValue);
                        });
                      }}
                      className="h-11 flex-1 rounded-[8px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[var(--primary)]"
                      placeholder="클럽 안에서 보여줄 닉네임"
                      maxLength={100}
                    />
                    <button
                      type="button"
                      onClick={handleSaveDisplayName}
                      disabled={savingDisplayName || savingAvatar}
                      className="h-11 rounded-[8px] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingDisplayName ? "저장 중" : "저장"}
                    </button>
                  </div>
                </label>
              </div>
              <h3 className="mt-3 text-xl font-bold">{clubProfile?.displayName ?? payload?.clubName ?? "Club"}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {clubProfile?.tagline ?? clubProfile?.introText ?? "클럽 안에서 사용하는 프로필 정보입니다."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  {clubProfile?.roleCode ?? "MEMBER"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {clubProfile?.membershipStatus ?? "ACTIVE"}
                </span>
                <span className="text-sm text-slate-500">
                  {clubProfile?.joinedLabel ?? "-"}
                </span>
              </div>
            </div>
          </motion.section>

          <section className="px-4 pb-12">
            <div className="grid grid-cols-2 gap-4">
              {(payload?.clubRecords ?? []).map((record, index) => (
                <motion.article
                  key={record.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                  {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {record.title}
                  </p>
                  <p className="mt-2 text-xl font-extrabold tracking-tight">{record.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{record.description}</p>
                </motion.article>
              ))}
            </div>
          </section>
        </main>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFileChange}
        />

        {payload?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
      </div>
    </div>
  );
}
