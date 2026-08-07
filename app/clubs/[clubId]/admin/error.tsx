"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { ClubRouteErrorState } from "@/app/components/ClubRouteState";

type ClubAdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ClubAdminError({ error, reset }: ClubAdminErrorProps) {
  const params = useParams<{ clubId: string }>();

  useEffect(() => {
    console.error("SEMO 관리자 화면 오류", error);
  }, [error]);

  return (
    <ClubRouteErrorState
      title="클럽 관리"
      message="관리자 화면을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      backHref={`/clubs/${params.clubId}`}
      theme="admin"
      onRetry={reset}
    />
  );
}
