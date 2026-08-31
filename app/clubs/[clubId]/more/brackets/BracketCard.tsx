import type { BracketSummary } from "@/app/lib/clubs";

import { approvalBadgeClass, approvalLabel, sourceLabel } from "./bracketPresentation";

export function BracketCard({
  bracket,
  onOpen,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onDelete,
}: {
  bracket: BracketSummary;
  onOpen: () => void;
  onEdit: (() => void) | null;
  onSubmit: (() => void) | null;
  onApprove: (() => void) | null;
  onReject: (() => void) | null;
  onDelete: (() => void) | null;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${approvalBadgeClass(bracket.approvalStatus)}`}>
              {approvalLabel(bracket.approvalStatus)}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {sourceLabel(bracket.sourceType)}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {bracket.participantCount}명
            </span>
          </div>
          <h4 className="mt-3 text-lg font-bold text-slate-900">{bracket.title}</h4>
          {bracket.summaryText ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{bracket.summaryText}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
            {bracket.sourceTournamentTitle ? <span>원본 대회: {bracket.sourceTournamentTitle}</span> : null}
            {bracket.authorDisplayName ? <span>작성자: {bracket.authorDisplayName}</span> : null}
            {bracket.reviewedAtLabel ? <span>검토: {bracket.reviewedAtLabel}</span> : null}
          </div>
          {bracket.rejectionReason ? (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              반려 사유: {bracket.rejectionReason}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
        >
          상세
        </button>
      </div>
      {(onEdit || onSubmit || onApprove || onReject || onDelete) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {onEdit ? (
            <button type="button" onClick={onEdit} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              수정
            </button>
          ) : null}
          {onSubmit ? (
            <button type="button" onClick={onSubmit} className="rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white">
              제출
            </button>
          ) : null}
          {onApprove ? (
            <button type="button" onClick={onApprove} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
              승인
            </button>
          ) : null}
          {onReject ? (
            <button type="button" onClick={onReject} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white">
              반려
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" onClick={onDelete} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              삭제
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
