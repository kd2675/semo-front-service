"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClub } from "@/app/lib/clubs";
import { uploadTempImage } from "@/app/lib/imageUpload";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubCategory = {
  key: string;
  label: string;
  icon: string;
};

const CATEGORIES: ClubCategory[] = [
  { key: "TENNIS", label: "Tennis", icon: "sports_tennis" },
  { key: "RUNNING", label: "Running", icon: "directions_run" },
  { key: "CROSSFIT", label: "Crossfit", icon: "fitness_center" },
  { key: "HIKING", label: "Hiking", icon: "hiking" },
  { key: "CYCLING", label: "Cycling", icon: "pedal_bike" },
  { key: "OTHER", label: "Other", icon: "more_horiz" },
];

const VISIBILITY_OPTIONS = [
  { key: "PUBLIC", label: "Public", description: "누구나 찾고 가입 요청 가능" },
  { key: "PRIVATE", label: "Private", description: "초대나 승인된 멤버만 접근" },
] as const;

const MEMBERSHIP_OPTIONS = [
  { key: "APPROVAL", label: "Approval", description: "관리자 승인 후 가입" },
  { key: "OPEN", label: "Open", description: "즉시 가입 허용" },
] as const;

export default function CreateClubPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryKey, setCategoryKey] = useState<string>("TENNIS");
  const [visibilityStatus, setVisibilityStatus] = useState<(typeof VISIBILITY_OPTIONS)[number]["key"]>("PUBLIC");
  const [membershipPolicy, setMembershipPolicy] = useState<(typeof MEMBERSHIP_OPTIONS)[number]["key"]>("APPROVAL");
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
      setFeedback(uploadResult.error ?? "클럽 이미지 업로드에 실패했습니다.");
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
      setFeedback("클럽 이름을 입력해 주세요.");
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await createClub({
        name: name.trim(),
        description: description.trim() || null,
        categoryKey,
        visibilityStatus,
        membershipPolicy,
        fileName: uploadedPhotoFileName,
      });

      if (!result.ok || !result.data) {
        setFeedback(result.message ?? "클럽 생성에 실패했습니다.");
        return;
      }

      setFeedback(`클럽이 생성되었습니다. 클럽 ID ${result.data.clubId}.`);
      setName("");
      setDescription("");
      setCategoryKey("TENNIS");
      setVisibilityStatus("PUBLIC");
      setMembershipPolicy("APPROVAL");
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
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-white shadow-xl">
        <motion.header
          className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 p-4 backdrop-blur-md"
          {...staggeredFadeUpMotion(0, reduceMotion)}
        >
          <RouterLink
            href="/"
            className="flex size-10 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100"
            aria-label="홈으로 돌아가기"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </RouterLink>
          <h2 className="flex-1 pr-10 text-center text-lg font-bold leading-tight tracking-tight">
            Create Club
          </h2>
        </motion.header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <main className="semo-nav-bottom-space flex-1">
            <motion.section className="flex p-6" {...staggeredFadeUpMotion(1, reduceMotion)}>
              <div className="flex w-full flex-col items-center gap-4">
                <label className="group relative cursor-pointer">
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                  <div
                    className="relative flex aspect-square min-h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 bg-cover bg-center shadow-sm"
                    style={photoPreviewUrl ? { backgroundImage: `url("${photoPreviewUrl}")` } : undefined}
                  >
                    {photoPreviewUrl ? null : (
                      <span className="material-symbols-outlined text-4xl text-slate-300">groups</span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="material-symbols-outlined text-3xl text-white">photo_camera</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 rounded-full bg-[var(--primary)] p-2 text-white shadow-lg">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </div>
                </label>

                <div className="flex flex-col items-center justify-center">
                  <p className="text-center text-xl font-bold leading-tight tracking-tight text-slate-900">
                    Upload Club Photo
                  </p>
                  <p className="mt-1 text-center text-sm text-slate-500">Make your club stand out</p>
                  {isUploadingPhoto ? (
                    <p className="mt-2 text-xs font-semibold text-[var(--primary)]">Uploading photo...</p>
                  ) : uploadedPhotoFileName ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-600">Photo uploaded</p>
                  ) : null}
                </div>
              </div>
            </motion.section>

            <motion.section className="space-y-4 px-4 py-2" {...staggeredFadeUpMotion(2, reduceMotion)}>
              <div className="flex flex-col gap-2">
                <label className="px-1 text-sm font-bold leading-normal text-slate-900">Club Name</label>
                <input
                  className="form-input h-14 w-full rounded-xl border-slate-200 bg-white p-4 text-base text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--primary)]/50"
                  placeholder="e.g. Downtown Runners Elite"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="px-1 text-sm font-bold leading-normal text-slate-900">Club Description</label>
                <textarea
                  className="form-input min-h-32 w-full resize-none rounded-xl border-slate-200 bg-white p-4 text-base text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--primary)]/50"
                  placeholder="What's the vibe of your club? Who is it for?"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </motion.section>

            <motion.section className="px-4 py-6" {...staggeredFadeUpMotion(3, reduceMotion)}>
              <h3 className="mb-4 px-1 text-sm font-bold leading-tight text-slate-900">Club Category</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => {
                  const isActive = categoryKey === category.key;
                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setCategoryKey(category.key)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-all ${
                        isActive
                          ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
                          : "border border-transparent bg-slate-100 font-medium text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{category.icon}</span>
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </motion.section>

            <motion.section className="space-y-5 px-4 pb-6" {...staggeredFadeUpMotion(4, reduceMotion)}>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">Club Settings</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Visibility
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {VISIBILITY_OPTIONS.map((option) => {
                        const isActive = visibilityStatus === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setVisibilityStatus(option.key)}
                            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                              isActive
                                ? "border-[var(--primary)] bg-[var(--primary)]/8"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p className="text-sm font-bold text-slate-900">{option.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Membership
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {MEMBERSHIP_OPTIONS.map((option) => {
                        const isActive = membershipPolicy === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setMembershipPolicy(option.key)}
                            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                              isActive
                                ? "border-[var(--primary)] bg-[var(--primary)]/8"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p className="text-sm font-bold text-slate-900">{option.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            </motion.section>
          </main>

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-slate-100 bg-white/90 p-4 backdrop-blur-md">
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
              {isUploadingPhoto ? "Uploading Photo..." : isSubmitting ? "Creating..." : "Create Club"}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
