"use client";

import type { TournamentBracketRound } from "@/app/lib/clubs";

type TournamentBracketBoardProps = {
  rounds: TournamentBracketRound[];
  editable?: boolean;
  entryOptions?: Array<{ value: number; label: string }>;
  onSideEntryChange?: (
    tournamentMatchId: number,
    tournamentMatchSideId: number,
    tournamentEntryId: number | null,
  ) => void;
};

export function TournamentBracketBoard({
  rounds,
  editable = false,
  entryOptions = [],
  onSideEntryChange,
}: TournamentBracketBoardProps) {
  if (rounds.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
        아직 대진표가 생성되지 않았습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f6f8ff_100%)] shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-sky-600">Bracket</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">대회 대진표</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {rounds.length} Rounds
          </span>
        </div>
      </div>

      <div className="overflow-x-auto px-4 pb-6 pt-6">
        <div className="flex min-w-[980px] items-start gap-5">
          {rounds.map((round) => (
            <section key={round.tournamentRoundId} className="w-72 shrink-0">
              <div className="mb-4 px-2 text-center">
                <span className="font-headline text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  {round.displayName}
                </span>
              </div>

              <div className="space-y-5">
                {round.matches.map((match) => (
                  <article
                    key={match.tournamentMatchId}
                    className="rounded-[22px] border border-slate-200 bg-white/95 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{match.title || "브래킷 매치"}</p>
                        {match.scheduledAtLabel ? (
                          <p className="mt-1 text-[11px] font-medium text-slate-400">{match.scheduledAtLabel}</p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {match.matchStatus}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {match.sides.map((side) => (
                        <div
                          key={side.tournamentMatchSideId}
                          className={`rounded-2xl border px-3 py-3 ${
                            side.resultStatus === "WINNER"
                              ? "border-sky-200 bg-sky-50/80"
                              : side.resultStatus === "LOSER"
                                ? "border-slate-200 bg-slate-50"
                                : "border-slate-200 bg-white"
                          }`}
                        >
                          {editable ? (
                            <select
                              value={side.tournamentEntryId ?? ""}
                              onChange={(event) => {
                                const nextValue = event.target.value ? Number(event.target.value) : null;
                                onSideEntryChange?.(match.tournamentMatchId, side.tournamentMatchSideId, nextValue);
                              }}
                              className="mb-2 block w-full rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-700"
                            >
                              <option value="">엔트리 선택</option>
                              {entryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : null}

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">
                                  {side.seedNumber ?? side.sideNo}
                                </div>
                                <p className="truncate text-sm font-bold text-slate-900">
                                  {side.entryDisplayName ?? "TBD"}
                                </p>
                              </div>
                              {side.members.length > 0 ? (
                                <p className="mt-2 line-clamp-2 text-[11px] font-medium text-slate-500">
                                  {side.members.map((member) => member.displayName).join(", ")}
                                </p>
                              ) : null}
                            </div>
                            <div className="text-right">
                              {side.scoreSummary ? (
                                <p className="text-base font-black tracking-tight text-sky-700">{side.scoreSummary}</p>
                              ) : null}
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                {side.resultStatus}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
