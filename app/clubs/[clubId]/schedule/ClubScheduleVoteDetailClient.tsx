"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useState } from "react";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import {
  closeClubScheduleVote,
  getClubScheduleVoteDetail,
  submitClubScheduleVoteSelection,
  type ClubScheduleVoteDetailResponse,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { ClubDetailLoadingShell } from "../ClubRouteLoadingShells";

type ClubScheduleVoteDetailClientProps = {
  clubId: string;
  voteId: string;
  presentation?: "page" | "modal";
  onRequestClose?: () => void;
};

function getVoteStatusLabel(payload: ClubScheduleVoteDetailResponse) {
  if (!payload.votingOpen) {
    return "마감";
  }
  if (payload.mySelectedOptionId) {
    return "참여 완료";
  }
  return "진행 중";
}

function getVoteStatusClassName(payload: ClubScheduleVoteDetailResponse) {
  if (!payload.votingOpen) {
    return "bg-slate-100 text-slate-500";
  }
  return "bg-blue-50 text-blue-600";
}

function buildVoteTag(payload: ClubScheduleVoteDetailResponse) {
  const normalizedClubName = payload.clubName.replace(/\s+/g, "_");
  return `#${normalizedClubName}_투표`;
}

function getOptionPercent(voteCount: number, totalResponses: number) {
  if (totalResponses <= 0) {
    return 0;
  }
  return Math.round((voteCount / totalResponses) * 100);
}

function getSubmitLabel(
  payload: ClubScheduleVoteDetailResponse,
  selectedOptionId: number | null,
  submittingVoteOptionId: number | null,
) {
  if (!payload.votingOpen) {
    return "투표 마감";
  }
  if (submittingVoteOptionId !== null) {
    return "투표 처리 중...";
  }
  if (selectedOptionId == null) {
    return "항목을 선택하세요";
  }
  if (payload.mySelectedOptionId != null && payload.mySelectedOptionId === selectedOptionId) {
    return "선택 완료";
  }
  if (payload.mySelectedOptionId != null) {
    return "다시 투표하기";
  }
  return "투표하기";
}

export function ClubScheduleVoteDetailClient({
  clubId,
  voteId,
  presentation = "page",
  onRequestClose,
}: ClubScheduleVoteDetailClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [payload, setPayload] = useState<ClubScheduleVoteDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [submittingVoteOptionId, setSubmittingVoteOptionId] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useEffectEvent(async () => {
    setLoading(true);
    setError(null);
    const result = await getClubScheduleVoteDetail(clubId, voteId);
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "투표 상세를 불러오지 못했습니다.");
      return;
    }
    setPayload(result.data);
    setSelectedOptionId(result.data.mySelectedOptionId);
  });

  useEffect(() => {
    void loadDetail();
  }, [clubId, voteId]);

  const handleVoteSubmit = async () => {
    if (!payload?.votingOpen || selectedOptionId == null) {
      return;
    }

    setSubmittingVoteOptionId(selectedOptionId);
    setError(null);
    const result = await submitClubScheduleVoteSelection(clubId, voteId, { voteOptionId: selectedOptionId });
    setSubmittingVoteOptionId(null);
    if (!result.ok || !result.data) {
      setError(result.message ?? "투표 저장에 실패했습니다.");
      return;
    }
    setPayload(result.data);
    setSelectedOptionId(result.data.mySelectedOptionId);
  };

  const handleCloseVote = async () => {
    if (!payload || !payload.canManage || !payload.votingOpen) {
      return;
    }
    if (!window.confirm("이 투표를 지금 종료하시겠습니까?")) {
      return;
    }

    setClosing(true);
    setError(null);
    const result = await closeClubScheduleVote(clubId, voteId);
    setClosing(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "투표 종료에 실패했습니다.");
      return;
    }
    setPayload(result.data);
    setSelectedOptionId(result.data.mySelectedOptionId);
  };

  if (loading && !payload && !error) {
    return <ClubDetailLoadingShell />;
  }

  const showPrimaryAction = Boolean(payload?.votingOpen);
  const showAdminCloseAction = Boolean(payload?.canManage && payload?.votingOpen);
  const submitDisabled = !payload?.votingOpen
    || selectedOptionId == null
    || submittingVoteOptionId !== null
    || selectedOptionId === payload?.mySelectedOptionId;
  const isModal = presentation === "modal";
  const backHref = `/clubs/${clubId}/schedule`;

  return (
    <div className={isModal ? "flex min-h-0 flex-1 flex-col bg-white font-display text-gray-900 antialiased" : "min-h-screen bg-gray-50 font-display text-gray-900 antialiased"}>
      <div className={`relative flex flex-col bg-white ${isModal ? "min-h-0 flex-1" : "mx-auto min-h-screen max-w-md shadow-lg"}`}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            {isModal && onRequestClose ? (
              <button
                type="button"
                onClick={onRequestClose}
                aria-label="투표 상세 닫기"
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-[24px] text-gray-700">close</span>
              </button>
            ) : (
              <RouterLink
                href={backHref}
                aria-label="뒤로 가기"
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-[24px] text-gray-700">arrow_back</span>
              </RouterLink>
            )}
            <h1 className="text-lg font-bold">투표 상세</h1>
          </div>
          <div className="w-8" />
        </header>

        <main className={`no-scrollbar flex-1 overflow-y-auto p-5 ${isModal ? "pb-8" : "pb-28"}`}>
          {error ? (
            <motion.div
              className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
              {...staggeredFadeUpMotion(1, reduceMotion)}
            >
              {error}
            </motion.div>
          ) : null}

          {payload ? (
            <>
              <motion.section className="mb-8" {...staggeredFadeUpMotion(2, reduceMotion)}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${getVoteStatusClassName(payload)}`}>
                    {getVoteStatusLabel(payload)}
                  </span>
                  <span className="text-sm text-gray-400">{buildVoteTag(payload)}</span>
                </div>
                <h2 className="mb-4 text-2xl font-bold leading-tight">{payload.title}</h2>
                <div className="flex flex-col gap-1.5 border-y border-gray-100 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">투표 기간</span>
                    <span className="font-medium text-gray-700">{payload.votePeriodLabel}</span>
                  </div>
                  {payload.voteTimeLabel ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">투표 시간</span>
                      <span className="font-medium text-gray-700">{payload.voteTimeLabel}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">총 응답 수</span>
                    <span className="font-medium text-blue-600">{payload.totalResponses}명</span>
                  </div>
                </div>
              </motion.section>

              <motion.section className="space-y-4" {...staggeredFadeUpMotion(3, reduceMotion)}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">투표 항목</h3>

                {payload.options.map((option) => {
                  const percent = getOptionPercent(option.voteCount, payload.totalResponses);
                  const isPersistedSelection = payload.mySelectedOptionId === option.voteOptionId;
                  const isSelected = selectedOptionId === option.voteOptionId;

                  return (
                    <button
                      key={option.voteOptionId}
                      type="button"
                      onClick={() => setSelectedOptionId(option.voteOptionId)}
                      disabled={!payload.votingOpen}
                      className={`block w-full rounded-2xl p-4 text-left transition-colors ${
                        isSelected
                          ? "overflow-hidden border-2 border-blue-500 bg-white shadow-sm"
                          : "border border-gray-200 bg-white hover:border-blue-200"
                      } ${!payload.votingOpen ? "cursor-default" : ""}`}
                    >
                      <div className="relative z-10 mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            </span>
                          ) : (
                            <span className="h-6 w-6 rounded-full border-2 border-gray-200" />
                          )}
                          <span className={`font-medium ${isSelected ? "font-bold text-gray-900" : "text-gray-700"}`}>
                            {option.label}
                          </span>
                        </div>
                        <span className={`text-sm ${isSelected ? "font-bold text-blue-600" : "font-medium text-gray-500"}`}>
                          {percent}% ({option.voteCount}명)
                        </span>
                      </div>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full ${isSelected ? "bg-blue-500" : "bg-gray-300"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {isPersistedSelection ? (
                        <div className="mt-2 text-[10px] font-bold uppercase text-blue-500">나의 선택</div>
                      ) : null}
                    </button>
                  );
                })}

                {payload.linkedNoticeId ? (
                  <RouterLink
                    href={`/clubs/${clubId}/board/${payload.linkedNoticeId}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">게시판 공지와 연결됨</p>
                      <p className="mt-1 text-xs text-slate-500">공지 화면에서도 이 투표를 확인할 수 있습니다.</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                  </RouterLink>
                ) : null}
              </motion.section>

              {showPrimaryAction || showAdminCloseAction ? (
                <motion.section className="pt-6" {...staggeredFadeUpMotion(4, reduceMotion)}>
                  <div className="space-y-3">
                    {showPrimaryAction ? (
                      <button
                        type="button"
                        onClick={handleVoteSubmit}
                        disabled={submitDisabled}
                        className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-60"
                      >
                        {getSubmitLabel(payload, selectedOptionId, submittingVoteOptionId)}
                      </button>
                    ) : null}

                    {showAdminCloseAction ? (
                      <button
                        type="button"
                        onClick={handleCloseVote}
                        disabled={closing}
                        className="w-full rounded-xl border border-amber-100 bg-white py-3 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-60"
                      >
                        {closing ? "종료 중..." : "투표 종료"}
                      </button>
                    ) : null}
                  </div>
                </motion.section>
              ) : null}
            </>
          ) : null}
        </main>

        {!isModal && payload?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" className="bottom-44" /> : null}
        {!isModal ? <ClubBottomNav clubId={clubId} isAdmin={payload?.admin ?? false} /> : null}
      </div>
    </div>
  );
}
