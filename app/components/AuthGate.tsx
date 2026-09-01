"use client";

import { startTransition, useEffect, useEffectEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuthSession from "@/app/hooks/useAuthSession";
import { SemoBrandMark } from "@/app/components/SemoBrandMark";
import { buildLoginPath, currentBrowserPath } from "@/app/lib/authRouting";

type AuthGateProps = {
  children: React.ReactNode;
};

const PUBLIC_PATHS = new Set(["/login", "/auth/callback"]);

function GateScreen({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[var(--background-light)] px-6 py-12 text-[var(--foreground)]">
      <div className="semo-orb semo-orb-left" />
      <div className="semo-orb semo-orb-right" />
      <div className="semo-panel flex w-full max-w-md flex-col gap-4 px-6 py-8 text-center">
        <SemoBrandMark className="mx-auto size-12 text-[var(--primary)]" />
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--primary)]">
          {label}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <div className="semo-loading-bar" />
      </div>
    </div>
  );
}

export default function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated, authStatus } = useAuthSession();

  const isPublicPath = PUBLIC_PATHS.has(pathname ?? "");

  const redirectToLogin = useEffectEvent(() => {
    startTransition(() => {
      router.replace(buildLoginPath(currentBrowserPath()));
    });
  });

  useEffect(() => {
    if (isPublicPath) {
      return;
    }
    if (isHydrated && authStatus === "out") {
      redirectToLogin();
    }
  }, [authStatus, isHydrated, isPublicPath]);

  if (isPublicPath) {
    return children;
  }

  if (!isHydrated || authStatus === "unknown") {
    return <GateScreen label="세션 확인" title="세션을 확인하는 중입니다." />;
  }

  if (authStatus === "out") {
    return <GateScreen label="로그인" title="로그인 페이지로 이동 중입니다." />;
  }

  return children;
}
