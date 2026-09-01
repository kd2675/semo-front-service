"use client";

import { motion } from "motion/react";
import { ResourceAttachmentPanel } from "@/app/components/ResourceAttachmentPanel";
import type {
  ClubAdminFinanceHomeResponse,
  ClubAdminFinanceObligation,
  ClubFinanceExpense,
  ClubFinanceRequest,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { getObligationFrameClassName } from "../utils/financeUtils";
import {
  AdminFinanceRequestCard,
  EmptyAdminState,
  ExpenseLedgerCard,
  MetricCard,
  WorkspaceStatusCard,
} from "./financeCardParts";

export function DashboardTabPanel({
  finance,
  pendingRequestCount,
  expenseCount,
  reduceMotion,
}: {
  finance: ClubAdminFinanceHomeResponse;
  pendingRequestCount: number;
  expenseCount: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.section className="space-y-5" {...staggeredFadeUpMotion(2, reduceMotion)}>
      <section className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">재무 요약</p>
            <h3 className="mt-2 text-xl font-bold">현재 운영 중인 회비/청구 흐름</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              청구, 수납, 미납 현황을 한눈에 확인하고 필요한 후속 처리를 이어갈 수 있습니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="재정 항목" value={finance.totalObligationCount} />
            <MetricCard label="총 납부건" value={finance.totalPaymentCount} />
            <MetricCard label="연체" value={finance.overduePaymentCount} />
            <MetricCard label="수납률" value={`${finance.collectionRate}%`} accent />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <WorkspaceStatusCard
          title="회비 관리"
          status="운영 중"
          description="청구 발행부터 멤버별 납부 상태 확인과 면제 처리까지 한곳에서 관리합니다."
          metrics={[
            { label: "활성 멤버", value: `${finance.activeMemberCount}명` },
            { label: "미납", value: `${finance.pendingPaymentCount}건` },
            { label: "연체", value: `${finance.overduePaymentCount}건` },
          ]}
        />
        <WorkspaceStatusCard
          title="재정 운영 현황"
          status="운영 중"
          description="회원 요청과 운영 지출을 함께 확인하고 처리할 수 있습니다."
          metrics={[
            { label: "요청 대기", value: `${pendingRequestCount}건` },
            { label: "지출 입력", value: `${expenseCount}건` },
            { label: "관리 범위", value: "요청 · 지출" },
          ]}
          muted
        />
      </section>
    </motion.section>
  );
}

export function BillingTabPanel({
  obligations,
  obligationFilter,
  searchQuery,
  reduceMotion,
  activeObligationId,
  hasNext,
  isLoadingMore,
  loadError,
  onFilterChange,
  onSearchQueryChange,
  onOpenDetail,
  onDeleteRequest,
  onSetSentinelNode,
}: {
  obligations: ClubAdminFinanceObligation[];
  obligationFilter: "ALL" | "OPEN" | "SETTLED";
  searchQuery: string;
  reduceMotion: boolean;
  activeObligationId: number | null;
  hasNext: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  onFilterChange: (value: "ALL" | "OPEN" | "SETTLED") => void;
  onSearchQueryChange: (value: string) => void;
  onOpenDetail: (obligationId: number) => void;
  onDeleteRequest: (obligation: ClubAdminFinanceObligation) => void;
  onSetSentinelNode: (node: HTMLDivElement | null) => void;
}) {
  return (
    <motion.section className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm" {...staggeredFadeUpMotion(2, reduceMotion)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-400">납부 관리</p>
          <h3 className="mt-2 text-xl font-bold">회비 관리</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">운영비, 가입비, 행사비처럼 모임 기준 청구를 발행하고 멤버별 납부 상태를 마감합니다.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex rounded-full bg-slate-100 p-1">
            {(["ALL", "OPEN", "SETTLED"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange(filter)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  obligationFilter === filter ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {filter === "ALL" ? "전체" : filter === "OPEN" ? "미정산" : "정산 완료"}
              </button>
            ))}
          </div>
          <input
            aria-label="재정 항목 검색"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="항목명, 발행자, 멤버명, 메모 검색"
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 sm:w-72"
          />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {obligations.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">조건에 맞는 재정 항목이 없습니다.</div>
        ) : (
          obligations.map((obligation, index) => (
            <motion.article
              key={obligation.obligationId}
              className={`rounded-[var(--radius-modal)] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${getObligationFrameClassName(obligation)}`}
              {...staggeredFadeUpMotion(index + 3, reduceMotion)}
            >
              <div className="flex flex-col gap-5 text-left">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">{obligation.targetScopeLabel}</span>
                      {obligation.overduePaymentCount > 0 ? (
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-600">연체 {obligation.overduePaymentCount}건</span>
                      ) : obligation.pendingPaymentCount > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">미납 {obligation.pendingPaymentCount}건</span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">정산 완료</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-xl font-bold text-slate-900">{obligation.title}</h4>
                        <p className="mt-2 text-sm text-slate-500">{obligation.amountLabel} · 마감 {obligation.dueAtLabel ?? "미정"} · 발행 {obligation.issuedByDisplayName}</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-400" aria-hidden="true">chevron_right</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[320px]">
                    <MetricCard compact label="대상" value={obligation.totalPaymentCount} />
                    <MetricCard compact label="미납" value={obligation.pendingPaymentCount} />
                    <MetricCard compact label="완납" value={obligation.paidPaymentCount} />
                    <MetricCard compact label="수납률" value={`${obligation.collectionRate}%`} accent />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-white/80 pt-4">
                  <p className="text-xs font-medium text-slate-500">멤버별 납부 상태와 면제 처리는 상세 보기에서 관리합니다.</p>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(obligation.obligationId)}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    상세 보기
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!obligation.canDelete || activeObligationId === obligation.obligationId}
                  onClick={() => onDeleteRequest(obligation)}
                  className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {activeObligationId === obligation.obligationId ? "삭제 중..." : "미처리 재정 항목 삭제"}
                </button>
              </div>
            </motion.article>
          ))
        )}
      </div>

      {loadError ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{loadError}</div> : null}

      <div className="mt-4">
        {hasNext ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-4 text-center text-sm text-slate-400">
            {isLoadingMore ? "재정 항목을 더 불러오는 중..." : "스크롤을 내리면 다음 재정 항목 10개를 자동으로 불러옵니다."}
          </div>
        ) : obligations.length > 0 ? (
          <div className="pb-1 text-center text-sm text-slate-400">마지막 재정 항목까지 모두 불러왔습니다.</div>
        ) : null}
      </div>

      <div ref={onSetSentinelNode} className="h-16" />
    </motion.section>
  );
}

export function ExpensesTabPanel({
  clubId,
  pendingRequestCount,
  totalExpenseAmountLabel,
  advanceRequestItems,
  expenses,
  canReview,
  activeRequestId,
  reduceMotion,
  onReviewRequest,
  onOpenExpense,
}: {
  clubId: string;
  pendingRequestCount: number;
  totalExpenseAmountLabel: string;
  advanceRequestItems: ClubFinanceRequest[];
  expenses: ClubFinanceExpense[];
  canReview: boolean;
  activeRequestId: number | null;
  reduceMotion: boolean;
  onReviewRequest: (requestId: number, decision: "APPROVED" | "REJECTED") => void;
  onOpenExpense: (expense: ClubFinanceExpense) => void;
}) {
  return (
    <motion.section className="space-y-5" {...staggeredFadeUpMotion(2, reduceMotion)}>
      <section className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">지출 운영</p>
            <h3 className="mt-2 text-xl font-bold">지출 관리</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">회원 선지출과 환불 요청을 검토하고, 운영진이 직접 입력한 지출을 같은 화면에서 관리합니다.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard label="요청 대기" value={pendingRequestCount} accent />
            <MetricCard label="등록 지출" value={expenses.length} />
            <MetricCard label="누적 지출" value={totalExpenseAmountLabel} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-400">멤버 요청</p>
              <h4 className="mt-1 text-lg font-bold text-slate-900">선지출 / 환불 요청</h4>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{advanceRequestItems.length}건</span>
          </div>
          <div className="mt-4 space-y-3">
            {advanceRequestItems.length === 0 ? (
              <EmptyAdminState title="검토할 선지출/환불 요청이 없습니다." description="회원이 FAB로 제출한 요청이 생기면 이 탭에서 승인 또는 반려할 수 있습니다." />
            ) : (
              advanceRequestItems.map((request) => (
                <div key={request.requestId} className="space-y-3">
                  <AdminFinanceRequestCard request={request} canReview={canReview} busy={activeRequestId === request.requestId} onApprove={() => onReviewRequest(request.requestId, "APPROVED")} onReject={() => onReviewRequest(request.requestId, "REJECTED")} />
                  <ResourceAttachmentPanel clubId={clubId} resourceType="FINANCE_REQUEST" resourceId={request.requestId} canUpload={false} canDelete={false} theme="admin" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-400">지출 장부</p>
              <h4 className="mt-1 text-lg font-bold text-slate-900">운영 지출 입력 내역</h4>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{expenses.length}건</span>
          </div>
          <div className="mt-4 space-y-3">
            {expenses.length === 0 ? (
              <EmptyAdminState title="아직 입력된 지출이 없습니다." description="FAB 버튼에서 지출 입력을 열어 운영비, 식비, 대관비를 바로 기록할 수 있습니다." />
            ) : (
              expenses.map((expense) => <ExpenseLedgerCard key={expense.expenseId} expense={expense} onOpen={() => onOpenExpense(expense)} />)
            )}
          </div>
        </div>
      </section>
    </motion.section>
  );
}

export function SettlementsTabPanel({
  clubId,
  settlementRequestItems,
  canReview,
  activeRequestId,
  reduceMotion,
  onReviewRequest,
}: {
  clubId: string;
  settlementRequestItems: ClubFinanceRequest[];
  canReview: boolean;
  activeRequestId: number | null;
  reduceMotion: boolean;
  onReviewRequest: (requestId: number, decision: "APPROVED" | "REJECTED") => void;
}) {
  return (
    <motion.section className="space-y-5" {...staggeredFadeUpMotion(2, reduceMotion)}>
      <section className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">정산 운영</p>
            <h3 className="mt-2 text-xl font-bold">정산 관리</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">회원이 제출한 정산 요청을 확인하고 승인 또는 반려할 수 있습니다.</p>
          </div>
          <MetricCard label="정산 요청" value={settlementRequestItems.length} accent />
        </div>
      </section>

      <section className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">정산 대기열</p>
            <h4 className="mt-1 text-lg font-bold text-slate-900">회원 정산 요청</h4>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{settlementRequestItems.length}건</span>
        </div>
        <div className="mt-4 space-y-3">
          {settlementRequestItems.length === 0 ? (
            <EmptyAdminState title="현재 정산 요청이 없습니다." description="회원이 FAB에서 정산 요청을 제출하면 이 큐에서 승인 또는 반려할 수 있습니다." />
          ) : (
            settlementRequestItems.map((request) => (
              <div key={request.requestId} className="space-y-3">
                <AdminFinanceRequestCard request={request} canReview={canReview} busy={activeRequestId === request.requestId} onApprove={() => onReviewRequest(request.requestId, "APPROVED")} onReject={() => onReviewRequest(request.requestId, "REJECTED")} />
                <ResourceAttachmentPanel clubId={clubId} resourceType="FINANCE_REQUEST" resourceId={request.requestId} canUpload={false} canDelete={false} theme="admin" />
              </div>
            ))
          )}
        </div>
      </section>
    </motion.section>
  );
}
