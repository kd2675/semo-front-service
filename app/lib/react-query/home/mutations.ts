import { mutationOptions } from "@tanstack/react-query";
import { cancelClubJoinRequest, submitClubJoinRequest } from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export function submitClubJoinMutationOptions() {
  return mutationOptions({
    mutationFn: async ({
      clubId,
      requestMessage,
    }: {
      clubId: number;
      requestMessage: string | null;
    }) =>
      requireApiData(
        await submitClubJoinRequest(clubId, { requestMessage }),
        "가입 처리에 실패했습니다.",
      ),
  });
}

export function cancelClubJoinMutationOptions() {
  return mutationOptions({
    mutationFn: async ({ clubId }: { clubId: number }) =>
      requireApiData(
        await cancelClubJoinRequest(clubId),
        "가입 신청을 취소하지 못했습니다.",
      ),
  });
}
