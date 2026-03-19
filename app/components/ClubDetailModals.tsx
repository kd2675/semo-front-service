"use client";

import { RouteModal } from "@/app/components/RouteModal";
import { ClubNoticeDetailClient } from "@/app/clubs/[clubId]/board/[noticeId]/ClubNoticeDetailClient";
import { ClubScheduleDetailClient } from "@/app/clubs/[clubId]/schedule/ClubScheduleDetailClient";
import { ClubScheduleVoteDetailClient } from "@/app/clubs/[clubId]/schedule/ClubScheduleVoteDetailClient";

type DetailMode = "user" | "admin";

type ClubNoticeDetailModalProps = {
  clubId: string;
  noticeId: string;
  mode?: DetailMode;
  onRequestClose: () => void;
};

type ClubScheduleEventDetailModalProps = {
  clubId: string;
  eventId: string;
  onRequestClose: () => void;
};

type ClubPollDetailModalProps = {
  clubId: string;
  voteId: string;
  mode?: DetailMode;
  onRequestClose: () => void;
};

function getNoticeBasePath(clubId: string, mode: DetailMode) {
  return mode === "admin" ? `/clubs/${clubId}/admin/more/notices` : `/clubs/${clubId}/more/notices`;
}

function getPollBasePath(clubId: string, mode: DetailMode) {
  return mode === "admin" ? `/clubs/${clubId}/admin/more/polls` : `/clubs/${clubId}/more/polls`;
}

export function ClubNoticeDetailModal({
  clubId,
  noticeId,
  mode = "user",
  onRequestClose,
}: ClubNoticeDetailModalProps) {
  return (
    <RouteModal onDismiss={onRequestClose}>
      <ClubNoticeDetailClient
        clubId={clubId}
        noticeId={noticeId}
        presentation="modal"
        basePath={getNoticeBasePath(clubId, mode)}
        onRequestClose={onRequestClose}
      />
    </RouteModal>
  );
}

export function ClubScheduleEventDetailModal({
  clubId,
  eventId,
  onRequestClose,
}: ClubScheduleEventDetailModalProps) {
  return (
    <RouteModal onDismiss={onRequestClose}>
      <ClubScheduleDetailClient
        clubId={clubId}
        eventId={eventId}
        presentation="modal"
        onRequestClose={onRequestClose}
      />
    </RouteModal>
  );
}

export function ClubPollDetailModal({
  clubId,
  voteId,
  mode = "user",
  onRequestClose,
}: ClubPollDetailModalProps) {
  return (
    <RouteModal onDismiss={onRequestClose}>
      <ClubScheduleVoteDetailClient
        clubId={clubId}
        voteId={voteId}
        presentation="modal"
        basePath={getPollBasePath(clubId, mode)}
        onRequestClose={onRequestClose}
      />
    </RouteModal>
  );
}
