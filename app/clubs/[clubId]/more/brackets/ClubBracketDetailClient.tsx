"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouterLink } from "@/app/components/RouterLink";
import { type BracketDetailResponse } from "@/app/lib/clubs";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import {
  reviewBracketMutationOptions,
  submitBracketMutationOptions,
} from "@/app/lib/react-query/brackets/mutations";
import {
  bracketDetailQueryOptions,
  bracketQueryKeys,
} from "@/app/lib/react-query/brackets/queries";
import { ClubDetailLoadingShell } from "../../ClubRouteLoadingShells";
import { BracketRejectModal } from "./BracketRejectModal";

type ClubBracketDetailClientProps = {
  clubId: string;
  bracketRecordId: string;
  mode?: "user" | "admin";
  presentation?: "page" | "modal";
  basePath?: string;
  onRequestClose?: () => void;
  onReload?: () => void;
};

function getBracketParticipantLabel(name: string | null) {
  if (!name) {
    return "부전승";
  }

  const winnerMatch = /^Winner M(\d+)$/.exec(name);
  return winnerMatch ? `${winnerMatch[1]}경기 승자` : name;
}

function approvalBadgeClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "REJECTED":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function approvalLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return "승인 완료";
    case "PENDING":
      return "승인 대기";
    case "REJECTED":
      return "반려";
    default:
      return "초안";
  }
}

function sourceLabel(sourceType: string) {
  return sourceType === "TOURNAMENT" ? "대회 불러오기" : "직접 작성";
}

export function ClubBracketDetailClient({
  clubId,
  bracketRecordId,
  mode = "user",
  presentation = "page",
  basePath,
  onRequestClose,
  onReload,
}: ClubBracketDetailClientProps) {
  const queryClient = useQueryClient();
  const {
    data: queryPayload,
    isPending: loading,
    error: queryError,
  } = useQuery(bracketDetailQueryOptions(clubId, bracketRecordId));
  const [payloadState, setPayload] = useState<BracketDetailResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const submitBracketMutation = useMutation(submitBracketMutationOptions(clubId));
  const reviewBracketMutation = useMutation(reviewBracketMutationOptions(clubId));
  const isModal = presentation === "modal";
  const isAdminMode = mode === "admin";
  const payload = payloadState ?? queryPayload ?? null;
  const error =
    actionError ?? (queryError
      ? getQueryErrorMessage(queryError, "대진표 상세를 불러오지 못했습니다.")
      : null);
  const fallbackBasePath = basePath ?? (isAdminMode
    ? `/clubs/${clubId}/admin/more/brackets`
    : `/clubs/${clubId}/more/brackets`);
  const heroClassName = isAdminMode
    ? "bg-[linear-gradient(135deg,#fff3eb_0%,#ffffff_55%,#fff7f1_100%)] shadow-[0_18px_50px_rgba(236,91,19,0.12)] ring-orange-100"
    : "bg-[linear-gradient(135deg,#eaf1ff_0%,#ffffff_55%,#f5f8ff_100%)] shadow-[0_18px_50px_rgba(19,91,236,0.12)] ring-sky-100";

  const handleSubmit = async () => {
    if (!payload) {
      return;
    }
    setSubmitting(true);
    setActionError(null);
    const result = await submitBracketMutation.mutateAsync(payload.bracketRecordId);
    setSubmitting(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "대진표 제출에 실패했습니다.");
      return;
    }
    queryClient.setQueryData(bracketQueryKeys.bracketDetail(clubId, bracketRecordId), result.data);
    setPayload(result.data);
    void invalidateClubQueries(queryClient, clubId);
    onReload?.();
  };

  const handleReview = async (
    approvalStatus: "APPROVED" | "REJECTED",
    reason: string | null = null,
  ): Promise<boolean> => {
    if (!payload) {
      return false;
    }
    setSubmitting(true);
    setActionError(null);
    const result = await reviewBracketMutation.mutateAsync({
      bracketRecordId: payload.bracketRecordId,
      approvalStatus,
      rejectionReason: reason,
    });
    setSubmitting(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "대진표 검토에 실패했습니다.");
      return false;
    }
    queryClient.setQueryData(bracketQueryKeys.bracketDetail(clubId, bracketRecordId), result.data);
    setPayload(result.data);
    void invalidateClubQueries(queryClient, clubId);
    onReload?.();
    return true;
  };

  if (loading && !payload) {
    return <ClubDetailLoadingShell />;
  }

  if (!payload) {
    return (
      <div className="px-4 py-8 text-sm font-medium text-rose-600">
        {error ?? "대진표 정보를 찾을 수 없습니다."}
      </div>
    );
  }

  return (
    <div className={`${isAdminMode ? "semo-admin-theme" : "semo-user-theme"} ${isModal ? "flex min-h-0 flex-1 flex-col font-display text-slate-900" : "min-h-full font-display text-slate-900"}`}>
      <div
        className={isModal ? "flex min-h-0 flex-1 flex-col" : "mx-auto flex min-h-full max-w-md flex-col"}
        style={{ backgroundColor: "var(--background-light)" }}
      >
        <ClubPageHeader
          title="대진표 초안 상세"
          subtitle={payload.clubName}
          icon="account_tree"
          theme={isAdminMode ? "admin" : "user"}
          layout={isModal ? "modal" : "page"}
          leftSlot={!isModal ? (
            <RouterLink
              href={fallbackBasePath}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
              aria-label="대진표 목록으로 돌아가기"
            >
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">arrow_back</span>
            </RouterLink>
          ) : undefined}
          rightSlot={isModal && onRequestClose ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="semo-icon-control transition-colors hover:bg-slate-100"
              aria-label="대진표 상세 닫기"
            >
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">close</span>
            </button>
          ) : undefined}
        />

        <main className={`flex-1 ${isModal ? "overflow-y-auto" : "semo-nav-bottom-space"} px-4 pb-24 pt-5`}>
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <section className={`overflow-hidden rounded-[var(--radius-modal)] p-6 ring-1 ${heroClassName}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 sm:max-w-[74%]">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${approvalBadgeClass(payload.approvalStatus)}`}>
                    {approvalLabel(payload.approvalStatus)}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-slate-600">
                    {sourceLabel(payload.sourceType)}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-slate-600">
                    {payload.participantCount}명
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{payload.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {payload.summaryText ?? "대진표 설명이 아직 없습니다."}
                </p>
              </div>
              <div className="w-full rounded-[var(--radius-card)] bg-white/85 px-4 py-3 text-left shadow-sm sm:w-auto sm:text-right">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">작성자</p>
                <p className="mt-1 text-lg font-black text-slate-900">{payload.authorDisplayName ?? "-"}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoCard label="원본 대회" value={payload.sourceTournamentTitle ?? "직접 작성"} />
              <InfoCard label="검토 정보" value={payload.reviewedByDisplayName ?? payload.reviewedAtLabel ?? "아직 검토 전"} />
            </div>

            {payload.rejectionReason ? (
              <div className="mt-4 rounded-[var(--radius-card)] bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                반려 사유: {payload.rejectionReason}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              {payload.canSubmit ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                  className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(19,91,236,0.18)] transition hover:opacity-95 disabled:opacity-60"
                >
                  {submitting ? "처리 중..." : "승인 요청"}
                </button>
              ) : null}
              {isAdminMode && payload.canReview && payload.approvalStatus === "PENDING" ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleReview("APPROVED")}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:opacity-60"
                >
                  승인
                </button>
              ) : null}
              {isAdminMode && payload.canReview && payload.approvalStatus === "PENDING" ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setRejectionReason("");
                    setRejectModalOpen(true);
                  }}
                  className="rounded-full bg-rose-600 px-5 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:opacity-60"
                >
                  반려
                </button>
              ) : null}
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-[320px_1fr]">
            <article className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-black tracking-wide text-slate-400">참가자</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">참가자</h3>
              </div>
              <div className="space-y-3">
                {payload.participants.map((participant) => (
                  <div
                    key={`${participant.bracketParticipantId ?? participant.seedNumber}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{participant.displayName}</p>
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        시드 {participant.seedNumber} · {participant.entrySourceType === "TOURNAMENT"
                          ? "대회 불러오기"
                          : participant.guestEntry
                            ? "게스트"
                            : "직접 입력"}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                      {participant.seedNumber}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-black tracking-wide text-slate-400">대진 미리보기</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">라운드 미리보기</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {payload.rounds.map((round) => (
                  <section key={round.roundNumber} className="rounded-2xl bg-slate-50 p-4">
                    <h4 className="text-sm font-bold text-slate-900">{round.title}</h4>
                    <div className="mt-3 space-y-3">
                      {round.matches.map((match) => (
                        <div key={match.matchNumber} className="rounded-xl bg-white px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            경기 {match.matchNumber}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                              {getBracketParticipantLabel(match.homeParticipantName)}
                            </p>
                            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                              {getBracketParticipantLabel(match.awayParticipantName)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>
      {rejectModalOpen ? (
        <BracketRejectModal
          reason={rejectionReason}
          busy={submitting}
          onReasonChange={setRejectionReason}
          onCancel={() => {
            if (!submitting) {
              setRejectModalOpen(false);
              setRejectionReason("");
            }
          }}
          onConfirm={() => {
            void handleReview("REJECTED", rejectionReason.trim()).then((succeeded) => {
              if (succeeded) {
                setRejectModalOpen(false);
                setRejectionReason("");
              }
            });
          }}
        />
      ) : null}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-white/85 p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}
