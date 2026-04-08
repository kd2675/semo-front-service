import { mutationOptions } from "@tanstack/react-query";
import {
  createClubNotice,
  deleteClubNotice,
  recordClubBoardItemRead,
  updateClubNotice,
} from "@/app/lib/clubs";

export function saveNoticeMutationOptions(clubId: string, noticeId?: string | null) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubNotice>[1]) =>
      noticeId != null
        ? updateClubNotice(clubId, noticeId, request)
        : createClubNotice(clubId, request),
  });
}

export function deleteNoticeMutationOptions(clubId: string, noticeId?: string | null) {
  return mutationOptions({
    mutationFn: (targetNoticeId?: number | string) =>
      deleteClubNotice(clubId, targetNoticeId ?? (noticeId as string)),
  });
}

export function recordBoardItemReadMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (boardItemId: number) => recordClubBoardItemRead(clubId, boardItemId),
  });
}
