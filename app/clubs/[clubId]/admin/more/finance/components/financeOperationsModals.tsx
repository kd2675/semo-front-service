"use client";

import { useState, type ReactNode } from "react";
import { DatePopoverField } from "@/app/components/DatePopoverField";
import { RouteModal } from "@/app/components/RouteModal";
import type {
  CreateFinancePeriodRequest,
  FinanceAccount,
  FinancePeriod,
  UpsertFinanceAccountRequest,
  UpsertFinanceBudgetRequest,
} from "@/app/lib/clubs";

const FIELD_CLASS = "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

export function FinanceAccountEditorModal({
  account,
  busy,
  onClose,
  onSubmit,
}: {
  account: FinanceAccount | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (request: UpsertFinanceAccountRequest) => void;
}) {
  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [accountTypeCode, setAccountTypeCode] = useState(account?.accountTypeCode ?? "BANK");
  const [providerName, setProviderName] = useState(account?.providerName ?? "");
  const [maskedIdentifier, setMaskedIdentifier] = useState(account?.maskedIdentifier ?? "");
  const [holderName, setHolderName] = useState(account?.holderName ?? "");
  const [usageScopeCode, setUsageScopeCode] = useState(account?.usageScopeCode ?? "BOTH");
  const [defaultCollection, setDefaultCollection] = useState(account?.defaultCollection ?? false);
  const [defaultExpense, setDefaultExpense] = useState(account?.defaultExpense ?? false);

  return (
    <RouteModal ariaLabel={account ? "계좌·결제수단 수정" : "계좌·결제수단 등록"} onDismiss={onClose} dismissOnBackdrop={false}>
      <ModalFrame
        eyebrow="자금 수단"
        title={account ? "계좌·결제수단 수정" : "계좌·결제수단 등록"}
        busy={busy}
        submitLabel={account ? "변경 저장" : "등록"}
        onClose={onClose}
        onSubmit={() => onSubmit({
          displayName: displayName.trim(),
          accountTypeCode,
          providerName: providerName.trim() || null,
          maskedIdentifier: maskedIdentifier.trim() || null,
          holderName: holderName.trim() || null,
          usageScopeCode,
          defaultCollection: usageScopeCode === "EXPENSE" ? false : defaultCollection,
          defaultExpense: usageScopeCode === "COLLECTION" ? false : defaultExpense,
        })}
      >
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          계좌번호와 카드번호 전체는 저장하지 않습니다. 운영진이 구분할 수 있는 마스킹 정보만 입력하세요.
        </p>
        <label className="block"><FieldLabel>표시 이름</FieldLabel><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="예: 동아리 회비 계좌" className={FIELD_CLASS} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><FieldLabel>유형</FieldLabel><select value={accountTypeCode} onChange={(event) => setAccountTypeCode(event.target.value)} className={FIELD_CLASS}><option value="BANK">은행 계좌</option><option value="CASH">현금</option><option value="CARD">카드</option><option value="OTHER">기타</option></select></label>
          <label className="block"><FieldLabel>사용 범위</FieldLabel><select value={usageScopeCode} onChange={(event) => setUsageScopeCode(event.target.value)} className={FIELD_CLASS}><option value="BOTH">수납·지출 공용</option><option value="COLLECTION">수납 전용</option><option value="EXPENSE">지출 전용</option></select></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><FieldLabel>금융사·브랜드</FieldLabel><input value={providerName} onChange={(event) => setProviderName(event.target.value)} placeholder="예: 하나은행" className={FIELD_CLASS} /></label>
          <label className="block"><FieldLabel>마스킹 식별값</FieldLabel><input value={maskedIdentifier} onChange={(event) => setMaskedIdentifier(event.target.value)} placeholder="예: 123-***-789" className={FIELD_CLASS} /></label>
        </div>
        <label className="block"><FieldLabel>예금주·명의</FieldLabel><input value={holderName} onChange={(event) => setHolderName(event.target.value)} placeholder="예: 세모 동아리" className={FIELD_CLASS} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleCard label="기본 수납 계좌" description="새 청구와 납부 처리에 자동 선택" checked={defaultCollection} disabled={usageScopeCode === "EXPENSE"} onChange={setDefaultCollection} />
          <ToggleCard label="기본 지출 수단" description="새 지출 입력에 자동 선택" checked={defaultExpense} disabled={usageScopeCode === "COLLECTION"} onChange={setDefaultExpense} />
        </div>
      </ModalFrame>
    </RouteModal>
  );
}

export function FinancePeriodEditorModal({ busy, onClose, onSubmit }: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (request: CreateFinancePeriodRequest) => void;
}) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [note, setNote] = useState("");

  return (
    <RouteModal ariaLabel="재정 기간 만들기" onDismiss={onClose} dismissOnBackdrop={false}>
      <ModalFrame eyebrow="기간 원장" title="재정 기간 만들기" busy={busy} submitLabel="기간 열기" onClose={onClose} onSubmit={() => onSubmit({
        title: title.trim(),
        startDate,
        endDate,
        openingBalance: Number(openingBalance),
        note: note.trim() || null,
      })}>
        <p className="text-sm leading-6 text-slate-500">날짜가 겹치는 기간은 만들 수 없습니다. 기간을 마감하면 해당 기간의 수납과 지출을 더 이상 수정할 수 없습니다.</p>
        <label className="block"><FieldLabel>기간 이름</FieldLabel><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 2026년 8월" className={FIELD_CLASS} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><FieldLabel>시작일</FieldLabel><div className="mt-2"><DatePopoverField value={startDate} onChange={setStartDate} placeholder="시작일 선택" buttonClassName="min-h-12 rounded-xl" /></div></label>
          <label className="block"><FieldLabel>종료일</FieldLabel><div className="mt-2"><DatePopoverField value={endDate} onChange={setEndDate} placeholder="종료일 선택" buttonClassName="min-h-12 rounded-xl" /></div></label>
        </div>
        <label className="block"><FieldLabel>기초 잔액</FieldLabel><input value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} inputMode="decimal" className={FIELD_CLASS} /></label>
        <label className="block"><FieldLabel>운영 메모</FieldLabel><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="마감 기준이나 인수인계 내용을 적어주세요." className={`${FIELD_CLASS} py-3`} /></label>
      </ModalFrame>
    </RouteModal>
  );
}

export function FinanceBudgetEditorModal({ period, busy, onClose, onSubmit }: {
  period: FinancePeriod;
  busy: boolean;
  onClose: () => void;
  onSubmit: (request: UpsertFinanceBudgetRequest) => void;
}) {
  const [categoryCode, setCategoryCode] = useState(period.budgets[0]?.categoryCode ?? "VENUE");
  const selectedBudget = period.budgets.find((budget) => budget.categoryCode === categoryCode);
  const [amount, setAmount] = useState(String(selectedBudget?.allocatedAmount ?? 0));
  const [note, setNote] = useState(selectedBudget?.note ?? "");

  const handleCategoryChange = (nextCategoryCode: string) => {
    const nextBudget = period.budgets.find((budget) => budget.categoryCode === nextCategoryCode);
    setCategoryCode(nextCategoryCode);
    setAmount(String(nextBudget?.allocatedAmount ?? 0));
    setNote(nextBudget?.note ?? "");
  };

  return (
    <RouteModal ariaLabel={`${period.title} 예산 설정`} onDismiss={onClose} dismissOnBackdrop={false}>
      <ModalFrame eyebrow={period.title} title="카테고리 예산 설정" busy={busy} submitLabel="예산 저장" onClose={onClose} onSubmit={() => onSubmit({ categoryCode, allocatedAmount: Number(amount), note: note.trim() || null })}>
        <label className="block"><FieldLabel>카테고리</FieldLabel><select value={categoryCode} onChange={(event) => handleCategoryChange(event.target.value)} className={FIELD_CLASS}><option value="MEMBERSHIP_FEE">회비</option><option value="EVENT_FEE">행사비</option><option value="MEAL">식비</option><option value="VENUE">대관비</option><option value="SUPPLIES">물품비</option><option value="TRANSPORT">교통비</option><option value="REFUND">환불</option><option value="OTHER">기타</option></select></label>
        <label className="block"><FieldLabel>배정 예산</FieldLabel><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className={FIELD_CLASS} /></label>
        <label className="block"><FieldLabel>예산 메모</FieldLabel><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="산정 근거나 사용 범위를 적어주세요." className={`${FIELD_CLASS} py-3`} /></label>
      </ModalFrame>
    </RouteModal>
  );
}

function ModalFrame({ eyebrow, title, busy, submitLabel, onClose, onSubmit, children }: {
  eyebrow: string;
  title: string;
  busy: boolean;
  submitLabel: string;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div><p className="text-xs font-semibold tracking-wide text-slate-400">{eyebrow}</p><h3 className="mt-1 text-xl font-bold text-slate-900">{title}</h3></div>
        <button type="button" aria-label={`${title} 닫기`} onClick={onClose} disabled={busy} className="semo-icon-control rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">{children}</div>
      <div className="border-t border-slate-200 px-5 py-4"><button type="button" onClick={onSubmit} disabled={busy} className="min-h-12 w-full rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white transition hover:brightness-95 disabled:bg-slate-300">{busy ? "저장 중..." : submitLabel}</button></div>
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-sm font-semibold text-slate-700">{children}</span>;
}

function ToggleCard({ label, description, checked, disabled, onChange }: { label: string; description: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`flex min-h-20 items-center justify-between gap-3 rounded-xl border px-4 py-3 ${checked ? "border-[var(--primary)]/30 bg-[var(--primary)]/5" : "border-slate-200 bg-slate-50"} ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}>
      <span><span className="block text-sm font-bold text-slate-800">{label}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="size-5 accent-[var(--primary)]" />
    </label>
  );
}
