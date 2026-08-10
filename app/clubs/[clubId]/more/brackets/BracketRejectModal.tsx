import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouteModal } from "@/app/components/RouteModal";

type BracketRejectModalProps = {
  reason: string;
  busy: boolean;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function BracketRejectModal({
  reason,
  busy,
  onReasonChange,
  onCancel,
  onConfirm,
}: BracketRejectModalProps) {
  const normalizedReason = reason.trim();

  return (
    <RouteModal ariaLabel="대진표 초안 반려" onDismiss={onCancel} dismissOnBackdrop={!busy}>
      <ClubPageHeader
        title="반려 사유"
        subtitle="작성자가 다음 수정 방향을 알 수 있도록 구체적으로 적어주세요."
        icon="rate_review"
        theme="admin"
        layout="modal"
        rightSlot={
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="semo-icon-control text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            aria-label="반려 사유 입력 닫기"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        }
      />
      <div className="space-y-4 p-5">
        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-800">반려 사유</span>
          <textarea
            autoFocus
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            rows={5}
            maxLength={500}
            placeholder="예: 3번 시드와 4번 시드의 참가 자격을 다시 확인해 주세요."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
          />
        </label>
        <p className="text-right text-xs text-slate-400">{reason.length}/500</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 disabled:opacity-40"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !normalizedReason}
            className="rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white disabled:bg-slate-200 disabled:text-slate-500"
          >
            {busy ? "처리 중..." : "사유와 함께 반려"}
          </button>
        </div>
      </div>
    </RouteModal>
  );
}
