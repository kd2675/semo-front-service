"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ensureAccessToken, getUserFromToken, isUserRole, logout } from "@/app/lib/auth";
import { consumeOAuthNextPath } from "@/app/lib/authRouting";
import { initializeProfile } from "@/app/lib/profile";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const failureQuery = buildOAuthFailureQuery(window.location.search);
    if (failureQuery) {
      router.replace(`/login?${failureQuery}`);
      return;
    }

    let cancelled = false;

    void (async () => {
      const token = await ensureAccessToken();
      if (cancelled) {
        return;
      }
      if (!token) {
        consumeOAuthNextPath();
        router.replace("/login?loginError=session_restore_failed");
        return;
      }

      const user = getUserFromToken(token);
      if (!isUserRole(user?.role)) {
        await logout();
        consumeOAuthNextPath();
        router.replace("/login?loginError=unsupported_role");
        return;
      }

      const profileResult = await initializeProfile(token);
      if (cancelled) {
        return;
      }
      if (profileResult.error) {
        await logout();
        consumeOAuthNextPath();
        router.replace("/login?loginError=profile_initialize_failed");
        return;
      }

      router.replace(consumeOAuthNextPath());
    })().catch(async () => {
      await logout().catch(() => undefined);
      consumeOAuthNextPath();
      if (!cancelled) {
        router.replace("/login?loginError=processing_failed");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-x-hidden bg-[var(--background-light)] px-6 text-[var(--foreground)]" aria-live="polite">
      <div className="semo-orb semo-orb-left" />
      <div className="semo-orb semo-orb-right" />
      <section className="semo-panel relative w-full max-w-md px-6 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--primary)]">SIGNING IN</p>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">로그인을 마무리하고 있습니다</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">인증 정보를 확인한 뒤 이전 화면으로 이동합니다.</p>
        <div className="mt-6 semo-loading-bar" />
      </section>
    </main>
  );
}

function buildOAuthFailureQuery(search: string): string | null {
  const callbackQuery = new URLSearchParams(search);
  if (!callbackQuery.has("error") && !callbackQuery.has("errorCode")) {
    return null;
  }
  const loginQuery = new URLSearchParams();
  ["error", "errorCode", "provider"].forEach((key) => {
    const value = callbackQuery.get(key);
    if (value) {
      loginQuery.set(key, value);
    }
  });
  return loginQuery.toString();
}
