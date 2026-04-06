"use client";

import { startTransition, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { RouteModal } from "@/app/components/RouteModal";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import {
  createClubFinanceRequest,
  type ClubFinanceHomeResponse,
  type ClubFinancePayment,
  type ClubFinanceRequest,
  type ClubFinanceRequestFeedResponse,
  type ClubFinanceUserObligation,
} from "@/app/lib/clubs";
import { FAB_RIGHT_OFFSET_CLASS_NAME, getActionFabBottomClass } from "@/app/lib/fab";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubFinanceClientProps = {
  clubId: string;
  initialData: ClubFinanceHomeResponse;
  initialRequestFeed: ClubFinanceRequestFeedResponse;
  isAdmin: boolean;
};

type MemberFabAction = "ADVANCE" | "REFUND_REQUEST" | "SETTLEMENT_REQUEST";

type MemberRequestDraft = {
  title: string;
  amount: string;
  relatedEventName: string;
  note: string;
};

const MEMBER_ACTION_OPTIONS: Array<{
  type: MemberFabAction;
  icon: string;
  label: string;
  description: string;
}> = [
  {
    type: "ADVANCE",
    icon: "credit_card_heart",
    label: "선지출 등록",
    description: "내가 대신 결제한 금액과 행사, 메모를 제출합니다.",
  },
  {
    type: "REFUND_REQUEST",
    icon: "undo",
    label: "환불 요청",
    description: "취소나 변경으로 돌려받아야 할 금액을 요청합니다.",
  },
  {
    type: "SETTLEMENT_REQUEST",
    icon: "group",
    label: "정산 요청",
    description: "행사 정산 참여와 내 분담금 확인이 필요할 때 요청합니다.",
  },
];

function getStatusClassName(payment: ClubFinancePayment) {
  if (payment.paymentStatusCode === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (payment.paymentStatusCode === "WAIVED") {
    return "bg-slate-200 text-slate-600";
  }
  if (payment.paymentStatusCode === "OVERDUE") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-amber-50 text-amber-700";
}

function getRequestStatusClassName(request: ClubFinanceRequest) {
  if (request.statusCode === "APPROVED") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (request.statusCode === "REJECTED") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-sky-50 text-sky-700";
}

function createDraft(action: MemberFabAction): MemberRequestDraft {
  if (action === "ADVANCE") {
    return {
      title: "선지출 등록",
      amount: "",
      relatedEventName: "",
      note: "",
    };
  }
  if (action === "REFUND_REQUEST") {
    return {
      title: "환불 요청",
      amount: "",
      relatedEventName: "",
      note: "",
    };
  }
  return {
    title: "정산 요청",
    amount: "",
    relatedEventName: "",
    note: "",
  };
}

export function ClubFinanceClient({
  clubId,
  initialData,
  initialRequestFeed,
  isAdmin,
}: ClubFinanceClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const finance = initialData;
  const [requests, setRequests] = useState(initialRequestFeed.items);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [activeAction, setActiveAction] = useState<MemberFabAction | null>(null);
  const [draft, setDraft] = useState<MemberRequestDraft>(createDraft("ADVANCE"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, clearToast } = useEphemeralToast();

  const paidHistory = useMemo(
    () =>
      finance.paymentHistory
        .filter((obligation) => obligation.payment.paymentStatusCode === "PAID")
        .sort((left, right) => {
          const leftTime = left.payment.paidAt ?? left.issuedAt ?? "";
          const rightTime = right.payment.paidAt ?? right.issuedAt ?? "";
          return rightTime.localeCompare(leftTime);
        }),
    [finance.paymentHistory],
  );
  const recentTransactions = finance.recentPayments;
  const advanceAndRefundRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.requestTypeCode === "ADVANCE" || request.requestTypeCode === "REFUND_REQUEST",
      ),
    [requests],
  );
  const settlementRequests = useMemo(
    () => requests.filter((request) => request.requestTypeCode === "SETTLEMENT_REQUEST"),
    [requests],
  );
  const pendingRequestCount = requests.filter((request) => request.statusCode === "SUBMITTED").length;

  const openActionModal = (action: MemberFabAction) => {
    startTransition(() => {
      setActiveAction(action);
      setDraft(createDraft(action));
      setShowActionSheet(false);
    });
  };

  const closeRequestModal = () => {
    if (isSubmitting) {
      return;
    }
    setActiveAction(null);
  };

  const handleSubmitRequest = async () => {
    if (!activeAction || isSubmitting) {
      return;
    }

    const parsedAmount = Number(draft.amount);
    if (!draft.title.trim()) {
      showToast("제목을 입력해주세요.", "error");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showToast("금액은 0보다 커야 합니다.", "error");
      return;
    }

    setIsSubmitting(true);
    clearToast();
    const result = await createClubFinanceRequest(clubId, {
      requestTypeCode: activeAction,
      title: draft.title.trim(),
      amount: parsedAmount,
      relatedEventName: draft.relatedEventName.trim() || null,
      note: draft.note.trim() || null,
    });
    setIsSubmitting(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "재정 요청 제출에 실패했습니다.", "error");
      return;
    }

    startTransition(() => {
      setRequests((current) => [result.data!, ...current]);
      setActiveAction(null);
    });
    showToast(`${result.data.requestTypeLabel}이 운영진에게 제출되었습니다.`, "success");
  };

  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative min-h-screen">
        <ClubPageHeader
          title="내 재정"
          subtitle={finance.clubName}
          icon="payments"
          className="bg-white/85 backdrop-blur-md"
        />

        <main className="semo-nav-bottom-space mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              What Needs Attention
            </p>
            <h2 className="mt-3 text-[26px] font-bold leading-tight text-slate-900">
              {finance.nextPayableObligation
                ? `${finance.nextPayableObligation.title}부터 처리하면 됩니다.`
                : "지금 바로 처리할 재정 항목은 없습니다."}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              내가 내야 할 돈, 이미 낸 돈, 운영진에게 제출한 재정 요청만 선명하게 보이도록 정리했습니다.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryCard label="미납 합계" value={finance.totalPendingAmountLabel} accent="amber" />
              <SummaryCard label="완납 누계" value={finance.totalPaidAmountLabel} accent="emerald" />
              <SummaryCard label="액션 필요" value={`${finance.actionRequiredCount}건`} accent="rose" />
              <SummaryCard label="제출 요청" value={`${pendingRequestCount}건`} accent="sky" />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-[#135bec]/10 p-2 text-[#135bec]">
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">지금 할 일</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {finance.nextPayableObligation
                      ? `${finance.nextPayableObligation.amountLabel} · 마감 ${finance.nextPayableObligation.dueAtLabel ?? "미정"}`
                      : "미납은 없고, FAB 버튼으로 선지출·환불·정산 요청을 제출할 수 있습니다."}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section className="space-y-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <FinanceSection title="내 재정 요약" caption="지금 내가 확인해야 하는 재정 상태를 먼저 보여줍니다.">
              {finance.nextPayableObligation ? (
                <ObligationCard obligation={finance.nextPayableObligation} emphasize />
              ) : (
                <EmptyStateCard
                  title="미납 항목이 없습니다."
                  description="새 청구가 발행되면 여기에서 가장 먼저 확인할 수 있습니다."
                />
              )}
            </FinanceSection>

            <FinanceSection title="내 미납 내역" caption="회비, 행사비, 공동 구매비처럼 아직 내가 내야 하는 금액입니다.">
              <div className="space-y-3">
                {finance.openObligations.length === 0 ? (
                  <EmptyStateCard
                    title="현재 미납 내역이 없습니다."
                    description="새 청구가 생기면 이 화면에서 바로 확인할 수 있습니다."
                  />
                ) : (
                  finance.openObligations.map((obligation, index) => (
                    <motion.div
                      key={obligation.obligationId}
                      {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                    >
                      <ObligationCard obligation={obligation} emphasize={index === 0} />
                    </motion.div>
                  ))
                )}
              </div>
            </FinanceSection>

            <FinanceSection title="최근 거래" caption="최근 처리된 청구와 납부 흐름을 빠르게 확인합니다.">
              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <EmptyStateCard
                    title="최근 거래가 없습니다."
                    description="재정 항목이 발행되거나 납부가 처리되면 여기에 쌓입니다."
                  />
                ) : (
                  recentTransactions.map((obligation) => (
                    <CompactTransactionCard
                      key={`${obligation.obligationId}-${obligation.payment.paymentId}`}
                      obligation={obligation}
                    />
                  ))
                )}
              </div>
            </FinanceSection>

            <FinanceSection title="내 납부 내역" caption="언제, 무엇을, 얼마 냈는지 기준으로 정리했습니다.">
              <div className="space-y-3">
                {paidHistory.length === 0 ? (
                  <EmptyStateCard
                    title="아직 완료된 납부 내역이 없습니다."
                    description="운영진이 납부 완료 처리하면 이 화면에 기록이 쌓입니다."
                  />
                ) : (
                  paidHistory.map((obligation, index) => (
                    <motion.div
                      key={`${obligation.obligationId}-paid-${obligation.payment.paymentId}`}
                      {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                    >
                      <ObligationCard obligation={obligation} muted />
                    </motion.div>
                  ))
                )}
              </div>
            </FinanceSection>

            <FinanceSection
              title="선지출/환급 요청"
              caption="회원이 대신 결제한 건과 환불 요청을 운영진에게 제출하고 상태를 추적합니다."
            >
              <div className="space-y-3">
                {advanceAndRefundRequests.length === 0 ? (
                  <PlaceholderPanel
                    icon="receipt_long"
                    title="선지출/환급 요청이 없습니다."
                    description="FAB 버튼에서 선지출 등록이나 환불 요청을 제출하면 운영진 검토 상태가 여기에 쌓입니다."
                    bullets={[
                      "선지출 등록",
                      "환불 요청",
                      "승인 / 반려 상태 확인",
                    ]}
                  />
                ) : (
                  advanceAndRefundRequests.map((request) => (
                    <FinanceRequestCard key={request.requestId} request={request} />
                  ))
                )}
              </div>
            </FinanceSection>

            <FinanceSection
              title="정산 요청"
              caption="행사 정산 참여 확인과 정산 요청 제출을 같은 화면에서 처리합니다."
            >
              <div className="space-y-3">
                {settlementRequests.length === 0 ? (
                  <PlaceholderPanel
                    icon="group"
                    title="아직 제출한 정산 요청이 없습니다."
                    description="행사별 1/N 정산이 필요하면 FAB 버튼에서 정산 요청을 제출하세요."
                    bullets={[
                      "내 분담금 확인 요청",
                      "참여자 기준 정산 검토 요청",
                      "송금 증빙 제출 및 확인",
                    ]}
                  />
                ) : (
                  settlementRequests.map((request) => (
                    <FinanceRequestCard key={request.requestId} request={request} />
                  ))
                )}
              </div>
            </FinanceSection>

            <FinanceSection
              title="운영진에게 제출한 전체 요청"
              caption="선지출, 환불, 정산 요청 전체를 시간순으로 확인합니다."
            >
              <div className="space-y-3">
                {requests.length === 0 ? (
                  <EmptyStateCard
                    title="아직 제출한 요청이 없습니다."
                    description="오른쪽 아래 FAB를 눌러 선지출, 환불, 정산 요청을 바로 제출할 수 있습니다."
                  />
                ) : (
                  requests.map((request) => (
                    <FinanceRequestCard key={request.requestId} request={request} />
                  ))
                )}
              </div>
            </FinanceSection>
          </motion.section>
        </main>

        <button
          type="button"
          aria-label="재정 제출 메뉴 열기"
          onClick={() => setShowActionSheet(true)}
          className={`fixed ${FAB_RIGHT_OFFSET_CLASS_NAME} ${getActionFabBottomClass(isAdmin)} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#135bec] text-white transition-transform active:scale-95`}
          style={{ boxShadow: "0 10px 24px rgba(19, 91, 236, 0.34)" }}
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}

        <EphemeralToast toastId={toast?.id ?? null} message={toast?.message ?? null} tone={toast?.tone} />
        <AnimatePresence>
          {showActionSheet ? (
            <RouteModal
              onDismiss={() => setShowActionSheet(false)}
              contentClassName="max-w-md rounded-[2rem] sm:rounded-[2rem]"
            >
              <section className="px-5 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Member Actions
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">운영진에게 제출할 재정 요청</h3>
                  </div>
                  <button
                    type="button"
                    aria-label="제출 메뉴 닫기"
                    onClick={() => setShowActionSheet(false)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {MEMBER_ACTION_OPTIONS.map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => openActionModal(option.type)}
                      className="flex w-full items-start gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-[#135bec]/30 hover:bg-[#f4f8ff]"
                    >
                      <div className="rounded-full bg-[#135bec]/10 p-2 text-[#135bec]">
                        <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900">{option.label}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </RouteModal>
          ) : null}

          {activeAction ? (
            <RouteModal
              onDismiss={closeRequestModal}
              dismissOnBackdrop={false}
              contentClassName="max-w-xl"
            >
              <FinanceRequestModal
                action={activeAction}
                draft={draft}
                busy={isSubmitting}
                onChange={(nextDraft) => setDraft(nextDraft)}
                onClose={closeRequestModal}
                onSubmit={() => void handleSubmitRequest()}
              />
            </RouteModal>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FinanceSection({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{caption}</p>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string;
  accent?: "slate" | "amber" | "emerald" | "rose" | "sky";
}) {
  const accentClassName =
    accent === "amber"
      ? "bg-amber-50 text-amber-800"
      : accent === "emerald"
        ? "bg-emerald-50 text-emerald-800"
        : accent === "rose"
          ? "bg-rose-50 text-rose-800"
          : accent === "sky"
            ? "bg-sky-50 text-sky-800"
            : "bg-slate-50 text-slate-900";

  return (
    <div className={`rounded-2xl px-4 py-4 ${accentClassName}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function CompactTransactionCard({ obligation }: { obligation: ClubFinanceUserObligation }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusClassName(obligation.payment)}`}
            >
              {obligation.payment.paymentStatusLabel}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
              {obligation.obligationTypeLabel}
            </span>
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900">{obligation.title}</p>
        </div>
        <p className="shrink-0 text-sm font-bold text-slate-900">{obligation.amountLabel}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{obligation.payment.paidAtLabel ?? obligation.issuedAtLabel ?? "일시 미정"}</span>
        <span>{obligation.note ?? obligation.payment.note ?? "메모 없음"}</span>
      </div>
    </article>
  );
}

function ObligationCard({
  obligation,
  emphasize = false,
  muted = false,
}: {
  obligation: ClubFinanceUserObligation;
  emphasize?: boolean;
  muted?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 ${
        emphasize
          ? "border-[#135bec]/15 bg-blue-50/60"
          : muted
            ? "border-slate-100 bg-slate-50"
            : "border-amber-100 bg-amber-50/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${getStatusClassName(obligation.payment)}`}>
              {obligation.payment.paymentStatusLabel}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
              {obligation.obligationTypeLabel}
            </span>
          </div>
          <p className="mt-3 text-base font-bold text-slate-900">{obligation.title}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{obligation.amountLabel}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <InfoItem label="마감일" value={obligation.dueAtLabel ?? "미정"} />
        <InfoItem label="발행일" value={obligation.issuedAtLabel ?? "미정"} />
        <InfoItem label="납부일" value={obligation.payment.paidAtLabel ?? "미납"} />
        <InfoItem label="메모" value={obligation.note ?? obligation.payment.note ?? "없음"} />
      </div>
    </article>
  );
}

function FinanceRequestCard({ request }: { request: ClubFinanceRequest }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getRequestStatusClassName(request)}`}
            >
              {request.statusLabel}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
              {request.requestTypeLabel}
            </span>
          </div>
          <h4 className="mt-3 text-base font-bold text-slate-900">{request.title}</h4>
          <p className="mt-1 text-lg font-bold text-slate-900">{request.amountLabel}</p>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {request.submittedAtLabel ?? "방금 제출"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <InfoItem label="관련 행사" value={request.relatedEventName ?? "없음"} />
        <InfoItem label="검토 시각" value={request.reviewedAtLabel ?? "대기 중"} />
        <InfoItem label="메모" value={request.note ?? "없음"} />
        <InfoItem label="검토 메모" value={request.reviewNote ?? "아직 없음"} />
      </div>
    </article>
  );
}

function FinanceRequestModal({
  action,
  draft,
  busy,
  onChange,
  onClose,
  onSubmit,
}: {
  action: MemberFabAction;
  draft: MemberRequestDraft;
  busy: boolean;
  onChange: (nextDraft: MemberRequestDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const actionMeta = MEMBER_ACTION_OPTIONS.find((option) => option.type === action) ?? MEMBER_ACTION_OPTIONS[0];

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {actionMeta.label}
          </p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">운영진에게 제출</h3>
        </div>
        <button
          type="button"
          aria-label="요청 제출 닫기"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-500">{actionMeta.description}</p>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">제목</span>
            <input
              value={draft.title}
              onChange={(event) => onChange({ ...draft, title: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#135bec] focus:ring-2 focus:ring-[#135bec]/10"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">금액</span>
            <input
              value={draft.amount}
              onChange={(event) => onChange({ ...draft, amount: event.target.value })}
              inputMode="numeric"
              placeholder="예: 24800"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#135bec] focus:ring-2 focus:ring-[#135bec]/10"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">관련 행사</span>
            <input
              value={draft.relatedEventName}
              onChange={(event) => onChange({ ...draft, relatedEventName: event.target.value })}
              placeholder="예: 봄 친선전"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#135bec] focus:ring-2 focus:ring-[#135bec]/10"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">메모</span>
            <textarea
              value={draft.note}
              onChange={(event) => onChange({ ...draft, note: event.target.value })}
              rows={4}
              placeholder="계좌, 영수증 안내, 정산이 필요한 이유 등을 적어주세요."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#135bec] focus:ring-2 focus:ring-[#135bec]/10"
            />
          </label>
        </div>
      </div>

      <div className="border-t border-slate-200 px-5 py-4">
        <button
          type="button"
          disabled={busy}
          onClick={onSubmit}
          className="w-full rounded-2xl bg-[#135bec] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0f4dcc] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {busy ? "제출 중..." : `${actionMeta.label} 제출`}
        </button>
      </div>
    </section>
  );
}

function PlaceholderPanel({
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
    <article className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white p-2 text-slate-500">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-4 space-y-2">
            {bullets.map((bullet) => (
              <p key={bullet} className="text-sm text-slate-600">
                {bullet}
              </p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyStateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-slate-600">{value}</p>
    </div>
  );
}
