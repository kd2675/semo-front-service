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
import { RouteModal } from "@/app/components/RouteModal";
import { TimePopoverField } from "@/app/components/TimePopoverField";
import { useAppToast } from "@/app/hooks/useAppToast";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import {
  createClubAdminFinanceExpense,
  createClubFinanceObligation,
  deleteClubFinanceObligation,
  getClubAdminFinance,
  getClubAdminFinanceExpenses,
  getClubAdminFinanceObligationDetail,
  getClubAdminFinanceObligations,
  getClubAdminFinanceRequests,
  reviewClubFinanceRequest,
  updateClubFinancePaymentStatus,
  type ClubAdminFinanceHomeResponse,
  type ClubAdminFinanceObligation,
  type ClubAdminFinanceObligationDetailResponse,
  type ClubAdminFinanceObligationFeedResponse,
  type ClubFinanceExpense,
  type ClubFinanceExpenseFeedResponse,
  type ClubFinanceMemberOption,
  type ClubFinancePayment,
  type ClubFinanceRequest,
  type ClubFinanceRequestFeedResponse,
} from "@/app/lib/clubs";
import { FAB_RIGHT_OFFSET_CLASS_NAME, getActionFabBottomClass } from "@/app/lib/fab";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ClubAdminFinanceClientProps = {
  clubId: string;
  initialData: ClubAdminFinanceHomeResponse;
  initialObligationFeed: ClubAdminFinanceObligationFeedResponse;
  initialRequestFeed: ClubFinanceRequestFeedResponse;
  initialExpenseFeed: ClubFinanceExpenseFeedResponse;
};

type ObligationFilter = "ALL" | "OPEN" | "SETTLED";
type TargetScope = "ALL_ACTIVE_MEMBERS" | "SELECTED_MEMBERS";
type AdminFinanceTabKey = "DASHBOARD" | "BILLING" | "EXPENSES" | "SETTLEMENTS" | "LEDGER";

const TARGET_SCOPE_OPTIONS: { value: TargetScope; label: string; description: string }[] = [
  { value: "ALL_ACTIVE_MEMBERS", label: "활성 멤버 전체", description: "현재 활성 멤버 전체에게 한 번에 발행합니다." },
  { value: "SELECTED_MEMBERS", label: "선택 멤버만", description: "특정 멤버만 골라서 재정 항목을 발행합니다." },
];

const ADMIN_FINANCE_TABS: Array<{ key: AdminFinanceTabKey; label: string }> = [
  { key: "DASHBOARD", label: "재정 대시보드" },
  { key: "BILLING", label: "회비 관리" },
  { key: "EXPENSES", label: "지출 관리" },
  { key: "SETTLEMENTS", label: "정산 관리" },
  { key: "LEDGER", label: "장부" },
];

function getPaymentStatusClassName(payment: ClubFinancePayment) {
  if (payment.paymentStatusCode === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (payment.paymentStatusCode === "WAIVED") {
    return "bg-slate-200 text-slate-600";
  }
  if (payment.paymentStatusCode === "OVERDUE") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-amber-50 text-amber-700";
}

function getObligationFrameClassName(obligation: ClubAdminFinanceObligation) {
  if (obligation.overduePaymentCount > 0) {
    return "border-rose-200 bg-rose-50/30";
  }
  if (obligation.pendingPaymentCount > 0) {
    return "border-amber-200 bg-amber-50/30";
  }
  return "border-emerald-200 bg-emerald-50/20";
}

function getFinanceRequestStatusClassName(request: ClubFinanceRequest) {
  if (request.statusCode === "APPROVED") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (request.statusCode === "REJECTED") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-sky-50 text-sky-700";
}

function combineDateTimeValue(dateValue: string, timeValue: string) {
  if (!dateValue) {
    return null;
  }
  return `${dateValue}T${timeValue || "23:59"}:00`;
}

function mergeObligationSummary(
  current: ClubAdminFinanceObligation[],
  nextObligation: ClubAdminFinanceObligation,
) {
  return current.map((obligation) =>
    obligation.obligationId === nextObligation.obligationId ? nextObligation : obligation,
  );
}

export function ClubAdminFinanceClient({
  clubId,
  initialData,
  initialObligationFeed,
  initialRequestFeed,
  initialExpenseFeed,
}: ClubAdminFinanceClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [finance, setFinance] = useState(initialData);
  const [obligations, setObligations] = useState(initialObligationFeed.items);
  const [requests, setRequests] = useState(initialRequestFeed.items);
  const [expenses, setExpenses] = useState(initialExpenseFeed.items);
  const [nextCursorObligationId, setNextCursorObligationId] = useState<number | null>(
    initialObligationFeed.nextCursorObligationId,
  );
  const [hasNext, setHasNext] = useState(initialObligationFeed.hasNext);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const [detailObligationId, setDetailObligationId] = useState<number | null>(null);
  const [obligationDetailsById, setObligationDetailsById] = useState<
    Record<number, ClubAdminFinanceObligationDetailResponse>
  >({});
  const [obligationDetailErrors, setObligationDetailErrors] = useState<Record<number, string>>({});
  const [loadingDetailIds, setLoadingDetailIds] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminFinanceTabKey>("DASHBOARD");
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
  const [obligationFilter, setObligationFilter] = useState<ObligationFilter>("ALL");
  const [isCreating, setIsCreating] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("10000");
  const [expenseCategory, setExpenseCategory] = useState("SUPPLIES");
  const [expenseSpentDate, setExpenseSpentDate] = useState("");
  const [expenseSpentTime, setExpenseSpentTime] = useState("");
  const [expenseRelatedEventName, setExpenseRelatedEventName] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [activeObligationId, setActiveObligationId] = useState<number | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<number | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [pendingDeleteObligation, setPendingDeleteObligation] = useState<ClubAdminFinanceObligation | null>(null);
  const { showToast, clearToast } = useAppToast();
  const loadingMoreRef = useRef(false);
  const didMountFilterRef = useRef(false);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = deferredMemberSearchQuery.trim().toLowerCase();
    return finance.availableMembers.filter((member) => {
      if (!normalizedSearch) {
        return true;
      }
      return [member.memberDisplayName, member.memberRoleCode ?? ""].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    });
  }, [deferredMemberSearchQuery, finance.availableMembers]);

  const selectedMemberSet = useMemo(() => new Set(selectedMemberIds), [selectedMemberIds]);
  const loadingDetailSet = useMemo(() => new Set(loadingDetailIds), [loadingDetailIds]);
  const advanceRequestItems = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.requestTypeCode === "ADVANCE" || request.requestTypeCode === "REFUND_REQUEST",
      ),
    [requests],
  );
  const settlementRequestItems = useMemo(
    () => requests.filter((request) => request.requestTypeCode === "SETTLEMENT_REQUEST"),
    [requests],
  );
  const pendingRequestCount = useMemo(
    () => requests.filter((request) => request.statusCode === "SUBMITTED").length,
    [requests],
  );
  const totalExpenseAmountLabel = useMemo(
    () => `${expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString("ko-KR")}원`,
    [expenses],
  );

  const reloadOverview = async () => {
    const result = await getClubAdminFinance(clubId);
    if (!result.ok || !result.data) {
      showToast(result.message ?? "재정 요약 정보를 다시 불러오지 못했습니다.", "error");
      return null;
    }
    const data = result.data;

    startTransition(() => {
      setFinance(data);
    });
    return data;
  };

  const reloadRequestFeed = async () => {
    const result = await getClubAdminFinanceRequests(clubId);
    if (!result.ok || !result.data) {
      showToast(result.message ?? "재정 요청 목록을 다시 불러오지 못했습니다.", "error");
      return null;
    }
    startTransition(() => {
      setRequests(result.data!.items);
    });
    return result.data;
  };

  const reloadExpenseFeed = async () => {
    const result = await getClubAdminFinanceExpenses(clubId);
    if (!result.ok || !result.data) {
      showToast(result.message ?? "지출 목록을 다시 불러오지 못했습니다.", "error");
      return null;
    }
    startTransition(() => {
      setExpenses(result.data!.items);
    });
    return result.data;
  };

  const loadObligationFeed = async (mode: "reset" | "append") => {
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

    const result = await getClubAdminFinanceObligations(clubId, {
      query: deferredSearchQuery,
      obligationFilter,
      cursorObligationId: mode === "append" ? nextCursorObligationId : null,
      size: 10,
    });

    loadingMoreRef.current = false;
    setIsLoadingMore(false);

    if (!result.ok || !result.data) {
      setLoadError(result.message ?? "재정 항목을 불러오지 못했습니다.");
      return false;
    }

    const data = result.data;
    startTransition(() => {
      setObligations((current) => (mode === "append" ? [...current, ...data.items] : data.items));
      setNextCursorObligationId(data.nextCursorObligationId);
      setHasNext(data.hasNext);
      setLoadError(null);
      if (mode === "reset") {
        setObligationDetailsById({});
        setObligationDetailErrors({});
        setLoadingDetailIds([]);
      }
    });
    return true;
  };

  const loadObligationDetail = async (obligationId: number, force = false) => {
    if (!force && obligationDetailsById[obligationId]) {
      return obligationDetailsById[obligationId];
    }
    if (loadingDetailSet.has(obligationId)) {
      return null;
    }

    setLoadingDetailIds((current) =>
      current.includes(obligationId) ? current : [...current, obligationId],
    );
    setObligationDetailErrors((current) => {
      if (!(obligationId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[obligationId];
      return next;
    });

    const result = await getClubAdminFinanceObligationDetail(clubId, obligationId);

    setLoadingDetailIds((current) => current.filter((id) => id !== obligationId));

    if (!result.ok || !result.data) {
      const message = result.message ?? "재정 상세를 불러오지 못했습니다.";
      setObligationDetailErrors((current) => ({ ...current, [obligationId]: message }));
      return null;
    }

    const detail = result.data;
    startTransition(() => {
      setObligationDetailsById((current) => ({ ...current, [obligationId]: detail }));
      setObligations((current) => mergeObligationSummary(current, detail.obligation));
    });
    return detail;
  };

  const handleLoadMore = useEffectEvent(async () => {
    void loadObligationFeed("append");
  });

  const handleResetFeed = useEffectEvent(async () => {
    void loadObligationFeed("reset");
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
  }, [obligationFilter, deferredSearchQuery]);

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

  const resetExpenseForm = () => {
    startTransition(() => {
      setExpenseTitle("");
      setExpenseAmount("10000");
      setExpenseCategory("SUPPLIES");
      setExpenseSpentDate("");
      setExpenseSpentTime("");
      setExpenseRelatedEventName("");
      setExpenseNote("");
    });
  };

  const handleCreateObligation = async () => {
    if (!finance.canIssue || isCreating) {
      return;
    }

    const parsedAmount = Number(amount);
    if (!title.trim()) {
      showToast("재정 항목 이름을 입력해주세요.", "error");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showToast("금액은 0보다 커야 합니다.", "error");
      return;
    }
    if (targetScope === "SELECTED_MEMBERS" && selectedMemberIds.length === 0) {
      showToast("선택 멤버 발행은 대상 멤버를 한 명 이상 골라야 합니다.", "error");
      return;
    }

    setIsCreating(true);
    clearToast();
    const result = await createClubFinanceObligation(clubId, {
      title: title.trim(),
      amount: parsedAmount,
      dueAt: combineDateTimeValue(dueAtDate, dueAtTime),
      note: note || null,
      targetScopeCode: targetScope,
      clubProfileIds: targetScope === "SELECTED_MEMBERS" ? selectedMemberIds : undefined,
    });
    setIsCreating(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "재정 항목 발행에 실패했습니다.", "error");
      return;
    }

    const [overview] = await Promise.all([reloadOverview(), loadObligationFeed("reset")]);
    if (!overview) {
      return;
    }
    setShowCreateModal(false);
    resetCreateForm();
    showToast(`${result.data.title} 항목을 ${result.data.createdCount}명에게 발행했습니다.`, "success");
  };

  const handleCreateExpense = async () => {
    if (!finance.canIssue || isCreatingExpense) {
      return;
    }

    const parsedAmount = Number(expenseAmount);
    if (!expenseTitle.trim()) {
      showToast("지출 제목을 입력해주세요.", "error");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showToast("지출 금액은 0보다 커야 합니다.", "error");
      return;
    }

    setIsCreatingExpense(true);
    clearToast();
    const result = await createClubAdminFinanceExpense(clubId, {
      title: expenseTitle.trim(),
      categoryCode: expenseCategory,
      amount: parsedAmount,
      spentAt: combineDateTimeValue(expenseSpentDate, expenseSpentTime),
      relatedEventName: expenseRelatedEventName.trim() || null,
      note: expenseNote.trim() || null,
    });
    setIsCreatingExpense(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "지출 입력에 실패했습니다.", "error");
      return;
    }

    const expenseFeed = await reloadExpenseFeed();
    if (!expenseFeed) {
      return;
    }
    setShowExpenseModal(false);
    resetExpenseForm();
    showToast(`${result.data.title} 지출을 장부에 추가했습니다.`, "success");
  };

  const handleUpdateStatus = async (
    obligationId: number,
    paymentId: number,
    paymentStatus: "PENDING" | "PAID" | "WAIVED",
  ) => {
    if (activePaymentId != null) {
      return;
    }

    setActivePaymentId(paymentId);
    clearToast();
    const result = await updateClubFinancePaymentStatus(clubId, paymentId, {
      paymentStatusCode: paymentStatus,
    });
    setActivePaymentId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "재정 상태 변경에 실패했습니다.", "error");
      return;
    }

    const [overview, detail] = await Promise.all([
      reloadOverview(),
      loadObligationDetail(obligationId, true),
    ]);
    if (!overview || !detail) {
      return;
    }
    showToast(`${result.data.memberDisplayName} 재정 상태를 변경했습니다.`, "success");
  };

  const handleDeleteObligation = async (obligation: ClubAdminFinanceObligation) => {
    if (!obligation.canDelete || activeObligationId != null) {
      return;
    }

    setActiveObligationId(obligation.obligationId);
    clearToast();
    const result = await deleteClubFinanceObligation(clubId, obligation.obligationId);
    setActiveObligationId(null);

    if (!result.ok) {
      showToast(result.message ?? "재정 항목 삭제에 실패했습니다.", "error");
      return;
    }

    const [overview] = await Promise.all([reloadOverview(), loadObligationFeed("reset")]);
    if (!overview) {
      return;
    }
    showToast(`${obligation.title} 재정 항목을 삭제했습니다.`, "success");
  };

  const handleReviewRequest = async (
    requestId: number,
    statusCode: "APPROVED" | "REJECTED",
  ) => {
    if (!finance.canIssue) {
      showToast("재정 요청을 검토할 권한이 없습니다.", "error");
      return;
    }
    if (activeRequestId != null) {
      return;
    }

    setActiveRequestId(requestId);
    clearToast();
    const result = await reviewClubFinanceRequest(clubId, requestId, {
      statusCode,
      reviewNote: statusCode === "APPROVED" ? "운영진 검토 완료" : "운영진 검토 후 반려",
    });
    setActiveRequestId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "재정 요청 검토에 실패했습니다.", "error");
      return;
    }

    const requestFeed = await reloadRequestFeed();
    if (!requestFeed) {
      return;
    }
    showToast(`${result.data.requestTypeLabel}을 ${result.data.statusLabel} 처리했습니다.`, "success");
  };

  const toggleSelectedMember = (member: ClubFinanceMemberOption) => {
    startTransition(() => {
      setSelectedMemberIds((current) =>
        current.includes(member.clubProfileId)
          ? current.filter((id) => id !== member.clubProfileId)
          : [...current, member.clubProfileId],
      );
    });
  };

  const handleOpenObligationDetail = (obligationId: number) => {
    setDetailObligationId(obligationId);
    void loadObligationDetail(obligationId);
  };

  const canRestoreToPending = finance.canMarkPaid || finance.canMarkWaive;
  const activeObligationDetail =
    detailObligationId != null ? obligationDetailsById[detailObligationId] ?? null : null;
  const activeObligationSummary =
    detailObligationId == null
      ? null
      : activeObligationDetail?.obligation ??
        obligations.find((obligation) => obligation.obligationId === detailObligationId) ??
        null;
  const activeDetailError =
    detailObligationId != null ? obligationDetailErrors[detailObligationId] ?? null : null;
  const activeDetailLoading =
    detailObligationId != null && loadingDetailSet.has(detailObligationId);

  return (
    <div className={`${publicSans.className} min-h-screen bg-[#f8f6f6] text-slate-900`}>
      <div className="min-h-screen bg-[#f8f6f6]">
        <ClubPageHeader
          title="재정 관리"
          subtitle={finance.clubName}
          icon="payments"
          theme="admin"
          containerClassName="max-w-6xl"
        />

        <main className="semo-nav-bottom-space mx-auto w-full max-w-6xl space-y-5 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Finance Operations</p>
                <h2 className="mt-2 text-2xl font-bold">모임 돈을 운영하고 마감하는 흐름으로 재정 화면을 정리했습니다.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  청구 발행과 수납 상태는 기존 obligation/payment 데이터로 유지하고, 회원 요청과 운영 지출은
                  FAB 입력 흐름으로 바로 이어지게 재구성했습니다.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <PermissionChip label="조회" enabled />
                  <PermissionChip label="발행" enabled={finance.canIssue} />
                  <PermissionChip label="납부 완료" enabled={finance.canMarkPaid} />
                  <PermissionChip label="면제" enabled={finance.canMarkWaive} />
                </div>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[420px]">
                <MetricCard label="총 청구액" value={finance.totalBilledAmountLabel} accent />
                <MetricCard label="수납 완료" value={finance.totalCollectedAmountLabel} />
                <MetricCard label="미수금" value={finance.totalOutstandingAmountLabel} />
                <MetricCard label="면제 금액" value={finance.totalWaivedAmountLabel} />
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {ADMIN_FINANCE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                    activeTab === tab.key
                      ? "bg-[#ec5b13] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.section>

          {activeTab === "DASHBOARD" ? (
            <motion.section
              className="space-y-5"
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Dashboard KPI</p>
                    <h3 className="mt-2 text-xl font-bold">현재 운영 중인 회비/청구 흐름</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      아직은 지출·정산 장부가 아니라 청구와 수납 현황에 집중합니다. 현재 숫자는 모두 실제
                      obligation / payment 데이터 기준입니다.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MetricCard label="재정 항목" value={finance.totalObligationCount} />
                    <MetricCard label="총 납부건" value={finance.totalPaymentCount} />
                    <MetricCard label="연체" value={finance.overduePaymentCount} />
                    <MetricCard label="수납률" value={`${finance.collectionRate}%`} accent />
                  </div>
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-2">
                <WorkspaceStatusCard
                  title="회비 관리"
                  status="실동작"
                  description="청구 발행, 멤버별 납부 상태 관리, 면제 처리까지 현재 바로 운영할 수 있습니다."
                  metrics={[
                    { label: "활성 멤버", value: `${finance.activeMemberCount}명` },
                    { label: "미납", value: `${finance.pendingPaymentCount}건` },
                    { label: "연체", value: `${finance.overduePaymentCount}건` },
                  ]}
                />
                <WorkspaceStatusCard
                  title="확장 예정 영역"
                  status="실동작"
                  description="회원 요청 검토와 운영 지출 입력까지는 연결했습니다. 행사별 정산 마감과 장부 리포트는 다음 단계입니다."
                  metrics={[
                    { label: "요청 대기", value: `${pendingRequestCount}건` },
                    { label: "지출 입력", value: `${expenses.length}건` },
                    { label: "장부/리포트", value: "다음 단계" },
                  ]}
                  muted
                />
              </section>
            </motion.section>
          ) : null}

          {activeTab === "BILLING" ? (
            <motion.section
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Billing Management</p>
                  <h3 className="mt-2 text-xl font-bold">회비 관리</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    운영비, 가입비, 행사비처럼 모임 기준 청구를 발행하고 멤버별 납부 상태를 마감합니다.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex rounded-full bg-slate-100 p-1">
                    {(["ALL", "OPEN", "SETTLED"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setObligationFilter(filter)}
                        className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                          obligationFilter === filter
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
                {obligations.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    조건에 맞는 재정 항목이 없습니다.
                  </div>
                ) : (
                  obligations.map((obligation, index) => {
                    return (
                      <motion.article
                        key={obligation.obligationId}
                        className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${getObligationFrameClassName(obligation)}`}
                        {...staggeredFadeUpMotion(index + 3, reduceMotion)}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleOpenObligationDetail(obligation.obligationId)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleOpenObligationDetail(obligation.obligationId);
                            }
                          }}
                          className="flex cursor-pointer flex-col gap-5 text-left"
                          aria-label={`${obligation.title} 상세 보기`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
                                  {obligation.targetScopeLabel}
                                </span>
                                {obligation.overduePaymentCount > 0 ? (
                                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                                    연체 {obligation.overduePaymentCount}건
                                  </span>
                                ) : obligation.pendingPaymentCount > 0 ? (
                                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                    미납 {obligation.pendingPaymentCount}건
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                    정산 완료
                                  </span>
                                )}
                              </div>
                              <div className="mt-3 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="text-xl font-bold text-slate-900">{obligation.title}</h4>
                                  <p className="mt-2 text-sm text-slate-500">
                                    {obligation.amountLabel} · 마감 {obligation.dueAtLabel ?? "미정"} · 발행 {obligation.issuedByDisplayName}
                                  </p>
                                </div>
                                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[320px]">
                              <MetricCard compact label="대상" value={obligation.totalPaymentCount} />
                              <MetricCard compact label="미납" value={obligation.pendingPaymentCount} />
                              <MetricCard compact label="완납" value={obligation.paidPaymentCount} />
                              <MetricCard compact label="수납률" value={`${obligation.collectionRate}%`} accent />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 border-t border-white/80 pt-4">
                            <p className="text-xs font-medium text-slate-500">
                              멤버별 납부 상태와 면제 처리는 상세 보기에서 관리합니다.
                            </p>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenObligationDetail(obligation.obligationId);
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
                            disabled={!obligation.canDelete || activeObligationId === obligation.obligationId}
                            onClick={() => setPendingDeleteObligation(obligation)}
                            className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            {activeObligationId === obligation.obligationId ? "삭제 중..." : "미처리 재정 항목 삭제"}
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
                    {isLoadingMore ? "재정 항목을 더 불러오는 중..." : "스크롤을 내리면 다음 재정 항목 10개를 자동으로 불러옵니다."}
                  </div>
                ) : obligations.length > 0 ? (
                  <div className="pb-1 text-center text-sm text-slate-400">마지막 재정 항목까지 모두 불러왔습니다.</div>
                ) : null}
              </div>

              <div ref={setSentinelNode} className="h-16" />
            </motion.section>
          ) : null}

          {activeTab === "EXPENSES" ? (
            <motion.section
              className="space-y-5"
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Expense Operations</p>
                    <h3 className="mt-2 text-xl font-bold">지출 관리</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      회원 선지출과 환불 요청을 검토하고, 운영진이 직접 입력한 지출을 같은 화면에서 관리합니다.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <MetricCard label="요청 대기" value={pendingRequestCount} accent />
                    <MetricCard label="등록 지출" value={expenses.length} />
                    <MetricCard label="누적 지출" value={totalExpenseAmountLabel} />
                  </div>
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Member Requests</p>
                      <h4 className="mt-1 text-lg font-bold text-slate-900">선지출 / 환불 요청</h4>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {advanceRequestItems.length}건
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {advanceRequestItems.length === 0 ? (
                      <EmptyAdminState
                        title="검토할 선지출/환불 요청이 없습니다."
                        description="회원이 FAB로 제출한 요청이 생기면 이 탭에서 승인 또는 반려할 수 있습니다."
                      />
                    ) : (
                      advanceRequestItems.map((request) => (
                        <AdminFinanceRequestCard
                          key={request.requestId}
                          request={request}
                          canReview={finance.canIssue}
                          busy={activeRequestId === request.requestId}
                          onApprove={() => void handleReviewRequest(request.requestId, "APPROVED")}
                          onReject={() => void handleReviewRequest(request.requestId, "REJECTED")}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Expense Ledger</p>
                      <h4 className="mt-1 text-lg font-bold text-slate-900">운영 지출 입력 내역</h4>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {expenses.length}건
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {expenses.length === 0 ? (
                      <EmptyAdminState
                        title="아직 입력된 지출이 없습니다."
                        description="FAB 버튼에서 지출 입력을 열어 운영비, 식비, 대관비를 바로 기록할 수 있습니다."
                      />
                    ) : (
                      expenses.map((expense) => (
                        <ExpenseLedgerCard key={expense.expenseId} expense={expense} />
                      ))
                    )}
                  </div>
                </div>
              </section>
            </motion.section>
          ) : null}

          {activeTab === "SETTLEMENTS" ? (
            <motion.section
              className="space-y-5"
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Settlement Operations</p>
                    <h3 className="mt-2 text-xl font-bold">정산 관리</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      행사별 분담 계산은 다음 단계에서 붙이고, 지금은 회원이 올린 정산 요청을 운영 관점에서 검토합니다.
                    </p>
                  </div>
                  <MetricCard label="정산 요청" value={settlementRequestItems.length} accent />
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Settlement Queue</p>
                    <h4 className="mt-1 text-lg font-bold text-slate-900">회원 정산 요청</h4>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    {settlementRequestItems.length}건
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {settlementRequestItems.length === 0 ? (
                    <EmptyAdminState
                      title="현재 정산 요청이 없습니다."
                      description="회원이 FAB에서 정산 요청을 제출하면 이 큐에서 승인 또는 반려할 수 있습니다."
                    />
                  ) : (
                    settlementRequestItems.map((request) => (
                      <AdminFinanceRequestCard
                        key={request.requestId}
                        request={request}
                        canReview={finance.canIssue}
                        busy={activeRequestId === request.requestId}
                        onApprove={() => void handleReviewRequest(request.requestId, "APPROVED")}
                        onReject={() => void handleReviewRequest(request.requestId, "REJECTED")}
                      />
                    ))
                  )}
                </div>
              </section>
            </motion.section>
          ) : null}

          {activeTab === "LEDGER" ? (
            <motion.section
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              <AdminPlaceholderPanel
                icon="menu_book"
                title="장부와 리포트는 수입·지출 원장이 붙으면 활성화됩니다."
                description="입금/출금/조정 내역, 카테고리별 집계, 활동 로그, 권한 분리와 리포트 출력을 이 탭에서 관리하게 됩니다."
                bullets={[
                  "수입 / 지출 / 조정 장부",
                  "카테고리 및 계정 관리",
                  "활동 로그와 권한 관리",
                ]}
              />
            </motion.section>
          ) : null}
        </main>

        {finance.canIssue ? (
          <button
            type="button"
            aria-label="재정 입력 메뉴"
            onClick={() => setShowActionSheet(true)}
            className={`fixed ${FAB_RIGHT_OFFSET_CLASS_NAME} ${getActionFabBottomClass(true)} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#ec5b13] text-white transition-transform active:scale-95`}
            style={{ boxShadow: "0 6px 16px rgba(236, 91, 19, 0.32)" }}
          >
            <span className="material-symbols-outlined text-[28px]">add</span>
          </button>
        ) : null}

        <AnimatePresence>
          {detailObligationId && activeObligationSummary ? (
            <RouteModal onDismiss={() => setDetailObligationId(null)}>
              <ObligationDetailModal
                obligation={activeObligationSummary}
                detail={activeObligationDetail}
                loading={activeDetailLoading}
                error={activeDetailError}
                canMarkPaid={finance.canMarkPaid}
                canMarkWaive={finance.canMarkWaive}
                canRestoreToPending={canRestoreToPending}
                activePaymentId={activePaymentId}
                onClose={() => setDetailObligationId(null)}
                onUpdateStatus={(paymentId, paymentStatus) =>
                  void handleUpdateStatus(activeObligationSummary.obligationId, paymentId, paymentStatus)
                }
              />
            </RouteModal>
          ) : null}

          {showActionSheet ? (
            <RouteModal
              onDismiss={() => setShowActionSheet(false)}
              contentClassName="max-w-md rounded-[2rem] sm:rounded-[2rem]"
            >
              <section className="px-5 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Admin Actions
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">재정 입력 메뉴</h3>
                  </div>
                  <button
                    type="button"
                    aria-label="재정 입력 메뉴 닫기"
                    onClick={() => setShowActionSheet(false)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionSheet(false);
                      setShowCreateModal(true);
                    }}
                    className="flex w-full items-start gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-[#ec5b13]/30 hover:bg-[#fff7f2]"
                  >
                    <div className="rounded-full bg-[#ec5b13]/10 p-2 text-[#ec5b13]">
                      <span className="material-symbols-outlined text-[20px]">add_card</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">재정 항목 발행</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        전체 멤버 또는 선택 멤버에게 회비·행사비를 발행합니다.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowActionSheet(false);
                      setShowExpenseModal(true);
                    }}
                    className="flex w-full items-start gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-[#ec5b13]/30 hover:bg-[#fff7f2]"
                  >
                    <div className="rounded-full bg-[#ec5b13]/10 p-2 text-[#ec5b13]">
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">지출 입력</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        운영비, 식비, 대관비, 환불 같은 실제 지출을 장부에 기록합니다.
                      </p>
                    </div>
                  </button>
                </div>
              </section>
            </RouteModal>
          ) : null}

          {showCreateModal ? (
            <RouteModal onDismiss={() => setShowCreateModal(false)} dismissOnBackdrop={false}>
              <section className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Create Obligation</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">새 재정 항목 발행</h3>
                  </div>
                  <button
                    type="button"
                    aria-label="재정 항목 발행 닫기"
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
                        항목 이름, 금액, 대상 멤버를 정하면 하나의 재정 항목으로 묶여 발행됩니다.
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
                            현재 활성 멤버 {finance.activeMemberCount}명을 기준으로 자동 발행됩니다.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 px-5 py-4">
                  <button
                    type="button"
                    disabled={!finance.canIssue || isCreating}
                    onClick={() => void handleCreateObligation()}
                    className="w-full rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d94f0b] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isCreating ? "발행 중..." : "재정 항목 발행"}
                  </button>
                </div>
              </section>
            </RouteModal>
          ) : null}

          {showExpenseModal ? (
            <RouteModal onDismiss={() => setShowExpenseModal(false)} dismissOnBackdrop={false}>
              <section className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Expense Entry</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">운영 지출 입력</h3>
                  </div>
                  <button
                    type="button"
                    aria-label="지출 입력 닫기"
                    onClick={() => setShowExpenseModal(false)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm leading-6 text-slate-500">
                      실제로 모임 계좌에서 나간 돈이나 운영진이 현장에서 결제한 건을 기록합니다.
                    </p>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">지출 제목</span>
                      <input
                        value={expenseTitle}
                        onChange={(event) => setExpenseTitle(event.target.value)}
                        placeholder="예: 4월 연습장 대관비"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">카테고리</span>
                        <select
                          value={expenseCategory}
                          onChange={(event) => setExpenseCategory(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                        >
                          <option value="MEMBERSHIP_FEE">회비</option>
                          <option value="EVENT_FEE">행사비</option>
                          <option value="MEAL">식비</option>
                          <option value="VENUE">대관비</option>
                          <option value="SUPPLIES">물품비</option>
                          <option value="TRANSPORT">교통비</option>
                          <option value="REFUND">환불</option>
                          <option value="OTHER">기타</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">금액</span>
                        <input
                          value={expenseAmount}
                          onChange={(event) => setExpenseAmount(event.target.value)}
                          inputMode="numeric"
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">지출 날짜</span>
                        <div className="mt-2">
                          <DatePopoverField
                            value={expenseSpentDate}
                            onChange={setExpenseSpentDate}
                            buttonClassName="py-3 focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                            placeholder="지출 날짜를 선택하세요"
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">지출 시간</span>
                        <div className="mt-2">
                          <TimePopoverField
                            value={expenseSpentTime}
                            onChange={setExpenseSpentTime}
                            disabled={!expenseSpentDate}
                            buttonClassName="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">관련 행사</span>
                      <input
                        value={expenseRelatedEventName}
                        onChange={(event) => setExpenseRelatedEventName(event.target.value)}
                        placeholder="예: 봄 시즌 훈련"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">메모</span>
                      <textarea
                        value={expenseNote}
                        onChange={(event) => setExpenseNote(event.target.value)}
                        rows={4}
                        placeholder="결제 수단, 현장 상황, 증빙 위치 등을 적어주세요."
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                      />
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-200 px-5 py-4">
                  <button
                    type="button"
                    disabled={isCreatingExpense}
                    onClick={() => void handleCreateExpense()}
                    className="w-full rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d94f0b] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isCreatingExpense ? "지출 입력 중..." : "지출 입력"}
                  </button>
                </div>
              </section>
            </RouteModal>
          ) : null}
        </AnimatePresence>
        {pendingDeleteObligation ? (
          <ScheduleActionConfirmModal
            title="재정 항목 삭제"
            description={`"${pendingDeleteObligation.title}" 항목을 삭제할까요?\n아직 아무도 처리하지 않은 납부 건만 함께 삭제됩니다.`}
            confirmLabel="재정 항목 삭제"
            busyLabel="삭제 중..."
            busy={activeObligationId === pendingDeleteObligation.obligationId}
            onCancel={() => {
              if (activeObligationId == null) {
                setPendingDeleteObligation(null);
              }
            }}
            onConfirm={() =>
              void handleDeleteObligation(pendingDeleteObligation).finally(() => {
                setPendingDeleteObligation(null);
              })
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function ObligationDetailModal({
  obligation,
  detail,
  loading,
  error,
  canMarkPaid,
  canMarkWaive,
  canRestoreToPending,
  activePaymentId,
  onClose,
  onUpdateStatus,
}: {
  obligation: ClubAdminFinanceObligation;
  detail: ClubAdminFinanceObligationDetailResponse | null;
  loading: boolean;
  error: string | null;
  canMarkPaid: boolean;
  canMarkWaive: boolean;
  canRestoreToPending: boolean;
  activePaymentId: number | null;
  onClose: () => void;
  onUpdateStatus: (
    paymentId: number,
    paymentStatus: "PENDING" | "PAID" | "WAIVED",
  ) => void;
}) {
  const payments = detail?.payments ?? [];

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Obligation Detail</p>
          <h3 className="mt-1 truncate text-xl font-bold text-slate-900">{obligation.title}</h3>
        </div>
        <button
          type="button"
          aria-label="재정 상세 닫기"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-5">
          <section className={`rounded-3xl border p-5 shadow-sm ${getObligationFrameClassName(obligation)}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
                {obligation.targetScopeLabel}
              </span>
              {obligation.overduePaymentCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                  연체 {obligation.overduePaymentCount}건
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-5">
              <MetaItem label="발행 금액" value={obligation.amountLabel} strong />
              <MetaItem label="마감일" value={obligation.dueAtLabel ?? "미정"} />
              <MetaItem label="발행일" value={obligation.issuedAtLabel ?? "미정"} />
              <MetaItem label="발행자" value={obligation.issuedByDisplayName} />
              <MetaItem label="수납률" value={`${obligation.collectionRate}%`} strong />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard compact label="대상" value={obligation.totalPaymentCount} />
              <MetricCard compact label="미납" value={obligation.pendingPaymentCount} />
              <MetricCard compact label="완납" value={obligation.paidPaymentCount} />
              <MetricCard compact label="면제" value={obligation.waivedPaymentCount} />
            </div>

            <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">
              {obligation.note ?? "운영 메모 없음"}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Payments</p>
                <h4 className="mt-1 text-lg font-bold text-slate-900">멤버별 납부 내역</h4>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {obligation.totalPaymentCount}건
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                멤버별 납부 내역을 불러오는 중입니다.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            ) : null}

            {!loading && !error && payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                납부 대상이 없습니다.
              </div>
            ) : null}

            {!loading && !error
              ? payments.map((payment) => (
                  <div
                    key={payment.paymentId}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-bold text-slate-900">{payment.memberDisplayName}</p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            {payment.memberRoleCode ?? "MEMBER"}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getPaymentStatusClassName(payment)}`}
                          >
                            {payment.paymentStatusLabel}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                          <MetaItem label="청구 금액" value={payment.amountLabel} strong />
                          <MetaItem label="납부일" value={payment.paidAtLabel ?? "미납"} />
                          <MetaItem label="메모" value={payment.note ?? "없음"} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          disabled={
                            !canMarkPaid ||
                            activePaymentId === payment.paymentId ||
                            payment.paymentStatusCode === "PAID"
                          }
                          onClick={() => onUpdateStatus(payment.paymentId, "PAID")}
                          className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          {activePaymentId === payment.paymentId ? "처리 중..." : "납부 완료"}
                        </button>
                        <button
                          type="button"
                          disabled={
                            !canMarkWaive ||
                            activePaymentId === payment.paymentId ||
                            payment.paymentStatusCode === "WAIVED"
                          }
                          onClick={() => onUpdateStatus(payment.paymentId, "WAIVED")}
                          className="rounded-full bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          면제
                        </button>
                        <button
                          type="button"
                          disabled={
                            !canRestoreToPending ||
                            activePaymentId === payment.paymentId ||
                            (payment.paymentStatusCode !== "PAID" && payment.paymentStatusCode !== "WAIVED")
                          }
                          onClick={() => onUpdateStatus(payment.paymentId, "PENDING")}
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

function PermissionChip({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        enabled ? "bg-[#fff5ef] text-[#ec5b13]" : "bg-slate-100 text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}

function WorkspaceStatusCard({
  title,
  status,
  description,
  metrics,
  muted = false,
}: {
  title: string;
  status: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  muted?: boolean;
}) {
  return (
    <article
      className={`rounded-[28px] border p-5 shadow-sm ${
        muted ? "border-slate-200 bg-slate-50" : "border-[#ec5b13]/15 bg-[#fff7f2]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg font-bold text-slate-900">{title}</h4>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            muted ? "bg-white text-slate-500" : "bg-[#ec5b13] text-white"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
            <p className="mt-2 text-base font-bold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function AdminPlaceholderPanel({
  icon,
  title,
  description,
  bullets,
}: {
  icon: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <article className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white p-2 text-slate-500">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {bullets.map((bullet) => (
              <div key={bullet} className="rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-slate-700">
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyAdminState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function AdminFinanceRequestCard({
  request,
  canReview,
  busy,
  onApprove,
  onReject,
}: {
  request: ClubFinanceRequest;
  canReview: boolean;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const reviewDone = request.statusCode !== "SUBMITTED";
  const actionsDisabled = reviewDone || busy || !canReview;

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getFinanceRequestStatusClassName(request)}`}
            >
              {request.statusLabel}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
              {request.requestTypeLabel}
            </span>
          </div>
          <h4 className="mt-3 text-base font-bold text-slate-900">{request.title}</h4>
          <p className="mt-1 text-lg font-bold text-slate-900">{request.amountLabel}</p>
          <div className="mt-3 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
            <MetaItem label="요청자" value={request.requesterDisplayName} strong />
            <MetaItem label="제출 시각" value={request.submittedAtLabel ?? "방금"} />
            <MetaItem label="관련 행사" value={request.relatedEventName ?? "없음"} />
            <MetaItem label="검토 메모" value={request.reviewNote ?? "없음"} />
          </div>
          {request.note ? (
            <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">{request.note}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={onApprove}
          className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {busy ? "처리 중..." : "승인"}
        </button>
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={onReject}
          className="rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          반려
        </button>
        {!canReview ? (
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500">
            발행 권한이 있어야 검토할 수 있습니다.
          </span>
        ) : null}
        {reviewDone ? (
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500">
            {request.reviewedAtLabel ?? "검토 완료"}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ExpenseLedgerCard({ expense }: { expense: ClubFinanceExpense }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
              {expense.categoryLabel}
            </span>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[#ec5b13]">
              {expense.expenseTypeLabel}
            </span>
          </div>
          <h4 className="mt-3 text-base font-bold text-slate-900">{expense.title}</h4>
        </div>
        <p className="text-base font-bold text-slate-900">{expense.amountLabel}</p>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
        <MetaItem label="입력자" value={expense.enteredByDisplayName} strong />
        <MetaItem label="지출 시각" value={expense.spentAtLabel ?? "미정"} />
        <MetaItem label="관련 행사" value={expense.relatedEventName ?? "없음"} />
        <MetaItem label="메모" value={expense.note ?? "없음"} />
      </div>
    </article>
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
