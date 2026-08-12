"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubRouteErrorState, ClubRouteLoadingState } from "@/app/components/ClubRouteState";
import { DecisionRecordCard } from "@/app/components/DecisionRecordCard";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/modals/ScheduleActionConfirmModal";
import { useAppToast } from "@/app/hooks/useAppToast";
import { clubQueryKeys } from "@/app/lib/react-query/club/queries";
import {
  archiveDecisionRecordMutationOptions,
  confirmDecisionRecordMutationOptions,
  createDecisionRecordMutationOptions,
  deleteDecisionDraftMutationOptions,
  updateDecisionRecordMutationOptions,
} from "@/app/lib/react-query/decision/mutations";
import { adminDecisionCenterQueryOptions, decisionQueryKeys } from "@/app/lib/react-query/decision/queries";
import type { DecisionRecord, UpsertDecisionRecordRequest } from "@/app/lib/semo/decision";

import { DecisionRecordEditor, type DecisionEditorDraft } from "./DecisionRecordEditor";

type StatusFilter = "ACTIVE" | "DRAFT" | "CONFIRMED" | "HISTORY";
type DecisionConfirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "danger" | "primary";
  iconName: string;
  run: () => Promise<void>;
};

const EMPTY_DRAFT: DecisionEditorDraft = {
  recordType: "DECISION",
  visibilityScope: "OPERATORS",
  title: "",
  decisionContent: "",
  backgroundContext: "",
  rationale: "",
  meetingDate: "",
  meetingTime: "",
  effectiveDate: "",
  reviewDate: "",
  clubOperatingTermId: "",
  supersedesDecisionRecordId: "",
  deciderClubProfileIds: [],
  participantClubProfileIds: [],
  relatedResourceKeys: [],
  followUpTodoItemIds: [],
};

function toEditorDraft(record: DecisionRecord): DecisionEditorDraft {
  const relatedResourceKeys = record.resourceLinks
    .filter((item) => item.relationType !== "FOLLOW_UP")
    .map((item) => `${item.resourceType}:${item.resourceId}`);
  const followUpTodoItemIds = record.resourceLinks
    .filter((item) => item.relationType === "FOLLOW_UP" && item.resourceType === "TODO_ITEM")
    .map((item) => item.resourceId);
  return {
    recordType: record.recordType === "MEETING_MINUTES" ? "MEETING_MINUTES" : "DECISION",
    visibilityScope: record.visibilityScope === "MEMBERS" ? "MEMBERS" : "OPERATORS",
    title: record.title,
    decisionContent: record.decisionContent,
    backgroundContext: record.backgroundContext ?? "",
    rationale: record.rationale ?? "",
    meetingDate: record.meetingAt?.slice(0, 10) ?? "",
    meetingTime: record.meetingAt?.slice(11, 16) ?? "",
    effectiveDate: record.effectiveDate ?? "",
    reviewDate: record.reviewDate ?? "",
    clubOperatingTermId: record.clubOperatingTermId == null ? "" : String(record.clubOperatingTermId),
    supersedesDecisionRecordId: record.supersedesDecisionRecordId == null ? "" : String(record.supersedesDecisionRecordId),
    deciderClubProfileIds: record.participants.filter((item) => item.participantRole === "DECIDER").map((item) => item.clubProfileId),
    participantClubProfileIds: record.participants.filter((item) => item.participantRole !== "DECIDER").map((item) => item.clubProfileId),
    relatedResourceKeys,
    followUpTodoItemIds,
  };
}

export function ClubDecisionAdminClient({ clubId }: { clubId: string }) {
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DecisionEditorDraft>(EMPTY_DRAFT);
  const [confirmation, setConfirmation] = useState<DecisionConfirmation | null>(null);
  const centerQuery = useQuery(adminDecisionCenterQueryOptions(clubId));
  const center = centerQuery.data ?? null;
  const createMutation = useMutation(createDecisionRecordMutationOptions(clubId));
  const updateMutation = useMutation(updateDecisionRecordMutationOptions(clubId));
  const confirmMutation = useMutation(confirmDecisionRecordMutationOptions(clubId));
  const archiveMutation = useMutation(archiveDecisionRecordMutationOptions(clubId));
  const deleteMutation = useMutation(deleteDecisionDraftMutationOptions(clubId));
  const pending = createMutation.isPending || updateMutation.isPending || confirmMutation.isPending || archiveMutation.isPending || deleteMutation.isPending;

  const records = useMemo(() => center?.records.filter((record) => {
    if (statusFilter === "DRAFT") return record.statusCode === "DRAFT";
    if (statusFilter === "CONFIRMED") return record.statusCode === "CONFIRMED";
    if (statusFilter === "HISTORY") return ["SUPERSEDED", "ARCHIVED"].includes(record.statusCode);
    return ["DRAFT", "CONFIRMED"].includes(record.statusCode);
  }) ?? [], [center?.records, statusFilter]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: decisionQueryKeys.all(clubId) }),
      queryClient.invalidateQueries({ queryKey: clubQueryKeys.moreSummary(clubId) }),
    ]);
  };

  const reportResult = async (result: { ok: boolean; message?: string }, message: string) => {
    if (!result.ok) {
      showToast(result.message ?? "요청을 처리하지 못했습니다.", "error");
      return false;
    }
    await refresh();
    showToast(message, "success");
    return true;
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingRecordId(null);
    setDraft(EMPTY_DRAFT);
  };

  const startCreate = () => {
    const activeTerm = center?.termOptions.find((term) => term.statusCode === "ACTIVE");
    setEditingRecordId(null);
    setDraft({ ...EMPTY_DRAFT, clubOperatingTermId: activeTerm ? String(activeTerm.clubOperatingTermId) : "" });
    setEditorOpen(true);
    window.requestAnimationFrame(() => document.getElementById("decision-record-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const startEdit = (record: DecisionRecord) => {
    setEditingRecordId(record.decisionRecordId);
    setDraft(toEditorDraft(record));
    setEditorOpen(true);
    window.requestAnimationFrame(() => document.getElementById("decision-record-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const submitDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.recordType === "MEETING_MINUTES" && (!draft.meetingDate || !draft.meetingTime)) {
      showToast("회의 날짜와 시간을 모두 선택해주세요.", "error");
      return;
    }
    if (draft.deciderClubProfileIds.length === 0) {
      showToast("결정자를 한 명 이상 선택해주세요.", "error");
      return;
    }
    const relatedResources = draft.relatedResourceKeys.map((key) => {
      const separator = key.lastIndexOf(":");
      return { resourceType: key.slice(0, separator), resourceId: Number(key.slice(separator + 1)) };
    });
    const request: UpsertDecisionRecordRequest = {
      recordType: draft.recordType,
      visibilityScope: draft.visibilityScope,
      title: draft.title,
      decisionContent: draft.decisionContent,
      backgroundContext: draft.backgroundContext || null,
      rationale: draft.rationale || null,
      meetingAt: draft.recordType === "MEETING_MINUTES" ? `${draft.meetingDate}T${draft.meetingTime}:00` : null,
      effectiveDate: draft.effectiveDate || null,
      reviewDate: draft.reviewDate || null,
      clubOperatingTermId: draft.clubOperatingTermId ? Number(draft.clubOperatingTermId) : null,
      supersedesDecisionRecordId: draft.supersedesDecisionRecordId ? Number(draft.supersedesDecisionRecordId) : null,
      deciderClubProfileIds: draft.deciderClubProfileIds,
      participantClubProfileIds: draft.participantClubProfileIds,
      relatedResources,
      followUpTodoItemIds: draft.followUpTodoItemIds,
    };
    const result = editingRecordId == null
      ? await createMutation.mutateAsync(request)
      : await updateMutation.mutateAsync({ decisionRecordId: editingRecordId, request });
    if (await reportResult(result, editingRecordId == null ? "회의록·결정 초안을 저장했습니다." : "회의록·결정 초안을 수정했습니다.")) closeEditor();
  };

  if (centerQuery.isError && !center) {
    return <ClubRouteErrorState title="회의록·결정" message="회의록과 운영 결정 정보를 불러오지 못했습니다." backHref={`/clubs/${clubId}/admin/more`} theme="admin" onRetry={() => void centerQuery.refetch()} />;
  }
  if (!center) return <ClubRouteLoadingState title="회의록·결정 운영 센터를 준비하고 있습니다" theme="admin" />;

  return (
    <div className="min-h-screen bg-[var(--background-light)] text-slate-900">
      <ClubPageHeader title="회의록·결정" subtitle={center.clubName} icon="gavel" theme="admin" />
      <main className="semo-nav-bottom-space semo-page-admin px-4 py-5">
        <section className="rounded-[30px] bg-slate-950 p-5 text-white shadow-lg shadow-slate-200/70">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-white/55">운영의 이유를 보존합니다</p><h1 className="mt-2 text-2xl font-black tracking-tight">회의에서 실행까지</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">결정자와 참여자, 판단 근거, 관련 운영 항목, 후속 업무와 재검토 시점을 한 기록으로 연결합니다.</p></div><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10"><span className="material-symbols-outlined text-[27px]" aria-hidden="true">history_edu</span></span></div>
          <div className="mt-5 grid grid-cols-3 gap-2"><HeroMetric label="초안" value={center.draftCount} /><HeroMetric label="확정" value={center.confirmedCount} /><HeroMetric label="검토 필요" value={center.reviewDueCount} danger={center.reviewDueCount > 0} /></div>
        </section>

        <div className="mt-4 flex items-end justify-between gap-3"><div><h2 className="text-base font-black">운영 기록</h2><p className="mt-1 text-xs text-slate-500">확정된 기록은 수정하지 않고 새 결정으로 대체합니다.</p></div>{center.canManage && !editorOpen ? <button type="button" onClick={startCreate} className="min-h-11 shrink-0 rounded-2xl bg-indigo-600 px-4 text-xs font-bold text-white">새 기록</button> : null}</div>

        <div className="mt-4 grid grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {([ ["ACTIVE", "진행"], ["DRAFT", "초안"], ["CONFIRMED", "확정"], ["HISTORY", "이력"] ] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)} className={`min-h-11 rounded-xl px-1 text-xs font-bold ${statusFilter === key ? "bg-indigo-600 text-white" : "text-slate-500"}`}>{label}</button>)}
        </div>

        {editorOpen ? <div className="mt-5"><DecisionRecordEditor center={center} draft={draft} editing={editingRecordId != null} pending={pending} onChange={setDraft} onSubmit={submitDraft} onCancel={closeEditor} /></div> : null}

        <section className="mt-6 space-y-3">
          {records.length > 0 ? records.map((record) => <DecisionRecordCard
            key={record.decisionRecordId}
            clubId={clubId}
            record={record}
            canManage={center.canManage}
            pending={pending}
            onEdit={startEdit}
            onConfirm={(target) => {
              setConfirmation({
                title: "기록을 확정할까요?",
                description: `확정 후에는 내용을 직접 수정할 수 없습니다. 대상 기록: ${target.title}${target.supersedesDecisionTitle ? ` · 이전 결정: ${target.supersedesDecisionTitle}` : ""}`,
                confirmLabel: "기록 확정",
                tone: "primary",
                iconName: "verified",
                run: async () => {
                  const result = await confirmMutation.mutateAsync(target.decisionRecordId);
                  await reportResult(result, "회의록·결정을 확정했습니다.");
                },
              });
            }}
            onArchive={(target) => {
              setConfirmation({
                title: "기록을 보관할까요?",
                description: `활성 기록 목록에서 이력으로 이동합니다. 대상 기록: ${target.title}`,
                confirmLabel: "기록 보관",
                tone: "danger",
                iconName: "archive",
                run: async () => {
                  const result = await archiveMutation.mutateAsync(target.decisionRecordId);
                  await reportResult(result, "회의록·결정을 보관했습니다.");
                },
              });
            }}
            onDelete={(target) => {
              setConfirmation({
                title: "초안을 삭제할까요?",
                description: `저장한 초안이 삭제됩니다. 대상 기록: ${target.title}`,
                confirmLabel: "초안 삭제",
                tone: "danger",
                iconName: "delete",
                run: async () => {
                  const result = await deleteMutation.mutateAsync(target.decisionRecordId);
                  await reportResult(result, "회의록·결정 초안을 삭제했습니다.");
                },
              });
            }}
          />) : <div className="rounded-[26px] border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><span className="material-symbols-outlined text-[34px] text-slate-300" aria-hidden="true">history_edu</span><p className="mt-3 text-sm font-black text-slate-700">조건에 맞는 기록이 없습니다.</p><p className="mt-1 text-xs leading-5 text-slate-400">새 기록에서 회의 배경과 결정 내용을 초안으로 남겨보세요.</p></div>}
        </section>
      </main>
      {confirmation ? (
        <ScheduleActionConfirmModal
          title={confirmation.title}
          description={confirmation.description}
          confirmLabel={confirmation.confirmLabel}
          busyLabel="처리 중..."
          busy={pending}
          iconName={confirmation.iconName}
          tone={confirmation.tone}
          onCancel={() => { if (!pending) setConfirmation(null); }}
          onConfirm={() => {
            void confirmation.run().finally(() => setConfirmation(null));
          }}
        />
      ) : null}
    </div>
  );
}

function HeroMetric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <div className="rounded-2xl bg-white/8 px-3 py-3"><p className="text-[11px] font-bold text-white/50">{label}</p><p className={`mt-1 text-xl font-black ${danger ? "text-rose-300" : "text-white"}`}>{value}</p></div>;
}
