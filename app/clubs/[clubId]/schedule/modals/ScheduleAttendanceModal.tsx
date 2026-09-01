"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { RouteModal } from "@/app/components/RouteModal";
import type {
  ScheduleAttendanceStatus,
  ScheduleEventAttendanceMember,
} from "@/app/lib/clubs";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import { updateScheduleAttendanceMutationOptions } from "@/app/lib/react-query/schedule/mutations";
import {
  scheduleEventAttendanceQueryOptions,
  scheduleQueryKeys,
} from "@/app/lib/react-query/schedule/queries";

type ScheduleAttendanceModalProps = {
  clubId: string;
  eventId: string;
  onDismiss: () => void;
};

const ATTENDANCE_ACTIONS: Array<{
  value: ScheduleAttendanceStatus;
  label: string;
  className: string;
}> = [
  { value: "PRESENT", label: "출석", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { value: "LATE", label: "지각", className: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "ABSENT", label: "결석", className: "border-rose-200 bg-rose-50 text-rose-700" },
  { value: "EXCUSED", label: "사유 인정", className: "border-sky-200 bg-sky-50 text-sky-700" },
];

function getParticipationLabel(status: ScheduleEventAttendanceMember["participationStatus"]) {
  if (status === "GOING") {
    return "참석 예정";
  }
  if (status === "NOT_GOING") {
    return "불참 응답";
  }
  if (status === "CANCELED") {
    return "응답 취소";
  }
  return "미응답";
}

function getAttendanceLabel(status: ScheduleEventAttendanceMember["attendanceStatus"]) {
  return ATTENDANCE_ACTIONS.find((action) => action.value === status)?.label ?? "미확인";
}

function getRoleLabel(roleCode: string) {
  if (roleCode === "OWNER") {
    return "소유자";
  }
  if (roleCode === "ADMIN") {
    return "관리자";
  }
  return "멤버";
}

export function ScheduleAttendanceModal({
  clubId,
  eventId,
  onDismiss,
}: ScheduleAttendanceModalProps) {
  const queryClient = useQueryClient();
  const attendanceQuery = useQuery(scheduleEventAttendanceQueryOptions(clubId, eventId));
  const attendanceMutation = useMutation(updateScheduleAttendanceMutationOptions(clubId, eventId));
  const [selectedClubProfileId, setSelectedClubProfileId] = useState<number | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<ScheduleAttendanceStatus | "UNMARKED">("PRESENT");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const payload = attendanceQuery.data ?? null;
  const selectedMember = useMemo(
    () => payload?.members.find((member) => member.clubProfileId === selectedClubProfileId) ?? null,
    [payload?.members, selectedClubProfileId],
  );

  const selectMember = (member: ScheduleEventAttendanceMember) => {
    setSelectedClubProfileId(member.clubProfileId);
    setAttendanceStatus(member.attendanceStatus ?? "PRESENT");
    setNote(member.attendanceNote ?? "");
    setActionError(null);
  };

  const saveAttendance = async () => {
    if (!selectedMember || attendanceMutation.isPending) {
      return;
    }
    setActionError(null);
    const result = await attendanceMutation.mutateAsync({
      clubProfileId: selectedMember.clubProfileId,
      request: {
        attendanceStatus,
        note: note.trim() || null,
      },
    });
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "출석 상태를 저장하지 못했습니다.");
      return;
    }
    queryClient.setQueryData(
      scheduleQueryKeys.scheduleEventAttendance(clubId, eventId),
      result.data,
    );
    void invalidateClubQueries(queryClient, clubId);
    setSelectedClubProfileId(null);
  };

  return (
    <RouteModal
      ariaLabel="일정 출석 관리"
      onDismiss={onDismiss}
      contentClassName="max-w-md"
    >
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2 className="truncate text-base font-bold text-slate-900">출석 관리</h2>
            <p className="mt-1 truncate text-xs text-slate-500">
              {payload ? `${payload.eventTitle} · ${payload.dateLabel}` : "일정 출석 현황"}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="semo-icon-control shrink-0 text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="출석 관리 닫기"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">close</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {attendanceQuery.isPending && !payload ? (
            <div className="space-y-3" aria-label="출석 현황 불러오는 중">
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : attendanceQuery.isError && !payload ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-rose-700">
                {getQueryErrorMessage(attendanceQuery.error, "출석 현황을 불러오지 못했습니다.")}
              </p>
              <button
                type="button"
                onClick={() => void attendanceQuery.refetch()}
                className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-rose-700 shadow-sm"
              >
                다시 시도
              </button>
            </div>
          ) : payload ? (
            <div className="space-y-6">
              <section aria-labelledby="attendance-summary-heading">
                <h3 id="attendance-summary-heading" className="sr-only">출석 요약</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-xs font-semibold text-slate-500">참석 예정</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{payload.summary.goingCount}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-3 py-3">
                    <p className="text-xs font-semibold text-emerald-700">도착 확인</p>
                    <p className="mt-1 text-lg font-bold text-emerald-800">
                      {payload.summary.presentCount + payload.summary.lateCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-3 py-3">
                    <p className="text-xs font-semibold text-amber-700">미확인</p>
                    <p className="mt-1 text-lg font-bold text-amber-800">{payload.summary.unmarkedCount}</p>
                  </div>
                </div>
              </section>

              <section aria-labelledby="attendance-roster-heading">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h3 id="attendance-roster-heading" className="text-sm font-bold text-slate-900">멤버별 상태</h3>
                    <p className="mt-1 text-xs text-slate-500">멤버를 선택해 실제 출석을 확인합니다.</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{payload.members.length}명</span>
                </div>
                <div className="space-y-2">
                  {payload.members.map((member) => (
                    <button
                      key={member.clubProfileId}
                      type="button"
                      onClick={() => selectMember(member)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left transition-colors hover:border-[var(--primary)]/30 hover:bg-slate-50"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)]">
                        {member.displayName.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900">{member.displayName}</p>
                          <span className="shrink-0 text-xs text-slate-400">{getRoleLabel(member.roleCode)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {getParticipationLabel(member.participationStatus)} · {getAttendanceLabel(member.attendanceStatus)}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[20px] text-slate-300" aria-hidden="true">chevron_right</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </div>

        {selectedMember ? (
          <div className="border-t border-slate-100 bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{selectedMember.displayName}</p>
                <p className="mt-0.5 text-xs text-slate-500">{getParticipationLabel(selectedMember.participationStatus)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClubProfileId(null)}
                className="semo-icon-control text-slate-400 hover:bg-slate-100"
                aria-label="멤버 출석 편집 닫기"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ATTENDANCE_ACTIONS.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  onClick={() => setAttendanceStatus(action.value)}
                  className={`min-h-10 rounded-xl border px-2 py-2 text-xs font-bold transition ${
                    attendanceStatus === action.value
                      ? action.className
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                  aria-pressed={attendanceStatus === action.value}
                >
                  {action.label}
                </button>
              ))}
            </div>
            <label htmlFor="schedule-attendance-note" className="sr-only">출석 확인 메모</label>
            <textarea
              id="schedule-attendance-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="확인 메모를 입력하세요."
              aria-describedby="schedule-attendance-note-length"
              className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
            />
            <p id="schedule-attendance-note-length" className="mt-1 text-right text-xs text-slate-400">
              {note.length}/500
            </p>
            {actionError ? <p className="mt-2 text-xs font-medium text-rose-600">{actionError}</p> : null}
            <div className="mt-3 flex gap-2">
              {selectedMember.attendanceStatus ? (
                <button
                  type="button"
                  onClick={() => setAttendanceStatus("UNMARKED")}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                    attendanceStatus === "UNMARKED"
                      ? "border-slate-400 bg-slate-100 text-slate-700"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  표시 해제
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void saveAttendance()}
                disabled={attendanceMutation.isPending}
                className="min-h-12 flex-1 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {attendanceMutation.isPending ? "저장 중..." : "출석 상태 저장"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </RouteModal>
  );
}
