"use client";

import { motion } from "motion/react";
import type {
  ClubFinanceOperationsResponse,
  FinanceAccount,
  FinancePeriod,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type FinanceOperationsPanelProps = {
  operations: ClubFinanceOperationsResponse;
  reduceMotion: boolean;
  busyKey: string | null;
  onCreateAccount: () => void;
  onEditAccount: (account: FinanceAccount) => void;
  onDeactivateAccount: (account: FinanceAccount) => void;
  onCreatePeriod: () => void;
  onEditBudget: (period: FinancePeriod) => void;
  onClosePeriod: (period: FinancePeriod) => void;
  onExport: (periodId: number | null) => void;
};

export function FinanceOperationsPanel({
  operations,
  reduceMotion,
  busyKey,
  onCreateAccount,
  onEditAccount,
  onDeactivateAccount,
  onCreatePeriod,
  onEditBudget,
  onClosePeriod,
  onExport,
}: FinanceOperationsPanelProps) {
  const openPeriods = operations.periods.filter((period) => period.statusCode === "OPEN");
  const activeAccounts = operations.accounts.filter((account) => account.active);
  const totalBudget = openPeriods.reduce(
    (sum, period) => sum + period.budgets.reduce((budgetSum, budget) => budgetSum + budget.allocatedAmount, 0),
    0,
  );

  return (
    <motion.section className="space-y-5" {...staggeredFadeUpMotion(2, reduceMotion)}>
      <section className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-slate-400">예산과 마감</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">기간별로 예산을 세우고 잔액을 확정합니다.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              월·시즌 단위로 청구와 지출을 묶고, 미수납 항목이 없는 기간만 마감할 수 있습니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <OperationMetric label="열린 기간" value={`${openPeriods.length}개`} />
            <OperationMetric label="사용 계좌" value={`${activeAccounts.length}개`} />
            <OperationMetric label="설정 예산" value={`${totalBudget.toLocaleString("ko-KR")}원`} />
            <OperationMetric label="마감 완료" value={`${operations.periods.length - openPeriods.length}개`} accent />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <ActionButton icon="date_range" label="재정 기간 만들기" onClick={onCreatePeriod} disabled={!operations.canClosePeriods} primary />
          <ActionButton icon="account_balance" label="계좌·결제수단 등록" onClick={onCreateAccount} disabled={!operations.canClosePeriods} />
          <ActionButton icon="download" label="전체 CSV" onClick={() => onExport(null)} disabled={!operations.canExport || busyKey === "export:all"} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <SectionHeading eyebrow="기간 원장" title="재정 기간과 예산" count={operations.periods.length} />
          {operations.periods.length === 0 ? (
            <EmptyOperationState
              icon="calendar_month"
              title="아직 재정 기간이 없습니다."
              description="이번 달이나 현재 시즌부터 기간을 만들어 청구·지출을 묶어보세요."
            />
          ) : (
            operations.periods.map((period) => (
              <PeriodCard
                key={period.financePeriodId}
                period={period}
                canManage={operations.canClosePeriods}
                canExport={operations.canExport}
                busyKey={busyKey}
                onEditBudget={() => onEditBudget(period)}
                onClose={() => onClosePeriod(period)}
                onExport={() => onExport(period.financePeriodId)}
              />
            ))
          )}
        </div>

        <div className="space-y-4">
          <SectionHeading eyebrow="자금 수단" title="계좌·결제수단" count={operations.accounts.length} />
          {operations.accounts.length === 0 ? (
            <EmptyOperationState
              icon="account_balance_wallet"
              title="등록된 계좌·결제수단이 없습니다."
              description="실제 번호 전체를 저장하지 말고 식별 가능한 마스킹 정보만 등록하세요."
            />
          ) : (
            <div className="space-y-3">
              {operations.accounts.map((account) => (
                <AccountCard
                  key={account.financeAccountId}
                  account={account}
                  canManage={operations.canClosePeriods}
                  busy={busyKey === `account:${account.financeAccountId}`}
                  onEdit={() => onEditAccount(account)}
                  onDeactivate={() => onDeactivateAccount(account)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </motion.section>
  );
}

function PeriodCard({
  period,
  canManage,
  canExport,
  busyKey,
  onEditBudget,
  onClose,
  onExport,
}: {
  period: FinancePeriod;
  canManage: boolean;
  canExport: boolean;
  busyKey: string | null;
  onEditBudget: () => void;
  onClose: () => void;
  onExport: () => void;
}) {
  const closed = period.statusCode === "CLOSED";
  const budgetTotal = period.budgets.reduce((sum, budget) => sum + budget.allocatedAmount, 0);
  const spentTotal = period.budgets.reduce((sum, budget) => sum + budget.spentAmount, 0);

  return (
    <article className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${closed ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>
              {closed ? "마감" : "운영 중"}
            </span>
            <span className="text-xs font-semibold text-slate-400">{period.startDate} – {period.endDate}</span>
          </div>
          <h4 className="mt-3 text-lg font-bold text-slate-900">{period.title}</h4>
          <p className="mt-1 text-sm text-slate-500">{period.note ?? "기간 메모 없음"}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold tracking-wide text-slate-400">{closed ? "확정 잔액" : "현재 잔액"}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{closed ? period.closingBalanceLabel : period.currentBalanceLabel}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <OperationMetric label="기초" value={period.openingBalanceLabel} compact />
        <OperationMetric label="수납" value={period.collectedAmountLabel} compact />
        <OperationMetric label="지출" value={period.spentAmountLabel} compact />
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900">카테고리 예산</p>
            <p className="mt-1 text-xs text-slate-500">{budgetTotal.toLocaleString("ko-KR")}원 중 {spentTotal.toLocaleString("ko-KR")}원 집행</p>
          </div>
          {!closed && canManage ? (
            <button type="button" onClick={onEditBudget} className="min-h-11 rounded-xl bg-white px-3 text-xs font-bold text-[var(--primary)] shadow-sm transition hover:bg-[var(--primary)]/5">
              예산 설정
            </button>
          ) : null}
        </div>

        <div className="mt-3 space-y-3">
          {period.budgets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-400">설정된 카테고리 예산이 없습니다.</p>
          ) : (
            period.budgets.map((budget) => (
              <div key={budget.financeBudgetId}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-600">{budget.categoryLabel}</span>
                  <span className={budget.remainingAmount < 0 ? "font-bold text-rose-600" : "text-slate-500"}>
                    {budget.spentAmountLabel} / {budget.allocatedAmountLabel}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${budget.executionRate > 100 ? "bg-rose-500" : "bg-[var(--primary)]"}`}
                    style={{ width: `${Math.min(100, Math.max(0, budget.executionRate))}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onExport} disabled={!canExport || busyKey === `export:${period.financePeriodId}`} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
          CSV 내보내기
        </button>
        {!closed ? (
          <button type="button" onClick={onClose} disabled={!canManage || busyKey === `period:${period.financePeriodId}`} className="min-h-11 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50">
            {busyKey === `period:${period.financePeriodId}` ? "마감 중..." : "기간 마감"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function AccountCard({ account, canManage, busy, onEdit, onDeactivate }: {
  account: FinanceAccount;
  canManage: boolean;
  busy: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  return (
    <article className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${account.active ? "" : "opacity-55"}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
          <span className="material-symbols-outlined" aria-hidden="true">{account.accountTypeCode === "BANK" ? "account_balance" : account.accountTypeCode === "CARD" ? "credit_card" : "payments"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-slate-900">{account.displayName}</h4>
            {!account.active ? <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">비활성</span> : null}
            {account.defaultCollection ? <span className="rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700">기본 수납</span> : null}
            {account.defaultExpense ? <span className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">기본 지출</span> : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">{[account.providerName, account.maskedIdentifier, account.holderName].filter(Boolean).join(" · ") || account.accountTypeLabel}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">{account.usageScopeLabel}</p>
        </div>
      </div>
      {account.active && canManage ? (
        <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button type="button" onClick={onEdit} className="min-h-11 rounded-xl px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">수정</button>
          <button type="button" onClick={onDeactivate} disabled={busy} className="min-h-11 rounded-xl px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50">{busy ? "처리 중..." : "비활성화"}</button>
        </div>
      ) : null}
    </article>
  );
}

function OperationMetric({ label, value, accent = false, compact = false }: { label: string; value: string; accent?: boolean; compact?: boolean }) {
  return (
    <div className={`${compact ? "rounded-xl p-3" : "rounded-2xl p-4"} ${accent ? "bg-[var(--primary)] text-white" : "bg-slate-50 text-slate-900"}`}>
      <p className={`text-[11px] font-semibold ${accent ? "text-white/70" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-1 font-bold ${compact ? "text-sm" : "text-base"}`}>{value}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick, disabled, primary = false }: { icon: string; label: string; onClick: () => void; disabled: boolean; primary?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${primary ? "bg-[var(--primary)] text-white hover:brightness-95" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

function SectionHeading({ eyebrow, title, count }: { eyebrow: string; title: string; count: number }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold tracking-wide text-slate-400">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{count}개</span>
    </div>
  );
}

function EmptyOperationState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-[var(--radius-modal)] border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><span className="material-symbols-outlined" aria-hidden="true">{icon}</span></div>
      <p className="mt-3 text-sm font-bold text-slate-800">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
