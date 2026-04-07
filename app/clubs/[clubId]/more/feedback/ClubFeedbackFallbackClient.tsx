"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubFeedbackDetail, getClubFeedbackHome, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubFeedbackClient } from "./ClubFeedbackClient";

type ClubFeedbackFallbackClientProps = {
  clubId: string;
};

export function ClubFeedbackFallbackClient({
  clubId,
}: ClubFeedbackFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const { data: feedbackHome, isError: feedbackError } = useQuery({
    queryKey: clubKeys.feedback.list(clubId),
    queryFn: () => unwrap(getClubFeedbackHome(clubId)),
  });

  const firstFeedbackId = feedbackHome?.items[0]?.feedbackId;

  const { data: initialDetail = null, isError: initialDetailError } = useQuery({
    queryKey: clubKeys.feedback.detail(clubId, String(firstFeedbackId!)),
    queryFn: () => unwrap(getClubFeedbackDetail(clubId, firstFeedbackId!)),
    enabled: firstFeedbackId != null,
    retry: 1,
  });

  useEffect(() => {
    if (clubError || feedbackError) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [clubError, feedbackError, clubId, router]);

  if (!club || !feedbackHome) {
    return <ClubTimelineLoadingShell />;
  }

  return (
    <>
      {initialDetailError ? (
        <div className="mx-auto max-w-md px-4 pt-2">
          <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
            일부 데이터를 불러오지 못했습니다. 새로고침하면 다시 시도합니다.
          </div>
        </div>
      ) : null}
      <ClubFeedbackClient
        clubId={clubId}
        initialData={feedbackHome}
        initialDetail={initialDetail ?? null}
        isAdmin={club.admin}
      />
    </>
  );
}
