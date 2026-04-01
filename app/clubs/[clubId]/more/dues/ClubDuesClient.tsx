"use client";

import { motion, useReducedMotion } from "motion/react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { type ClubDuesHomeResponse, type ClubDuesInvoice, type ClubDuesUserCharge } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubDuesClientProps = {
  clubId: string;
  initialData: ClubDuesHomeResponse;
  isAdmin: boolean;
};

function getStatusClassName(invoice: ClubDuesInvoice) {
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
              My Dues
            </p>
            <h2 className="mt-3 text-xl font-bold">
              {dues.nextPayableCharge ? `${dues.nextPayableCharge.title} 납부가 필요합니다.` : "현재 납부할 회비 항목이 없습니다."}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              운영자가 발행한 회비 항목을 확인하고, 미납 상태와 마감일을 한 번에 볼 수 있습니다.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <SummaryCard label="미납" value={dues.pendingInvoiceCount} />
              <SummaryCard label="완납" value={dues.paidInvoiceCount} />
              <SummaryCard label="연체" value={dues.overdueInvoiceCount} />
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
              <h3 className="text-base font-bold">가장 가까운 회비 항목</h3>
              <span className="text-xs font-medium text-slate-400">
                {dues.nextPayableCharge ? "열림" : "없음"}
              </span>
            </div>
            {dues.nextPayableCharge ? (
              <ChargeCard charge={dues.nextPayableCharge} emphasize />
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                현재 열려 있는 회비 항목이 없습니다.
              </div>
            )}
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">납부 필요 항목</h3>
              <span className="text-xs font-medium text-slate-400">{dues.openCharges.length}건</span>
            </div>
            <div className="space-y-3">
              {dues.openCharges.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  현재 납부할 회비 항목이 없습니다.
                </div>
              ) : (
                dues.openCharges.map((charge, index) => (
                  <motion.div
                    key={charge.chargeId}
                    {...staggeredFadeUpMotion(index + 3, reduceMotion)}
                  >
                    <ChargeCard charge={charge} />
                  </motion.div>
                ))
              )}
            </div>
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(3, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">전체 회비 이력</h3>
              <span className="text-xs font-medium text-slate-400">{dues.chargeHistory.length}건</span>
            </div>
            <div className="space-y-3">
              {dues.chargeHistory.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  표시할 회비 기록이 없습니다.
                </div>
              ) : (
                dues.chargeHistory.map((charge, index) => (
                  <motion.div
                    key={`${charge.chargeId}-history`}
                    {...staggeredFadeUpMotion(index + 6, reduceMotion)}
                  >
                    <ChargeCard charge={charge} muted />
                  </motion.div>
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

function ChargeCard({
  charge,
  emphasize = false,
  muted = false,
}: {
  charge: ClubDuesUserCharge;
  emphasize?: boolean;
  muted?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
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
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${getStatusClassName(charge.invoice)}`}>
              {charge.invoice.paymentStatusLabel}
            </span>
          </div>
          <p className="mt-3 text-base font-bold text-slate-900">{charge.title}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{charge.amountLabel}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <InfoItem label="마감일" value={charge.dueAtLabel ?? "미정"} />
        <InfoItem label="발행일" value={charge.issuedAtLabel ?? "미정"} />
        <InfoItem label="납부일" value={charge.invoice.paidAtLabel ?? "미납"} />
        <InfoItem label="메모" value={charge.note ?? charge.invoice.note ?? "없음"} />
      </div>
    </article>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
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
