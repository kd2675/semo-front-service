"use client";

import { RouteModal } from "@/app/components/RouteModal";
import { ClubGrowthCorePanel } from "@/app/components/ClubGrowthCorePanel";
import {
  getActivityCategoryLabel,
  getAffiliationTypeLabel,
  getPrimaryClubActivityLabel,
} from "@/app/lib/clubClassification";
import { type ClubDiscoverSummary } from "@/app/lib/clubs";

type DiscoverClubModalProps = {
  club: ClubDiscoverSummary;
  requestMessage: string;
  isSubmitting: boolean;
  onClose: () => void;
  onRequestMessageChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

function getMembershipPolicyLabel(membershipPolicy: string) {
  return membershipPolicy === "OPEN" ? "바로 가입" : "승인 후 가입";
}

function getJoinActionLabel(club: ClubDiscoverSummary) {
  if (club.joinStatus === "PENDING") {
    return "신청 취소";
  }
  if (club.membershipPolicy === "OPEN") {
    return "바로 가입";
  }
  if (club.joinStatus === "REJECTED") {
    return "다시 신청";
  }
  return "가입 신청";
}

export function DiscoverClubModal({
  club,
  requestMessage,
  isSubmitting,
  onClose,
  onRequestMessageChange,
  onSubmit,
}: DiscoverClubModalProps) {
  const actionLabel = getJoinActionLabel(club);
  const showRequestMessage = club.membershipPolicy === "APPROVAL";

  return (
    <RouteModal onDismiss={onClose} ariaLabel={`${club.name} 가입 안내`} contentClassName="max-w-[30rem]">
      <div className="overflow-y-auto bg-white px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">{club.name}</h3>
              {club.recommendedByTags || club.recommendedByCategory ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-600">
                  추천
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {club.description ?? club.summary ?? "클럽 소개가 아직 없습니다."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="semo-icon-control rounded-full bg-slate-100 text-slate-500"
            aria-label="가입 신청 모달 닫기"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="mt-5">
          <ClubGrowthCorePanel growthCore={club.growthCore} compact />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold text-slate-500">활동</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {getPrimaryClubActivityLabel(club.activityTags, club.activityCategory, club.categoryKey)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold text-slate-500">소속 유형</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {[
                getActivityCategoryLabel(club.activityCategory),
                getAffiliationTypeLabel(club.affiliationType),
              ]
                .filter(Boolean)
                .join(" · ") || "기타 · 독립"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold text-slate-500">가입 방식</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{getMembershipPolicyLabel(club.membershipPolicy)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold text-slate-500">공개 범위</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {club.visibilityStatus === "PUBLIC" ? "공개 클럽" : "비공개 클럽"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold text-slate-500">회원</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{club.activeMemberCount.toLocaleString("ko-KR")}명</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold text-slate-500">활동 지역</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{club.regionLabel ?? "전국"}</p>
          </div>
        </div>

        {showRequestMessage ? (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-900">가입 메시지</label>
            <textarea
              aria-label="가입 메시지"
              value={requestMessage}
              onChange={(event) => onRequestMessageChange(event.target.value)}
              placeholder="모임에 관심 있는 이유나 활동 계획을 남겨 주세요."
              className="form-input min-h-28 w-full resize-none rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--primary)]/40"
            />
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="semo-control flex-1 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={isSubmitting}
            className="semo-control flex-1 bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isSubmitting ? "처리 중..." : actionLabel}
          </button>
        </div>
      </div>
    </RouteModal>
  );
}
