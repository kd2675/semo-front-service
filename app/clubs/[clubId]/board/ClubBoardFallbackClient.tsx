"use client";

import { ClubBoardFeedClient } from "./ClubBoardFeedClient";

type ClubBoardFallbackClientProps = {
  clubId: string;
};

export function ClubBoardFallbackClient({ clubId }: ClubBoardFallbackClientProps) {
  return <ClubBoardFeedClient clubId={clubId} />;
}
