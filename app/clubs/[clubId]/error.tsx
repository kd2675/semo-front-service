"use client";

import { useEffect } from "react";

import { ClubRouteErrorState } from "@/app/components/ClubRouteState";

type ClubErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ClubError({ error, reset }: ClubErrorProps) {
  useEffect(() => {
    console.error("SEMO 클럽 화면 오류", error);
  }, [error]);

  return (
    <ClubRouteErrorState
      title="클럽"
      message="클럽 화면을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      backHref="/"
      onRetry={reset}
    />
  );
}
