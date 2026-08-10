"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubRouteErrorState, ClubRouteLoadingState } from "@/app/components/ClubRouteState";
import { ResourceAttachmentPanel } from "@/app/components/ResourceAttachmentPanel";
import { RouterLink } from "@/app/components/RouterLink";
import { useAppToast } from "@/app/hooks/useAppToast";
import { clubQueryKeys } from "@/app/lib/react-query/club/queries";
import {
  acknowledgeHandoverNoteMutationOptions,
  activateOperatingTermMutationOptions,
  closeOperatingTermMutationOptions,
  createHandoverNoteMutationOptions,
  createOperatingTermMutationOptions,
  deleteExecutiveAssignmentMutationOptions,
  deleteHandoverNoteMutationOptions,
  updateCarryoverStatusMutationOptions,
  updateOperatingTermMutationOptions,
  upsertExecutiveAssignmentMutationOptions,
} from "@/app/lib/react-query/handover/mutations";
import { handoverCenterQueryOptions, handoverQueryKeys } from "@/app/lib/react-query/handover/queries";
import type {
  ClubExecutiveAssignment,
  ClubHandoverCenter,
  ClubHandoverNote,
  ClubOperatingTerm,
  ClubTermCarryoverItem,
  HandoverQueueItem,
  OperatingTermType,
  UpsertOperatingTermRequest,
} from "@/app/lib/semo/handover";

type HandoverTab = "OVERVIEW" | "TERMS" | "EXECUTIVES" | "NOTES";

const TABS: Array<{ key: HandoverTab; label: string; icon: string }> = [
  { key: "OVERVIEW", label: "운영 현황", icon: "space_dashboard" },
  { key: "TERMS", label: "임기", icon: "date_range" },
  { key: "EXECUTIVES", label: "집행부", icon: "groups" },
  { key: "NOTES", label: "인계 메모", icon: "assignment" },
];

const TERM_TYPE_OPTIONS: Array<{ value: OperatingTermType; label: string }> = [
  { value: "YEAR", label: "연도" },
  { value: "SEMESTER", label: "학기" },
  { value: "SEASON", label: "시즌" },
  { value: "CUSTOM", label: "직접 설정" },
];

const EMPTY_TERM_FORM: UpsertOperatingTermRequest = {
  termName: "",
  termType: "YEAR",
  startDate: "",
  endDate: "",
  description: "",
};

const fieldClassName = "min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
const textareaClassName = "w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

function formatDate(value: string | null | undefined) {
  if (!value) return "미정";
  const date = new Date(`${value.length === 10 ? `${value}T00:00:00` : value}`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value: number, currencyCode: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: currencyCode || "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

function termStatusLabel(statusCode: string) {
  if (statusCode === "ACTIVE") return "진행 중";
  if (statusCode === "CLOSED") return "종료";
  return "예정";
}

function termStatusClass(statusCode: string) {
  if (statusCode === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (statusCode === "CLOSED") return "bg-slate-100 text-slate-500";
  return "bg-blue-50 text-blue-700";
}

function initials(value: string) {
  return value.trim().slice(0, 2) || "멤";
}

export function ClubAdminHandoverClient({ clubId }: { clubId: string }) {
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  const [activeTab, setActiveTab] = useState<HandoverTab>("OVERVIEW");
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [showTermForm, setShowTermForm] = useState(false);
  const [editingTermId, setEditingTermId] = useState<number | null>(null);
  const [termForm, setTermForm] = useState<UpsertOperatingTermRequest>(EMPTY_TERM_FORM);
  const [executiveForm, setExecutiveForm] = useState({ memberId: "", positionId: "", responsibility: "" });
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    assignedProfileId: "",
    positionId: "",
    dueAt: "",
    ready: true,
  });

  const centerQuery = useQuery(handoverCenterQueryOptions(clubId, selectedTermId));
  const center = centerQuery.data ?? null;
  const createTermMutation = useMutation(createOperatingTermMutationOptions(clubId));
  const updateTermMutation = useMutation(updateOperatingTermMutationOptions(clubId));
  const activateTermMutation = useMutation(activateOperatingTermMutationOptions(clubId));
  const closeTermMutation = useMutation(closeOperatingTermMutationOptions(clubId));
  const executiveMutation = useMutation(upsertExecutiveAssignmentMutationOptions(clubId));
  const deleteExecutiveMutation = useMutation(deleteExecutiveAssignmentMutationOptions(clubId));
  const createNoteMutation = useMutation(createHandoverNoteMutationOptions(clubId));
  const acknowledgeMutation = useMutation(acknowledgeHandoverNoteMutationOptions(clubId));
  const deleteNoteMutation = useMutation(deleteHandoverNoteMutationOptions(clubId));
  const carryoverMutation = useMutation(updateCarryoverStatusMutationOptions(clubId));

  const displayedTerm = center?.selectedTerm ?? center?.activeTerm ?? center?.nextTerm ?? null;
  const displayedTermId = displayedTerm?.clubOperatingTermId ?? null;
  const displayedAssignments = useMemo(
    () => center?.executiveAssignments.filter((item) => item.clubOperatingTermId === displayedTermId) ?? [],
    [center?.executiveAssignments, displayedTermId],
  );

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: handoverQueryKeys.all(clubId) }),
      queryClient.invalidateQueries({ queryKey: clubQueryKeys.moreSummary(clubId) }),
    ]);
  };

  const reportResult = async (result: { ok: boolean; message?: string }, successMessage: string) => {
    if (!result.ok) {
      showToast(result.message ?? "요청을 처리하지 못했습니다.", "error");
      return false;
    }
    await refresh();
    showToast(successMessage, "success");
    return true;
  };

  const startCreateTerm = () => {
    setEditingTermId(null);
    setTermForm(EMPTY_TERM_FORM);
    setShowTermForm(true);
  };

  const startEditTerm = (term: ClubOperatingTerm) => {
    setEditingTermId(term.clubOperatingTermId);
    setTermForm({
      termName: term.termName,
      termType: (TERM_TYPE_OPTIONS.some((item) => item.value === term.termType) ? term.termType : "CUSTOM") as OperatingTermType,
      startDate: term.startDate,
      endDate: term.endDate,
      description: term.description ?? "",
    });
    setShowTermForm(true);
  };

  const submitTerm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = editingTermId == null
      ? await createTermMutation.mutateAsync(termForm)
      : await updateTermMutation.mutateAsync({ termId: editingTermId, request: termForm });
    if (await reportResult(result, editingTermId == null ? "운영 임기를 만들었습니다." : "운영 임기를 수정했습니다.")) {
      if (result.data) setSelectedTermId(result.data.clubOperatingTermId);
      setShowTermForm(false);
      setEditingTermId(null);
      setTermForm(EMPTY_TERM_FORM);
    }
  };

  const activateTerm = async (term: ClubOperatingTerm) => {
    const currentName = center?.activeTerm?.termName;
    const message = currentName && center?.activeTerm?.clubOperatingTermId !== term.clubOperatingTermId
      ? `${term.termName}을 시작하면 ${currentName}은 종료되고 미완료 항목이 새 임기로 이관됩니다. 계속할까요?`
      : `${term.termName}을 현재 운영 임기로 시작할까요?`;
    if (!window.confirm(message)) return;
    const result = await activateTermMutation.mutateAsync(term.clubOperatingTermId);
    if (await reportResult(result, "새 운영 임기를 시작했습니다.")) setSelectedTermId(term.clubOperatingTermId);
  };

  const closeTerm = async (term: ClubOperatingTerm) => {
    if (!window.confirm(`${term.termName}을 종료할까요? 종료된 임기와 집행부 스냅샷은 수정할 수 없습니다.`)) return;
    const result = await closeTermMutation.mutateAsync(term.clubOperatingTermId);
    await reportResult(result, "운영 임기를 종료했습니다.");
  };

  const submitExecutive = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!displayedTermId || !executiveForm.memberId || !executiveForm.positionId) {
      showToast("임기, 멤버와 직책을 모두 선택해주세요.", "error");
      return;
    }
    const result = await executiveMutation.mutateAsync({
      termId: displayedTermId,
      request: {
        clubMemberId: Number(executiveForm.memberId),
        clubPositionId: Number(executiveForm.positionId),
        responsibility: executiveForm.responsibility || null,
        sortOrder: displayedAssignments.length * 10 + 10,
      },
    });
    if (await reportResult(result, "집행부 구성을 저장했습니다.")) {
      setExecutiveForm({ memberId: "", positionId: "", responsibility: "" });
    }
  };

  const submitNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!center?.activeTerm && !center?.nextTerm && !displayedTerm) {
      showToast("먼저 운영 임기를 만들어주세요.", "error");
      return;
    }
    const result = await createNoteMutation.mutateAsync({
      fromTermId: center?.activeTerm?.clubOperatingTermId ?? displayedTermId,
      toTermId: center?.nextTerm?.clubOperatingTermId ?? null,
      clubPositionId: noteForm.positionId ? Number(noteForm.positionId) : null,
      assignedClubProfileId: noteForm.assignedProfileId ? Number(noteForm.assignedProfileId) : null,
      title: noteForm.title,
      content: noteForm.content,
      statusCode: noteForm.ready ? "READY" : "DRAFT",
      dueAt: noteForm.dueAt ? `${noteForm.dueAt}:00` : null,
    });
    if (await reportResult(result, "인수인계 메모를 저장했습니다.")) {
      setNoteForm({ title: "", content: "", assignedProfileId: "", positionId: "", dueAt: "", ready: true });
    }
  };

  if (centerQuery.isError && !center) {
    return (
      <ClubRouteErrorState
        title="인수인계 센터"
        message="운영 임기와 인수인계 정보를 불러오지 못했습니다."
        backHref={`/clubs/${clubId}/admin/more`}
        theme="admin"
        onRetry={() => void centerQuery.refetch()}
      />
    );
  }

  if (!center) {
    return <ClubRouteLoadingState title="인수인계 센터를 준비하고 있습니다" theme="admin" />;
  }

  const totalAttention = center.queueSummary.openTodoCount
    + center.queueSummary.unpaidPaymentCount
    + center.queueSummary.pendingFinanceRequestCount
    + center.queueSummary.openFeedbackCount
    + center.queueSummary.pendingJoinRequestCount
    + center.queueSummary.openHandoverNoteCount
    + center.queueSummary.openCarryoverCount;

  return (
    <div className="min-h-screen bg-[var(--background-light)] text-slate-900">
      <ClubPageHeader title="인수인계 센터" subtitle={center.clubName} icon="move_up" theme="admin" />

      <main className="semo-nav-bottom-space semo-page-admin px-4 py-5">
        <section className="overflow-hidden rounded-[30px] bg-slate-950 p-5 text-white shadow-lg shadow-slate-200/70">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white/55">현재 운영 임기</p>
              <h1 className="mt-2 truncate text-2xl font-black tracking-tight">
                {center.activeTerm?.termName ?? "진행 중인 임기가 없습니다"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {center.activeTerm
                  ? `${formatDate(center.activeTerm.startDate)} – ${formatDate(center.activeTerm.endDate)}`
                  : "임기를 만들면 집행부와 운영 데이터를 기간별로 보존할 수 있습니다."}
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <span className="material-symbols-outlined text-[28px]" aria-hidden="true">history_edu</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <HeroMetric label="확인할 운영 항목" value={`${totalAttention}건`} danger={totalAttention > 0} />
            <HeroMetric label="다음 임기" value={center.nextTerm?.termName ?? "미정"} />
          </div>
        </section>

        <div className="mt-4 overflow-x-auto pb-1">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={activeTab === tab.key}
                className={`flex min-h-11 min-w-[104px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold transition ${
                  activeTab === tab.key ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "OVERVIEW" ? (
          <OverviewTab
            clubId={clubId}
            center={center}
            selectedTermId={selectedTermId}
            onSelectTerm={setSelectedTermId}
            onCarryoverToggle={async (item) => {
              const result = await carryoverMutation.mutateAsync({
                carryoverItemId: item.clubTermCarryoverItemId,
                resolved: item.statusCode !== "RESOLVED",
              });
              await reportResult(result, item.statusCode === "RESOLVED" ? "이관 항목을 다시 열었습니다." : "이관 항목을 완료했습니다.");
            }}
            carryoverPendingId={carryoverMutation.isPending ? carryoverMutation.variables?.carryoverItemId ?? null : null}
          />
        ) : null}

        {activeTab === "TERMS" ? (
          <TermsTab
            terms={center.terms}
            canManage={center.canManage}
            showForm={showTermForm}
            editingTermId={editingTermId}
            form={termForm}
            pending={createTermMutation.isPending || updateTermMutation.isPending || activateTermMutation.isPending || closeTermMutation.isPending}
            onFormChange={setTermForm}
            onSubmit={submitTerm}
            onCreate={startCreateTerm}
            onEdit={startEditTerm}
            onCancel={() => { setShowTermForm(false); setEditingTermId(null); setTermForm(EMPTY_TERM_FORM); }}
            onActivate={activateTerm}
            onClose={closeTerm}
            onSelect={(termId) => { setSelectedTermId(termId); setActiveTab("OVERVIEW"); }}
          />
        ) : null}

        {activeTab === "EXECUTIVES" ? (
          <ExecutivesTab
            center={center}
            displayedTerm={displayedTerm}
            assignments={displayedAssignments}
            form={executiveForm}
            onFormChange={setExecutiveForm}
            onSubmit={submitExecutive}
            onDelete={async (assignmentId) => {
              if (!window.confirm("이 집행부 배정을 제거할까요?")) return;
              const result = await deleteExecutiveMutation.mutateAsync(assignmentId);
              await reportResult(result, "집행부 배정을 제거했습니다.");
            }}
            pending={executiveMutation.isPending || deleteExecutiveMutation.isPending}
          />
        ) : null}

        {activeTab === "NOTES" ? (
          <NotesTab
            center={center}
            form={noteForm}
            onFormChange={setNoteForm}
            onSubmit={submitNote}
            onAcknowledge={async (note) => {
              const result = await acknowledgeMutation.mutateAsync(note.clubHandoverNoteId);
              await reportResult(result, "인수인계 메모를 확인했습니다.");
            }}
            onDelete={async (note) => {
              if (!window.confirm(`인수인계 메모 ${note.title}을 삭제할까요?`)) return;
              const result = await deleteNoteMutation.mutateAsync(note.clubHandoverNoteId);
              await reportResult(result, "인수인계 메모를 삭제했습니다.");
            }}
            pending={createNoteMutation.isPending || acknowledgeMutation.isPending || deleteNoteMutation.isPending}
          />
        ) : null}
      </main>
    </div>
  );
}

function HeroMetric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/8 px-4 py-3">
      <p className="text-[11px] font-bold text-white/50">{label}</p>
      <p className={`mt-1 truncate text-lg font-black ${danger ? "text-orange-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function SectionTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-1">
      <div>
        <h2 className="text-base font-black text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function OverviewTab({
  clubId,
  center,
  selectedTermId,
  onSelectTerm,
  onCarryoverToggle,
  carryoverPendingId,
}: {
  clubId: string;
  center: ClubHandoverCenter;
  selectedTermId: number | null;
  onSelectTerm: (termId: number | null) => void;
  onCarryoverToggle: (item: ClubTermCarryoverItem) => void;
  carryoverPendingId: number | null;
}) {
  const metrics = center.activeTermMetrics;
  const summary = center.queueSummary;
  const metricItems = [
    { label: "임기 업무", value: metrics.todoCount, icon: "task_alt" },
    { label: "일정", value: metrics.scheduleCount, icon: "calendar_month" },
    { label: "대회", value: metrics.tournamentCount, icon: "emoji_events" },
    { label: "회비 발행", value: metrics.financeObligationCount, icon: "request_quote" },
  ];
  const queueMetrics = [
    { label: "미완료 업무", value: summary.openTodoCount, detail: summary.overdueTodoCount > 0 ? `지연 ${summary.overdueTodoCount}` : null },
    { label: "미납 회비", value: summary.unpaidPaymentCount, detail: null },
    { label: "정산 검토", value: summary.pendingFinanceRequestCount, detail: null },
    { label: "피드백", value: summary.openFeedbackCount, detail: null },
    { label: "가입 신청", value: summary.pendingJoinRequestCount, detail: null },
    { label: "인계 메모", value: summary.openHandoverNoteCount, detail: null },
  ];

  return (
    <div className="mt-6 space-y-7">
      <section>
        <SectionTitle title="임기별 운영 지표" description="마감일과 실제 발생일을 기준으로 선택한 임기의 운영량을 집계합니다." />
        <label className="block text-xs font-bold text-slate-500" htmlFor="handover-term-filter">조회 임기</label>
        <select
          id="handover-term-filter"
          value={selectedTermId ?? ""}
          onChange={(event) => onSelectTerm(event.target.value ? Number(event.target.value) : null)}
          className={`${fieldClassName} mt-2`}
        >
          <option value="">현재 또는 다음 임기</option>
          {center.terms.map((term) => <option key={term.clubOperatingTermId} value={term.clubOperatingTermId}>{term.termName}</option>)}
        </select>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {metricItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="material-symbols-outlined text-[20px] text-orange-500" aria-hidden="true">{item.icon}</span>
              <p className="mt-3 text-xs font-bold text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">임기 지출 합계</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(metrics.financeExpenseAmount, metrics.currencyCode)}</p>
          <p className="mt-1 text-xs text-slate-400">정산 요청 {metrics.financeRequestCount}건 포함</p>
        </div>
      </section>

      <section>
        <SectionTitle title="인수인계 작업 큐" description="현재 운영에서 놓치면 안 되는 항목을 기능별로 모았습니다." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {queueMetrics.map((item) => (
            <div key={item.label} className={`rounded-2xl border p-4 ${item.value > 0 ? "border-orange-200 bg-orange-50/60" : "border-slate-200 bg-white"}`}>
              <p className="text-xs font-bold text-slate-500">{item.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-xl font-black text-slate-900">{item.value}</p>
                {item.detail ? <span className="text-[11px] font-bold text-rose-600">{item.detail}</span> : null}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {center.queueItems.length > 0 ? center.queueItems.map((item) => (
            <QueueItemCard key={`${item.resourceType}-${item.resourceId ?? item.title}`} item={item} />
          )) : (
            <EmptyState icon="task_alt" title="현재 처리할 운영 항목이 없습니다." description="새로운 대기 항목이 생기면 이곳에 표시됩니다." />
          )}
        </div>
      </section>

      <section>
        <SectionTitle title="임기 이관 항목" description="새 임기를 시작할 때 미완료 업무·정산·피드백을 자동으로 고정해 추적합니다." />
        <div className="space-y-2">
          {center.carryoverItems.length > 0 ? center.carryoverItems.map((item) => (
            <CarryoverCard key={item.clubTermCarryoverItemId} item={item} pending={carryoverPendingId === item.clubTermCarryoverItemId} onToggle={onCarryoverToggle} />
          )) : (
            <EmptyState icon="move_down" title="선택한 임기에 이관된 항목이 없습니다." description="임기 전환 시 남아 있던 운영 항목이 자동으로 기록됩니다." />
          )}
        </div>
      </section>

      <RouterLink href={`/clubs/${clubId}/admin/logs`} className="flex min-h-12 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm">
        <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-orange-500" aria-hidden="true">history</span>운영 감사 로그 확인</span>
        <span className="material-symbols-outlined text-[20px] text-slate-400" aria-hidden="true">chevron_right</span>
      </RouterLink>
    </div>
  );
}

function QueueItemCard({ item }: { item: HandoverQueueItem }) {
  return (
    <RouterLink href={item.targetPath} className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-orange-200">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.urgent ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{item.urgent ? "priority_high" : "arrow_outward"}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-slate-800">{item.title}</span>
        <span className="mt-1 block text-xs text-slate-500">{item.statusLabel}{item.dueAt ? ` · ${formatDateTime(item.dueAt)}` : ""}</span>
      </span>
      <span className="material-symbols-outlined text-[20px] text-slate-300" aria-hidden="true">chevron_right</span>
    </RouterLink>
  );
}

function CarryoverCard({ item, pending, onToggle }: { item: ClubTermCarryoverItem; pending: boolean; onToggle: (item: ClubTermCarryoverItem) => void }) {
  const resolved = item.statusCode === "RESOLVED";
  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-sm ${resolved ? "border-slate-200 opacity-70" : "border-orange-200"}`}>
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${resolved ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{resolved ? "done" : "move_down"}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-black ${resolved ? "text-slate-500 line-through" : "text-slate-900"}`}>{item.title}</p>
          <p className="mt-1 text-xs text-slate-500">{item.fromTermName ?? "이전 임기"} → {item.toTermName ?? "다음 임기"} · {item.statusSnapshot}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <RouterLink href={item.targetPath} className="flex min-h-10 flex-1 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700">원본 열기</RouterLink>
        <button type="button" disabled={pending} onClick={() => onToggle(item)} className="min-h-10 flex-1 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white disabled:opacity-50">
          {resolved ? "다시 열기" : "인계 완료"}
        </button>
      </div>
    </article>
  );
}

function TermsTab({ terms, canManage, showForm, editingTermId, form, pending, onFormChange, onSubmit, onCreate, onEdit, onCancel, onActivate, onClose, onSelect }: {
  terms: ClubOperatingTerm[];
  canManage: boolean;
  showForm: boolean;
  editingTermId: number | null;
  form: UpsertOperatingTermRequest;
  pending: boolean;
  onFormChange: (value: UpsertOperatingTermRequest) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCreate: () => void;
  onEdit: (term: ClubOperatingTerm) => void;
  onCancel: () => void;
  onActivate: (term: ClubOperatingTerm) => void;
  onClose: (term: ClubOperatingTerm) => void;
  onSelect: (termId: number) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <SectionTitle title="운영 임기" description="연도·학기·시즌을 같은 구조로 관리하고 집행부 스냅샷을 보존합니다." action={canManage && !showForm ? <button type="button" onClick={onCreate} className="min-h-10 rounded-xl bg-orange-500 px-3 text-xs font-bold text-white">임기 추가</button> : null} />
      {showForm ? (
        <form onSubmit={onSubmit} className="rounded-[26px] border border-orange-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-black">{editingTermId == null ? "새 운영 임기" : "운영 임기 수정"}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="임기 이름"><input aria-label="임기 이름" required maxLength={100} value={form.termName} onChange={(event) => onFormChange({ ...form, termName: event.target.value })} className={fieldClassName} placeholder="예: 2026년 2학기" /></FormField>
            <FormField label="임기 유형"><select aria-label="임기 유형" value={form.termType} onChange={(event) => onFormChange({ ...form, termType: event.target.value as OperatingTermType })} className={fieldClassName}>{TERM_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></FormField>
            <FormField label="시작일"><input aria-label="임기 시작일" required type="date" value={form.startDate} onChange={(event) => onFormChange({ ...form, startDate: event.target.value })} className={fieldClassName} /></FormField>
            <FormField label="종료일"><input aria-label="임기 종료일" required type="date" value={form.endDate} onChange={(event) => onFormChange({ ...form, endDate: event.target.value })} className={fieldClassName} /></FormField>
          </div>
          <div className="mt-4"><FormField label="운영 목표와 설명"><textarea aria-label="운영 목표와 설명" rows={3} maxLength={1000} value={form.description ?? ""} onChange={(event) => onFormChange({ ...form, description: event.target.value })} className={textareaClassName} placeholder="이 임기의 목표, 운영 범위와 특이사항" /></FormField></div>
          <div className="mt-4 flex gap-2"><button type="button" onClick={onCancel} className="min-h-11 flex-1 rounded-2xl bg-slate-100 text-sm font-bold text-slate-700">취소</button><button type="submit" disabled={pending} className="min-h-11 flex-1 rounded-2xl bg-orange-500 text-sm font-bold text-white disabled:opacity-50">{editingTermId == null ? "임기 만들기" : "수정 저장"}</button></div>
        </form>
      ) : null}
      <div className="space-y-3">
        {terms.length > 0 ? terms.map((term) => (
          <article key={term.clubOperatingTermId} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-lg font-black">{term.termName}</h3><p className="mt-1 text-xs text-slate-500">{formatDate(term.startDate)} – {formatDate(term.endDate)}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${termStatusClass(term.statusCode)}`}>{termStatusLabel(term.statusCode)}</span></div>
            {term.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{term.description}</p> : null}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
              <button type="button" onClick={() => onSelect(term.clubOperatingTermId)} className="min-h-10 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700">운영 현황</button>
              {canManage && term.statusCode !== "CLOSED" ? <button type="button" onClick={() => onEdit(term)} className="min-h-10 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700">수정</button> : null}
              {canManage && term.statusCode === "PLANNED" ? <button type="button" disabled={pending} onClick={() => void onActivate(term)} className="min-h-10 rounded-xl bg-orange-500 px-3 text-xs font-bold text-white disabled:opacity-50">임기 시작</button> : null}
              {canManage && term.statusCode === "ACTIVE" ? <button type="button" disabled={pending} onClick={() => void onClose(term)} className="min-h-10 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white disabled:opacity-50">임기 종료</button> : null}
            </div>
          </article>
        )) : <EmptyState icon="date_range" title="등록된 운영 임기가 없습니다." description="첫 임기를 만들면 기간별 집행부와 운영 지표를 보존할 수 있습니다." />}
      </div>
    </div>
  );
}

function ExecutivesTab({ center, displayedTerm, assignments, form, onFormChange, onSubmit, onDelete, pending }: {
  center: ClubHandoverCenter;
  displayedTerm: ClubOperatingTerm | null;
  assignments: ClubExecutiveAssignment[];
  form: { memberId: string; positionId: string; responsibility: string };
  onFormChange: (value: { memberId: string; positionId: string; responsibility: string }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (assignmentId: number) => void;
  pending: boolean;
}) {
  const editable = center.canManage && displayedTerm?.statusCode !== "CLOSED";
  return (
    <div className="mt-6 space-y-5">
      <SectionTitle title="집행부 구성" description={`${displayedTerm?.termName ?? "선택한 임기 없음"} 기준의 책임과 담당자를 보존합니다. 이 명단 자체는 실제 권한을 부여하지 않습니다.`} />
      {editable ? (
        <form onSubmit={onSubmit} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black">집행부 멤버 추가 또는 책임 수정</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="멤버"><select aria-label="집행부 멤버" required value={form.memberId} onChange={(event) => onFormChange({ ...form, memberId: event.target.value })} className={fieldClassName}><option value="">멤버 선택</option>{center.memberOptions.map((item) => <option key={item.clubMemberId} value={item.clubMemberId}>{item.displayName}</option>)}</select></FormField>
            <FormField label="직책"><select aria-label="집행부 직책" required value={form.positionId} onChange={(event) => onFormChange({ ...form, positionId: event.target.value })} className={fieldClassName}><option value="">직책 선택</option>{center.positionOptions.map((item) => <option key={item.clubPositionId} value={item.clubPositionId}>{item.displayName}</option>)}</select></FormField>
          </div>
          <div className="mt-4"><FormField label="이 임기의 책임"><textarea aria-label="집행부 책임" rows={3} maxLength={1000} value={form.responsibility} onChange={(event) => onFormChange({ ...form, responsibility: event.target.value })} className={textareaClassName} placeholder="담당 업무, 정기 보고와 인계 기준" /></FormField></div>
          <button type="submit" disabled={pending} className="mt-4 min-h-11 w-full rounded-2xl bg-orange-500 text-sm font-bold text-white disabled:opacity-50">집행부 구성 저장</button>
        </form>
      ) : null}
      <div className="space-y-3">
        {assignments.length > 0 ? assignments.map((assignment) => (
          <article key={assignment.clubTermExecutiveAssignmentId} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">{initials(assignment.memberDisplayName)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-black">{assignment.memberDisplayName}</h3><span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">{assignment.positionDisplayName}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{assignment.responsibility ?? "직책 설명을 바탕으로 책임 범위를 작성해주세요."}</p></div></div>
            {editable ? <button type="button" disabled={pending} onClick={() => onDelete(assignment.clubTermExecutiveAssignmentId)} className="mt-4 min-h-10 w-full rounded-xl bg-slate-100 text-xs font-bold text-slate-600 disabled:opacity-50">배정 제거</button> : null}
          </article>
        )) : <EmptyState icon="groups" title="이 임기에 등록된 집행부가 없습니다." description="임기를 시작하면 현재 직책 배정을 초기 집행부 스냅샷으로 가져옵니다." />}
      </div>
      <p className="rounded-2xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">실제 기능 권한은 조직·권한 화면의 현재 직책 배정에서 관리합니다. 임기 집행부는 계획과 이력 보존을 위한 스냅샷입니다.</p>
    </div>
  );
}

function NotesTab({ center, form, onFormChange, onSubmit, onAcknowledge, onDelete, pending }: {
  center: ClubHandoverCenter;
  form: { title: string; content: string; assignedProfileId: string; positionId: string; dueAt: string; ready: boolean };
  onFormChange: (value: { title: string; content: string; assignedProfileId: string; positionId: string; dueAt: string; ready: boolean }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAcknowledge: (note: ClubHandoverNote) => void;
  onDelete: (note: ClubHandoverNote) => void;
  pending: boolean;
}) {
  return (
    <div className="mt-6 space-y-5">
      <SectionTitle title="다음 담당자 메모" description="역할별 책임, 주의사항과 후속 작업을 지정된 담당자에게 전달합니다." />
      {center.canManage ? (
        <form onSubmit={onSubmit} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2"><FormField label="제목"><input aria-label="인수인계 제목" required maxLength={200} value={form.title} onChange={(event) => onFormChange({ ...form, title: event.target.value })} className={fieldClassName} placeholder="예: 월 회비 마감 절차" /></FormField><FormField label="담당 직책"><select aria-label="인수인계 담당 직책" value={form.positionId} onChange={(event) => onFormChange({ ...form, positionId: event.target.value })} className={fieldClassName}><option value="">직책 미지정</option>{center.positionOptions.map((item) => <option key={item.clubPositionId} value={item.clubPositionId}>{item.displayName}</option>)}</select></FormField><FormField label="다음 담당자"><select aria-label="인수인계 다음 담당자" value={form.assignedProfileId} onChange={(event) => onFormChange({ ...form, assignedProfileId: event.target.value })} className={fieldClassName}><option value="">담당자 미지정</option>{center.memberOptions.map((item) => <option key={item.clubProfileId} value={item.clubProfileId}>{item.displayName}</option>)}</select></FormField><FormField label="확인 기한"><input aria-label="인수인계 확인 기한" type="datetime-local" value={form.dueAt} onChange={(event) => onFormChange({ ...form, dueAt: event.target.value })} className={fieldClassName} /></FormField></div>
          <div className="mt-4"><FormField label="인계 내용"><textarea aria-label="인수인계 내용" required rows={5} maxLength={10000} value={form.content} onChange={(event) => onFormChange({ ...form, content: event.target.value })} className={textareaClassName} placeholder="진행 방법, 계정·문서 위치, 예외 상황과 다음 행동을 구체적으로 적어주세요." /></FormField></div>
          <label className="mt-4 flex min-h-11 items-center gap-3 rounded-2xl bg-slate-50 px-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.ready} onChange={(event) => onFormChange({ ...form, ready: event.target.checked })} className="size-4 accent-orange-500" />작성 즉시 인계 준비 상태로 표시</label>
          <button type="submit" disabled={pending} className="mt-4 min-h-11 w-full rounded-2xl bg-orange-500 text-sm font-bold text-white disabled:opacity-50">인수인계 메모 저장</button>
        </form>
      ) : null}
      <div className="space-y-3">{center.handoverNotes.length > 0 ? center.handoverNotes.map((note) => <HandoverNoteCard key={note.clubHandoverNoteId} clubId={String(center.clubId)} note={note} canManage={center.canManage} canAcknowledge={center.canManage || note.assignedClubProfileId === center.viewerClubProfileId} pending={pending} onAcknowledge={onAcknowledge} onDelete={onDelete} />) : <EmptyState icon="assignment" title="작성된 인수인계 메모가 없습니다." description="다음 담당자가 그대로 실행할 수 있을 만큼 구체적인 메모를 남겨보세요." />}</div>
    </div>
  );
}

function HandoverNoteCard({ clubId, note, canManage, canAcknowledge, pending, onAcknowledge, onDelete }: { clubId: string; note: ClubHandoverNote; canManage: boolean; canAcknowledge: boolean; pending: boolean; onAcknowledge: (note: ClubHandoverNote) => void; onDelete: (note: ClubHandoverNote) => void }) {
  const acknowledged = note.statusCode === "ACKNOWLEDGED";
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap gap-2">{note.positionDisplayName ? <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">{note.positionDisplayName}</span> : null}<span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${acknowledged ? "bg-emerald-50 text-emerald-700" : note.statusCode === "READY" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{acknowledged ? "확인 완료" : note.statusCode === "READY" ? "인계 준비" : "초안"}</span></div><h3 className="mt-3 text-base font-black">{note.title}</h3></div>{note.dueAt ? <span className="shrink-0 text-[11px] font-bold text-slate-400">{formatDateTime(note.dueAt)}</span> : null}</div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{note.content}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span>작성 {note.createdByDisplayName}</span>{note.assignedMemberDisplayName ? <span>인계 대상 {note.assignedMemberDisplayName}</span> : null}<span>{note.fromTermName ?? "현재"} → {note.toTermName ?? "다음 임기 미정"}</span></div>
      <button type="button" onClick={() => setAttachmentsOpen((current) => !current)} aria-expanded={attachmentsOpen} className="mt-4 flex min-h-10 w-full items-center justify-between rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[17px]" aria-hidden="true">attach_file</span>관련 문서</span>
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{attachmentsOpen ? "expand_less" : "expand_more"}</span>
      </button>
      {attachmentsOpen ? <div className="mt-3"><ResourceAttachmentPanel clubId={clubId} resourceType="HANDOVER_NOTE" resourceId={note.clubHandoverNoteId} canUpload={canManage} canDelete={canManage} theme="admin" /></div> : null}
      <div className="mt-4 flex gap-2">{!acknowledged && canAcknowledge ? <button type="button" disabled={pending} onClick={() => onAcknowledge(note)} className="min-h-10 flex-1 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white disabled:opacity-50">확인 완료</button> : null}{canManage ? <button type="button" disabled={pending} onClick={() => onDelete(note)} className="min-h-10 flex-1 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600 disabled:opacity-50">삭제</button> : null}</div>
    </article>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-slate-600"><span className="mb-2 block">{label}</span>{children}</label>;
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-5 py-8 text-center"><span className="material-symbols-outlined text-[32px] text-slate-300" aria-hidden="true">{icon}</span><p className="mt-3 text-sm font-black text-slate-700">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{description}</p></div>;
}
