"use client";

import type {
  ClubAdminFinanceObligation,
  ClubAdminFinanceObligationDetailResponse,
  ClubFinanceExpense,
  ClubFinanceRequest,
} from "@/app/lib/clubs";
import {
  getFinanceRequestStatusClassName,
  getObligationFrameClassName,
  getPaymentStatusClassName,
} from "../utils/financeUtils";

export function MetricCard({
  label,
  value,
  accent = false,
  compact = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ${
        accent ? "bg-orange-50 text-[#ec5b13]" : "bg-slate-50 text-slate-900"
      } ${compact ? "min-w-[72px]" : ""}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accent ? "text-[#ec5b13]/70" : "text-slate-400"}`}>
        {label}
      </p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

export function PermissionChip({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        enabled ? "bg-[#fff5ef] text-[#ec5b13]" : "bg-slate-100 text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}

export function WorkspaceStatusCard({
  title,
  status,
  description,
  metrics,
  muted = false,
}: {
  title: string;
  status: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  muted?: boolean;
}) {
  return (
    <article
      className={`rounded-[28px] border p-5 shadow-sm ${
        muted ? "border-slate-200 bg-slate-50" : "border-[#ec5b13]/15 bg-[#fff7f2]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg font-bold text-slate-900">{title}</h4>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${muted ? "bg-white text-slate-500" : "bg-[#ec5b13] text-white"}`}>
          {status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
            <p className="mt-2 text-base font-bold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function AdminPlaceholderPanel({
  icon,
  title,
  description,
  bullets,
}: {
  icon: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <article className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white p-2 text-slate-500">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {bullets.map((bullet) => (
              <div key={bullet} className="rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-slate-700">
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function EmptyAdminState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function AdminFinanceRequestCard({
  request,
  canReview,
  busy,
  onApprove,
  onReject,
}: {
  request: ClubFinanceRequest;
  canReview: boolean;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const reviewDone = request.statusCode !== "SUBMITTED";
  const actionsDisabled = reviewDone || busy || !canReview;

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getFinanceRequestStatusClassName(request)}`}>
              {request.statusLabel}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
              {request.requestTypeLabel}
            </span>
          </div>
          <h4 className="mt-3 text-base font-bold text-slate-900">{request.title}</h4>
          <p className="mt-1 text-lg font-bold text-slate-900">{request.amountLabel}</p>
          <div className="mt-3 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
            <MetaItem label="요청자" value={request.requesterDisplayName} strong />
            <MetaItem label="제출 시각" value={request.submittedAtLabel ?? "방금"} />
            <MetaItem label="관련 행사" value={request.relatedEventName ?? "없음"} />
            <MetaItem label="검토 메모" value={request.reviewNote ?? "없음"} />
          </div>
          {request.note ? <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">{request.note}</div> : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={onApprove}
          className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {busy ? "처리 중..." : "승인"}
        </button>
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={onReject}
          className="rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          반려
        </button>
        {!canReview ? (
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500">
            발행 권한이 있어야 검토할 수 있습니다.
          </span>
        ) : null}
        {reviewDone ? (
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500">
            {request.reviewedAtLabel ?? "검토 완료"}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function ExpenseLedgerCard({ expense }: { expense: ClubFinanceExpense }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">{expense.categoryLabel}</span>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[#ec5b13]">{expense.expenseTypeLabel}</span>
          </div>
          <h4 className="mt-3 text-base font-bold text-slate-900">{expense.title}</h4>
        </div>
        <p className="text-base font-bold text-slate-900">{expense.amountLabel}</p>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
        <MetaItem label="입력자" value={expense.enteredByDisplayName} strong />
        <MetaItem label="지출 시각" value={expense.spentAtLabel ?? "미정"} />
        <MetaItem label="관련 행사" value={expense.relatedEventName ?? "없음"} />
        <MetaItem label="메모" value={expense.note ?? "없음"} />
      </div>
    </article>
  );
}

export function ObligationDetailPanel({
  obligation,
  detail,
  loading,
  error,
  canMarkPaid,
  canMarkWaive,
  canRestoreToPending,
  activePaymentId,
  onUpdateStatus,
}: {
  obligation: ClubAdminFinanceObligation;
  detail: ClubAdminFinanceObligationDetailResponse | null;
  loading: boolean;
  error: string | null;
  canMarkPaid: boolean;
  canMarkWaive: boolean;
  canRestoreToPending: boolean;
  activePaymentId: number | null;
  onUpdateStatus: (paymentId: number, paymentStatus: "PENDING" | "PAID" | "WAIVED") => void;
}) {
  const payments = detail?.payments ?? [];

  return (
    <div className="space-y-5">
      <section className={`rounded-3xl border p-5 shadow-sm ${getObligationFrameClassName(obligation)}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">{obligation.targetScopeLabel}</span>
          {obligation.overduePaymentCount > 0 ? (
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-600">연체 {obligation.overduePaymentCount}건</span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-5">
          <MetaItem label="발행 금액" value={obligation.amountLabel} strong />
          <MetaItem label="마감일" value={obligation.dueAtLabel ?? "미정"} />
          <MetaItem label="발행일" value={obligation.issuedAtLabel ?? "미정"} />
          <MetaItem label="발행자" value={obligation.issuedByDisplayName} />
          <MetaItem label="수납률" value={`${obligation.collectionRate}%`} strong />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard compact label="대상" value={obligation.totalPaymentCount} />
          <MetricCard compact label="미납" value={obligation.pendingPaymentCount} />
          <MetricCard compact label="완납" value={obligation.paidPaymentCount} />
          <MetricCard compact label="면제" value={obligation.waivedPaymentCount} />
        </div>

        <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">{obligation.note ?? "운영 메모 없음"}</div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">납부 내역</p>
            <h4 className="mt-1 text-lg font-bold text-slate-900">멤버별 납부 내역</h4>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{obligation.totalPaymentCount}건</span>
        </div>

        {loading ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">멤버별 납부 내역을 불러오는 중입니다.</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}
        {!loading && !error && payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">납부 대상이 없습니다.</div>
        ) : null}

        {!loading && !error
          ? payments.map((payment) => (
              <div key={payment.paymentId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-slate-900">{payment.memberDisplayName}</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{payment.memberRoleCode ?? "MEMBER"}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getPaymentStatusClassName(payment)}`}>{payment.paymentStatusLabel}</span>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                      <MetaItem label="청구 금액" value={payment.amountLabel} strong />
                      <MetaItem label="납부일" value={payment.paidAtLabel ?? "미납"} />
                      <MetaItem label="메모" value={payment.note ?? "없음"} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button
                      type="button"
                      disabled={!canMarkPaid || activePaymentId === payment.paymentId || payment.paymentStatusCode === "PAID"}
                      onClick={() => onUpdateStatus(payment.paymentId, "PAID")}
                      className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {activePaymentId === payment.paymentId ? "처리 중..." : "납부 완료"}
                    </button>
                    <button
                      type="button"
                      disabled={!canMarkWaive || activePaymentId === payment.paymentId || payment.paymentStatusCode === "WAIVED"}
                      onClick={() => onUpdateStatus(payment.paymentId, "WAIVED")}
                      className="rounded-full bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      면제
                    </button>
                    <button
                      type="button"
                      disabled={!canRestoreToPending || activePaymentId === payment.paymentId || (payment.paymentStatusCode !== "PAID" && payment.paymentStatusCode !== "WAIVED")}
                      onClick={() => onUpdateStatus(payment.paymentId, "PENDING")}
                      className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      미납으로 복원
                    </button>
                  </div>
                </div>
              </div>
            ))
          : null}
      </section>
    </div>
  );
}

function MetaItem({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string | number;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-1 ${strong ? "font-semibold text-slate-900" : ""}`}>{value}</p>
    </div>
  );
}
