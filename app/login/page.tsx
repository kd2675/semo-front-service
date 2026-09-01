"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";

import { SemoBrandMark } from "@/app/components/SemoBrandMark";
import useAuthSession from "@/app/hooks/useAuthSession";
import { login, logout, signup } from "@/app/lib/auth";
import {
  isSemoAccountRole,
  SEMO_UNSUPPORTED_ROLE_MESSAGE,
} from "@/app/lib/authPolicy";
import { AUTH_API_BASE } from "@/app/lib/api";
import { rememberOAuthNextPath, sanitizeAuthNextPath } from "@/app/lib/authRouting";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { initializeProfile } from "@/app/lib/profile";

type LoginMode = "login" | "signup";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authStatus, isHydrated, user } = useAuthSession();
  const [isClientReady, setIsClientReady] = useState(false);
  const [mode, setMode] = useState<LoginMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const nextPath = useMemo(
    () => sanitizeAuthNextPath(searchParams.get("next")),
    [searchParams],
  );
  const queryMessage = resolveQueryMessage(searchParams);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    if (isSubmitting || !isHydrated || authStatus === "unknown" || authStatus === "out") {
      return;
    }
    if (!isSemoAccountRole(user?.role)) {
      void logout().finally(() => setMessage(SEMO_UNSUPPORTED_ROLE_MESSAGE));
      return;
    }
    router.replace(nextPath);
  }, [authStatus, isHydrated, isSubmitting, nextPath, router, user?.role]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim();
    const validationMessage = validateForm(mode, normalizedUsername, password, normalizedEmail);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const signupResult = await signup(normalizedUsername, password, normalizedEmail);
        if (!signupResult.ok) {
          setMessage(signupResult.message ?? "회원가입에 실패했습니다. 입력값 또는 중복 계정을 확인해 주세요.");
          return;
        }
      }

      const loginResult = await login(normalizedUsername, password);
      if (!loginResult.ok || !loginResult.token) {
        setMessage(loginResult.message ?? "로그인에 실패했습니다.");
        return;
      }
      if (!isSemoAccountRole(loginResult.user?.role)) {
        await logout();
        setMessage(SEMO_UNSUPPORTED_ROLE_MESSAGE);
        return;
      }

      const profileResult = await initializeProfile(loginResult.token);
      if (profileResult.error) {
        await logout();
        setMessage("프로필을 준비하지 못했습니다. 다시 로그인해 주세요.");
        return;
      }
      router.replace(nextPath);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startOAuthLogin = (provider: "naver-semo" | "kakao-semo") => {
    rememberOAuthNextPath(nextPath);
    window.location.replace(`${AUTH_API_BASE}/oauth2/authorize/${provider}`);
  };

  if (!isClientReady || !isHydrated || authStatus === "unknown" || (authStatus === "in" && !isSubmitting)) {
    return <SemoLoginProgress reduceMotion={reduceMotion} />;
  }

  return (
    <main className="semo-user-theme relative min-h-screen overflow-x-hidden bg-[var(--background-light)] px-5 py-8 text-[var(--foreground)]">
      <div className="semo-orb semo-orb-left" />
      <div className="semo-orb semo-orb-right" />
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <motion.div {...staggeredFadeUpMotion(0, reduceMotion)}>
          <SemoBrandMark className="size-16 text-[var(--primary)]" label="SEMO" />
          <p className="mt-5 text-xs font-black tracking-[0.28em] text-[var(--primary)]">SEMO · 세상의 모든 모임</p>
          <h1 className="mt-4 max-w-xl break-keep text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] md:text-6xl">
            모임의 시작부터
            <br />운영의 마지막까지
          </h1>
          <p className="mt-5 max-w-xl break-keep text-base leading-7 text-[var(--muted)]">
            함께한 활동, 운영 과정, 다음 사람에게 이어질 기록을 한곳에 남기세요.
            인증이 끝나면 로그인 전에 보고 있던 모임 화면으로 돌아갑니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-bold text-[var(--primary)]">
            {["함께", "운영", "이어짐"].map((label) => (
              <span key={label} className="rounded-lg border border-[var(--primary)]/15 bg-white/70 px-3 py-2">{label}</span>
            ))}
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="semo-panel w-full p-5"
          {...staggeredFadeUpMotion(1, reduceMotion)}
        >
          <div className="grid grid-cols-2 rounded-lg bg-[var(--primary)]/8 p-1">
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setMessage(null);
                }}
                className={item === mode
                  ? "rounded-lg bg-white px-3 py-2.5 text-sm font-extrabold text-[var(--foreground)] shadow-sm"
                  : "rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--muted)]"}
              >
                {item === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <SemoField label="아이디" name="username" value={username} onChange={setUsername} autoComplete="username" />
            {mode === "signup" ? (
              <SemoField label="이메일" name="email" value={email} onChange={setEmail} type="email" autoComplete="email" />
            ) : null}
            <SemoField label="비밀번호" name="password" value={password} onChange={setPassword} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>

          {message || queryMessage ? (
            <p role="alert" aria-live="polite" className="mt-4 rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700">
              {message ?? queryMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 min-h-12 w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-extrabold text-white hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "처리 중" : mode === "login" ? "SEMO 로그인" : "가입 후 시작"}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-bold text-slate-400">
            <span className="h-px flex-1 bg-[var(--line)]" />
            소셜 계정으로 계속
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>
          <div className="grid gap-2">
            <button type="button" onClick={() => startOAuthLogin("naver-semo")} className="min-h-12 rounded-lg bg-[var(--naver)] px-4 py-3 text-sm font-extrabold text-white hover:brightness-95">네이버로 계속</button>
            <button type="button" onClick={() => startOAuthLogin("kakao-semo")} className="min-h-12 rounded-lg bg-[var(--kakao)] px-4 py-3 text-sm font-extrabold text-[var(--kakao-text)] hover:brightness-95">카카오로 계속</button>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">로그인 시 이용약관 및 개인정보 처리방침에 동의하게 됩니다.</p>
        </motion.form>
      </section>
    </main>
  );
}

function SemoField({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[var(--muted)]">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        maxLength={255}
        className="mt-1 min-h-12 w-full rounded-lg border border-[var(--line)] bg-white/90 px-3 py-3 text-sm font-bold outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
      />
    </label>
  );
}

function SemoLoginProgress({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <main className="semo-user-theme relative grid min-h-screen place-items-center overflow-x-hidden bg-[var(--background-light)] px-5" aria-live="polite">
      <div className="semo-orb semo-orb-left" />
      <div className="semo-orb semo-orb-right" />
      <motion.section className="semo-panel relative w-full max-w-sm p-7 text-center" {...staggeredFadeUpMotion(0, reduceMotion)}>
        <SemoBrandMark className="mx-auto size-12 text-[var(--primary)]" />
        <p className="text-xs font-black tracking-[0.18em] text-[var(--primary)]">로그인 중</p>
        <h1 className="mt-4 text-2xl font-extrabold">로그인을 준비하고 있습니다</h1>
        <p className="mt-2 text-sm font-semibold text-[var(--muted)]">세션과 클럽 프로필을 확인합니다.</p>
        <div className="mt-6 semo-loading-bar" />
      </motion.section>
    </main>
  );
}

function validateForm(mode: LoginMode, username: string, password: string, email: string): string | null {
  if (!username) {
    return "아이디를 입력해 주세요.";
  }
  if (!password) {
    return "비밀번호를 입력해 주세요.";
  }
  if (mode === "signup" && !/^\S+@\S+\.\S+$/.test(email)) {
    return "올바른 이메일을 입력해 주세요.";
  }
  return null;
}

function resolveQueryMessage(searchParams: URLSearchParams): string | null {
  if (searchParams.get("expired") === "1") {
    return "세션이 만료되었습니다. 다시 로그인해 주세요.";
  }
  const errorCode = searchParams.get("errorCode");
  const provider = searchParams.get("provider")?.trim().toUpperCase();
  if (errorCode === "oauth_provider_mismatch") {
    const providerLabel = provider === "NAVER" ? "네이버" : provider === "KAKAO" ? "카카오" : "기존 소셜 계정";
    return `${providerLabel} 로그인으로 다시 시도해 주세요.`;
  }
  if (errorCode === "oauth_email_missing") {
    return "소셜 계정의 이메일 제공 동의가 필요합니다.";
  }
  if (errorCode === "oauth_provider_unsupported") {
    return "지원하지 않는 소셜 로그인 방식입니다.";
  }
  switch (searchParams.get("loginError")) {
    case "unsupported_role":
      return SEMO_UNSUPPORTED_ROLE_MESSAGE;
    case "profile_initialize_failed":
      return "프로필을 준비하지 못했습니다. 다시 로그인해 주세요.";
    case "session_restore_failed":
      return "소셜 로그인 세션을 확인할 수 없습니다. 다시 시도해 주세요.";
    case "processing_failed":
      return "로그인 정보를 처리하는 중 문제가 발생했습니다. 다시 시도해 주세요.";
    default:
      return searchParams.get("error") ? "소셜 로그인에 실패했습니다. 다시 시도해 주세요." : null;
  }
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--background-light)]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
