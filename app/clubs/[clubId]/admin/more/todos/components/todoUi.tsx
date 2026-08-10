"use client";

import { motion } from "motion/react";
import { DatePopoverField } from "@/app/components/DatePopoverField";
import { RouteModal } from "@/app/components/RouteModal";
import { TimePopoverField } from "@/app/components/TimePopoverField";
import type { ClubAdminTodoResponse, TodoSummary } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { getClubRoleLabel } from "@/app/lib/roleLabels";
import {
  APPLICATION_OPTIONS,
  ASSIGNMENT_MODE_OPTIONS,
  ASSIGNMENT_OPTIONS,
  type ApplicationFilter,
  type AssignmentFilter,
  type AssignmentMode,
  getApplicationFilterLabel,
  getAssignmentFilterLabel,
  getStatusFilterLabel,
  STATUS_OPTIONS,
  type StatusFilter,
  TODO_TYPE_OPTIONS,
  type TodoEditorModalState,
  type TodoType,
} from "../utils/todoOptions";

export function TodoSnapshotSection({
  todoData,
  reduceMotion,
}: {
  todoData: ClubAdminTodoResponse;
  reduceMotion: boolean;
}) {
  return (
    <motion.section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      {...staggeredFadeUpMotion(0, reduceMotion)}
    >
      <p className="text-xs font-semibold tracking-wide text-slate-400">운영 요약</p>
      <h2 className="mt-3 text-xl font-bold">
        누가 어떤 업무를 맡았는지, 아직 안 끝난 건 무엇인지 운영 관점에서 바로 확인합니다.
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <SummaryCard label="열림" value={todoData.openCount} />
        <SummaryCard label="진행중" value={todoData.inProgressCount} />
        <SummaryCard label="완료" value={todoData.completedCount} />
        <SummaryCard label="신청 대기" value={todoData.pendingApplicationCount} />
      </div>
      <div className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-slate-600">
        활성 멤버 {todoData.activeMemberCount}명 기준으로 신청을 받고, 선발 후 배정 상태를 운영합니다.
      </div>
    </motion.section>
  );
}

export function TodoFilterSummarySection({
  itemCount,
  statusFilter,
  assignmentFilter,
  applicationFilter,
  reduceMotion,
  onOpenFilter,
}: {
  itemCount: number;
  statusFilter: StatusFilter;
  assignmentFilter: AssignmentFilter;
  applicationFilter: ApplicationFilter;
  reduceMotion: boolean;
  onOpenFilter: () => void;
}) {
  return (
    <motion.section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      {...staggeredFadeUpMotion(1, reduceMotion)}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold">운영 필터</h3>
        <span className="text-xs font-medium text-slate-400">{itemCount}건</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenFilter}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white"
        >
          필터 선택
        </button>
        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
          {getStatusFilterLabel(statusFilter)}
        </span>
        <span className="rounded-full bg-orange-50 px-3 py-2 text-xs font-semibold text-[#b4541a]">
          {getAssignmentFilterLabel(assignmentFilter)}
        </span>
        <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          {getApplicationFilterLabel(applicationFilter)}
        </span>
      </div>
    </motion.section>
  );
}

export function TodoListSection({
  todoData,
  pendingTodoId,
  isLoadingMore,
  reduceMotion,
  onOpenEditor,
  onOpenApplications,
  onDeleteRequest,
  onUpdateStatus,
  onLoadMore,
}: {
  todoData: ClubAdminTodoResponse;
  pendingTodoId: number | null;
  isLoadingMore: boolean;
  reduceMotion: boolean;
  onOpenEditor: (item: TodoSummary) => void;
  onOpenApplications: (item: TodoSummary) => void;
  onDeleteRequest: (item: TodoSummary) => void;
  onUpdateStatus: (todoItemId: number, nextStatus: string) => void;
  onLoadMore: () => void;
}) {
  return (
    <motion.section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      {...staggeredFadeUpMotion(2, reduceMotion)}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold">업무 목록</h3>
        <span className="text-xs font-medium text-slate-400">{todoData.hasNext ? "계속 있음" : "마지막 페이지"}</span>
      </div>
      <div className="space-y-3">
        {todoData.items.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            현재 조건에 맞는 업무가 없습니다.
          </div>
        ) : (
          todoData.items.map((item, index) => (
            <TodoListCard
              key={item.todoItemId}
              item={item}
              canAssign={todoData.canAssign}
              canDelete={todoData.canDelete}
              pendingTodoId={pendingTodoId}
              reduceMotion={reduceMotion}
              motionIndex={index + 3}
              onOpenEditor={() => onOpenEditor(item)}
              onOpenApplications={() => onOpenApplications(item)}
              onDeleteRequest={() => onDeleteRequest(item)}
              onUpdateStatus={onUpdateStatus}
            />
          ))
        )}
      </div>

      {todoData.hasNext ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {isLoadingMore ? "불러오는 중..." : "더 보기"}
        </button>
      ) : null}
    </motion.section>
  );
}

export function TodoEditorModal({
  editorModal,
  canCreate,
  canAssign,
  title,
  description,
  todoType,
  assignmentMode,
  assignedClubProfileId,
  dueAtDate,
  dueAtTime,
  isSubmitting,
  availableMembers,
  assignedMemberLabel,
  inactiveAssignedOption,
  editingItem,
  onClose,
  onTitleChange,
  onDescriptionChange,
  onTodoTypeChange,
  onAssignmentModeChange,
  onAssignedClubProfileIdChange,
  onDueAtDateChange,
  onDueAtTimeChange,
  onSubmit,
}: {
  editorModal: TodoEditorModalState;
  canCreate: boolean;
  canAssign: boolean;
  title: string;
  description: string;
  todoType: TodoType;
  assignmentMode: AssignmentMode;
  assignedClubProfileId: string;
  dueAtDate: string;
  dueAtTime: string;
  isSubmitting: boolean;
  availableMembers: ClubAdminTodoResponse["availableMembers"];
  assignedMemberLabel: string;
  inactiveAssignedOption: { clubProfileId: number; label: string } | null;
  editingItem: TodoSummary | null;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTodoTypeChange: (value: TodoType) => void;
  onAssignmentModeChange: (value: AssignmentMode) => void;
  onAssignedClubProfileIdChange: (value: string) => void;
  onDueAtDateChange: (value: string) => void;
  onDueAtTimeChange: (value: string) => void;
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

            <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
              {canCreate ? (
                <>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">업무 이름</span>
                    <input
                      value={title}
                      onChange={(event) => onTitleChange(event.target.value)}
                      placeholder="예: 경기장 세팅, 참가자 안내"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">업무 설명</span>
                    <textarea
                      value={description}
                      onChange={(event) => onDescriptionChange(event.target.value)}
                      rows={4}
                      placeholder="필요한 맥락이나 체크포인트를 적어주세요."
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
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
                      <span className="text-sm font-semibold text-slate-700">마감일</span>
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                          <div>
                            <p className="text-xs font-bold text-slate-400">마감</p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {dueAtDate ? `${dueAtDate}${dueAtTime ? ` ${dueAtTime}` : ""}` : "마감일 미정"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onDueAtDateChange("");
                              onDueAtTimeChange("");
                            }}
                            disabled={!dueAtDate}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            초기화
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 transition focus-within:border-[#ec5b13] focus-within:bg-white">
                            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">calendar_month</span>
                              날짜
                            </span>
                            <DatePopoverField
                              value={dueAtDate}
                              onChange={onDueAtDateChange}
                              buttonClassName="w-full border-0 bg-transparent px-0 py-0 text-sm font-semibold text-slate-900 hover:border-transparent focus:border-transparent focus:ring-0"
                            />
                          </label>
                          <label
                            className={`rounded-2xl border px-3 py-3 text-sm transition ${
                              dueAtDate
                                ? "border-slate-200 bg-slate-50 text-slate-700 focus-within:border-[#ec5b13] focus-within:bg-white"
                                : "border-slate-200 bg-slate-100 text-slate-400"
                            }`}
                          >
                            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">schedule</span>
                              시간
                            </span>
                            <TimePopoverField
                              value={dueAtTime}
                              onChange={onDueAtTimeChange}
                              disabled={!dueAtDate}
                              buttonClassName={`w-full border-0 bg-transparent px-0 py-0 text-sm font-semibold text-slate-900 hover:border-transparent focus:border-transparent focus:ring-0 disabled:cursor-not-allowed ${
                                dueAtDate ? "" : "text-slate-400"
                              }`}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : editingItem ? (
                <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{editingItem.title}</p>
                  <p className="mt-2 leading-6">{editingItem.description || "설명 없음"}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                    <InfoItem label="업무 유형" value={editingItem.todoTypeLabel} />
                    <InfoItem label="마감일" value={editingItem.dueAtLabel ?? "미정"} />
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
                              onAssignedClubProfileIdChange("");
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-slate-700">담당자</span>
                    <div
                      className={`mt-2 rounded-2xl border p-3 ${
                        assignmentMode === "OPEN_SUPPORT"
                          ? "border-slate-200 bg-slate-100"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="mb-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-bold text-slate-400">담당자</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">{assignedMemberLabel}</p>
                      </div>
                      {assignmentMode === "OPEN_SUPPORT" ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                          지원자 모집 후 운영진이 선정합니다.
                        </div>
                      ) : (
                        <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                          {inactiveAssignedOption ? (
                            <SelectableMemberCard
                              selected={assignedClubProfileId === String(inactiveAssignedOption.clubProfileId)}
                              label={inactiveAssignedOption.label}
                              roleCode="INACTIVE"
                              onClick={() => onAssignedClubProfileIdChange(String(inactiveAssignedOption.clubProfileId))}
                            />
                          ) : null}
                          {availableMembers.map((member) => (
                            <SelectableMemberCard
                              key={member.clubProfileId}
                              selected={assignedClubProfileId === String(member.clubProfileId)}
                              label={member.memberDisplayName}
                              roleCode={member.memberRoleCode}
                              onClick={() => onAssignedClubProfileIdChange(String(member.clubProfileId))}
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
            className="w-full rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#ec5b13]/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
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

export function TodoFilterModal({
  status,
  assignment,
  application,
  onClose,
  onStatusChange,
  onAssignmentChange,
  onApplicationChange,
  onReset,
  onApply,
}: {
  status: StatusFilter;
  assignment: AssignmentFilter;
  application: ApplicationFilter;
  onClose: () => void;
  onStatusChange: (value: StatusFilter) => void;
  onAssignmentChange: (value: AssignmentFilter) => void;
  onApplicationChange: (value: ApplicationFilter) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <RouteModal ariaLabel="업무 필터 선택" onDismiss={onClose} dismissOnBackdrop={false}>
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400">운영 필터</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">운영 필터 선택</h3>
          </div>
          <button
            type="button"
            aria-label="운영 필터 닫기"
            onClick={onClose}
            className="semo-icon-control rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-5">
            <FilterGroup
              title="상태"
              options={STATUS_OPTIONS}
              value={status}
              getLabel={getStatusFilterLabel}
              onChange={onStatusChange}
            />
            <FilterGroup
              title="배정 방식"
              options={ASSIGNMENT_OPTIONS}
              value={assignment}
              getLabel={getAssignmentFilterLabel}
              onChange={onAssignmentChange}
            />
            <FilterGroup
              title="신청 상태"
              options={APPLICATION_OPTIONS}
              value={application}
              getLabel={getApplicationFilterLabel}
              onChange={onApplicationChange}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex-1 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white"
            >
              적용
            </button>
          </div>
        </div>
      </section>
    </RouteModal>
  );
}

function TodoListCard({
  item,
  canAssign,
  canDelete,
  pendingTodoId,
  reduceMotion,
  motionIndex,
  onOpenEditor,
  onOpenApplications,
  onDeleteRequest,
  onUpdateStatus,
}: {
  item: TodoSummary;
  canAssign: boolean;
  canDelete: boolean;
  pendingTodoId: number | null;
  reduceMotion: boolean;
  motionIndex: number;
  onOpenEditor: () => void;
  onOpenApplications: () => void;
  onDeleteRequest: () => void;
  onUpdateStatus: (todoItemId: number, nextStatus: string) => void;
}) {
  const isTerminal = item.statusCode === "COMPLETED" || item.statusCode === "CANCELED";
  const canOpenEditor = item.canEdit && !isTerminal;
  const canOpenAssignEditor = !item.canEdit && canAssign && !isTerminal;
  const canMarkInProgress = item.statusCode === "OPEN" && item.assignedClubProfileId != null;
  const canMarkCompleted =
    item.statusCode === "IN_PROGRESS" ||
    (item.statusCode === "OPEN" && item.assignedClubProfileId != null && item.assignmentMode === "DIRECT_ASSIGN");
  const canResetToOpen = item.statusCode === "IN_PROGRESS";
  const canReopen = isTerminal;
  const canCancel = item.statusCode === "OPEN" || item.statusCode === "IN_PROGRESS";
  const resetToOpenLabel = item.assignmentMode === "OPEN_SUPPORT" ? "모집으로 되돌리기" : "대기로 되돌리기";

  return (
    <motion.article
      className={`rounded-2xl border p-4 ${
        item.overdue
          ? "border-rose-200 bg-rose-50/40"
          : item.statusCode === "IN_PROGRESS"
            ? "border-amber-200 bg-amber-50/40"
            : item.statusCode === "COMPLETED"
              ? "border-emerald-200 bg-emerald-50/25"
              : "border-slate-200 bg-white"
      }`}
      {...staggeredFadeUpMotion(motionIndex, reduceMotion)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={item.todoType === "VOLUNTEER" ? "sky" : "slate"} label={item.todoTypeLabel} />
        <Badge tone={item.assignmentMode === "OPEN_SUPPORT" ? "amber" : "blue"} label={item.assignmentModeLabel} />
        <Badge
          tone={item.statusCode === "COMPLETED" ? "emerald" : item.overdue ? "rose" : "slate"}
          label={item.overdue ? "지연" : item.statusLabel}
        />
      </div>
      <p className="mt-3 text-base font-bold text-slate-900">{item.title}</p>
      {item.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <InfoItem label="담당자" value={item.assignedDisplayName ?? "미배정"} />
        <InfoItem label="마감일" value={item.dueAtLabel ?? "미정"} />
        <InfoItem label="등록자" value={item.createdByDisplayName ?? "미정"} />
        <InfoItem label="신청 수" value={`${item.applicationCount}건`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {canOpenEditor ? (
          <button type="button" onClick={onOpenEditor} className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white">
            수정
          </button>
        ) : null}
        {canOpenAssignEditor ? (
          <button type="button" onClick={onOpenEditor} className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white">
            배정
          </button>
        ) : null}
        {item.canReviewApplications ? (
          <button
            type="button"
            onClick={onOpenApplications}
            className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 ring-1 ring-amber-200"
          >
            신청 관리 {item.applicationCount}
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            onClick={onDeleteRequest}
            disabled={pendingTodoId === item.todoItemId}
            className="rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            보관
          </button>
        ) : null}
        {item.canManageStatus ? (
          <>
            {canMarkInProgress ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.todoItemId, "IN_PROGRESS")}
                disabled={pendingTodoId === item.todoItemId}
                className="rounded-full bg-amber-500 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                진행중
              </button>
            ) : null}
            {canMarkCompleted ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.todoItemId, "COMPLETED")}
                disabled={pendingTodoId === item.todoItemId}
                className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                완료
              </button>
            ) : null}
            {canResetToOpen ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.todoItemId, "OPEN")}
                disabled={pendingTodoId === item.todoItemId}
                className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {resetToOpenLabel}
              </button>
            ) : null}
            {canReopen ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.todoItemId, "REOPEN")}
                disabled={pendingTodoId === item.todoItemId}
                className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                다시 열기
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.todoItemId, "CANCELED")}
                disabled={pendingTodoId === item.todoItemId}
                className="rounded-full bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                취소
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </motion.article>
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

function Badge({
  tone,
  label,
}: {
  tone: "sky" | "slate" | "amber" | "blue" | "emerald" | "rose";
  label: string;
}) {
  const className = {
    sky: "bg-sky-50 text-sky-700",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  }[tone];

  return <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${className}`}>{label}</span>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-slate-600">{value}</p>
    </div>
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
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? "border-[#ec5b13] bg-[#fff4ec] shadow-[0_10px_24px_rgba(236,91,19,0.12)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div
        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${
          selected ? "bg-[#ec5b13] text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900">{label}</p>
          {selected ? (
            <span className="rounded-full bg-[#ec5b13] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
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
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? "border-[#ec5b13] bg-[#fff4ec] shadow-[0_10px_24px_rgba(236,91,19,0.12)]"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-xs font-medium tracking-[0.08em] text-slate-400">{getClubRoleLabel(roleCode)}</p>
      </div>
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-[#ec5b13] text-white" : "bg-white text-slate-300"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          {selected ? "check" : "radio_button_unchecked"}
        </span>
      </div>
    </button>
  );
}

function FilterGroup<T extends string>({
  title,
  options,
  value,
  getLabel,
  onChange,
}: {
  title: string;
  options: readonly T[];
  value: T;
  getLabel: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
              value === option ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {getLabel(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
