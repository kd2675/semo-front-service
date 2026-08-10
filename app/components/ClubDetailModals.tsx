"use client";

import { RouteModal } from "@/app/components/RouteModal";
import { ClubNoticeDetailClient } from "@/app/clubs/[clubId]/board/[noticeId]/ClubNoticeDetailClient";
import { ClubBracketDetailClient } from "@/app/clubs/[clubId]/more/brackets/ClubBracketDetailClient";
import { ClubScheduleDetailClient } from "@/app/clubs/[clubId]/schedule/clients/ClubScheduleDetailClient";
import { ClubScheduleVoteDetailClient } from "@/app/clubs/[clubId]/schedule/clients/ClubScheduleVoteDetailClient";
import { ClubTournamentDetailClient } from "@/app/clubs/[clubId]/more/tournaments/clients/ClubTournamentDetailClient";

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

type ClubTournamentDetailModalProps = {
  clubId: string;
  tournamentRecordId: string;
  mode?: DetailMode;
  onRequestClose: () => void;
};

type ClubBracketDetailModalProps = {
  clubId: string;
  bracketRecordId: string;
  mode?: DetailMode;
  onRequestClose: () => void;
  onReload?: () => void;
};

function getNoticeBasePath(clubId: string) {
  return `/clubs/${clubId}/board`;
}

function getPollBasePath(clubId: string) {
  return `/clubs/${clubId}/schedule`;
}

function getTournamentBasePath(clubId: string, mode: DetailMode) {
  return mode === "admin" ? `/clubs/${clubId}/admin/more/tournaments` : `/clubs/${clubId}/more/tournaments`;
}

function getBracketBasePath(clubId: string, mode: DetailMode) {
  return mode === "admin" ? `/clubs/${clubId}/admin/more/brackets` : `/clubs/${clubId}/more/brackets`;
}

export function ClubNoticeDetailModal({
  clubId,
  noticeId,
  onRequestClose,
}: ClubNoticeDetailModalProps) {
  return (
    <RouteModal ariaLabel="공지 상세" onDismiss={onRequestClose}>
      <ClubNoticeDetailClient
        clubId={clubId}
        noticeId={noticeId}
        presentation="modal"
        basePath={getNoticeBasePath(clubId)}
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
    <RouteModal ariaLabel="일정 상세" onDismiss={onRequestClose}>
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
  onRequestClose,
}: ClubPollDetailModalProps) {
  return (
    <RouteModal ariaLabel="투표 상세" onDismiss={onRequestClose}>
      <ClubScheduleVoteDetailClient
        clubId={clubId}
        voteId={voteId}
        presentation="modal"
        basePath={getPollBasePath(clubId)}
        onRequestClose={onRequestClose}
      />
    </RouteModal>
  );
}

export function ClubTournamentDetailModal({
  clubId,
  tournamentRecordId,
  mode = "user",
  onRequestClose,
}: ClubTournamentDetailModalProps) {
  return (
    <RouteModal ariaLabel="대회 상세" onDismiss={onRequestClose}>
      <ClubTournamentDetailClient
        clubId={clubId}
        tournamentRecordId={tournamentRecordId}
        mode={mode}
        presentation="modal"
        basePath={getTournamentBasePath(clubId, mode)}
        onRequestClose={onRequestClose}
      />
    </RouteModal>
  );
}

export function ClubBracketDetailModal({
  clubId,
  bracketRecordId,
  mode = "user",
  onRequestClose,
  onReload,
}: ClubBracketDetailModalProps) {
  return (
    <RouteModal ariaLabel="대진표 초안 상세" onDismiss={onRequestClose}>
      <ClubBracketDetailClient
        clubId={clubId}
        bracketRecordId={bracketRecordId}
        mode={mode}
        presentation="modal"
        basePath={getBracketBasePath(clubId, mode)}
        onRequestClose={onRequestClose}
        onReload={onReload}
      />
    </RouteModal>
  );
}
