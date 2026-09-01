"use client";

import { motion } from "motion/react";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import type { ClubAdminFinanceHomeResponse } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

import { MetricCard, PermissionChip } from "./components";
import { ADMIN_FINANCE_TABS, type AdminFinanceTabKey } from "./financeClientUtils";

export function FinanceAdminOverview({
  finance,
  activeTab,
  reduceMotion,
  onTabChange,
}: {
  finance: ClubAdminFinanceHomeResponse;
  activeTab: AdminFinanceTabKey;
  reduceMotion: boolean;
  onTabChange: (tab: AdminFinanceTabKey) => void;
}) {
  return (
    <>
      <ClubPageHeader
        title="재정 관리"
        subtitle={finance.clubName}
        icon="payments"
        theme="admin"
        containerClassName="semo-page-admin-wide"
      />

      <div className="semo-page-admin-wide space-y-5 px-4 pt-4">
        <motion.section
          className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm"
          {...staggeredFadeUpMotion(0, reduceMotion)}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-wide text-slate-400">재무 운영</p>
              <h2 className="mt-2 text-2xl font-bold">모임의 재정 흐름을 한곳에서 관리하세요.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                회비 발행과 수납 현황부터 회원 요청, 운영 지출까지 필요한 업무를 빠르게 이어갈 수 있습니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PermissionChip label="조회" enabled />
                <PermissionChip label="발행" enabled={finance.canIssue} />
                <PermissionChip label="납부 완료" enabled={finance.canMarkPaid} />
                <PermissionChip label="면제" enabled={finance.canMarkWaive} />
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-3 xl:max-w-[420px]">
              <MetricCard label="총 청구액" value={finance.totalBilledAmountLabel} accent />
              <MetricCard label="수납 완료" value={finance.totalCollectedAmountLabel} />
              <MetricCard label="미수금" value={finance.totalOutstandingAmountLabel} />
              <MetricCard label="면제 금액" value={finance.totalWaivedAmountLabel} />
            </div>
          </div>
        </motion.section>

        <motion.section
          className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm"
          {...staggeredFadeUpMotion(1, reduceMotion)}
        >
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {ADMIN_FINANCE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                aria-pressed={activeTab === tab.key}
                className={`w-full rounded-full px-4 py-2.5 text-sm font-bold transition sm:w-auto sm:shrink-0 ${
                  activeTab === tab.key
                    ? "bg-[var(--primary)] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.section>
      </div>
    </>
  );
}
