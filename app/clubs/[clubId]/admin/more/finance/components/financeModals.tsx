"use client";

import type { ReactNode } from "react";

import { DatePopoverField } from "@/app/components/DatePopoverField";
import { RouteModal } from "@/app/components/RouteModal";
import { TimePopoverField } from "@/app/components/TimePopoverField";
import type {
  ClubAdminFinanceHomeResponse,
  ClubAdminFinanceObligation,
  ClubAdminFinanceObligationDetailResponse,
  ClubFinanceMemberOption,
  ClubFinanceOperationsResponse,
  FinanceAccount,
} from "@/app/lib/clubs";
import { getClubRoleLabel } from "@/app/lib/roleLabels";
import { ObligationDetailPanel } from "./financeCardParts";

const TARGET_SCOPE_OPTIONS = [
  { value: "ALL_ACTIVE_MEMBERS", label: "활성 멤버 전체", description: "현재 활성 멤버 전체에게 한 번에 발행합니다." },
  { value: "SELECTED_MEMBERS", label: "선택 멤버만", description: "특정 멤버만 골라서 재정 항목을 발행합니다." },
] as const satisfies ReadonlyArray<{
  value: "ALL_ACTIVE_MEMBERS" | "SELECTED_MEMBERS";
  label: string;
  description: string;
}>;

export function ObligationDetailModal({
  obligation,
  detail,
  loading,
  error,
  canMarkPaid,
  canMarkWaive,
  canRestoreToPending,
  activePaymentId,
  collectionAccounts,
  onClose,
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
  collectionAccounts: FinanceAccount[];
  onClose: () => void;
  onUpdateStatus: (paymentId: number, paymentStatus: "PENDING" | "PAID" | "WAIVED", financeAccountId?: number | null, paymentMethodCode?: string | null) => void;
}) {
  return (
    <RouteModal ariaLabel={`${obligation.title} 납부 상세`} onDismiss={onClose}>
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-slate-400">납부 상세</p>
            <h3 className="mt-1 truncate text-xl font-bold text-slate-900">{obligation.title}</h3>
          </div>
          <button
            type="button"
            aria-label="재정 상세 닫기"
            onClick={onClose}
            className="semo-icon-control rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <ObligationDetailPanel
            obligation={obligation}
            detail={detail}
            loading={loading}
            error={error}
            canMarkPaid={canMarkPaid}
            canMarkWaive={canMarkWaive}
            canRestoreToPending={canRestoreToPending}
            activePaymentId={activePaymentId}
            collectionAccounts={collectionAccounts}
            onUpdateStatus={onUpdateStatus}
          />
        </div>
      </section>
    </RouteModal>
  );
}

export function FinanceActionSheetModal({
  canCreateObligation,
  canCreateExpense,
  onClose,
  onOpenCreate,
  onOpenExpense,
}: {
  canCreateObligation: boolean;
  canCreateExpense: boolean;
  onClose: () => void;
  onOpenCreate: () => void;
  onOpenExpense: () => void;
}) {
  return (
    <RouteModal ariaLabel="재정 입력 메뉴" onDismiss={onClose} contentClassName="max-w-md rounded-[2rem] sm:rounded-[2rem]">
      <section className="px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">관리자 작업</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">재정 입력 메뉴</h3>
          </div>
          <button
            type="button"
            aria-label="재정 입력 메뉴 닫기"
            onClick={onClose}
            className="semo-icon-control rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={onOpenCreate}
            disabled={!canCreateObligation}
            className="flex w-full items-start gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-[#ec5b13]/30 hover:bg-[#fff7f2] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <div className="rounded-full bg-[#ec5b13]/10 p-2 text-[#ec5b13]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add_card</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">재정 항목 발행</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">전체 멤버 또는 선택 멤버에게 회비·행사비를 발행합니다.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenExpense}
            disabled={!canCreateExpense}
            className="flex w-full items-start gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-[#ec5b13]/30 hover:bg-[#fff7f2] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <div className="rounded-full bg-[#ec5b13]/10 p-2 text-[#ec5b13]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">receipt_long</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">지출 입력</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">운영비, 식비, 대관비, 환불 같은 실제 지출을 장부에 기록합니다.</p>
            </div>
          </button>
        </div>
      </section>
    </RouteModal>
  );
}

export function CreateObligationModal({
  finance,
  operations,
  title,
  amount,
  dueAtDate,
  dueAtTime,
  note,
  financePeriodId,
  financeAccountId,
  linkedScheduleEventId,
  recurrenceFrequency,
  recurrenceInterval,
  recurrenceEndDate,
  targetScope,
  selectedMemberIds,
  memberSearchQuery,
  filteredMembers,
  selectedMemberSet,
  isCreating,
  onClose,
  onTitleChange,
  onAmountChange,
  onDueAtDateChange,
  onDueAtTimeChange,
  onNoteChange,
  onFinancePeriodIdChange,
  onFinanceAccountIdChange,
  onLinkedScheduleEventIdChange,
  onRecurrenceFrequencyChange,
  onRecurrenceIntervalChange,
  onRecurrenceEndDateChange,
  onTargetScopeChange,
  onMemberSearchQueryChange,
  onToggleSelectedMember,
  onCreate,
}: {
  finance: ClubAdminFinanceHomeResponse;
  operations: ClubFinanceOperationsResponse;
  title: string;
  amount: string;
  dueAtDate: string;
  dueAtTime: string;
  note: string;
  financePeriodId: string;
  financeAccountId: string;
  linkedScheduleEventId: string;
  recurrenceFrequency: string;
  recurrenceInterval: string;
  recurrenceEndDate: string;
  targetScope: "ALL_ACTIVE_MEMBERS" | "SELECTED_MEMBERS";
  selectedMemberIds: number[];
  memberSearchQuery: string;
  filteredMembers: ClubFinanceMemberOption[];
  selectedMemberSet: Set<number>;
  isCreating: boolean;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDueAtDateChange: (value: string) => void;
  onDueAtTimeChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onFinancePeriodIdChange: (value: string) => void;
  onFinanceAccountIdChange: (value: string) => void;
  onLinkedScheduleEventIdChange: (value: string) => void;
  onRecurrenceFrequencyChange: (value: string) => void;
  onRecurrenceIntervalChange: (value: string) => void;
  onRecurrenceEndDateChange: (value: string) => void;
  onTargetScopeChange: (value: "ALL_ACTIVE_MEMBERS" | "SELECTED_MEMBERS") => void;
  onMemberSearchQueryChange: (value: string) => void;
  onToggleSelectedMember: (member: ClubFinanceMemberOption) => void;
  onCreate: () => void;
}) {
  return (
    <RouteModal ariaLabel="새 재정 항목 발행" onDismiss={onClose} dismissOnBackdrop={false}>
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">납부 의무 만들기</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">새 재정 항목 발행</h3>
          </div>
          <button
            type="button"
            aria-label="재정 항목 발행 닫기"
            onClick={onClose}
            className="semo-icon-control rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-5">
            <div>
              <p className="text-sm text-slate-500">항목 이름, 금액, 대상 멤버를 정하면 하나의 재정 항목으로 묶여 발행됩니다.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">항목 이름</span>
                  <input
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    placeholder="예: 2026 봄 대회 참가비"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FinanceSelect label="재정 기간" value={financePeriodId} onChange={onFinancePeriodIdChange}>
                    <option value="">날짜 기준 자동 선택</option>
                    {operations.periods.filter((period) => period.statusCode === "OPEN").map((period) => (
                      <option key={period.financePeriodId} value={period.financePeriodId}>{period.title}</option>
                    ))}
                  </FinanceSelect>
                  <FinanceSelect label="수납 계좌" value={financeAccountId} onChange={onFinanceAccountIdChange}>
                    <option value="">기본 수납 계좌</option>
                    {operations.accounts.filter((account) => account.active && account.usageScopeCode !== "EXPENSE").map((account) => (
                      <option key={account.financeAccountId} value={account.financeAccountId}>{account.displayName}</option>
                    ))}
                  </FinanceSelect>
                </div>

                <FinanceSelect label="연결 일정" value={linkedScheduleEventId} onChange={onLinkedScheduleEventIdChange}>
                  <option value="">일정 연결 안 함</option>
                  {operations.scheduleOptions.map((schedule) => (
                    <option key={schedule.eventId} value={schedule.eventId}>{schedule.startAtLabel} · {schedule.title}</option>
                  ))}
                </FinanceSelect>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-700">반복 발행</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <select aria-label="회비 반복 발행 주기" value={recurrenceFrequency} onChange={(event) => onRecurrenceFrequencyChange(event.target.value)} className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm">
                      <option value="NONE">반복하지 않음</option>
                      <option value="MONTHLY">매월</option>
                      <option value="YEARLY">매년</option>
                    </select>
                    <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm text-slate-600">
                      <input value={recurrenceInterval} onChange={(event) => onRecurrenceIntervalChange(event.target.value)} disabled={recurrenceFrequency === "NONE"} inputMode="numeric" className="w-14 bg-transparent text-right font-bold text-slate-900 outline-none disabled:text-slate-300" />
                      {recurrenceFrequency === "YEARLY" ? "년마다" : "개월마다"}
                    </label>
                  </div>
                  {recurrenceFrequency !== "NONE" ? (
                    <div className="mt-3"><DatePopoverField value={recurrenceEndDate} onChange={onRecurrenceEndDateChange} placeholder="반복 종료일 선택 (선택)" buttonClassName="min-h-12" /></div>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">금액</span>
                    <input
                      value={amount}
                      onChange={(event) => onAmountChange(event.target.value)}
                      inputMode="numeric"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">마감일</span>
                    <div className="mt-2 space-y-2">
                      <DatePopoverField value={dueAtDate} onChange={onDueAtDateChange} buttonClassName="py-3 focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10" placeholder="마감 날짜를 선택하세요" />
                      <div className="flex items-center gap-2">
                        <TimePopoverField value={dueAtTime} onChange={onDueAtTimeChange} disabled={!dueAtDate} buttonClassName="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400" />
                        <button
                          type="button"
                          onClick={() => {
                            onDueAtDateChange("");
                            onDueAtTimeChange("");
                          }}
                          disabled={!dueAtDate}
                          className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          미정
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">시간을 비우면 선택한 날짜의 23:59로 저장됩니다.</p>
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">운영 메모</span>
                  <textarea
                    value={note}
                    onChange={(event) => onNoteChange(event.target.value)}
                    rows={3}
                    placeholder="예: 대회 당일 현장 수납 가능"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                  />
                </label>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700">발행 대상</p>
                  <div className="mt-3 space-y-2">
                    {TARGET_SCOPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onTargetScopeChange(option.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          targetScope === option.value ? "border-[#ec5b13] bg-[#fff5ef]" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <p className="text-sm font-bold text-slate-900">{option.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {targetScope === "SELECTED_MEMBERS" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">선택 멤버</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{selectedMemberIds.length}명 선택</span>
                    </div>

                    <input
                      aria-label="납부 대상 멤버 검색"
                      value={memberSearchQuery}
                      onChange={(event) => onMemberSearchQueryChange(event.target.value)}
                      placeholder="이름 또는 역할 검색"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                    />

                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                      {filteredMembers.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">선택 가능한 활성 멤버가 없습니다.</div>
                      ) : (
                        filteredMembers.map((member) => {
                          const selected = selectedMemberSet.has(member.clubProfileId);

                          return (
                            <button
                              key={member.clubProfileId}
                              type="button"
                              onClick={() => onToggleSelectedMember(member)}
                              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                                selected ? "border-[#ec5b13] bg-[#fff5ef]" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                              }`}
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-900">{member.memberDisplayName}</p>
                                <p className="mt-1 text-xs text-slate-500">{getClubRoleLabel(member.memberRoleCode)}</p>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${selected ? "bg-[#ec5b13] text-white" : "bg-white text-slate-500"}`}>
                                {selected ? "선택됨" : "추가"}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">현재 활성 멤버 {finance.activeMemberCount}명을 기준으로 자동 발행됩니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            disabled={!finance.canManageBilling || isCreating}
            onClick={onCreate}
            className="w-full rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d94f0b] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isCreating ? "발행 중..." : "재정 항목 발행"}
          </button>
        </div>
      </section>
    </RouteModal>
  );
}

export function ExpenseEntryModal({
  operations,
  title,
  amount,
  category,
  spentDate,
  spentTime,
  relatedEventName,
  note,
  financePeriodId,
  financeAccountId,
  linkedScheduleEventId,
  isCreating,
  onClose,
  onTitleChange,
  onAmountChange,
  onCategoryChange,
  onSpentDateChange,
  onSpentTimeChange,
  onRelatedEventNameChange,
  onNoteChange,
  onFinancePeriodIdChange,
  onFinanceAccountIdChange,
  onLinkedScheduleEventIdChange,
  onCreate,
}: {
  operations: ClubFinanceOperationsResponse;
  title: string;
  amount: string;
  category: string;
  spentDate: string;
  spentTime: string;
  relatedEventName: string;
  note: string;
  financePeriodId: string;
  financeAccountId: string;
  linkedScheduleEventId: string;
  isCreating: boolean;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSpentDateChange: (value: string) => void;
  onSpentTimeChange: (value: string) => void;
  onRelatedEventNameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onFinancePeriodIdChange: (value: string) => void;
  onFinanceAccountIdChange: (value: string) => void;
  onLinkedScheduleEventIdChange: (value: string) => void;
  onCreate: () => void;
}) {
  return (
    <RouteModal ariaLabel="운영 지출 입력" onDismiss={onClose} dismissOnBackdrop={false}>
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">지출 입력</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">운영 지출 입력</h3>
          </div>
          <button
            type="button"
            aria-label="지출 입력 닫기"
            onClick={onClose}
            className="semo-icon-control rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-500">실제로 모임 계좌에서 나간 돈이나 운영진이 현장에서 결제한 건을 기록합니다.</p>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">지출 제목</span>
              <input
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="예: 4월 연습장 대관비"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">카테고리</span>
                <select
                  value={category}
                  onChange={(event) => onCategoryChange(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                >
                  <option value="MEMBERSHIP_FEE">회비</option>
                  <option value="EVENT_FEE">행사비</option>
                  <option value="MEAL">식비</option>
                  <option value="VENUE">대관비</option>
                  <option value="SUPPLIES">물품비</option>
                  <option value="TRANSPORT">교통비</option>
                  <option value="REFUND">환불</option>
                  <option value="OTHER">기타</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">금액</span>
                <input
                  value={amount}
                  onChange={(event) => onAmountChange(event.target.value)}
                  inputMode="numeric"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FinanceSelect label="재정 기간" value={financePeriodId} onChange={onFinancePeriodIdChange}>
                <option value="">지출일 기준 자동 선택</option>
                {operations.periods.filter((period) => period.statusCode === "OPEN").map((period) => (
                  <option key={period.financePeriodId} value={period.financePeriodId}>{period.title}</option>
                ))}
              </FinanceSelect>
              <FinanceSelect label="지출 계좌" value={financeAccountId} onChange={onFinanceAccountIdChange}>
                <option value="">기본 지출 계좌</option>
                {operations.accounts.filter((account) => account.active && account.usageScopeCode !== "COLLECTION").map((account) => (
                  <option key={account.financeAccountId} value={account.financeAccountId}>{account.displayName}</option>
                ))}
              </FinanceSelect>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">지출 날짜</span>
                <div className="mt-2">
                  <DatePopoverField value={spentDate} onChange={onSpentDateChange} buttonClassName="py-3 focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10" placeholder="지출 날짜를 선택하세요" />
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">지출 시간</span>
                <div className="mt-2">
                  <TimePopoverField value={spentTime} onChange={onSpentTimeChange} disabled={!spentDate} buttonClassName="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400" />
                </div>
              </label>
            </div>

            <FinanceSelect label="연결 일정" value={linkedScheduleEventId} onChange={onLinkedScheduleEventIdChange}>
              <option value="">일정 연결 안 함</option>
              {operations.scheduleOptions.map((schedule) => (
                <option key={schedule.eventId} value={schedule.eventId}>{schedule.startAtLabel} · {schedule.title}</option>
              ))}
            </FinanceSelect>

            {!linkedScheduleEventId ? (
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">직접 입력 행사명</span>
                <input value={relatedEventName} onChange={(event) => onRelatedEventNameChange(event.target.value)} placeholder="일정에 없는 행사만 직접 입력" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10" />
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">메모</span>
              <textarea
                value={note}
                onChange={(event) => onNoteChange(event.target.value)}
                rows={4}
                placeholder="결제 수단, 현장 상황, 증빙 위치 등을 적어주세요."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
              />
            </label>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            disabled={isCreating}
            onClick={onCreate}
            className="w-full rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d94f0b] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isCreating ? "지출 입력 중..." : "지출 입력"}
          </button>
        </div>
      </section>
    </RouteModal>
  );
}

function FinanceSelect({ label, value, onChange, children }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10">
        {children}
      </select>
    </label>
  );
}
