"use client";

import { startTransition, useEffect, useEffectEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuthSession from "@/app/hooks/useAuthSession";

type AuthGateProps = {
  children: React.ReactNode;
};

const PUBLIC_PATHS = new Set(["/login"]);

function GateScreen({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background-light)] px-6 py-12 text-[var(--foreground)]">
      <div className="semo-orb semo-orb-left" />
      <div className="semo-orb semo-orb-right" />
      <div className="semo-panel flex w-full max-w-md flex-col gap-4 px-6 py-8 text-center">
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
      router.replace("/login");
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
    return <GateScreen label="SESSION" title="세션을 확인하는 중입니다." />;
  }

  if (authStatus === "out") {
    return <GateScreen label="LOGIN" title="로그인 페이지로 이동 중입니다." />;
  }

  return children;
}
