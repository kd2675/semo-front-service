"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { DatePopoverField } from "@/app/components/DatePopoverField";
import { ResourceAttachmentPanel } from "@/app/components/ResourceAttachmentPanel";
import { RouteModal } from "@/app/components/RouteModal";
import { TimePopoverField } from "@/app/components/TimePopoverField";
import { useAppToast } from "@/app/hooks/useAppToast";
import type {
  ClubFinanceExpense,
  ClubFinanceOperationsResponse,
} from "@/app/lib/clubs";
import {
  correctFinanceExpenseMutationOptions,
  voidFinanceExpenseMutationOptions,
} from "@/app/lib/react-query/finance/mutations";
import { adminFinanceExpenseRevisionsQueryOptions } from "@/app/lib/react-query/finance/queries";

type FinanceExpenseDetailModalProps = {
  clubId: string;
  expense: ClubFinanceExpense;
  operations: ClubFinanceOperationsResponse;
  onClose: () => void;
  onChanged: (expense: ClubFinanceExpense) => void;
};

export function FinanceExpenseDetailModal({
  clubId,
  expense,
  operations,
  onClose,
  onChanged,
}: FinanceExpenseDetailModalProps) {
  const { showToast } = useAppToast();
  const revisionsQuery = useQuery(adminFinanceExpenseRevisionsQueryOptions(clubId, expense.expenseId));
  const correctMutation = useMutation(correctFinanceExpenseMutationOptions(clubId));
  const voidMutation = useMutation(voidFinanceExpenseMutationOptions(clubId));
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(expense.title);
  const [categoryCode, setCategoryCode] = useState(expense.categoryCode);
  const [amount, setAmount] = useState(String(expense.amount));
  const [spentDate, setSpentDate] = useState(expense.spentAt?.slice(0, 10) ?? "");
  const [spentTime, setSpentTime] = useState(expense.spentAt?.slice(11, 16) ?? "");
  const [financePeriodId, setFinancePeriodId] = useState(expense.financePeriodId?.toString() ?? "");
  const [financeAccountId, setFinanceAccountId] = useState(expense.financeAccountId?.toString() ?? "");
  const [scheduleEventId, setScheduleEventId] = useState(expense.linkedScheduleEventId?.toString() ?? "");
  const [relatedEventName, setRelatedEventName] = useState(expense.relatedEventName ?? "");
  const [note, setNote] = useState(expense.note ?? "");
  const [reason, setReason] = useState("");
  const busy = correctMutation.isPending || voidMutation.isPending;
  const posted = expense.statusCode === "POSTED";

  const handleCorrect = async () => {
    const parsedAmount = Number(amount);
    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !reason.trim()) {
      showToast("제목, 0보다 큰 금액, 정정 사유를 확인해주세요.", "error");
      return;
    }
    const result = await correctMutation.mutateAsync({
      expenseId: expense.expenseId,
      request: {
        title: title.trim(),
        categoryCode,
        amount: parsedAmount,
        spentAt: spentDate ? `${spentDate}T${spentTime || "00:00"}:00` : null,
        financePeriodId: financePeriodId ? Number(financePeriodId) : null,
        financeAccountId: financeAccountId ? Number(financeAccountId) : null,
        linkedScheduleEventId: scheduleEventId ? Number(scheduleEventId) : null,
        relatedEventName: scheduleEventId ? null : relatedEventName.trim() || null,
        note: note.trim() || null,
        reason: reason.trim(),
      },
    });
    if (!result.ok || !result.data) {
      showToast(result.message ?? "지출 전표를 정정하지 못했습니다.", "error");
      return;
    }
    onChanged(result.data);
    setEditing(false);
    setReason("");
    await revisionsQuery.refetch();
    showToast("지출 전표를 정정하고 변경 이력을 남겼습니다.", "success");
  };

  const handleVoid = async () => {
    if (!reason.trim()) {
      showToast("취소 사유를 입력해주세요.", "error");
      return;
    }
    const result = await voidMutation.mutateAsync({ expenseId: expense.expenseId, reason: reason.trim() });
    if (!result.ok || !result.data) {
      showToast(result.message ?? "지출 전표를 취소하지 못했습니다.", "error");
      return;
    }
    onChanged(result.data);
    setReason("");
    await revisionsQuery.refetch();
    showToast("원본을 보존하고 취소 전표로 처리했습니다.", "success");
  };

  return (
    <RouteModal ariaLabel={`${expense.title} 지출 상세`} onDismiss={onClose} dismissOnBackdrop={false} contentClassName="max-w-3xl">
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><p className="text-xs font-semibold text-slate-400">지출 전표 #{expense.expenseId}</p><span className={`rounded-lg px-2 py-1 text-[11px] font-bold ${posted ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>{posted ? "정상" : "취소"}</span></div>
            <h3 className="mt-1 truncate text-xl font-bold text-slate-900">{expense.title}</h3>
          </div>
          <button type="button" aria-label="지출 상세 닫기" onClick={onClose} disabled={busy} className="semo-icon-control rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-40"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section className="grid gap-3 rounded-3xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="금액" value={expense.amountLabel} strong />
            <Meta label="카테고리" value={expense.categoryLabel} />
            <Meta label="재정 기간" value={expense.financePeriodTitle ?? "미지정"} />
            <Meta label="지출 계좌" value={expense.financeAccountName ?? "미지정"} />
            <Meta label="관련 일정" value={expense.linkedScheduleEventTitle ?? expense.relatedEventName ?? "없음"} />
            <Meta label="입력자" value={expense.enteredByDisplayName} />
            <Meta label="지출 시각" value={expense.spentAtLabel ?? "미정"} />
            <Meta label="메모" value={expense.note ?? "없음"} />
          </section>

          <ResourceAttachmentPanel clubId={clubId} resourceType="FINANCE_EXPENSE" resourceId={expense.expenseId} canUpload={posted && operations.canCreateExpenses} canDelete={posted && operations.canCreateExpenses} theme="admin" />

          {editing && posted ? (
            <section className="space-y-4 rounded-3xl border border-orange-200 bg-orange-50/40 p-4">
              <div><p className="text-sm font-bold text-slate-900">전표 정정</p><p className="mt-1 text-xs leading-5 text-slate-500">원본 값은 이력에 남고 현재 전표만 새 값으로 갱신됩니다.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="제목"><input value={title} onChange={(event) => setTitle(event.target.value)} className={FIELD_CLASS} /></Field>
                <Field label="금액"><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className={FIELD_CLASS} /></Field>
                <Field label="카테고리"><select value={categoryCode} onChange={(event) => setCategoryCode(event.target.value)} className={FIELD_CLASS}>{CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
                <Field label="재정 기간"><select value={financePeriodId} onChange={(event) => setFinancePeriodId(event.target.value)} className={FIELD_CLASS}><option value="">날짜 기준 자동 선택</option>{operations.periods.filter((period) => period.statusCode === "OPEN").map((period) => <option key={period.financePeriodId} value={period.financePeriodId}>{period.title}</option>)}</select></Field>
                <Field label="지출 계좌"><select value={financeAccountId} onChange={(event) => setFinanceAccountId(event.target.value)} className={FIELD_CLASS}><option value="">기본 지출 계좌</option>{operations.accounts.filter((account) => account.active && account.usageScopeCode !== "COLLECTION").map((account) => <option key={account.financeAccountId} value={account.financeAccountId}>{account.displayName}</option>)}</select></Field>
                <Field label="연결 일정"><select value={scheduleEventId} onChange={(event) => setScheduleEventId(event.target.value)} className={FIELD_CLASS}><option value="">일정 연결 안 함</option>{operations.scheduleOptions.map((schedule) => <option key={schedule.eventId} value={schedule.eventId}>{schedule.startAtLabel} · {schedule.title}</option>)}</select></Field>
                <Field label="지출 날짜"><DatePopoverField value={spentDate} onChange={setSpentDate} buttonClassName="mt-2 min-h-12" /></Field>
                <Field label="지출 시간"><TimePopoverField value={spentTime} onChange={setSpentTime} disabled={!spentDate} buttonClassName="mt-2 min-h-12 w-full" /></Field>
              </div>
              {!scheduleEventId ? <Field label="직접 입력 행사명"><input value={relatedEventName} onChange={(event) => setRelatedEventName(event.target.value)} className={FIELD_CLASS} /></Field> : null}
              <Field label="메모"><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className={`${FIELD_CLASS} py-3`} /></Field>
              <Field label="정정 사유"><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="감사 이력에 남을 구체적인 사유" className={`${FIELD_CLASS} py-3`} /></Field>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} disabled={busy} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600">취소</button><button type="button" onClick={() => void handleCorrect()} disabled={busy} className="min-h-11 rounded-xl bg-[#ec5b13] px-4 text-sm font-bold text-white disabled:bg-slate-300">{busy ? "저장 중..." : "정정 저장"}</button></div>
            </section>
          ) : null}

          {posted && operations.canCreateExpenses && !editing ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><Field label="변경·취소 사유"><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="정정 또는 취소 사유" className={FIELD_CLASS} /></Field><div className="flex shrink-0 gap-2"><button type="button" onClick={() => setEditing(true)} className="min-h-11 rounded-xl bg-orange-50 px-4 text-sm font-bold text-[#ec5b13]">전표 정정</button><button type="button" onClick={() => void handleVoid()} disabled={busy} className="min-h-11 rounded-xl bg-rose-50 px-4 text-sm font-bold text-rose-600 disabled:opacity-50">취소 전표 처리</button></div></div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400">감사 추적</p><h4 className="mt-1 text-base font-bold text-slate-900">정정·취소 이력</h4></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{revisionsQuery.data?.length ?? 0}건</span></div>
            {revisionsQuery.isPending ? <div className="mt-4 h-20 animate-pulse rounded-2xl bg-slate-100" /> : revisionsQuery.isError ? <button type="button" onClick={() => void revisionsQuery.refetch()} className="mt-4 w-full rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">이력 다시 불러오기</button> : revisionsQuery.data?.length ? <div className="mt-4 space-y-3">{revisionsQuery.data.map((revision) => <article key={revision.financeExpenseRevisionId} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><span className={`rounded-lg px-2 py-1 text-[11px] font-bold ${revision.revisionTypeCode === "VOID" ? "bg-rose-50 text-rose-600" : "bg-orange-50 text-[#ec5b13]"}`}>{revision.revisionTypeCode === "VOID" ? "취소" : "정정"}</span><p className="mt-3 text-sm font-bold text-slate-900">{revision.reason}</p><p className="mt-1 text-xs text-slate-500">{revision.revisedByDisplayName} · {revision.revisedAt}</p></div><div className="text-right text-xs text-slate-500"><p>{revision.previousAmount.toLocaleString("ko-KR")}원</p><p className="mt-1 font-bold text-slate-900">→ {revision.nextAmount == null ? "취소" : `${revision.nextAmount.toLocaleString("ko-KR")}원`}</p></div></div></article>)}</div> : <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">아직 정정·취소 이력이 없습니다.</p>}
          </section>
        </div>
      </section>
    </RouteModal>
  );
}

const FIELD_CLASS = "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10";
const CATEGORY_OPTIONS = [
  ["MEMBERSHIP_FEE", "회비"], ["EVENT_FEE", "행사비"], ["MEAL", "식비"], ["VENUE", "대관비"],
  ["SUPPLIES", "물품비"], ["TRANSPORT", "교통비"], ["REFUND", "환불"], ["OTHER", "기타"],
].map(([value, label]) => ({ value, label }));

function Meta({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div><p className="text-[11px] font-semibold text-slate-400">{label}</p><p className={`mt-1 text-sm ${strong ? "font-bold text-slate-900" : "text-slate-600"}`}>{value}</p></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0"><span className="text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
}
