"use client";

import { Suspense, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  isUserRole,
  logout,
} from "@/app/lib/auth";
import useAuthSession from "@/app/hooks/useAuthSession";
import { consumeOAuthNextPath } from "@/app/lib/authRouting";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const GATEWAY_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function normalizeProvider(provider?: string | null): "NAVER" | "KAKAO" | null {
  if (!provider) {
    return null;
  }

  const normalized = provider.trim().toUpperCase();
  if (normalized === "NAVER" || normalized === "KAKAO") {
    return normalized;
  }
  return null;
}

function getProviderLabel(provider?: string | null): string | null {
  const normalized = normalizeProvider(provider);
  if (normalized === "NAVER") {
    return "네이버";
  }
  if (normalized === "KAKAO") {
    return "카카오";
  }
  return null;
}

function resolveOAuthErrorMessage(
  errorCode?: string | null,
  provider?: string | null,
  fallback?: string | null,
): string | null {
  if (errorCode === "oauth_provider_mismatch") {
    const providerLabel = getProviderLabel(provider);
    if (providerLabel) {
      return `${providerLabel}로 가입된 계정이 있습니다. ${providerLabel}로 로그인해 주세요.`;
    }
    return "이미 다른 소셜 계정으로 가입된 이메일입니다. 기존 로그인 수단으로 다시 시도해 주세요.";
  }

  if (errorCode === "oauth_email_missing") {
    return "소셜 계정에서 이메일 정보를 가져오지 못했습니다. 이메일 제공 동의 후 다시 시도해 주세요.";
  }

  if (errorCode === "oauth_provider_unsupported") {
    return "지원하지 않는 소셜 로그인 방식입니다.";
  }

  if (!fallback) {
    return null;
  }

  return "소셜 로그인 중 문제가 발생했습니다. 다시 시도해 주세요.";
}

function resolveLoginProcessingErrorMessage(loginError?: string | null): string | null {
  if (!loginError) {
    return null;
  }

  switch (loginError) {
    case "unsupported_role":
      return "SEMO는 USER 계정만 로그인할 수 있습니다.";
    case "profile_initialize_failed":
      return "프로필 생성에 실패했습니다. 다시 로그인해 주세요.";
    case "session_restore_failed":
      return "소셜 로그인 세션을 확인할 수 없습니다. 다시 시도해 주세요.";
    case "processing_failed":
      return "로그인 정보를 처리하는 중 문제가 발생했습니다. 다시 시도해 주세요.";
    default:
      return "로그인 중 문제가 발생했습니다. 다시 시도해 주세요.";
  }
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { authStatus, isHydrated, user } = useAuthSession();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  const expired = searchParams.get("expired") === "1";
  const oauthError = searchParams.get("error");
  const oauthErrorCode = searchParams.get("errorCode");
  const oauthProvider = searchParams.get("provider");
  const loginError = searchParams.get("loginError");
  const queryError = resolveOAuthErrorMessage(
    oauthErrorCode,
    oauthProvider,
    oauthError,
  ) ?? resolveLoginProcessingErrorMessage(loginError);
  const isProcessing = !queryError && (!isHydrated || authStatus === "unknown" || authStatus === "in");

  useEffect(() => {
    if (queryError) {
      return;
    }

    if (!isHydrated || authStatus === "unknown" || authStatus === "out") {
      return;
    }

    if (!isUserRole(user?.role)) {
      void logout().finally(() => {
        setError("SEMO는 USER 계정만 로그인할 수 있습니다.");
      });
      return;
    }

    router.replace(consumeOAuthNextPath());
  }, [authStatus, isHydrated, queryError, router, user?.role]);

  const handleNaverLogin = () => {
    window.location.replace(`${GATEWAY_BASE_URL}/oauth2/authorize/naver-semo`);
  };

  const handleKakaoLogin = () => {
    window.location.replace(`${GATEWAY_BASE_URL}/oauth2/authorize/kakao-semo`);
  };

  if (isProcessing) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[var(--background-light)] px-6 py-12 text-[var(--foreground)]">
        <div className="semo-orb semo-orb-left" />
        <div className="semo-orb semo-orb-right" />
        <motion.div
          className="semo-panel w-full max-w-md px-6 py-8 text-center"
          {...staggeredFadeUpMotion(0, reduceMotion)}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--primary)]">
            SIGNING IN
          </p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">로그인 처리 중입니다.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            인증 정보를 확인하고 홈 화면으로 이동하고 있습니다.
          </p>
          <div className="mt-6 semo-loading-bar" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-[var(--background-light)] px-6 py-8 text-[var(--foreground)]">
      <div className="semo-orb semo-orb-left" />
      <div className="semo-orb semo-orb-right" />

      <main className="relative z-10 flex w-full max-w-sm flex-col items-center pb-24">
        <motion.section
          className="flex w-full flex-col items-center"
          {...staggeredFadeUpMotion(0, reduceMotion)}
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[calc(var(--radius-xl)+0.5rem)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-[var(--shadow-soft)]">
            <span className="material-symbols-outlined !text-5xl">groups</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-[var(--foreground)]">SEMO</h1>
          <p className="mt-2 text-center text-lg font-medium text-[var(--muted)]">
            세상의 모든 모임을 한곳에서
          </p>
        </motion.section>

        <motion.section className="w-full pt-10" {...staggeredFadeUpMotion(1, reduceMotion)}>
          <div className="flex flex-col gap-4">
            <motion.button
              type="button"
              onClick={handleNaverLogin}
              className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-[var(--radius-xl)] bg-[var(--naver)] px-6 text-base font-bold text-white transition-all duration-200 hover:opacity-95 active:scale-[0.985]"
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            >
              <div className="absolute left-6 flex items-center justify-center">
                <span className="text-xl font-black">N</span>
              </div>
              <span className="truncate">네이버로 시작하기</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={handleKakaoLogin}
              className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-[var(--radius-xl)] bg-[var(--kakao)] px-6 text-base font-bold text-[var(--kakao-text)] transition-all duration-200 hover:opacity-95 active:scale-[0.985]"
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            >
              <div className="absolute left-6 flex items-center justify-center">
                <span className="material-symbols-outlined !text-2xl">chat_bubble</span>
              </div>
              <span className="truncate">카카오로 시작하기</span>
            </motion.button>
          </div>
        </motion.section>

        {expired ? (
          <motion.p
            className="mt-5 w-full rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            세션이 만료되었습니다. 다시 로그인해 주세요.
          </motion.p>
        ) : null}
        {error ?? queryError ? (
          <motion.p
            className="mt-5 w-full rounded-[var(--radius-lg)] border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            {error ?? queryError}
          </motion.p>
        ) : null}

        <motion.section className="pt-12 text-center" {...staggeredFadeUpMotion(3, reduceMotion)}>
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="h-1 w-8 rounded-full bg-[var(--primary)]/20" />
            <div className="h-1 w-12 rounded-full bg-[var(--primary)]" />
            <div className="h-1 w-8 rounded-full bg-[var(--primary)]/20" />
          </div>
          <p className="mx-auto max-w-[240px] text-xs leading-relaxed text-slate-400">
            로그인 시 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
          </p>
        </motion.section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background-light)]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
