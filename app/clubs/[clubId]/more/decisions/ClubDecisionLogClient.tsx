"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubRouteErrorState, ClubRouteLoadingState } from "@/app/components/ClubRouteState";
import { DecisionRecordCard } from "@/app/components/DecisionRecordCard";
import { memberDecisionLogQueryOptions } from "@/app/lib/react-query/decision/queries";

type RecordFilter = "ALL" | "DECISION" | "MEETING_MINUTES";

export function ClubDecisionLogClient({ clubId }: { clubId: string }) {
  const [filter, setFilter] = useState<RecordFilter>("ALL");
  const logQuery = useQuery(memberDecisionLogQueryOptions(clubId));
  const log = logQuery.data ?? null;
  const records = useMemo(
    () => log?.records.filter((record) => filter === "ALL" || record.recordType === filter) ?? [],
    [filter, log?.records],
  );

  if (logQuery.isError && !log) {
    return <ClubRouteErrorState title="회의록·결정" message="확정된 회의록과 운영 결정을 불러오지 못했습니다." backHref={`/clubs/${clubId}/more`} onRetry={() => void logQuery.refetch()} />;
  }
  if (!log) return <ClubRouteLoadingState title="회의록과 운영 결정을 불러오는 중입니다" />;

  return (
    <div className="min-h-screen bg-[var(--background-light)] text-slate-900">
      <ClubPageHeader title="회의록·결정" subtitle={log.clubName} icon="gavel" />
      <main className="semo-page-user semo-nav-bottom-space px-4 py-5">
        <section className="overflow-hidden rounded-[var(--radius-modal)] bg-slate-950 p-5 text-white shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-blue-200">운영의 맥락을 이어갑니다</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight">결정한 이유까지 남겨요</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">확정된 회의 합의와 운영 결정을 확인하고 관련 일정·업무·재정 항목으로 바로 이동할 수 있습니다.</p>
            </div>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10"><span className="material-symbols-outlined text-[27px]" aria-hidden="true">history_edu</span></span>
          </div>
          <div className="mt-5 rounded-[var(--radius-card)] bg-white/10 px-4 py-3"><p className="text-xs font-bold text-slate-300">공개된 운영 기록</p><p className="mt-1 text-2xl font-black">{log.records.length}건</p></div>
        </section>

        <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {([
            ["ALL", "전체"],
            ["DECISION", "운영 결정"],
            ["MEETING_MINUTES", "회의록"],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`min-h-11 rounded-[var(--radius-control)] px-2 text-xs font-bold transition sm:text-sm ${filter === key ? "bg-[var(--primary)] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>
          ))}
        </div>

        <section className="mt-6 space-y-3">
          {records.length > 0 ? records.map((record) => <DecisionRecordCard key={record.decisionRecordId} clubId={clubId} record={record} />) : <div className="rounded-[var(--radius-modal)] border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><span className="material-symbols-outlined text-[34px] text-slate-300" aria-hidden="true">gavel</span><p className="mt-3 text-sm font-black text-slate-700">공개된 기록이 없습니다.</p><p className="mt-1 text-xs leading-5 text-slate-400">운영진이 기록을 확정하고 멤버 공개로 설정하면 이곳에 표시됩니다.</p></div>}
        </section>
      </main>
    </div>
  );
}
