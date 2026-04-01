"use client";

import { motion, useReducedMotion } from "motion/react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { type ClubDuesHomeResponse, type ClubDuesSummary } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubDuesClientProps = {
  clubId: string;
  initialData: ClubDuesHomeResponse;
  isAdmin: boolean;
};

function getStatusClassName(invoice: ClubDuesSummary) {
  if (invoice.paymentStatus === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (invoice.paymentStatus === "WAIVED") {
    return "bg-slate-200 text-slate-600";
  }
  if (invoice.paymentStatus === "OVERDUE") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-amber-50 text-amber-700";
}

export function ClubDuesClient({ clubId, initialData, isAdmin }: ClubDuesClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const dues = initialData;

  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative min-h-screen">
        <ClubPageHeader
          title="회비 관리"
          subtitle={dues.clubName}
          icon="payments"
          className="bg-white/85 backdrop-blur-md"
        />

        <main className="semo-nav-bottom-space mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-4">
          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              내 회비
            </p>
            <h2 className="mt-3 text-xl font-bold">
              {dues.nextInvoice ? `${dues.nextInvoice.billingMonthLabel} 청구가 있습니다.` : "현재 청구된 회비가 없습니다."}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              납부 처리는 운영자가 확인 후 반영합니다. 회비 상태와 마감일을 여기서 확인할 수 있습니다.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">미납</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{dues.pendingInvoiceCount}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">완납</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{dues.paidInvoiceCount}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">연체</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{dues.overdueInvoiceCount}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-[#135bec]">
              현재 미납 합계 {dues.totalPendingAmountLabel}
            </div>
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">가장 가까운 청구</h3>
              <span className="text-xs font-medium text-slate-400">
                {dues.nextInvoice ? dues.nextInvoice.billingMonthLabel : "없음"}
              </span>
            </div>
            {dues.nextInvoice ? (
              <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{dues.nextInvoice.billingMonthLabel}</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{dues.nextInvoice.amountLabel}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${getStatusClassName(dues.nextInvoice)}`}>
                    {dues.nextInvoice.paymentStatusLabel}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <p>마감일: {dues.nextInvoice.dueAtLabel ?? "미정"}</p>
                  <p>비고: {dues.nextInvoice.note ?? "운영 메모 없음"}</p>
                </div>
              </article>
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                아직 발행된 회비가 없습니다.
              </div>
            )}
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">청구 내역</h3>
              <span className="text-xs font-medium text-slate-400">{dues.myInvoices.length}건</span>
            </div>
            <div className="space-y-3">
              {dues.myInvoices.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  표시할 회비 기록이 없습니다.
                </div>
              ) : (
                dues.myInvoices.map((invoice, index) => (
                  <motion.article
                    key={invoice.invoiceId}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    {...staggeredFadeUpMotion(index + 3, reduceMotion)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{invoice.billingMonthLabel}</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">{invoice.amountLabel}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${getStatusClassName(invoice)}`}>
                        {invoice.paymentStatusLabel}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                      <div>
                        <p className="font-semibold text-slate-400">마감일</p>
                        <p className="mt-1">{invoice.dueAtLabel ?? "미정"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-400">납부일</p>
                        <p className="mt-1">{invoice.paidAtLabel ?? "미납"}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">{invoice.note ?? "운영 메모가 없습니다."}</p>
                  </motion.article>
                ))
              )}
            </div>
          </motion.section>
        </main>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
      </div>
    </div>
  );
}
