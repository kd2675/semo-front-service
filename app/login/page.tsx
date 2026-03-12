"use client";

import { Suspense, useEffect, useEffectEvent, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  bootstrapAccessToken,
  clearAccessToken,
  getUserFromToken,
  isUserRole,
  logout,
  setAccessToken,
} from "@/app/lib/auth";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { initializeProfile } from "@/app/lib/profile";

const GATEWAY_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  const expired = searchParams.get("expired") === "1";
  const token = searchParams.get("token");
  const isProcessing = Boolean(token);

  const completeLogin = useEffectEvent(async (nextToken: string) => {
    setAccessToken(nextToken);
    const user = getUserFromToken(nextToken);

    if (!isUserRole(user?.role)) {
      await logout();
      clearAccessToken();
      setError("SEMO는 USER 계정만 로그인할 수 있습니다.");
      return;
    }

    const initializeResult = await initializeProfile(nextToken);
    if (initializeResult.error) {
      await logout();
      clearAccessToken();
      setError(`프로필 생성에 실패했습니다. (${initializeResult.error})`);
      return;
    }

    router.replace("/");
  });

  const restoreSession = useEffectEvent(async () => {
    const restoredToken = await bootstrapAccessToken();
    if (!restoredToken) {
      return;
    }

    const restoredUser = getUserFromToken(restoredToken);
    if (!isUserRole(restoredUser?.role)) {
      await logout();
      clearAccessToken();
      setError("SEMO는 USER 계정만 로그인할 수 있습니다.");
      return;
    }

    router.replace("/");
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (token) {
          if (!cancelled) {
            await completeLogin(token);
          }
          return;
        }

        if (!cancelled) {
          await restoreSession();
        }
      } catch {
        if (!cancelled) {
          clearAccessToken();
          setError("로그인 정보를 처리하는 중 문제가 발생했습니다. 다시 시도해 주세요.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleNaverLogin = () => {
    window.location.href = `${GATEWAY_BASE_URL}/oauth2/authorize/naver-semo`;
  };

  const handleKakaoLogin = () => {
    window.location.href = `${GATEWAY_BASE_URL}/oauth2/authorize/kakao-semo`;
  };

  if (isProcessing) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background-light)] px-6 py-12 text-[var(--foreground)]">
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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[var(--background-light)] px-6 py-8 text-[var(--foreground)]">
      <div className="semo-orb semo-orb-left" />
      <div className="semo-orb semo-orb-right" />

      <motion.div
        className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-4 sm:px-6"
        {...staggeredFadeUpMotion(0, reduceMotion)}
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="홈으로 이동"
          className="flex size-10 items-center justify-center rounded-full border border-transparent text-[var(--foreground)] transition hover:border-[var(--line)] hover:bg-white/70"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="flex-1 text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
            SEMO
          </span>
        </div>
        <div className="size-10" />
      </motion.div>

      <main className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <motion.section
          className="flex w-full flex-col items-center"
          {...staggeredFadeUpMotion(1, reduceMotion)}
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[calc(var(--radius-xl)+0.5rem)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-[var(--shadow-soft)]">
            <span className="material-symbols-outlined !text-5xl">groups</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-[var(--foreground)]">SEMO</h1>
          <p className="mt-2 text-center text-lg font-medium text-[var(--muted)]">
            세상의 모든 모임을 한곳에서
          </p>
        </motion.section>

        <motion.section className="w-full pt-10" {...staggeredFadeUpMotion(2, reduceMotion)}>
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
            {...staggeredFadeUpMotion(3, reduceMotion)}
          >
            세션이 만료되었습니다. 다시 로그인해 주세요.
          </motion.p>
        ) : null}
        {error ? (
          <motion.p
            className="mt-5 w-full rounded-[var(--radius-lg)] border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
            {...staggeredFadeUpMotion(3, reduceMotion)}
          >
            {error}
          </motion.p>
        ) : null}

        <motion.section className="pt-12 text-center" {...staggeredFadeUpMotion(4, reduceMotion)}>
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
