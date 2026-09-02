"use client";

import { useState } from "react";

import { ResourceAttachmentPanel } from "@/app/components/ResourceAttachmentPanel";
import { RouterLink } from "@/app/components/RouterLink";
import type { DecisionRecord } from "@/app/lib/semo/decision";

type DecisionRecordCardProps = {
  clubId: string;
  record: DecisionRecord;
  canManage?: boolean;
  pending?: boolean;
  onEdit?: (record: DecisionRecord) => void;
  onConfirm?: (record: DecisionRecord) => void;
  onArchive?: (record: DecisionRecord) => void;
  onDelete?: (record: DecisionRecord) => void;
};

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value.length === 10 ? `${value}T00:00:00` : value}`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusMeta(statusCode: string) {
  switch (statusCode) {
    case "DRAFT":
      return { label: "초안", className: "bg-amber-50 text-amber-700" };
    case "CONFIRMED":
      return { label: "확정", className: "bg-emerald-50 text-emerald-700" };
    case "SUPERSEDED":
      return { label: "대체됨", className: "bg-slate-100 text-slate-500" };
    default:
      return { label: "보관", className: "bg-slate-100 text-slate-500" };
  }
}

function resourceTypeLabel(resourceType: string) {
  switch (resourceType) {
    case "SCHEDULE_EVENT": return "일정";
    case "TODO_ITEM": return "업무";
    case "FINANCE_REQUEST": return "정산";
    case "FINANCE_OBLIGATION": return "회비";
    case "TOURNAMENT": return "대회";
    default: return "관련 항목";
  }
}

export function DecisionRecordCard({
  clubId,
  record,
  canManage = false,
  pending = false,
  onEdit,
  onConfirm,
  onArchive,
  onDelete,
}: DecisionRecordCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const status = statusMeta(record.statusCode);
  const deciders = record.participants.filter((item) => item.participantRole === "DECIDER");
  const participants = record.participants.filter((item) => item.participantRole !== "DECIDER");
  const related = record.resourceLinks.filter((item) => item.relationType !== "FOLLOW_UP");
  const followUps = record.resourceLinks.filter((item) => item.relationType === "FOLLOW_UP");
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const reviewDue = record.statusCode === "CONFIRMED"
    && Boolean(record.reviewDate)
    && record.reviewDate! <= todayValue;
  const draft = record.statusCode === "DRAFT";

  return (
    <article className={`rounded-[var(--radius-modal)] border bg-white p-5 shadow-sm ${reviewDue ? "border-rose-200" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--primary)]/8 px-2.5 py-1 text-xs font-bold text-[var(--primary)]">
              {record.recordType === "MEETING_MINUTES" ? "회의록" : "운영 결정"}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
              {record.visibilityScope === "MEMBERS" ? "멤버 공개" : "운영진 공개"}
            </span>
            {reviewDue ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">검토 필요</span> : null}
          </div>
          <h2 className="mt-3 text-lg font-black leading-7 text-slate-900">{record.title}</h2>
          <p className="mt-2 text-xs text-slate-400">
            {record.operatingTermName ? `${record.operatingTermName} · ` : ""}
            {record.confirmedAt ? `확정 ${formatDateTime(record.confirmedAt)}` : `작성 ${record.createdByDisplayName}`}
          </p>
        </div>
        <span className="material-symbols-outlined shrink-0 text-[24px] text-[var(--primary)]/45" aria-hidden="true">
          {record.recordType === "MEETING_MINUTES" ? "meeting_room" : "gavel"}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
        <p className="text-xs font-bold text-slate-400">결정·합의 내용</p>
        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{record.decisionContent}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <InfoCell label="시행일" value={formatDate(record.effectiveDate) ?? "미정"} />
        <InfoCell label="검토일" value={formatDate(record.reviewDate) ?? "미정"} danger={reviewDue} />
        {record.meetingAt ? <InfoCell label="회의 일시" value={formatDateTime(record.meetingAt) ?? "미정"} /> : null}
        <InfoCell label="결정자" value={deciders.map((item) => item.displayName).join(", ") || "미지정"} />
      </div>

      {record.supersedesDecisionTitle ? (
        <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          이전 결정 <strong>{record.supersedesDecisionTitle}</strong>을 대체합니다.
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setDetailsOpen((current) => !current)}
        aria-expanded={detailsOpen}
        className="mt-4 flex min-h-11 w-full items-center justify-between rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-600"
      >
        <span>배경·이유와 연결 항목</span>
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{detailsOpen ? "expand_less" : "expand_more"}</span>
      </button>

      {detailsOpen ? (
        <div className="mt-3 space-y-4 rounded-2xl border border-slate-100 px-4 py-4">
          <DetailText label="배경" value={record.backgroundContext} empty="기록된 배경이 없습니다." />
          <DetailText label="결정 이유" value={record.rationale} empty="기록된 결정 이유가 없습니다." />
          {participants.length > 0 ? <DetailText label="참여자" value={participants.map((item) => item.displayName).join(", ")} /> : null}
          {related.length > 0 ? <ResourceLinks title="관련 운영 항목" links={related} /> : null}
          {followUps.length > 0 ? <ResourceLinks title="후속 업무" links={followUps} /> : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setAttachmentsOpen((current) => !current)}
        aria-expanded={attachmentsOpen}
        className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-600"
      >
        <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[17px]" aria-hidden="true">attach_file</span>첨부 자료</span>
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{attachmentsOpen ? "expand_less" : "expand_more"}</span>
      </button>
      {attachmentsOpen ? (
        <div className="mt-3">
          <ResourceAttachmentPanel
            clubId={clubId}
            resourceType="DECISION_RECORD"
            resourceId={record.decisionRecordId}
            canUpload={canManage && draft}
            canDelete={canManage && draft}
            theme={canManage ? "admin" : "user"}
          />
        </div>
      ) : null}

      {canManage ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {draft && onEdit ? <ActionButton label="수정" onClick={() => onEdit(record)} pending={pending} tone="light" /> : null}
          {draft && onConfirm ? <ActionButton label="확정" onClick={() => onConfirm(record)} pending={pending} tone="primary" /> : null}
          {onArchive && ["DRAFT", "CONFIRMED"].includes(record.statusCode) ? <ActionButton label="보관" onClick={() => onArchive(record)} pending={pending} tone="light" /> : null}
          {draft && onDelete ? <ActionButton label="삭제" onClick={() => onDelete(record)} pending={pending} tone="danger" /> : null}
        </div>
      ) : null}
    </article>
  );
}

function InfoCell({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return <div className={`min-w-0 rounded-xl px-3 py-2.5 ${danger ? "bg-rose-50" : "bg-slate-50"}`}><p className={`text-xs font-bold ${danger ? "text-rose-500" : "text-slate-400"}`}>{label}</p><p className={`mt-1 break-words font-bold ${danger ? "text-rose-700" : "text-slate-700"}`}>{value}</p></div>;
}

function DetailText({ label, value, empty }: { label: string; value?: string | null; empty?: string }) {
  return <div><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{value || empty}</p></div>;
}

function ResourceLinks({ title, links }: { title: string; links: DecisionRecord["resourceLinks"] }) {
  return <div><p className="text-xs font-bold text-slate-400">{title}</p><div className="mt-2 flex flex-wrap gap-2">{links.map((link) => <RouterLink key={`${link.relationType}-${link.resourceType}-${link.resourceId}`} href={link.targetPath} className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-control)] bg-[var(--primary)]/8 px-3 text-xs font-bold text-[var(--primary)]"><span>{resourceTypeLabel(link.resourceType)} · {link.title}</span><span className="material-symbols-outlined text-[15px]" aria-hidden="true">arrow_outward</span></RouterLink>)}</div></div>;
}

function ActionButton({ label, onClick, pending, tone }: { label: string; onClick: () => void; pending: boolean; tone: "primary" | "light" | "danger" }) {
  const toneClass = tone === "primary" ? "bg-slate-900 text-white" : tone === "danger" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600";
  return <button type="button" disabled={pending} onClick={onClick} className={`min-h-11 min-w-20 flex-1 rounded-xl px-3 text-xs font-bold disabled:opacity-50 ${toneClass}`}>{label}</button>;
}
