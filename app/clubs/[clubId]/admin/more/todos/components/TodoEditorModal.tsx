"use client";

import { DatePopoverField } from "@/app/components/DatePopoverField";
import { RouteModal } from "@/app/components/RouteModal";
import { TimePopoverField } from "@/app/components/TimePopoverField";
import type { ClubAdminTodoResponse, TodoSummary } from "@/app/lib/clubs";
import { getClubRoleLabel } from "@/app/lib/roleLabels";
import {
  ASSIGNMENT_MODE_OPTIONS,
  type AssignmentMode,
  TODO_PRIORITY_OPTIONS,
  TODO_RECURRENCE_OPTIONS,
  type TodoEditorModalState,
  type TodoPriority,
  type TodoRecurrence,
  TODO_TYPE_OPTIONS,
  type TodoType,
} from "../utils/todoOptions";
import { TodoInfoItem } from "./TodoInfoItem";

export function TodoEditorModal({
  editorModal,
  canCreate,
  canAssign,
  title,
  description,
  todoType,
  assignmentMode,
  assignedClubProfileIds,
  priorityCode,
  recruitmentCapacity,
  dueAtDate,
  dueAtTime,
  workStartDate,
  workStartTime,
  workEndDate,
  workEndTime,
  linkedScheduleEventId,
  linkedDecisionRecordId,
  recurrenceFrequency,
  recurrenceInterval,
  recurrenceEndDate,
  isSubmitting,
  availableMembers,
  scheduleOptions,
  decisionOptions,
  assignedMemberLabel,
  inactiveAssignedOptions,
  editingItem,
  onClose,
  onTitleChange,
  onDescriptionChange,
  onTodoTypeChange,
  onAssignmentModeChange,
  onAssignedClubProfileIdToggle,
  onClearAssignedClubProfileIds,
  onPriorityCodeChange,
  onRecruitmentCapacityChange,
  onDueAtDateChange,
  onDueAtTimeChange,
  onWorkStartDateChange,
  onWorkStartTimeChange,
  onWorkEndDateChange,
  onWorkEndTimeChange,
  onLinkedScheduleEventIdChange,
  onLinkedDecisionRecordIdChange,
  onRecurrenceFrequencyChange,
  onRecurrenceIntervalChange,
  onRecurrenceEndDateChange,
  onSubmit,
}: {
  editorModal: TodoEditorModalState;
  canCreate: boolean;
  canAssign: boolean;
  title: string;
  description: string;
  todoType: TodoType;
  assignmentMode: AssignmentMode;
  assignedClubProfileIds: string[];
  priorityCode: TodoPriority;
  recruitmentCapacity: string;
  dueAtDate: string;
  dueAtTime: string;
  workStartDate: string;
  workStartTime: string;
  workEndDate: string;
  workEndTime: string;
  linkedScheduleEventId: string;
  linkedDecisionRecordId: string;
  recurrenceFrequency: TodoRecurrence;
  recurrenceInterval: string;
  recurrenceEndDate: string;
  isSubmitting: boolean;
  availableMembers: ClubAdminTodoResponse["availableMembers"];
  scheduleOptions: ClubAdminTodoResponse["scheduleOptions"];
  decisionOptions: ClubAdminTodoResponse["decisionOptions"];
  assignedMemberLabel: string;
  inactiveAssignedOptions: Array<{ clubProfileId: number; label: string }>;
  editingItem: TodoSummary | null;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTodoTypeChange: (value: TodoType) => void;
  onAssignmentModeChange: (value: AssignmentMode) => void;
  onAssignedClubProfileIdToggle: (value: string) => void;
  onClearAssignedClubProfileIds: () => void;
  onPriorityCodeChange: (value: TodoPriority) => void;
  onRecruitmentCapacityChange: (value: string) => void;
  onDueAtDateChange: (value: string) => void;
  onDueAtTimeChange: (value: string) => void;
  onWorkStartDateChange: (value: string) => void;
  onWorkStartTimeChange: (value: string) => void;
  onWorkEndDateChange: (value: string) => void;
  onWorkEndTimeChange: (value: string) => void;
  onLinkedScheduleEventIdChange: (value: string) => void;
  onLinkedDecisionRecordIdChange: (value: string) => void;
  onRecurrenceFrequencyChange: (value: TodoRecurrence) => void;
  onRecurrenceIntervalChange: (value: string) => void;
  onRecurrenceEndDateChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <RouteModal
      ariaLabel={editorModal.mode === "create" ? "새 할 일 등록" : "업무 수정"}
      onDismiss={onClose}
      dismissOnBackdrop={false}
    >
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {editorModal.mode === "create" ? "할 일 등록" : "할 일 수정"}
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {editorModal.mode === "create" ? "새 할 일 등록" : canCreate ? "업무 수정" : "업무 배정"}
            </h3>
          </div>
          <button
            type="button"
            aria-label="할 일 편집기 닫기"
            onClick={onClose}
            className="semo-icon-control rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-5">
            <div>
              <p className="text-sm text-slate-500">
                {editorModal.mode === "create"
                  ? "운영 업무, 봉사 업무, 마감일과 담당 방식을 정해 바로 등록합니다."
                  : "권한에 따라 기본 정보 또는 담당자 배정을 조정합니다."}
              </p>
            </div>

            <div className="space-y-4 rounded-[var(--radius-modal)] bg-slate-50 p-4">
              {canCreate ? (
                <>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">업무 이름</span>
                    <input
                      value={title}
                      onChange={(event) => onTitleChange(event.target.value)}
                      placeholder="예: 경기장 세팅, 참가자 안내"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">업무 설명</span>
                    <textarea
                      value={description}
                      onChange={(event) => onDescriptionChange(event.target.value)}
                      rows={4}
                      placeholder="필요한 맥락이나 체크포인트를 적어주세요."
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-sm font-semibold text-slate-700">업무 유형</span>
                      <div className="mt-2 grid gap-2">
                        {TODO_TYPE_OPTIONS.map((option) => (
                          <SelectableCard
                            key={option.value}
                            selected={todoType === option.value}
                            label={option.label}
                            description={option.description}
                            icon={option.icon}
                            onClick={() => onTodoTypeChange(option.value)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-semibold text-slate-700">우선순위</span>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {TODO_PRIORITY_OPTIONS.map((option) => (
                          <CompactChoiceCard
                            key={option.value}
                            selected={priorityCode === option.value}
                            label={option.label}
                            description={option.description}
                            icon={option.icon}
                            onClick={() => onPriorityCodeChange(option.value)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <DateTimePanel
                    title="마감일"
                    summaryLabel="마감"
                    emptyLabel="마감일 미정"
                    dateValue={dueAtDate}
                    timeValue={dueAtTime}
                    onDateChange={onDueAtDateChange}
                    onTimeChange={onDueAtTimeChange}
                  />

                  <div>
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-slate-700">업무 시간</span>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        실제 활동 구간을 설정하면 담당자가 마감과 근무 시간을 구분해 확인할 수 있습니다.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DateTimePanel
                        title="시작"
                        summaryLabel="업무 시작"
                        emptyLabel="시작 시간 미정"
                        dateValue={workStartDate}
                        timeValue={workStartTime}
                        onDateChange={onWorkStartDateChange}
                        onTimeChange={onWorkStartTimeChange}
                        compact
                      />
                      <DateTimePanel
                        title="종료"
                        summaryLabel="업무 종료"
                        emptyLabel="종료 시간 미정"
                        dateValue={workEndDate}
                        timeValue={workEndTime}
                        onDateChange={onWorkEndDateChange}
                        onTimeChange={onWorkEndTimeChange}
                        compact
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-slate-700">관련 일정</span>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      업무가 특정 일정 준비나 현장 운영에 속한다면 연결해주세요.
                    </p>
                    <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3">
                      <ScheduleChoiceCard
                        selected={!linkedScheduleEventId}
                        title="연결 안 함"
                        meta="독립 업무로 등록"
                        onClick={() => onLinkedScheduleEventIdChange("")}
                      />
                      {scheduleOptions.map((schedule) => (
                        <ScheduleChoiceCard
                          key={schedule.eventId}
                          selected={linkedScheduleEventId === String(schedule.eventId)}
                          title={schedule.title}
                          meta={schedule.startAtLabel}
                          onClick={() => onLinkedScheduleEventIdChange(String(schedule.eventId))}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-slate-700">반복 업무</span>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      현재 회차를 완료하면 마감일과 업무 시간을 이동해 다음 회차를 한 번만 자동 생성합니다.
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {TODO_RECURRENCE_OPTIONS.map((option) => (
                        <CompactChoiceCard
                          key={option.value}
                          selected={recurrenceFrequency === option.value}
                          label={option.label}
                          description={option.description}
                          icon={option.icon}
                          onClick={() => {
                            onRecurrenceFrequencyChange(option.value);
                            if (option.value === "NONE") {
                              onRecurrenceIntervalChange("1");
                              onRecurrenceEndDateChange("");
                            }
                          }}
                        />
                      ))}
                    </div>
                    {recurrenceFrequency !== "NONE" ? (
                      <div className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
                        <div>
                          <span className="text-xs font-bold text-slate-500">반복 간격</span>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="반복 간격 줄이기"
                              onClick={() => onRecurrenceIntervalChange(String(Math.max(1, Number(recurrenceInterval || 1) - 1)))}
                              className="semo-icon-control shrink-0 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">remove</span>
                            </button>
                            <label className="min-w-0 flex-1">
                              <span className="sr-only">반복 간격</span>
                              <input
                                value={recurrenceInterval}
                                onChange={(event) => onRecurrenceIntervalChange(event.target.value.replace(/\D/g, "").slice(0, 2))}
                                inputMode="numeric"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-center text-sm font-bold outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                              />
                            </label>
                            <button
                              type="button"
                              aria-label="반복 간격 늘리기"
                              onClick={() => onRecurrenceIntervalChange(String(Math.min(12, Number(recurrenceInterval || 0) + 1)))}
                              className="semo-icon-control shrink-0 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                            </button>
                          </div>
                          <p className="mt-2 text-center text-xs text-slate-500">
                            {recurrenceInterval || 1}{recurrenceFrequency === "WEEKLY" ? "주" : "개월"}마다
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-500">반복 종료일</span>
                          <DatePopoverField
                            value={recurrenceEndDate}
                            onChange={onRecurrenceEndDateChange}
                            placeholder="종료일 없음"
                            buttonClassName="mt-2 h-11 rounded-xl border-slate-200 px-3 text-sm font-semibold"
                          />
                          {recurrenceEndDate ? (
                            <button
                              type="button"
                              onClick={() => onRecurrenceEndDateChange("")}
                              className="mt-2 min-h-9 w-full rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-600"
                            >
                              종료일 지우기
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-slate-700">관련 결정 기록</span>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      멤버에게 공개된 확정 결정과 연결해 이 업무를 왜 수행하는지 남깁니다.
                    </p>
                    <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3">
                      <ScheduleChoiceCard
                        selected={!linkedDecisionRecordId}
                        title="연결 안 함"
                        meta="결정 기록 없이 등록"
                        icon="link_off"
                        onClick={() => onLinkedDecisionRecordIdChange("")}
                      />
                      {decisionOptions.map((decision) => (
                        <ScheduleChoiceCard
                          key={decision.decisionRecordId}
                          selected={linkedDecisionRecordId === String(decision.decisionRecordId)}
                          title={decision.title}
                          meta={decision.confirmedAtLabel ?? "확정 시각 없음"}
                          icon="gavel"
                          onClick={() => onLinkedDecisionRecordIdChange(String(decision.decisionRecordId))}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : editingItem ? (
                <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{editingItem.title}</p>
                  <p className="mt-2 leading-6">{editingItem.description || "설명 없음"}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                    <TodoInfoItem label="업무 유형" value={editingItem.todoTypeLabel} />
                    <TodoInfoItem label="마감일" value={editingItem.dueAtLabel ?? "미정"} />
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    이 권한에서는 기본 정보를 바꾸지 않고 담당자와 배정 방식만 조정합니다.
                  </p>
                </div>
              ) : null}

              {canAssign ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">배정 방식</span>
                    <div className="mt-2 grid gap-2">
                      {ASSIGNMENT_MODE_OPTIONS.map((option) => (
                        <SelectableCard
                          key={option.value}
                          selected={assignmentMode === option.value}
                          label={option.label}
                          description={option.description}
                          icon={option.icon}
                          onClick={() => {
                            onAssignmentModeChange(option.value);
                            if (option.value === "OPEN_SUPPORT") {
                              onClearAssignedClubProfileIds();
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-slate-700">
                      {assignmentMode === "OPEN_SUPPORT" ? "모집 인원" : "담당자"}
                    </span>
                    <div
                      className={`mt-2 rounded-2xl border p-3 ${
                        assignmentMode === "OPEN_SUPPORT"
                          ? "border-slate-200 bg-slate-100"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="mb-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-bold text-slate-400">
                          {assignmentMode === "OPEN_SUPPORT" ? "모집 방식" : "선택된 담당자"}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">{assignedMemberLabel}</p>
                      </div>
                      {assignmentMode === "OPEN_SUPPORT" ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <p className="text-xs leading-5 text-slate-500">
                            지원자를 여러 명 선정할 수 있습니다. 이미 선정된 인원보다 작게 줄일 수 없습니다.
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="모집 인원 줄이기"
                              onClick={() => onRecruitmentCapacityChange(String(Math.max(1, Number(recruitmentCapacity || 1) - 1)))}
                              className="semo-icon-control shrink-0 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">remove</span>
                            </button>
                            <label className="min-w-0 flex-1">
                              <span className="sr-only">모집 인원</span>
                              <input
                                value={recruitmentCapacity}
                                onChange={(event) => onRecruitmentCapacityChange(event.target.value.replace(/\D/g, "").slice(0, 3))}
                                inputMode="numeric"
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-bold text-slate-900 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                              />
                            </label>
                            <button
                              type="button"
                              aria-label="모집 인원 늘리기"
                              onClick={() => onRecruitmentCapacityChange(String(Math.min(100, Number(recruitmentCapacity || 0) + 1)))}
                              className="semo-icon-control shrink-0 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                          {inactiveAssignedOptions.map((member) => (
                            <SelectableMemberCard
                              key={member.clubProfileId}
                              selected={assignedClubProfileIds.includes(String(member.clubProfileId))}
                              label={member.label}
                              roleCode="INACTIVE"
                              onClick={() => onAssignedClubProfileIdToggle(String(member.clubProfileId))}
                            />
                          ))}
                          {availableMembers.map((member) => (
                            <SelectableMemberCard
                              key={member.clubProfileId}
                              selected={assignedClubProfileIds.includes(String(member.clubProfileId))}
                              label={member.memberDisplayName}
                              roleCode={member.memberRoleCode}
                              onClick={() => onAssignedClubProfileIdToggle(String(member.clubProfileId))}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : canCreate ? (
                <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600">
                  {editorModal.mode === "edit" ? (
                    <>
                      <p className="font-semibold text-slate-900">
                        배정 권한이 없어 현재 배정 상태를 유지한 채 기본 정보만 수정합니다.
                      </p>
                      <p className="mt-2">배정 방식: {assignmentMode === "OPEN_SUPPORT" ? "신청 모집" : "직접 배정"}</p>
                      <p className="mt-1">담당자: {assignedMemberLabel === "담당자를 선택하세요." ? "미배정" : assignedMemberLabel}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-900">
                        배정 권한이 없어 새 업무는 신청 모집 상태로 등록됩니다.
                      </p>
                      <p className="mt-2">직접 배정은 배정 권한이 있는 운영자가 나중에 조정할 수 있습니다.</p>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="min-h-12 w-full rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isSubmitting
              ? "저장 중..."
              : editorModal.mode === "edit"
                ? canCreate
                  ? "업무 저장"
                  : "배정 저장"
                : "할 일 등록"}
          </button>
        </div>
      </section>
    </RouteModal>
  );
}


function DateTimePanel({
  title,
  summaryLabel,
  emptyLabel,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  compact = false,
}: {
  title: string;
  summaryLabel: string;
  emptyLabel: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
      <div className={`mt-2 rounded-2xl border border-slate-200 bg-white ${compact ? "p-2.5" : "p-3"}`}>
        <div className="mb-3 flex min-h-11 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">{summaryLabel}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-700">
              {dateValue ? `${dateValue}${timeValue ? ` ${timeValue}` : ""}` : emptyLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onDateChange("");
              onTimeChange("");
            }}
            disabled={!dateValue}
            className="min-h-9 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            초기화
          </button>
        </div>
        <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
          <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 transition focus-within:border-[var(--primary)] focus-within:bg-white">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">calendar_month</span>
              날짜
            </span>
            <DatePopoverField
              value={dateValue}
              onChange={onDateChange}
              buttonClassName="w-full border-0 bg-transparent px-0 py-0 text-sm font-semibold text-slate-900 hover:border-transparent focus:border-transparent focus:ring-0"
            />
          </label>
          <label
            className={`rounded-xl border px-3 py-3 text-sm transition ${
              dateValue
                ? "border-slate-200 bg-slate-50 text-slate-700 focus-within:border-[var(--primary)] focus-within:bg-white"
                : "border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">schedule</span>
              시간
            </span>
            <TimePopoverField
              value={timeValue}
              onChange={onTimeChange}
              disabled={!dateValue}
              buttonClassName={`w-full border-0 bg-transparent px-0 py-0 text-sm font-semibold text-slate-900 hover:border-transparent focus:border-transparent focus:ring-0 disabled:cursor-not-allowed ${
                dateValue ? "" : "text-slate-400"
              }`}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function CompactChoiceCard({
  selected,
  label,
  description,
  icon,
  onClick,
}: {
  selected: boolean;
  label: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-20 rounded-2xl border p-3 text-left transition ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/8 text-[var(--primary)]"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
      }`}
    >
      <span className="material-symbols-outlined text-[19px]" aria-hidden="true">{icon}</span>
      <span className="mt-1 block text-sm font-bold text-slate-900">{label}</span>
      <span className="mt-1 block text-[11px] leading-4 text-slate-500">{description}</span>
    </button>
  );
}

function ScheduleChoiceCard({
  selected,
  title,
  meta,
  icon = "event",
  onClick,
}: {
  selected: boolean;
  title: string;
  meta: string;
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/8"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
      }`}
    >
      <span className={`material-symbols-outlined text-[20px] ${selected ? "text-[var(--primary)]" : "text-slate-400"}`} aria-hidden="true">
        {selected ? "check_circle" : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-900">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">{meta}</span>
      </span>
      <span className={`material-symbols-outlined text-[18px] ${selected ? "text-[var(--primary)]" : "text-slate-300"}`} aria-hidden="true">
        {selected ? "check_circle" : "radio_button_unchecked"}
      </span>
    </button>
  );
}

function SelectableCard({
  selected,
  label,
  description,
  icon,
  onClick,
}: {
  selected: boolean;
  label: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-16 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/8 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div
        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${
          selected ? "bg-[var(--primary)] text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900">{label}</p>
          {selected ? (
            <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[11px] font-bold text-white">
              선택됨
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </button>
  );
}

function SelectableMemberCard({
  selected,
  label,
  roleCode,
  onClick,
}: {
  selected: boolean;
  label: string;
  roleCode: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/8 shadow-sm"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-xs font-medium tracking-[0.08em] text-slate-400">{getClubRoleLabel(roleCode)}</p>
      </div>
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-[var(--primary)] text-white" : "bg-white text-slate-300"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          {selected ? "check" : "add"}
        </span>
      </div>
    </button>
  );
}
