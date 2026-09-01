"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubClassificationField } from "@/app/components/ClubClassificationField";
import { ClubGrowthCoreMark } from "@/app/components/ClubGrowthCoreMark";
import { ClubRegionField } from "@/app/components/ClubRegionField";
import { SemoBrandMark } from "@/app/components/SemoBrandMark";
import { createClub } from "@/app/lib/clubs";
import type { ActivityCategoryKey, ActivityTagKey, AffiliationTypeKey } from "@/app/lib/clubClassification";
import { uploadTempImage } from "@/app/lib/imageUpload";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type { RegionScope } from "@/app/lib/regions";

const VISIBILITY_OPTIONS = [
  { key: "PUBLIC", label: "공개", description: "누구나 찾고 가입 요청 가능" },
  { key: "PRIVATE", label: "비공개", description: "초대나 승인된 멤버만 접근" },
] as const;

const MEMBERSHIP_OPTIONS = [
  { key: "APPROVAL", label: "승인 가입", description: "관리자 승인 후 가입" },
  { key: "OPEN", label: "바로 가입", description: "승인 없이 즉시 가입" },
] as const;

export default function CreateClubPage() {
  const router = useRouter();
  const reduceMotion = useHydrationSafeReducedMotion();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activityCategory, setActivityCategory] = useState<ActivityCategoryKey>("SPORTS");
  const [activityTags, setActivityTags] = useState<ActivityTagKey[]>(["TENNIS"]);
  const [affiliationType, setAffiliationType] = useState<AffiliationTypeKey>("INDEPENDENT");
  const [visibilityStatus, setVisibilityStatus] = useState<(typeof VISIBILITY_OPTIONS)[number]["key"]>("PUBLIC");
  const [membershipPolicy, setMembershipPolicy] = useState<(typeof MEMBERSHIP_OPTIONS)[number]["key"]>("APPROVAL");
  const [regionScope, setRegionScope] = useState<RegionScope>("NATIONWIDE");
  const [regionDepth1Code, setRegionDepth1Code] = useState<string | null>(null);
  const [regionDepth2Code, setRegionDepth2Code] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [uploadedPhotoFileName, setUploadedPhotoFileName] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFeedback(null);
    const nextPreviewUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return nextPreviewUrl;
    });

    setIsUploadingPhoto(true);
    setUploadedPhotoFileName(null);

    const uploadResult = await uploadTempImage(file);
    setIsUploadingPhoto(false);

    if (!uploadResult.data?.fileName) {
      setUploadedPhotoFileName(null);
      setFeedback(uploadResult.error ?? "모임 이미지 업로드에 실패했습니다.");
      return;
    }

    setUploadedPhotoFileName(uploadResult.data.fileName);
    if (uploadResult.data.imageUrl) {
      setPhotoPreviewUrl((current) => {
        if (current?.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }
        return uploadResult.data?.imageUrl ?? current;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setFeedback("모임 이름을 입력해 주세요.");
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await createClub({
        name: name.trim(),
        description: description.trim() || null,
        activityCategory,
        activityTags,
        affiliationType,
        visibilityStatus,
        membershipPolicy,
        regionScope,
        regionDepth1Code,
        regionDepth2Code,
        fileName: uploadedPhotoFileName,
      });

      if (!result.ok || !result.data) {
        setFeedback(result.message ?? "모임 생성에 실패했습니다.");
        return;
      }

      setFeedback("모임이 만들어졌습니다. 첫 세모를 준비합니다.");
      setName("");
      setDescription("");
      setActivityCategory("SPORTS");
      setActivityTags(["TENNIS"]);
      setAffiliationType("INDEPENDENT");
      setVisibilityStatus("PUBLIC");
      setMembershipPolicy("APPROVAL");
      setRegionScope("NATIONWIDE");
      setRegionDepth1Code(null);
      setRegionDepth2Code(null);
      setUploadedPhotoFileName(null);
      setPhotoPreviewUrl((current) => {
        if (current) {
          if (current.startsWith("blob:")) {
            URL.revokeObjectURL(current);
          }
        }
        return null;
      });

      window.setTimeout(() => {
        router.replace("/");
      }, reduceMotion ? 180 : 520);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="semo-user-theme semo-app-shell font-display">
      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col overflow-x-hidden bg-white/70">
        <motion.header
          className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 p-4 backdrop-blur-md"
          {...staggeredFadeUpMotion(0, reduceMotion)}
        >
          <RouterLink
            href="/"
            className="flex size-11 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100"
            aria-label="홈으로 돌아가기"
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          </RouterLink>
          <h2 className="flex-1 pr-10 text-center text-lg font-bold leading-tight tracking-tight">
            모임 만들기
          </h2>
        </motion.header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <main className="semo-nav-bottom-space flex-1">
            <motion.section className="flex p-6" {...staggeredFadeUpMotion(1, reduceMotion)}>
              <div className="flex w-full flex-col items-center gap-4">
                <label className="group relative cursor-pointer" aria-label="모임 사진 선택">
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                  <div
                    className="relative flex aspect-square min-h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 bg-cover bg-center shadow-sm"
                    style={photoPreviewUrl ? { backgroundImage: `url("${photoPreviewUrl}")` } : undefined}
                  >
                    {photoPreviewUrl ? null : (
                      <SemoBrandMark className="size-16 text-slate-300" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="material-symbols-outlined text-3xl text-white" aria-hidden="true">photo_camera</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 rounded-full bg-[var(--primary)] p-2 text-white shadow-lg">
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                  </div>
                </label>

                <div className="flex flex-col items-center justify-center">
                  <p className="text-center text-xl font-bold leading-tight tracking-tight text-slate-900">
                    모임 대표 사진
                  </p>
                  <p className="mt-1 text-center text-sm text-slate-500">모임을 알아보기 쉬운 사진을 등록하세요.</p>
                  {isUploadingPhoto ? (
                    <p className="mt-2 text-xs font-semibold text-[var(--primary)]">사진을 업로드하고 있습니다.</p>
                  ) : uploadedPhotoFileName ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-600">사진을 업로드했습니다.</p>
                  ) : null}
                </div>
              </div>
            </motion.section>

            <motion.section className="px-4 pb-4" {...staggeredFadeUpMotion(2, reduceMotion)}>
              <div className="semo-card flex items-center gap-4 p-4">
                <div className="flex size-24 shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-[var(--primary)]/6">
                  <ClubGrowthCoreMark size={88} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black tracking-[0.16em] text-[var(--primary)]">첫 세모</p>
                  <h3 className="mt-1 text-base font-black text-slate-900">작은 세모와 원석 코어로 시작합니다</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    함께·운영·이어짐에 해당하는 실제 기록이 쌓이면 바깥 세모와 코어가 자연스럽게 성장합니다.
                  </p>
                </div>
              </div>
            </motion.section>

            <motion.section className="space-y-4 px-4 py-2" {...staggeredFadeUpMotion(3, reduceMotion)}>
              <div className="flex flex-col gap-2">
                <label className="px-1 text-sm font-bold leading-normal text-slate-900">모임 이름</label>
                <input
                  aria-label="모임 이름"
                  className="form-input h-14 w-full rounded-xl border-slate-200 bg-white p-4 text-base text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--primary)]/50"
                  placeholder="예: 성수 러닝 모임"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="px-1 text-sm font-bold leading-normal text-slate-900">모임 소개</label>
                <textarea
                  aria-label="모임 소개"
                  className="form-input min-h-32 w-full resize-none rounded-xl border-slate-200 bg-white p-4 text-base text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--primary)]/50"
                  placeholder="어떤 활동을 누구와 함께하는 클럽인지 알려주세요."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </motion.section>

            <motion.section className="px-4 py-6" {...staggeredFadeUpMotion(4, reduceMotion)}>
              <div className="semo-card p-4">
                <h3 className="text-sm font-bold text-slate-900">모임 분류</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  모임이 어떤 활동을 하는지, 어떤 배경을 가진 모임인지 함께 저장합니다.
                </p>
                <div className="mt-4">
                  <ClubClassificationField
                    value={{ activityCategory, activityTags, affiliationType }}
                    onChange={(nextValue) => {
                      setActivityCategory(nextValue.activityCategory ?? "OTHER");
                      setActivityTags(nextValue.activityTags);
                      setAffiliationType(nextValue.affiliationType ?? "INDEPENDENT");
                    }}
                    disabled={isSubmitting || isUploadingPhoto}
                  />
                </div>
              </div>
            </motion.section>

            <motion.section className="space-y-5 px-4 pb-6" {...staggeredFadeUpMotion(5, reduceMotion)}>
              <div className="semo-card p-4">
                <h3 className="text-sm font-bold text-slate-900">공개 및 가입 설정</h3>
                <div className="mt-4 space-y-4">
                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      공개 범위
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      {VISIBILITY_OPTIONS.map((option) => {
                        const isActive = visibilityStatus === option.key;
                        return (
                          <label
                            key={option.key}
                            className={`min-h-20 cursor-pointer rounded-[var(--radius-control)] border px-4 py-3 text-left transition-colors ${
                              isActive
                                ? "border-[var(--primary)] bg-[var(--primary)]/8"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              name="visibilityStatus"
                              value={option.key}
                              checked={isActive}
                              onChange={() => setVisibilityStatus(option.key)}
                              className="sr-only"
                            />
                            <p className="text-sm font-bold text-slate-900">{option.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{option.description}</p>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      가입 방식
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      {MEMBERSHIP_OPTIONS.map((option) => {
                        const isActive = membershipPolicy === option.key;
                        return (
                          <label
                            key={option.key}
                            className={`min-h-20 cursor-pointer rounded-[var(--radius-control)] border px-4 py-3 text-left transition-colors ${
                              isActive
                                ? "border-[var(--primary)] bg-[var(--primary)]/8"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              name="membershipPolicy"
                              value={option.key}
                              checked={isActive}
                              onChange={() => setMembershipPolicy(option.key)}
                              className="sr-only"
                            />
                            <p className="text-sm font-bold text-slate-900">{option.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{option.description}</p>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                  <div>
                    <ClubRegionField
                      value={{ regionScope, regionDepth1Code, regionDepth2Code }}
                      onChange={(nextValue) => {
                        setRegionScope(nextValue.regionScope);
                        setRegionDepth1Code(nextValue.regionDepth1Code);
                        setRegionDepth2Code(nextValue.regionDepth2Code);
                      }}
                      disabled={isSubmitting || isUploadingPhoto}
                      helperText="클럽 대표 활동 권역입니다. 일정별 장소와는 별도로 모임의 기본 지역을 저장합니다."
                    />
                  </div>
                </div>
              </div>
            </motion.section>
          </main>

          <div className="sticky bottom-0 z-20 mt-auto border-t border-slate-200 bg-white/92 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
            {feedback ? (
              <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {feedback}
              </p>
            ) : null}
            <motion.button
              type="submit"
              disabled={isSubmitting || isUploadingPhoto}
              className="w-full rounded-xl bg-[var(--primary)] py-4 font-bold text-white shadow-lg shadow-[var(--primary)]/25 transition-transform hover:bg-[var(--primary)]/90 active:scale-[0.98] disabled:opacity-60"
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            >
              {isUploadingPhoto ? "사진 업로드 중" : isSubmitting ? "모임 만드는 중" : "모임 만들기"}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
