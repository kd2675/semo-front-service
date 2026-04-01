"use client";

import { Public_Sans } from "next/font/google";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import {
  getClubAdminDues,
  issueClubDuesInvoices,
  updateClubDuesPaymentStatus,
  type ClubAdminDuesHomeResponse,
  type ClubDuesSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ClubAdminDuesClientProps = {
  clubId: string;
  initialData: ClubAdminDuesHomeResponse;
};

type InvoiceFilter = "ALL" | "PENDING" | "OVERDUE" | "PAID" | "WAIVED";

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

function getDefaultBillingPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function ClubAdminDuesClient({ clubId, initialData }: ClubAdminDuesClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [dues, setDues] = useState(initialData);
  const [billingPeriod, setBillingPeriod] = useState(getDefaultBillingPeriod);
  const [amount, setAmount] = useState("5000");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<InvoiceFilter>("ALL");
  const [isIssuing, setIsIssuing] = useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState<number | null>(null);
  const { toast, showToast, clearToast } = useEphemeralToast();

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = deferredSearchQuery.trim().toLowerCase();

    return dues.invoices.filter((invoice) => {
      if (statusFilter !== "ALL" && invoice.paymentStatus !== statusFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return [
        invoice.memberDisplayName,
        invoice.billingMonthLabel,
        invoice.paymentStatusLabel,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [deferredSearchQuery, dues.invoices, statusFilter]);

  const reloadDues = async () => {
    const result = await getClubAdminDues(clubId);
    if (!result.ok || !result.data) {
      showToast(result.message ?? "회비 정보를 다시 불러오지 못했습니다.", "error");
      return false;
    }
    const nextDues = result.data;
    startTransition(() => {
      setDues(nextDues);
    });
    return true;
  };

  const handleIssueInvoices = async () => {
    if (!dues.canIssue || isIssuing) {
      return;
    }

    const [billingYear, billingMonth] = billingPeriod.split("-").map((value) => Number(value));
    const parsedAmount = Number(amount);
    if (!billingYear || !billingMonth) {
      showToast("청구 연월을 확인해주세요.", "error");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showToast("회비 금액은 0보다 커야 합니다.", "error");
      return;
    }

    setIsIssuing(true);
    clearToast();
    const result = await issueClubDuesInvoices(clubId, {
      billingYear,
      billingMonth,
      amount: parsedAmount,
      dueAt: dueAt || null,
      note: note || null,
    });
    setIsIssuing(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "회비 발행에 실패했습니다.", "error");
      return;
    }

    const reloaded = await reloadDues();
    if (!reloaded) {
      return;
    }
    showToast(
      `${result.data.billingMonthLabel} 회비 ${result.data.createdCount}건을 발행했습니다.`,
      "success",
    );
  };

  const handleUpdateStatus = async (
    invoiceId: number,
    paymentStatus: "PENDING" | "PAID" | "WAIVED",
  ) => {
    if (activeInvoiceId != null) {
      return;
    }

    setActiveInvoiceId(invoiceId);
    clearToast();
    const result = await updateClubDuesPaymentStatus(clubId, invoiceId, {
      paymentStatus,
    });
    setActiveInvoiceId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "회비 상태 변경에 실패했습니다.", "error");
      return;
    }

    const reloaded = await reloadDues();
    if (!reloaded) {
      return;
    }
    showToast(`${result.data.memberDisplayName} 회비 상태를 변경했습니다.`, "success");
  };

  return (
    <div className={`${publicSans.className} min-h-screen bg-[#f8f6f6] text-slate-900`}>
      <div className="min-h-screen bg-[#f8f6f6]">
        <ClubPageHeader
          title="회비 관리"
          subtitle={dues.clubName}
          icon="payments"
          theme="admin"
          containerClassName="max-w-5xl"
        />

        <main className="semo-nav-bottom-space mx-auto w-full max-w-5xl space-y-5 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Dues Overview</p>
                <h2 className="mt-2 text-2xl font-bold">월별 회비 청구와 납부 상태를 운영합니다.</h2>
                <p className="mt-2 text-sm text-slate-500">
                  활성 멤버 {dues.activeMemberCount}명을 기준으로 회비를 발행하고, 납부 완료 또는 면제 상태를 처리합니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">총 청구</p>
                  <p className="mt-2 text-lg font-bold">{dues.totalInvoiceCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">미납</p>
                  <p className="mt-2 text-lg font-bold">{dues.pendingInvoiceCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">연체</p>
                  <p className="mt-2 text-lg font-bold">{dues.overdueInvoiceCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">면제</p>
                  <p className="mt-2 text-lg font-bold">{dues.waivedInvoiceCount}</p>
                </div>
                <div className="rounded-2xl bg-orange-50 px-4 py-3 text-[#ec5b13]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ec5b13]/70">납부율</p>
                  <p className="mt-2 text-lg font-bold">{dues.collectionRate}%</p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">월별 회비 발행</h3>
              <span className="text-xs font-medium text-slate-400">활성 멤버 전체 대상</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr_2fr_auto]">
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-slate-600">청구 연월</span>
                <input
                  type="month"
                  value={billingPeriod}
                  onChange={(event) => setBillingPeriod(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#ec5b13]"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-slate-600">금액</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#ec5b13]"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-slate-600">마감일</span>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#ec5b13]"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-slate-600">메모</span>
                <input
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="예: 4월 정기 회비"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#ec5b13]"
                />
              </label>
              <button
                type="button"
                onClick={() => void handleIssueInvoices()}
                disabled={!dues.canIssue || isIssuing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#d45111] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isIssuing ? "progress_activity" : "payments"}
                </span>
                {isIssuing ? "발행 중..." : "회비 발행"}
              </button>
            </div>
          </motion.section>

          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-bold">청구 목록</h3>
                <p className="mt-1 text-sm text-slate-500">멤버별 회비 상태를 필터링하고 바로 처리합니다.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="멤버 또는 월 검색"
                  className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#ec5b13]"
                />
                <div className="flex flex-wrap gap-2">
                  {(["ALL", "PENDING", "OVERDUE", "PAID", "WAIVED"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                        statusFilter === filter
                          ? "bg-[#ec5b13] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter === "ALL"
                        ? "전체"
                        : filter === "PENDING"
                          ? "미납"
                          : filter === "OVERDUE"
                            ? "연체"
                            : filter === "PAID"
                              ? "완납"
                              : "면제"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredInvoices.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  조건에 맞는 회비 청구가 없습니다.
                </div>
              ) : (
                filteredInvoices.map((invoice, index) => {
                    const canRestoreToPending = dues.canMarkPaid || dues.canMarkWaive;

                    return (
                      <motion.article
                        key={invoice.invoiceId}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        {...staggeredFadeUpMotion(index + 3, reduceMotion)}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-bold text-slate-900">{invoice.memberDisplayName}</p>
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                {invoice.memberRoleCode ?? "MEMBER"}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusClassName(invoice)}`}>
                                {invoice.paymentStatusLabel}
                              </span>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm text-slate-600">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">청구월</p>
                                <p className="mt-1 font-semibold text-slate-900">{invoice.billingMonthLabel}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">금액</p>
                                <p className="mt-1 font-semibold text-slate-900">{invoice.amountLabel}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">마감일</p>
                                <p className="mt-1">{invoice.dueAtLabel ?? "미정"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">납부일</p>
                                <p className="mt-1">{invoice.paidAtLabel ?? "미납"}</p>
                              </div>
                            </div>
                            <p className="mt-3 text-xs text-slate-500">{invoice.note ?? "메모 없음"}</p>
                          </div>

                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            <button
                              type="button"
                              disabled={!dues.canMarkPaid || activeInvoiceId === invoice.invoiceId || invoice.paymentStatus === "PAID"}
                              onClick={() => void handleUpdateStatus(invoice.invoiceId, "PAID")}
                              className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              {activeInvoiceId === invoice.invoiceId ? "처리 중..." : "납부 완료"}
                            </button>
                            <button
                              type="button"
                              disabled={!dues.canMarkWaive || activeInvoiceId === invoice.invoiceId || invoice.paymentStatus === "WAIVED"}
                              onClick={() => void handleUpdateStatus(invoice.invoiceId, "WAIVED")}
                              className="rounded-full bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              면제
                            </button>
                            <button
                              type="button"
                              disabled={
                                !canRestoreToPending ||
                                activeInvoiceId === invoice.invoiceId ||
                                (invoice.paymentStatus !== "PAID" && invoice.paymentStatus !== "WAIVED")
                              }
                              onClick={() => void handleUpdateStatus(invoice.invoiceId, "PENDING")}
                              className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              미납으로 복원
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })
              )}
            </div>
          </motion.section>
        </main>

        <EphemeralToast message={toast?.message ?? null} tone={toast?.tone} />
      </div>
    </div>
  );
}
