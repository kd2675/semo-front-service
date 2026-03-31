"use client";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { DatePopoverField } from "@/app/components/DatePopoverField";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  createClubTournament,
  getClubTournamentDetail,
  updateClubTournament,
  type TournamentDetailResponse,
  type UpsertTournamentRequest,
} from "@/app/lib/clubs";
import { ClubEditorLoadingShell } from "../../ClubRouteLoadingShells";

type ClubTournamentEditorClientProps = {
  clubId: string;
  tournamentRecordId?: string;
  presentation?: "page" | "modal";
  onRequestClose?: () => void;
  onSaved?: (tournamentRecordId: number) => void;
};

type TournamentDateMode = "single" | "range";

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function combineDateTime(date: string, time: string) {
  const safeTime = time || "00:00";
  return `${date}T${safeTime}:00`;
}

export function ClubTournamentEditorClient({
  clubId,
  tournamentRecordId,
  presentation = "page",
  onRequestClose,
  onSaved,
}: ClubTournamentEditorClientProps) {
  const router = useRouter();
  const formId = useId();
  const isEdit = Boolean(tournamentRecordId);
  const isModal = presentation === "modal";
  const [title, setTitle] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [detailText, setDetailText] = useState("");
  const [applicationStartDate, setApplicationStartDate] = useState(getTodayDateValue());
  const [applicationStartTime, setApplicationStartTime] = useState("09:00");
  const [applicationEndDate, setApplicationEndDate] = useState(getTodayDateValue());
  const [applicationEndTime, setApplicationEndTime] = useState("18:00");
  const [startDate, setStartDate] = useState(getTodayDateValue());
  const [tournamentDateMode, setTournamentDateMode] = useState<TournamentDateMode>("single");
  const [endDate, setEndDate] = useState(getTodayDateValue());
  const [locationLabel, setLocationLabel] = useState("");
  const [matchFormat, setMatchFormat] = useState<"SINGLE" | "DOUBLE" | "TEAM">("SINGLE");
  const [teamMemberLimit, setTeamMemberLimit] = useState("3");
  const [participantLimit, setParticipantLimit] = useState("");
  const [feeRequired, setFeeRequired] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");
  const [feeCurrencyCode, setFeeCurrencyCode] = useState("KRW");
  const [postToBoard, setPostToBoard] = useState(false);
  const [postToCalendar, setPostToCalendar] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [bracketMode, setBracketMode] = useState<"RANDOM" | "MANUAL">("RANDOM");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) {
      return;
    }
    let cancelled = false;

    void (async () => {
      if (!tournamentRecordId) {
        return;
      }
      setLoading(true);
      setError(null);
      const result = await getClubTournamentDetail(clubId, tournamentRecordId);
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok || !result.data) {
        setError(result.message ?? "대회 정보를 불러오지 못했습니다.");
        return;
      }

      const payload: TournamentDetailResponse = result.data;
      setTitle(payload.title);
      setSummaryText(payload.summaryText ?? "");
      setDetailText(payload.detailText ?? "");
      setApplicationStartDate(payload.applicationStartAt.slice(0, 10));
      setApplicationStartTime(payload.applicationStartAt.slice(11, 16));
      setApplicationEndDate(payload.applicationEndAt.slice(0, 10));
      setApplicationEndTime(payload.applicationEndAt.slice(11, 16));
      setStartDate(payload.startDate);
      setTournamentDateMode(payload.startDate === payload.endDate ? "single" : "range");
      setEndDate(payload.endDate);
      setLocationLabel(payload.locationLabel ?? "");
      setMatchFormat(payload.matchFormat);
      setTeamMemberLimit(String(payload.teamMemberLimit ?? 3));
      setParticipantLimit(payload.participantLimit ? String(payload.participantLimit) : "");
      setFeeRequired(payload.feeRequired);
      setFeeAmount(payload.feeAmount ? String(payload.feeAmount) : "");
      setFeeCurrencyCode(payload.feeCurrencyCode || "KRW");
      setPostToBoard(payload.postedToBoard);
      setPostToCalendar(payload.postedToCalendar);
      setPinned(payload.pinned);
      setBracketMode(payload.bracketMode);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, isEdit, tournamentRecordId]);

  const handleApplicationStartDateChange = (value: string) => {
    setApplicationStartDate(value);
    setApplicationEndDate((current) => (!current || current < value ? value : current));
  };

  const handleApplicationEndDateChange = (value: string) => {
    setApplicationEndDate(value);
  };

  const handleTournamentDateModeChange = (nextMode: TournamentDateMode) => {
    setTournamentDateMode(nextMode);
    if (nextMode === "single") {
      setEndDate(startDate);
      return;
    }
    setEndDate((current) => current || startDate);
  };

  const handleTournamentStartDateChange = (value: string) => {
    setStartDate(value);
    if (tournamentDateMode === "single") {
      setEndDate(value);
      return;
    }
    setEndDate((current) => (!current || current < value ? value : current));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const applicationStartAt = combineDateTime(applicationStartDate, applicationStartTime);
    const applicationEndAt = combineDateTime(applicationEndDate, applicationEndTime);
    const resolvedEndDate = tournamentDateMode === "range" ? endDate : startDate;

    if (applicationStartAt > applicationEndAt) {
      setSaving(false);
      setError("신청 시작 시점은 신청 종료 시점보다 늦을 수 없습니다.");
      return;
    }

    if (startDate > resolvedEndDate) {
      setSaving(false);
      setError("대회 시작일은 대회 종료일보다 늦을 수 없습니다.");
      return;
    }

    const request: UpsertTournamentRequest = {
      title,
      summaryText: summaryText.trim() || null,
      detailText: detailText.trim() || null,
      applicationStartAt,
      applicationEndAt,
      startDate,
      endDate: resolvedEndDate,
      locationLabel: locationLabel.trim() || null,
      matchFormat,
      teamMemberLimit: matchFormat === "TEAM" ? Number(teamMemberLimit || "3") : null,
      participantLimit: participantLimit ? Number(participantLimit) : null,
      feeRequired,
      feeAmount: feeRequired && feeAmount ? Number(feeAmount) : null,
      feeCurrencyCode,
      postToBoard,
      postToCalendar,
      pinned,
      bracketMode,
    };

    const result = isEdit && tournamentRecordId
      ? await updateClubTournament(clubId, tournamentRecordId, request)
      : await createClubTournament(clubId, request);
    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "대회 저장에 실패했습니다.");
      return;
    }

    if (onSaved) {
      onSaved(result.data.tournamentRecordId);
      return;
    }
    router.replace(`/clubs/${clubId}/more/tournaments/${result.data.tournamentRecordId}`);
  };

  if (loading) {
    return <ClubEditorLoadingShell presentation={presentation} />;
  }

  const actionBarClassName = isModal
    ? "sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur"
    : "fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur";
  const inputClassName = "block w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900";
  const textareaClassName = "block w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900";

  return (
    <div className={isModal ? "flex min-h-0 flex-1 flex-col bg-white font-display text-slate-900" : "bg-[var(--background-light)] font-display text-slate-900"}>
      <div className={isModal ? "flex min-h-0 flex-1 flex-col bg-white" : "mx-auto flex min-h-screen max-w-md flex-col bg-white"}>
        <ClubPageHeader
          title={isEdit ? "대회 수정" : "대회 생성"}
          subtitle="Tournament Studio"
          icon="emoji_events"
          leftSlot={isModal && onRequestClose ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
              aria-label="대회 폼 닫기"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          ) : undefined}
        />

        <main className={`flex-1 px-4 py-5 ${isModal ? "overflow-y-auto pb-28" : "semo-nav-bottom-space pb-28"}`}>
          <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>
            ) : null}

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-sky-600">Meta</p>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">대회 이름</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={inputClassName}
                    placeholder="예: 2026 SEMO Spring Open"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">요약 소개</span>
                  <textarea
                    value={summaryText}
                    onChange={(event) => setSummaryText(event.target.value)}
                    className={`${textareaClassName} min-h-24`}
                    placeholder="메인 카드와 배너에 노출될 짧은 설명"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">상세 설명</span>
                  <textarea
                    value={detailText}
                    onChange={(event) => setDetailText(event.target.value)}
                    className={`${textareaClassName} min-h-36`}
                    placeholder="참가 규칙, 경기 방식, 유의사항을 입력하세요."
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">Schedule</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">신청 시작일</span>
                  <DatePopoverField
                    value={applicationStartDate}
                    onChange={handleApplicationStartDateChange}
                    maxDate={applicationEndDate || undefined}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">신청 시작 시간</span>
                  <input type="time" value={applicationStartTime} onChange={(event) => setApplicationStartTime(event.target.value)} className={inputClassName} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">신청 종료일</span>
                  <DatePopoverField
                    value={applicationEndDate}
                    onChange={handleApplicationEndDateChange}
                    minDate={applicationStartDate || undefined}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">신청 종료 시간</span>
                  <input type="time" value={applicationEndTime} onChange={(event) => setApplicationEndTime(event.target.value)} className={inputClassName} />
                </label>
              </div>
              <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">대회 시점</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    { value: "single", label: "날짜" },
                    { value: "range", label: "기간" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleTournamentDateModeChange(option.value as TournamentDateMode)}
                      className={`rounded-[18px] border px-4 py-3 text-left text-sm font-bold transition ${
                        tournamentDateMode === option.value
                          ? "border-sky-200 bg-white text-sky-700 shadow-sm"
                          : "border-transparent bg-white/60 text-slate-500"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className={`mt-4 grid gap-4 ${tournamentDateMode === "range" ? "grid-cols-2" : "grid-cols-1"}`}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      {tournamentDateMode === "range" ? "대회 시작일" : "대회 날짜"}
                    </span>
                    <DatePopoverField
                      value={startDate}
                      onChange={handleTournamentStartDateChange}
                      maxDate={tournamentDateMode === "range" ? endDate || undefined : undefined}
                    />
                  </label>
                  {tournamentDateMode === "range" ? (
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">대회 종료일</span>
                      <DatePopoverField value={endDate} onChange={setEndDate} minDate={startDate || undefined} />
                    </label>
                  ) : null}
                </div>
              </div>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">장소</span>
                <input value={locationLabel} onChange={(event) => setLocationLabel(event.target.value)} className={inputClassName} placeholder="예: 잠실 실내 체육관 A코트" />
              </label>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-amber-600">Format</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { value: "SINGLE", label: "개인전" },
                  { value: "DOUBLE", label: "복식" },
                  { value: "TEAM", label: "단체전" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMatchFormat(option.value as "SINGLE" | "DOUBLE" | "TEAM")}
                    className={`rounded-[18px] border px-4 py-3 text-left text-sm font-bold transition ${
                      matchFormat === option.value
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {matchFormat === "TEAM" ? (
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">팀당 인원</span>
                  <input
                    type="number"
                    min={3}
                    value={teamMemberLimit}
                    onChange={(event) => setTeamMemberLimit(event.target.value)}
                    className={inputClassName}
                  />
                </label>
              ) : null}
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">전체 참가 제한 인원</span>
                <input
                  type="number"
                  min={2}
                  value={participantLimit}
                  onChange={(event) => setParticipantLimit(event.target.value)}
                  className={inputClassName}
                  placeholder="비우면 제한 없음"
                />
              </label>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-emerald-600">Fee & Share</p>
              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-700">참가비 사용</span>
                  <input type="checkbox" checked={feeRequired} onChange={(event) => setFeeRequired(event.target.checked)} className="rounded border-slate-300 text-sky-600" />
                </label>
                {feeRequired ? (
                  <div className="grid grid-cols-[1fr_92px] gap-3">
                    <input
                      type="number"
                      min={0}
                      value={feeAmount}
                      onChange={(event) => setFeeAmount(event.target.value)}
                      className={inputClassName}
                      placeholder="예: 10000"
                    />
                    <input
                      value={feeCurrencyCode}
                      onChange={(event) => setFeeCurrencyCode(event.target.value.toUpperCase())}
                      className={inputClassName}
                    />
                  </div>
                ) : null}

                {[
                  { checked: postToBoard, setChecked: setPostToBoard, label: "게시판에도 공유" },
                  { checked: postToCalendar, setChecked: setPostToCalendar, label: "캘린더에도 공유" },
                  { checked: pinned, setChecked: setPinned, label: "게시판 중요 고정" },
                ].map((item) => (
                  <label key={item.label} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                    <input type="checkbox" checked={item.checked} onChange={(event) => item.setChecked(event.target.checked)} className="rounded border-slate-300 text-sky-600" />
                  </label>
                ))}
                <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">대진표는 대회 상세에서 생성합니다.</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    생성 후 상세 화면에서 랜덤 생성, 직접 배치, 초안 저장, 대진 확정을 진행할 수 있습니다.
                  </p>
                </div>
              </div>
            </section>
          </form>
        </main>

        <div className={actionBarClassName}>
          <button
            type="submit"
            form={formId}
            disabled={saving}
            className="w-full rounded-[20px] bg-[var(--primary)] px-5 py-4 text-sm font-black text-white shadow-[0_14px_32px_rgba(19,91,236,0.22)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "저장 중..." : isEdit ? "대회 수정 저장" : "대회 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}
