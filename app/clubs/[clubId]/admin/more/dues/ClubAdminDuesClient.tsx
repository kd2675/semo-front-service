"use client";

import { Public_Sans } from "next/font/google";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { DatePopoverField } from "@/app/components/DatePopoverField";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { RouteModal } from "@/app/components/RouteModal";
import { TimePopoverField } from "@/app/components/TimePopoverField";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import {
  createClubDuesCharge,
  deleteClubDuesCharge,
  getClubAdminDues,
  getClubAdminDuesChargeDetail,
  getClubAdminDuesCharges,
  updateClubDuesPaymentStatus,
  type ClubAdminDuesCharge,
  type ClubAdminDuesChargeDetailResponse,
  type ClubAdminDuesChargeFeedResponse,
  type ClubAdminDuesHomeResponse,
  type ClubDuesInvoice,
  type ClubDuesMemberOption,
} from "@/app/lib/clubs";
import { FAB_RIGHT_OFFSET_CLASS_NAME, getActionFabBottomClass } from "@/app/lib/fab";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ClubAdminDuesClientProps = {
  clubId: string;
  initialData: ClubAdminDuesHomeResponse;
  initialChargeFeed: ClubAdminDuesChargeFeedResponse;
};

type ChargeFilter = "ALL" | "OPEN" | "SETTLED";
type TargetScope = "ALL_ACTIVE_MEMBERS" | "SELECTED_MEMBERS";

const TARGET_SCOPE_OPTIONS: { value: TargetScope; label: string; description: string }[] = [
  { value: "ALL_ACTIVE_MEMBERS", label: "활성 멤버 전체", description: "현재 활성 멤버 전체에게 한 번에 발행합니다." },
  { value: "SELECTED_MEMBERS", label: "선택 멤버만", description: "특정 멤버만 골라서 회비를 발행합니다." },
];

function getInvoiceStatusClassName(invoice: ClubDuesInvoice) {
  if (invoice.paymentStatus === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (invoice.paymentStatus === "WAIVED") {
    return "bg-slate-200 text-slate-600";
  }
  if (invoice.paymentStatus === "OVERDUE") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-amber-50 text-amber-700";
}

function getChargeFrameClassName(charge: ClubAdminDuesCharge) {
  if (charge.overdueInvoiceCount > 0) {
    return "border-rose-200 bg-rose-50/30";
  }
  if (charge.pendingInvoiceCount > 0) {
    return "border-amber-200 bg-amber-50/30";
  }
  return "border-emerald-200 bg-emerald-50/20";
}

function combineDateTimeValue(dateValue: string, timeValue: string) {
  if (!dateValue) {
    return null;
  }
  return `${dateValue}T${timeValue || "23:59"}:00`;
}

function mergeChargeSummary(current: ClubAdminDuesCharge[], nextCharge: ClubAdminDuesCharge) {
  return current.map((charge) => (charge.chargeId === nextCharge.chargeId ? nextCharge : charge));
}

export function ClubAdminDuesClient({
  clubId,
  initialData,
  initialChargeFeed,
}: ClubAdminDuesClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [dues, setDues] = useState(initialData);
  const [charges, setCharges] = useState(initialChargeFeed.items);
  const [nextCursorChargeId, setNextCursorChargeId] = useState<number | null>(
    initialChargeFeed.nextCursorChargeId,
  );
  const [hasNext, setHasNext] = useState(initialChargeFeed.hasNext);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const [detailChargeId, setDetailChargeId] = useState<number | null>(null);
  const [chargeDetailsById, setChargeDetailsById] = useState<
    Record<number, ClubAdminDuesChargeDetailResponse>
  >({});
  const [chargeDetailErrors, setChargeDetailErrors] = useState<Record<number, string>>({});
  const [loadingDetailIds, setLoadingDetailIds] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("5000");
  const [dueAtDate, setDueAtDate] = useState("");
  const [dueAtTime, setDueAtTime] = useState("");
  const [note, setNote] = useState("");
  const [targetScope, setTargetScope] = useState<TargetScope>("ALL_ACTIVE_MEMBERS");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const deferredMemberSearchQuery = useDeferredValue(memberSearchQuery);
  const [chargeFilter, setChargeFilter] = useState<ChargeFilter>("ALL");
  const [isCreating, setIsCreating] = useState(false);
  const [activeChargeId, setActiveChargeId] = useState<number | null>(null);
  const [activeInvoiceId, setActiveInvoiceId] = useState<number | null>(null);
  const [pendingDeleteCharge, setPendingDeleteCharge] = useState<ClubAdminDuesCharge | null>(null);
  const { toast, showToast, clearToast } = useEphemeralToast();
  const loadingMoreRef = useRef(false);
  const didMountFilterRef = useRef(false);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = deferredMemberSearchQuery.trim().toLowerCase();
    return dues.availableMembers.filter((member) => {
      if (!normalizedSearch) {
        return true;
      }
      return [member.memberDisplayName, member.memberRoleCode ?? ""].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    });
  }, [deferredMemberSearchQuery, dues.availableMembers]);

  const selectedMemberSet = useMemo(() => new Set(selectedMemberIds), [selectedMemberIds]);
  const loadingDetailSet = useMemo(() => new Set(loadingDetailIds), [loadingDetailIds]);

  const reloadOverview = async () => {
    const result = await getClubAdminDues(clubId);
    if (!result.ok || !result.data) {
      showToast(result.message ?? "회비 요약 정보를 다시 불러오지 못했습니다.", "error");
      return null;
    }
    const data = result.data;

    startTransition(() => {
      setDues(data);
    });
    return data;
  };

  const loadChargeFeed = async (mode: "reset" | "append") => {
    if (loadingMoreRef.current) {
      return false;
    }
    if (mode === "append" && !hasNext) {
      return true;
    }

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    if (mode === "reset") {
      setLoadError(null);
    }

    const result = await getClubAdminDuesCharges(clubId, {
      query: deferredSearchQuery,
      chargeFilter,
      cursorChargeId: mode === "append" ? nextCursorChargeId : null,
      size: 10,
    });

    loadingMoreRef.current = false;
    setIsLoadingMore(false);

    if (!result.ok || !result.data) {
      setLoadError(result.message ?? "회비 항목을 불러오지 못했습니다.");
      return false;
    }

    const data = result.data;
    startTransition(() => {
      setCharges((current) => (mode === "append" ? [...current, ...data.items] : data.items));
      setNextCursorChargeId(data.nextCursorChargeId);
      setHasNext(data.hasNext);
      setLoadError(null);
      if (mode === "reset") {
        setChargeDetailsById({});
        setChargeDetailErrors({});
        setLoadingDetailIds([]);
      }
    });
    return true;
  };

  const loadChargeDetail = async (chargeId: number, force = false) => {
    if (!force && chargeDetailsById[chargeId]) {
      return chargeDetailsById[chargeId];
    }
    if (loadingDetailSet.has(chargeId)) {
      return null;
    }

    setLoadingDetailIds((current) =>
      current.includes(chargeId) ? current : [...current, chargeId],
    );
    setChargeDetailErrors((current) => {
      if (!(chargeId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[chargeId];
      return next;
    });

    const result = await getClubAdminDuesChargeDetail(clubId, chargeId);

    setLoadingDetailIds((current) => current.filter((id) => id !== chargeId));

    if (!result.ok || !result.data) {
      const message = result.message ?? "청구 상세를 불러오지 못했습니다.";
      setChargeDetailErrors((current) => ({ ...current, [chargeId]: message }));
      return null;
    }

    const detail = result.data;
    startTransition(() => {
      setChargeDetailsById((current) => ({ ...current, [chargeId]: detail }));
      setCharges((current) => mergeChargeSummary(current, detail.charge));
    });
    return detail;
  };

  const handleLoadMore = useEffectEvent(async () => {
    void loadChargeFeed("append");
  });

  const handleResetFeed = useEffectEvent(async () => {
    void loadChargeFeed("reset");
  });

  useEffect(() => {
    if (!sentinelNode || !hasNext || isLoadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }
        void handleLoadMore();
      },
      { rootMargin: "260px 0px" },
    );

    observer.observe(sentinelNode);
    return () => {
      observer.disconnect();
    };
  }, [hasNext, isLoadingMore, sentinelNode]);

  useEffect(() => {
    if (!didMountFilterRef.current) {
      didMountFilterRef.current = true;
      return;
    }
    void handleResetFeed();
  }, [chargeFilter, deferredSearchQuery]);

  const resetCreateForm = () => {
    startTransition(() => {
      setTitle("");
      setAmount("5000");
      setDueAtDate("");
      setDueAtTime("");
      setNote("");
      setTargetScope("ALL_ACTIVE_MEMBERS");
      setSelectedMemberIds([]);
      setMemberSearchQuery("");
    });
  };

  const handleCreateCharge = async () => {
    if (!dues.canIssue || isCreating) {
      return;
    }

    const parsedAmount = Number(amount);
    if (!title.trim()) {
      showToast("회비 항목 이름을 입력해주세요.", "error");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showToast("회비 금액은 0보다 커야 합니다.", "error");
      return;
    }
    if (targetScope === "SELECTED_MEMBERS" && selectedMemberIds.length === 0) {
      showToast("선택 멤버 발행은 대상 멤버를 한 명 이상 골라야 합니다.", "error");
      return;
    }

    setIsCreating(true);
    clearToast();
    const result = await createClubDuesCharge(clubId, {
      title: title.trim(),
      amount: parsedAmount,
      dueAt: combineDateTimeValue(dueAtDate, dueAtTime),
      note: note || null,
      targetScope,
      clubProfileIds: targetScope === "SELECTED_MEMBERS" ? selectedMemberIds : undefined,
    });
    setIsCreating(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "회비 항목 발행에 실패했습니다.", "error");
      return;
    }

    const [overview] = await Promise.all([reloadOverview(), loadChargeFeed("reset")]);
    if (!overview) {
      return;
    }
    setShowCreateModal(false);
    resetCreateForm();
    showToast(`${result.data.title} 항목을 ${result.data.createdCount}명에게 발행했습니다.`, "success");
  };

  const handleUpdateStatus = async (
    chargeId: number,
    invoiceId: number,
    paymentStatus: "PENDING" | "PAID" | "WAIVED",
  ) => {
    if (activeInvoiceId != null) {
      return;
    }

    setActiveInvoiceId(invoiceId);
    clearToast();
    const result = await updateClubDuesPaymentStatus(clubId, invoiceId, { paymentStatus });
    setActiveInvoiceId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "회비 상태 변경에 실패했습니다.", "error");
      return;
    }

    const [overview, detail] = await Promise.all([
      reloadOverview(),
      loadChargeDetail(chargeId, true),
    ]);
    if (!overview || !detail) {
      return;
    }
    showToast(`${result.data.memberDisplayName} 회비 상태를 변경했습니다.`, "success");
  };

  const handleDeleteCharge = async (charge: ClubAdminDuesCharge) => {
    if (!charge.canDelete || activeChargeId != null) {
      return;
    }

    setActiveChargeId(charge.chargeId);
    clearToast();
    const result = await deleteClubDuesCharge(clubId, charge.chargeId);
    setActiveChargeId(null);

    if (!result.ok) {
      showToast(result.message ?? "회비 항목 삭제에 실패했습니다.", "error");
      return;
    }

    const [overview] = await Promise.all([reloadOverview(), loadChargeFeed("reset")]);
    if (!overview) {
      return;
    }
    showToast(`${charge.title} 회비 항목을 삭제했습니다.`, "success");
  };

  const toggleSelectedMember = (member: ClubDuesMemberOption) => {
    startTransition(() => {
      setSelectedMemberIds((current) =>
        current.includes(member.clubProfileId)
          ? current.filter((id) => id !== member.clubProfileId)
          : [...current, member.clubProfileId],
      );
    });
  };

  const handleOpenChargeDetail = (chargeId: number) => {
    setDetailChargeId(chargeId);
    void loadChargeDetail(chargeId);
  };

  const canRestoreToPending = dues.canMarkPaid || dues.canMarkWaive;
  const activeChargeDetail = detailChargeId != null ? chargeDetailsById[detailChargeId] ?? null : null;
  const activeChargeSummary =
    detailChargeId == null
      ? null
      : activeChargeDetail?.charge ??
        charges.find((charge) => charge.chargeId === detailChargeId) ??
        null;
  const activeDetailError =
    detailChargeId != null ? chargeDetailErrors[detailChargeId] ?? null : null;
  const activeDetailLoading = detailChargeId != null && loadingDetailSet.has(detailChargeId);

  return (
    <div className={`${publicSans.className} min-h-screen bg-[#f8f6f6] text-slate-900`}>
      <div className="min-h-screen bg-[#f8f6f6]">
        <ClubPageHeader
          title="회비 관리"
          subtitle={dues.clubName}
          icon="payments"
          theme="admin"
          containerClassName="max-w-6xl"
        />

        <main className="semo-nav-bottom-space mx-auto w-full max-w-6xl space-y-5 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Dues Charges</p>
                <h2 className="mt-2 text-2xl font-bold">회비 항목을 만들고 대상 멤버별 청구를 운영합니다.</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  월 회비뿐 아니라 가입비, 행사비, 시즌 회비처럼 커스텀 항목을 발행할 수 있습니다.
                  기본 대상은 활성 멤버 전체이며, 필요하면 특정 멤버만 골라 발행할 수 있습니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                <MetricCard label="회비 항목" value={dues.totalChargeCount} />
                <MetricCard label="총 청구" value={dues.totalInvoiceCount} />
                <MetricCard label="미납" value={dues.pendingInvoiceCount} />
                <MetricCard label="연체" value={dues.overdueInvoiceCount} />
                <MetricCard label="면제" value={dues.waivedInvoiceCount} />
                <MetricCard label="수금률" value={`${dues.collectionRate}%`} accent />
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Issued Charges</p>
                <h3 className="mt-2 text-xl font-bold">발행한 회비 항목 목록</h3>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex rounded-full bg-slate-100 p-1">
                  {(["ALL", "OPEN", "SETTLED"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setChargeFilter(filter)}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                        chargeFilter === filter
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {filter === "ALL" ? "전체" : filter === "OPEN" ? "미정산" : "정산 완료"}
                    </button>
                  ))}
                </div>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="항목명, 발행자, 멤버명, 메모 검색"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10 sm:w-72"
                />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {charges.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  조건에 맞는 회비 항목이 없습니다.
                </div>
              ) : (
                charges.map((charge, index) => {
                  return (
                    <motion.article
                      key={charge.chargeId}
                      className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${getChargeFrameClassName(charge)}`}
                      {...staggeredFadeUpMotion(index + 3, reduceMotion)}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenChargeDetail(charge.chargeId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleOpenChargeDetail(charge.chargeId);
                          }
                        }}
                        className="flex cursor-pointer flex-col gap-5 text-left"
                        aria-label={`${charge.title} 상세 보기`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
                                {charge.targetScopeLabel}
                              </span>
                              {charge.overdueInvoiceCount > 0 ? (
                                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                                  연체 {charge.overdueInvoiceCount}건
                                </span>
                              ) : charge.pendingInvoiceCount > 0 ? (
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                  미납 {charge.pendingInvoiceCount}건
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                  정산 완료
                                </span>
                              )}
                            </div>
                            <div className="mt-3 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="text-xl font-bold text-slate-900">{charge.title}</h4>
                                <p className="mt-2 text-sm text-slate-500">
                                  {charge.amountLabel} · 마감 {charge.dueAtLabel ?? "미정"} · 발행 {charge.issuedByDisplayName}
                                </p>
                              </div>
                              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[320px]">
                            <MetricCard compact label="대상" value={charge.totalInvoiceCount} />
                            <MetricCard compact label="미납" value={charge.pendingInvoiceCount} />
                            <MetricCard compact label="완납" value={charge.paidInvoiceCount} />
                            <MetricCard compact label="수금률" value={`${charge.collectionRate}%`} accent />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-white/80 pt-4">
                          <p className="text-xs font-medium text-slate-500">
                            멤버별 청구, 납부 처리, 면제 처리는 상세 보기에서 관리합니다.
                          </p>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenChargeDetail(charge.chargeId);
                            }}
                            className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            상세 보기
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          disabled={!charge.canDelete || activeChargeId === charge.chargeId}
                          onClick={() => setPendingDeleteCharge(charge)}
                          className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {activeChargeId === charge.chargeId ? "삭제 중..." : "미처리 회비 항목 삭제"}
                        </button>
                      </div>
                    </motion.article>
                  );
                })
              )}
            </div>

            {loadError ? (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>
            ) : null}

            <div className="mt-4">
              {hasNext ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-4 text-center text-sm text-slate-400">
                  {isLoadingMore ? "회비 항목을 더 불러오는 중..." : "스크롤을 내리면 다음 회비 항목 10개를 자동으로 불러옵니다."}
                </div>
              ) : charges.length > 0 ? (
                <div className="pb-1 text-center text-sm text-slate-400">마지막 회비 항목까지 모두 불러왔습니다.</div>
              ) : null}
            </div>

            <div ref={setSentinelNode} className="h-16" />
          </motion.section>
        </main>

        {dues.canIssue ? (
          <button
            type="button"
            aria-label="회비 항목 발행"
            onClick={() => setShowCreateModal(true)}
            className={`fixed ${FAB_RIGHT_OFFSET_CLASS_NAME} ${getActionFabBottomClass(true)} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#ec5b13] text-white transition-transform active:scale-95`}
            style={{ boxShadow: "0 6px 16px rgba(236, 91, 19, 0.32)" }}
          >
            <span className="material-symbols-outlined text-[28px]">add_card</span>
          </button>
        ) : null}

        <EphemeralToast toastId={toast?.id ?? null} message={toast?.message ?? null} tone={toast?.tone} />
        <AnimatePresence>
          {detailChargeId && activeChargeSummary ? (
            <RouteModal onDismiss={() => setDetailChargeId(null)}>
              <ChargeDetailModal
                charge={activeChargeSummary}
                detail={activeChargeDetail}
                loading={activeDetailLoading}
                error={activeDetailError}
                canMarkPaid={dues.canMarkPaid}
                canMarkWaive={dues.canMarkWaive}
                canRestoreToPending={canRestoreToPending}
                activeInvoiceId={activeInvoiceId}
                onClose={() => setDetailChargeId(null)}
                onUpdateStatus={(invoiceId, paymentStatus) =>
                  void handleUpdateStatus(activeChargeSummary.chargeId, invoiceId, paymentStatus)
                }
              />
            </RouteModal>
          ) : null}

          {showCreateModal ? (
            <RouteModal onDismiss={() => setShowCreateModal(false)} dismissOnBackdrop={false}>
              <section className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Create Charge</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">새 회비 항목 발행</h3>
                  </div>
                  <button
                    type="button"
                    aria-label="회비 발행 닫기"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm text-slate-500">
                        항목 이름, 금액, 대상 멤버를 정하면 하나의 회비 항목으로 묶여 청구됩니다.
                      </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
                      <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">항목 이름</span>
                          <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="예: 2026 봄 대회 참가비"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                          />
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-sm font-semibold text-slate-700">금액</span>
                            <input
                              value={amount}
                              onChange={(event) => setAmount(event.target.value)}
                              inputMode="numeric"
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                            />
                          </label>
                          <label className="block">
                            <span className="text-sm font-semibold text-slate-700">마감일</span>
                            <div className="mt-2 space-y-2">
                              <DatePopoverField
                                value={dueAtDate}
                                onChange={setDueAtDate}
                                buttonClassName="py-3 focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                                placeholder="마감 날짜를 선택하세요"
                              />
                              <div className="flex items-center gap-2">
                                <TimePopoverField
                                  value={dueAtTime}
                                  onChange={setDueAtTime}
                                  disabled={!dueAtDate}
                                  buttonClassName="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDueAtDate("");
                                    setDueAtTime("");
                                  }}
                                  disabled={!dueAtDate}
                                  className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                  미정
                                </button>
                              </div>
                              <p className="text-xs text-slate-400">
                                시간을 비우면 선택한 날짜의 23:59로 저장됩니다.
                              </p>
                            </div>
                          </label>
                        </div>

                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">운영 메모</span>
                          <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            rows={3}
                            placeholder="예: 대회 당일 현장 수납 가능"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                          />
                        </label>
                      </div>

                      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">발행 대상</p>
                          <div className="mt-3 space-y-2">
                            {TARGET_SCOPE_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setTargetScope(option.value)}
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                  targetScope === option.value
                                    ? "border-[#ec5b13] bg-[#fff5ef]"
                                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                                }`}
                              >
                                <p className="text-sm font-bold text-slate-900">{option.label}</p>
                                <p className="mt-1 text-xs text-slate-500">{option.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {targetScope === "SELECTED_MEMBERS" ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-700">선택 멤버</p>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                {selectedMemberIds.length}명 선택
                              </span>
                            </div>

                            <input
                              value={memberSearchQuery}
                              onChange={(event) => setMemberSearchQuery(event.target.value)}
                              placeholder="이름 또는 역할 검색"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                            />

                            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                              {filteredMembers.length === 0 ? (
                                <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                  선택 가능한 활성 멤버가 없습니다.
                                </div>
                              ) : (
                                filteredMembers.map((member) => {
                                  const selected = selectedMemberSet.has(member.clubProfileId);

                                  return (
                                    <button
                                      key={member.clubProfileId}
                                      type="button"
                                      onClick={() => toggleSelectedMember(member)}
                                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                                        selected
                                          ? "border-[#ec5b13] bg-[#fff5ef]"
                                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                                      }`}
                                    >
                                      <div>
                                        <p className="text-sm font-bold text-slate-900">{member.memberDisplayName}</p>
                                        <p className="mt-1 text-xs text-slate-500">{member.memberRoleCode ?? "MEMBER"}</p>
                                      </div>
                                      <span
                                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                          selected ? "bg-[#ec5b13] text-white" : "bg-white text-slate-500"
                                        }`}
                                      >
                                        {selected ? "선택됨" : "추가"}
                                      </span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                            현재 활성 멤버 {dues.activeMemberCount}명을 기준으로 자동 발행됩니다.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 px-5 py-4">
                  <button
                    type="button"
                    disabled={!dues.canIssue || isCreating}
                    onClick={() => void handleCreateCharge()}
                    className="w-full rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d94f0b] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isCreating ? "발행 중..." : "회비 항목 발행"}
                  </button>
                </div>
              </section>
            </RouteModal>
          ) : null}
        </AnimatePresence>
        {pendingDeleteCharge ? (
          <ScheduleActionConfirmModal
            title="회비 항목 삭제"
            description={`"${pendingDeleteCharge.title}" 항목을 삭제할까요?\n아직 아무도 처리하지 않은 청구만 함께 삭제됩니다.`}
            confirmLabel="회비 항목 삭제"
            busyLabel="삭제 중..."
            busy={activeChargeId === pendingDeleteCharge.chargeId}
            onCancel={() => {
              if (activeChargeId == null) {
                setPendingDeleteCharge(null);
              }
            }}
            onConfirm={() =>
              void handleDeleteCharge(pendingDeleteCharge).finally(() => {
                setPendingDeleteCharge(null);
              })
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function ChargeDetailModal({
  charge,
  detail,
  loading,
  error,
  canMarkPaid,
  canMarkWaive,
  canRestoreToPending,
  activeInvoiceId,
  onClose,
  onUpdateStatus,
}: {
  charge: ClubAdminDuesCharge;
  detail: ClubAdminDuesChargeDetailResponse | null;
  loading: boolean;
  error: string | null;
  canMarkPaid: boolean;
  canMarkWaive: boolean;
  canRestoreToPending: boolean;
  activeInvoiceId: number | null;
  onClose: () => void;
  onUpdateStatus: (
    invoiceId: number,
    paymentStatus: "PENDING" | "PAID" | "WAIVED",
  ) => void;
}) {
  const invoices = detail?.invoices ?? [];

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Charge Detail</p>
          <h3 className="mt-1 truncate text-xl font-bold text-slate-900">{charge.title}</h3>
        </div>
        <button
          type="button"
          aria-label="회비 상세 닫기"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-5">
          <section className={`rounded-3xl border p-5 shadow-sm ${getChargeFrameClassName(charge)}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
                {charge.targetScopeLabel}
              </span>
              {charge.overdueInvoiceCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                  연체 {charge.overdueInvoiceCount}건
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-5">
              <MetaItem label="발행 금액" value={charge.amountLabel} strong />
              <MetaItem label="마감일" value={charge.dueAtLabel ?? "미정"} />
              <MetaItem label="발행일" value={charge.issuedAtLabel ?? "미정"} />
              <MetaItem label="발행자" value={charge.issuedByDisplayName} />
              <MetaItem label="수금률" value={`${charge.collectionRate}%`} strong />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard compact label="대상" value={charge.totalInvoiceCount} />
              <MetricCard compact label="미납" value={charge.pendingInvoiceCount} />
              <MetricCard compact label="완납" value={charge.paidInvoiceCount} />
              <MetricCard compact label="면제" value={charge.waivedInvoiceCount} />
            </div>

            <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">
              {charge.note ?? "운영 메모 없음"}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Invoices</p>
                <h4 className="mt-1 text-lg font-bold text-slate-900">멤버별 청구 내역</h4>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {charge.totalInvoiceCount}건
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                멤버별 청구를 불러오는 중입니다.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            ) : null}

            {!loading && !error && invoices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                청구 대상이 없습니다.
              </div>
            ) : null}

            {!loading && !error
              ? invoices.map((invoice) => (
                  <div
                    key={invoice.invoiceId}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-bold text-slate-900">{invoice.memberDisplayName}</p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            {invoice.memberRoleCode ?? "MEMBER"}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getInvoiceStatusClassName(invoice)}`}
                          >
                            {invoice.paymentStatusLabel}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                          <MetaItem label="청구 금액" value={invoice.amountLabel} strong />
                          <MetaItem label="납부일" value={invoice.paidAtLabel ?? "미납"} />
                          <MetaItem label="메모" value={invoice.note ?? "없음"} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          disabled={
                            !canMarkPaid ||
                            activeInvoiceId === invoice.invoiceId ||
                            invoice.paymentStatus === "PAID"
                          }
                          onClick={() => onUpdateStatus(invoice.invoiceId, "PAID")}
                          className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          {activeInvoiceId === invoice.invoiceId ? "처리 중..." : "납부 완료"}
                        </button>
                        <button
                          type="button"
                          disabled={
                            !canMarkWaive ||
                            activeInvoiceId === invoice.invoiceId ||
                            invoice.paymentStatus === "WAIVED"
                          }
                          onClick={() => onUpdateStatus(invoice.invoiceId, "WAIVED")}
                          className="rounded-full bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          면제
                        </button>
                        <button
                          type="button"
                          disabled={
                            !canRestoreToPending ||
                            activeInvoiceId === invoice.invoiceId ||
                            (invoice.paymentStatus !== "PAID" && invoice.paymentStatus !== "WAIVED")
                          }
                          onClick={() => onUpdateStatus(invoice.invoiceId, "PENDING")}
                          className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          미납으로 복원
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              : null}
          </section>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  accent = false,
  compact = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ${
        accent ? "bg-orange-50 text-[#ec5b13]" : "bg-slate-50 text-slate-900"
      } ${compact ? "min-w-[72px]" : ""}`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.18em] ${
          accent ? "text-[#ec5b13]/70" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function MetaItem({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string | number;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-1 ${strong ? "font-semibold text-slate-900" : ""}`}>{value}</p>
    </div>
  );
}
