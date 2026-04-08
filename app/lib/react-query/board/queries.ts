import { queryOptions } from "@tanstack/react-query";
import {
  getClubBoard,
  getClubBoardItemReadStatus,
  getClubNoticeDetail,
  getClubNoticeFeed,
  getClubNoticeHome,
  getClubPollHome,
} from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const boardQueryKeys = {
  board: (clubId: string) => ["semo", "clubs", clubId, "board"] as const,
  noticeFeed: (
    clubId: string,
    options: {
      query?: string;
      pinnedOnly?: boolean;
      cursorBoardItemId?: number | null;
      size?: number;
    } = {},
  ) => ["semo", "clubs", clubId, "notice-feed", options] as const,
  noticeHome: (clubId: string) => ["semo", "clubs", clubId, "notice-home"] as const,
  noticeDetail: (clubId: string, noticeId: string | number) =>
    ["semo", "clubs", clubId, "notice-detail", noticeId] as const,
  pollHome: (clubId: string) => ["semo", "clubs", clubId, "poll-home"] as const,
  boardReadStatus: (clubId: string, boardItemId: string | number) =>
    ["semo", "clubs", clubId, "board-read-status", boardItemId] as const,
};

export function boardQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: boardQueryKeys.board(clubId),
    queryFn: async () =>
      requireApiData(await getClubBoard(clubId), "보드 정보를 불러오지 못했습니다."),
  });
}

export function noticeFeedQueryOptions(
  clubId: string,
  options: {
    query?: string;
    pinnedOnly?: boolean;
    cursorBoardItemId?: number | null;
    size?: number;
  } = {},
) {
  return queryOptions({
    queryKey: boardQueryKeys.noticeFeed(clubId, options),
    queryFn: async () =>
      requireApiData(
        await getClubNoticeFeed(clubId, options),
        options.cursorBoardItemId == null
          ? "공지 피드를 불러오지 못했습니다."
          : "공지 피드를 더 불러오지 못했습니다.",
      ),
  });
}

export function noticeHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: boardQueryKeys.noticeHome(clubId),
    queryFn: async () =>
      requireApiData(await getClubNoticeHome(clubId), "공지 정보를 불러오지 못했습니다."),
  });
}

export function noticeDetailQueryOptions(clubId: string, noticeId: string | number) {
  return queryOptions({
    queryKey: boardQueryKeys.noticeDetail(clubId, noticeId),
    queryFn: async () =>
      requireApiData(
        await getClubNoticeDetail(clubId, noticeId),
        "공지 상세를 불러오지 못했습니다.",
      ),
  });
}

export function pollHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: boardQueryKeys.pollHome(clubId),
    queryFn: async () =>
      requireApiData(await getClubPollHome(clubId), "투표 정보를 불러오지 못했습니다."),
  });
}

export function boardReadStatusQueryOptions(clubId: string, boardItemId: string | number) {
  return queryOptions({
    queryKey: boardQueryKeys.boardReadStatus(clubId, boardItemId),
    queryFn: async () =>
      requireApiData(
        await getClubBoardItemReadStatus(clubId, boardItemId),
        "읽음 상태를 불러오지 못했습니다.",
      ),
  });
}
