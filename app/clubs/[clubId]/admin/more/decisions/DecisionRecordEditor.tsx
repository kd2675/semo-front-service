"use client";

import { useDeferredValue, useMemo, useState, type FormEvent } from "react";

import { DatePopoverField } from "@/app/components/DatePopoverField";
import { TimePopoverField } from "@/app/components/TimePopoverField";
import type { ClubDecisionAdminCenter, DecisionRecordType, DecisionVisibility } from "@/app/lib/semo/decision";

export type DecisionEditorDraft = {
  recordType: DecisionRecordType;
  visibilityScope: DecisionVisibility;
  title: string;
  decisionContent: string;
  backgroundContext: string;
  rationale: string;
  meetingDate: string;
  meetingTime: string;
  effectiveDate: string;
  reviewDate: string;
  clubOperatingTermId: string;
  supersedesDecisionRecordId: string;
  deciderClubProfileIds: number[];
  participantClubProfileIds: number[];
  relatedResourceKeys: string[];
  followUpTodoItemIds: number[];
};

type DecisionRecordEditorProps = {
  center: ClubDecisionAdminCenter;
  draft: DecisionEditorDraft;
  editing: boolean;
  pending: boolean;
  onChange: (draft: DecisionEditorDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

const fieldClassName = "min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
const textareaClassName = "w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function resourceKey(resourceType: string, resourceId: number) {
  return `${resourceType}:${resourceId}`;
}

function resourceTypeLabel(resourceType: string) {
  switch (resourceType) {
    case "SCHEDULE_EVENT": return "일정";
    case "TODO_ITEM": return "업무";
    case "FINANCE_REQUEST": return "정산";
    case "FINANCE_OBLIGATION": return "회비";
    case "TOURNAMENT": return "대회";
    default: return "기타";
  }
}

export function DecisionRecordEditor({ center, draft, editing, pending, onChange, onSubmit, onCancel }: DecisionRecordEditorProps) {
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [resourceSearch, setResourceSearch] = useState("");
  const deferredSearch = useDeferredValue(resourceSearch.trim().toLowerCase());
  const resourceTypes = useMemo(
    () => Array.from(new Set(center.resourceOptions.map((item) => item.resourceType))),
    [center.resourceOptions],
  );
  const filteredResources = useMemo(
    () => center.resourceOptions.filter((item) => {
      if (resourceFilter !== "ALL" && item.resourceType !== resourceFilter) return false;
      return !deferredSearch || item.title.toLowerCase().includes(deferredSearch);
    }),
    [center.resourceOptions, deferredSearch, resourceFilter],
  );
  const todoOptions = center.resourceOptions.filter((item) => item.resourceType === "TODO_ITEM");

  const setPersonRole = (profileId: number, role: "DECIDER" | "PARTICIPANT" | "NONE") => {
    const deciderClubProfileIds = draft.deciderClubProfileIds.filter((id) => id !== profileId);
    const participantClubProfileIds = draft.participantClubProfileIds.filter((id) => id !== profileId);
    if (role === "DECIDER") deciderClubProfileIds.push(profileId);
    if (role === "PARTICIPANT") participantClubProfileIds.push(profileId);
    onChange({ ...draft, deciderClubProfileIds, participantClubProfileIds });
  };

  const toggleRelatedResource = (key: string) => {
    const selected = draft.relatedResourceKeys.includes(key);
    onChange({
      ...draft,
      relatedResourceKeys: selected
        ? draft.relatedResourceKeys.filter((item) => item !== key)
        : [...draft.relatedResourceKeys, key],
    });
  };

  const toggleFollowUp = (todoItemId: number) => {
    const selected = draft.followUpTodoItemIds.includes(todoItemId);
    onChange({
      ...draft,
      followUpTodoItemIds: selected
        ? draft.followUpTodoItemIds.filter((id) => id !== todoItemId)
        : [...draft.followUpTodoItemIds, todoItemId],
    });
  };

  return (
    <form id="decision-record-editor" onSubmit={onSubmit} className="scroll-mt-24 rounded-[28px] border border-indigo-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold text-indigo-600">{editing ? "초안 수정" : "새 기록"}</p><h2 className="mt-1 text-lg font-black text-slate-900">{editing ? "회의록·결정 내용 다듬기" : "회의의 맥락과 결론 남기기"}</h2></div>
        <button type="button" onClick={onCancel} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500" aria-label="편집기 닫기"><span className="material-symbols-outlined text-[21px]" aria-hidden="true">close</span></button>
      </div>

      <EditorSection title="기록 유형" description="회의 전체 흐름을 남길지, 하나의 운영 결정을 남길지 선택합니다.">
        <div className="grid grid-cols-2 gap-2">
          <ChoiceCard selected={draft.recordType === "DECISION"} icon="gavel" label="운영 결정" description="정책과 실행 방향" onClick={() => onChange({ ...draft, recordType: "DECISION" })} />
          <ChoiceCard selected={draft.recordType === "MEETING_MINUTES"} icon="meeting_room" label="회의록" description="회의 일시와 합의" onClick={() => onChange({ ...draft, recordType: "MEETING_MINUTES" })} />
        </div>
      </EditorSection>

      <EditorSection title="공개 범위" description="멤버 공개 기록만 일반 More와 홈 위젯에 표시됩니다.">
        <div className="grid grid-cols-2 gap-2">
          <ChoiceCard selected={draft.visibilityScope === "MEMBERS"} icon="groups" label="멤버 공개" description="확정 후 전 멤버 조회" onClick={() => onChange({ ...draft, visibilityScope: "MEMBERS" })} />
          <ChoiceCard selected={draft.visibilityScope === "OPERATORS"} icon="admin_panel_settings" label="운영진 공개" description="권한 보유자만 조회" onClick={() => onChange({ ...draft, visibilityScope: "OPERATORS" })} />
        </div>
      </EditorSection>

      <EditorSection title="핵심 내용" description="결론뿐 아니라 배경과 이유를 분리해 다음 집행부가 판단 근거를 이해하게 합니다.">
        <div className="space-y-4">
          <FormField label="제목"><input aria-label="회의록·결정 제목" required maxLength={200} value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} className={fieldClassName} placeholder="예: 정기 모임 장소 변경" /></FormField>
          <FormField label="결정·합의 내용"><textarea aria-label="결정·합의 내용" required rows={5} maxLength={20000} value={draft.decisionContent} onChange={(event) => onChange({ ...draft, decisionContent: event.target.value })} className={textareaClassName} placeholder="무엇을 언제부터 어떻게 시행하기로 했는지 명확하게 적어주세요." /></FormField>
          <FormField label="배경과 문제 상황"><textarea aria-label="배경과 문제 상황" rows={4} maxLength={20000} value={draft.backgroundContext} onChange={(event) => onChange({ ...draft, backgroundContext: event.target.value })} className={textareaClassName} placeholder="결정이 필요했던 상황과 제약을 적어주세요." /></FormField>
          <FormField label="선택한 이유"><textarea aria-label="선택한 이유" rows={4} maxLength={20000} value={draft.rationale} onChange={(event) => onChange({ ...draft, rationale: event.target.value })} className={textareaClassName} placeholder="검토한 대안과 이 결론을 선택한 이유를 적어주세요." /></FormField>
        </div>
      </EditorSection>

      <EditorSection title="시점과 임기" description="시행일과 재검토 시점을 정해 확정 후에도 판단을 갱신할 수 있게 합니다.">
        <div className="grid gap-4 sm:grid-cols-2">
          {draft.recordType === "MEETING_MINUTES" ? <><FormField label="회의 날짜"><DatePopoverField value={draft.meetingDate} onChange={(value) => onChange({ ...draft, meetingDate: value })} placeholder="회의 날짜 선택" buttonClassName={fieldClassName} /></FormField><FormField label="회의 시간"><TimePopoverField value={draft.meetingTime} onChange={(value) => onChange({ ...draft, meetingTime: value })} placeholder="회의 시간 선택" buttonClassName={fieldClassName} /></FormField></> : null}
          <FormField label="시행일"><DatePopoverField value={draft.effectiveDate} onChange={(value) => onChange({ ...draft, effectiveDate: value, reviewDate: draft.reviewDate && draft.reviewDate < value ? "" : draft.reviewDate })} placeholder="시행일 선택" buttonClassName={fieldClassName} /></FormField>
          <FormField label="검토일"><DatePopoverField value={draft.reviewDate} minDate={draft.effectiveDate || undefined} onChange={(value) => onChange({ ...draft, reviewDate: value })} placeholder="검토일 선택" buttonClassName={fieldClassName} /></FormField>
          <FormField label="운영 임기"><select aria-label="운영 임기" value={draft.clubOperatingTermId} onChange={(event) => onChange({ ...draft, clubOperatingTermId: event.target.value })} className={fieldClassName}><option value="">임기 미지정</option>{center.termOptions.map((term) => <option key={term.clubOperatingTermId} value={term.clubOperatingTermId}>{term.termName} · {term.statusCode === "ACTIVE" ? "진행 중" : term.statusCode === "PLANNED" ? "예정" : "종료"}</option>)}</select></FormField>
          <FormField label="대체할 이전 결정"><select aria-label="대체할 이전 결정" value={draft.supersedesDecisionRecordId} onChange={(event) => onChange({ ...draft, supersedesDecisionRecordId: event.target.value })} className={fieldClassName}><option value="">대체 결정 없음</option>{center.records.filter((record) => record.statusCode === "CONFIRMED").map((record) => <option key={record.decisionRecordId} value={record.decisionRecordId}>{record.title}</option>)}</select></FormField>
        </div>
      </EditorSection>

      <EditorSection title="결정자와 참여자" description="한 사람은 결정자 또는 참여자 중 하나로 기록됩니다. 결정자는 최소 한 명 필요합니다.">
        <div className="space-y-2">
          {center.memberOptions.map((member) => {
            const role = draft.deciderClubProfileIds.includes(member.clubProfileId) ? "DECIDER" : draft.participantClubProfileIds.includes(member.clubProfileId) ? "PARTICIPANT" : "NONE";
            return <div key={member.clubProfileId} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">{member.displayName.slice(0, 2)}</span><span className="min-w-24 flex-1 text-sm font-bold text-slate-800">{member.displayName}</span><RoleButton selected={role === "DECIDER"} label="결정자" onClick={() => setPersonRole(member.clubProfileId, role === "DECIDER" ? "NONE" : "DECIDER")} /><RoleButton selected={role === "PARTICIPANT"} label="참여자" onClick={() => setPersonRole(member.clubProfileId, role === "PARTICIPANT" ? "NONE" : "PARTICIPANT")} /></div>;
          })}
        </div>
      </EditorSection>

      <EditorSection title="관련 운영 항목" description="일정·업무·정산·회비·대회를 연결하면 결정에서 실제 운영 화면으로 이동할 수 있습니다.">
        <input aria-label="관련 운영 항목 검색" value={resourceSearch} onChange={(event) => setResourceSearch(event.target.value)} className={fieldClassName} placeholder="제목으로 검색" />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1"><FilterButton selected={resourceFilter === "ALL"} label="전체" onClick={() => setResourceFilter("ALL")} />{resourceTypes.map((type) => <FilterButton key={type} selected={resourceFilter === type} label={resourceTypeLabel(type)} onClick={() => setResourceFilter(type)} />)}</div>
        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">{filteredResources.length > 0 ? filteredResources.map((resource) => { const key = resourceKey(resource.resourceType, resource.resourceId); const selected = draft.relatedResourceKeys.includes(key); return <ResourceChoice key={key} selected={selected} typeLabel={resourceTypeLabel(resource.resourceType)} title={resource.title} status={resource.statusLabel} onClick={() => toggleRelatedResource(key)} />; }) : <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-xs text-slate-400">조건에 맞는 운영 항목이 없습니다.</p>}</div>
      </EditorSection>

      <EditorSection title="후속 업무" description="이미 생성된 업무를 후속 실행 항목으로 연결합니다. 새 업무가 필요하면 업무 운영에서 먼저 만들어주세요.">
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">{todoOptions.length > 0 ? todoOptions.map((todo) => <ResourceChoice key={todo.resourceId} selected={draft.followUpTodoItemIds.includes(todo.resourceId)} typeLabel="후속 업무" title={todo.title} status={todo.statusLabel} onClick={() => toggleFollowUp(todo.resourceId)} />) : <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-xs text-slate-400">연결할 업무가 없습니다.</p>}</div>
      </EditorSection>

      <div className="mt-6 flex gap-2"><button type="button" onClick={onCancel} className="min-h-12 flex-1 rounded-2xl bg-slate-100 text-sm font-bold text-slate-700">취소</button><button type="submit" disabled={pending || draft.deciderClubProfileIds.length === 0} className="min-h-12 flex-[2] rounded-2xl bg-indigo-600 text-sm font-bold text-white disabled:opacity-50">{editing ? "초안 수정 저장" : "초안 저장"}</button></div>
    </form>
  );
}

function EditorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="mt-7 border-t border-slate-100 pt-6 first:mt-5 first:border-t-0 first:pt-0"><h3 className="text-sm font-black text-slate-900">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p><div className="mt-4">{children}</div></section>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-2 text-xs font-bold text-slate-600">{label}</p>{children}</div>;
}

function ChoiceCard({ selected, icon, label, description, onClick }: { selected: boolean; icon: string; label: string; description: string; onClick: () => void }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-20 items-center gap-3 rounded-2xl border px-3 text-left transition ${selected ? "border-indigo-400 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white text-slate-600"}`}><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}><span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span></span><span><span className="block text-sm font-black">{label}</span><span className="mt-1 block text-[11px]">{description}</span></span></button>;
}

function RoleButton({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-9 rounded-xl px-3 text-xs font-bold ${selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>{label}</button>;
}

function FilterButton({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-9 shrink-0 rounded-xl px-3 text-xs font-bold ${selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>{label}</button>;
}

function ResourceChoice({ selected, typeLabel, title, status, onClick }: { selected: boolean; typeLabel: string; title: string; status: string; onClick: () => void }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3 text-left ${selected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white"}`}><span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}><span className="material-symbols-outlined text-[17px]" aria-hidden="true">{selected ? "check" : "add"}</span></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold text-slate-400">{typeLabel} · {status}</span><span className="mt-0.5 block truncate text-xs font-bold text-slate-700">{title}</span></span></button>;
}
