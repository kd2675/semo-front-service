"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useSearchParams } from "next/navigation";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { useAppToast } from "@/app/hooks/useAppToast";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/modals/ScheduleActionConfirmModal";
import {
  type ClubAdminFinanceHomeResponse,
  type ClubAdminFinanceObligation,
  type ClubAdminFinanceObligationDetailResponse,
  type ClubAdminFinanceObligationFeedResponse,
  type ClubFinanceExpenseFeedResponse,
  type ClubFinanceExpense,
  type ClubFinanceMemberOption,
  type ClubFinanceOperationsResponse,
  type ClubFinanceRequestFeedResponse,
  type CreateFinancePeriodRequest,
  exportClubFinanceCsv,
  type FinanceAccount,
  type FinancePeriod,
  type UpsertFinanceAccountRequest,
  type UpsertFinanceBudgetRequest,
} from "@/app/lib/clubs";
import { FAB_RIGHT_OFFSET_CLASS_NAME, getActionFabBottomClass } from "@/app/lib/fab";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import {
  createAdminFinanceExpenseMutationOptions,
  closeFinancePeriodMutationOptions,
  createFinanceAccountMutationOptions,
  createFinanceObligationMutationOptions,
  createFinancePeriodMutationOptions,
  deactivateFinanceAccountMutationOptions,
  deleteFinanceObligationMutationOptions,
  reviewFinanceRequestMutationOptions,
  updateFinanceAccountMutationOptions,
  updateFinancePaymentStatusMutationOptions,
  upsertFinanceBudgetMutationOptions,
} from "@/app/lib/react-query/finance/mutations";
import {
  adminFinanceExpensesQueryOptions,
  adminFinanceHomeQueryOptions,
  adminFinanceOperationsQueryOptions,
  adminFinanceObligationDetailQueryOptions,
  adminFinanceObligationsQueryOptions,
  adminFinanceRequestsQueryOptions,
  financeQueryKeys,
} from "@/app/lib/react-query/finance/queries";
import {
  BillingTabPanel,
  CreateObligationModal,
  DashboardTabPanel,
  ExpenseEntryModal,
  ExpensesTabPanel,
  FinanceAccountEditorModal,
  FinanceActionSheetModal,
  FinanceBudgetEditorModal,
  FinanceExpenseDetailModal,
  FinanceOperationsPanel,
  FinancePeriodEditorModal,
  MetricCard,
  ObligationDetailModal,
  PermissionChip,
  SettlementsTabPanel,
} from "./components";

type ClubAdminFinanceClientProps = {
  clubId: string;
  initialData: ClubAdminFinanceHomeResponse;
  initialOperations: ClubFinanceOperationsResponse;
  initialObligationFeed: ClubAdminFinanceObligationFeedResponse;
  initialRequestFeed: ClubFinanceRequestFeedResponse;
  initialExpenseFeed: ClubFinanceExpenseFeedResponse;
};

type ObligationFilter = "ALL" | "OPEN" | "SETTLED";
type TargetScope = "ALL_ACTIVE_MEMBERS" | "SELECTED_MEMBERS";
type AdminFinanceTabKey = "DASHBOARD" | "BILLING" | "EXPENSES" | "SETTLEMENTS" | "OPERATIONS";

const ADMIN_FINANCE_TABS: Array<{ key: AdminFinanceTabKey; label: string }> = [
  { key: "DASHBOARD", label: "재정 대시보드" },
  { key: "BILLING", label: "회비 관리" },
  { key: "EXPENSES", label: "지출 관리" },
  { key: "SETTLEMENTS", label: "정산 관리" },
  { key: "OPERATIONS", label: "예산·마감" },
];

function resolveInitialFinanceTab(value: string | null): AdminFinanceTabKey {
  const normalized = value?.trim().toUpperCase();
  return ADMIN_FINANCE_TABS.some((tab) => tab.key === normalized)
    ? normalized as AdminFinanceTabKey
    : "DASHBOARD";
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
  initialOperations,
  initialObligationFeed,
  initialRequestFeed,
  initialExpenseFeed,
}: ClubAdminFinanceClientProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [finance, setFinance] = useState(initialData);
  const [operations, setOperations] = useState(initialOperations);
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
  const [accountEditor, setAccountEditor] = useState<FinanceAccount | null | undefined>(undefined);
  const [showPeriodEditor, setShowPeriodEditor] = useState(false);
  const [budgetPeriod, setBudgetPeriod] = useState<FinancePeriod | null>(null);
  const [operationsBusyKey, setOperationsBusyKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminFinanceTabKey>(() =>
    resolveInitialFinanceTab(searchParams.get("tab")),
  );
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("5000");
  const [dueAtDate, setDueAtDate] = useState("");
  const [dueAtTime, setDueAtTime] = useState("");
  const [note, setNote] = useState("");
  const [obligationPeriodId, setObligationPeriodId] = useState("");
  const [obligationAccountId, setObligationAccountId] = useState("");
  const [obligationScheduleId, setObligationScheduleId] = useState("");
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("NONE");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
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
  const [expensePeriodId, setExpensePeriodId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [expenseScheduleId, setExpenseScheduleId] = useState("");
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [activeObligationId, setActiveObligationId] = useState<number | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<number | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ClubFinanceExpense | null>(null);
  const [pendingDeleteObligation, setPendingDeleteObligation] = useState<ClubAdminFinanceObligation | null>(null);
  const { showToast, clearToast } = useAppToast();
  const createObligationMutation = useMutation(createFinanceObligationMutationOptions(clubId));
  const createExpenseMutation = useMutation(createAdminFinanceExpenseMutationOptions(clubId));
  const updatePaymentStatusMutation = useMutation(updateFinancePaymentStatusMutationOptions(clubId));
  const deleteObligationMutation = useMutation(deleteFinanceObligationMutationOptions(clubId));
  const reviewFinanceRequestMutation = useMutation(reviewFinanceRequestMutationOptions(clubId));
  const createAccountMutation = useMutation(createFinanceAccountMutationOptions(clubId));
  const updateAccountMutation = useMutation(updateFinanceAccountMutationOptions(clubId));
  const deactivateAccountMutation = useMutation(deactivateFinanceAccountMutationOptions(clubId));
  const createPeriodMutation = useMutation(createFinancePeriodMutationOptions(clubId));
  const upsertBudgetMutation = useMutation(upsertFinanceBudgetMutationOptions(clubId));
  const closePeriodMutation = useMutation(closeFinancePeriodMutationOptions(clubId));
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
    () => `${expenses.filter((expense) => expense.statusCode === "POSTED").reduce((sum, expense) => sum + expense.amount, 0).toLocaleString("ko-KR")}원`,
    [expenses],
  );

  const reloadOverview = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: financeQueryKeys.adminFinanceHome(clubId),
        exact: true,
        refetchType: "none",
      });
      const data = await queryClient.fetchQuery(adminFinanceHomeQueryOptions(clubId));
      setFinance(data);
      return data;
    } catch {
      showToast("재정 요약 정보를 다시 불러오지 못했습니다.", "error");
      return null;
    }
  };

  const reloadRequestFeed = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: financeQueryKeys.adminFinanceRequests(clubId),
        exact: true,
        refetchType: "none",
      });
      const data = await queryClient.fetchQuery(adminFinanceRequestsQueryOptions(clubId));
      setRequests(data.items);
      return data;
    } catch {
      showToast("재정 요청 목록을 다시 불러오지 못했습니다.", "error");
      return null;
    }
  };

  const reloadOperations = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: financeQueryKeys.adminFinanceOperations(clubId),
        exact: true,
        refetchType: "none",
      });
      const data = await queryClient.fetchQuery(adminFinanceOperationsQueryOptions(clubId));
      setOperations(data);
      return data;
    } catch {
      showToast("예산과 재정 기간 정보를 다시 불러오지 못했습니다.", "error");
      return null;
    }
  };

  const reloadExpenseFeed = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: financeQueryKeys.adminFinanceExpenses(clubId),
        exact: true,
        refetchType: "none",
      });
      const data = await queryClient.fetchQuery(adminFinanceExpensesQueryOptions(clubId));
      setExpenses(data.items);
      return data;
    } catch {
      showToast("지출 목록을 다시 불러오지 못했습니다.", "error");
      return null;
    }
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

    let data: ClubAdminFinanceObligationFeedResponse;
    try {
      data = await queryClient.fetchQuery(
        adminFinanceObligationsQueryOptions(clubId, {
          query: deferredSearchQuery,
          obligationFilter,
          cursorObligationId: mode === "append" ? nextCursorObligationId : null,
          size: 10,
        }),
      );
    } catch {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
      setLoadError("재정 항목을 불러오지 못했습니다.");
      return false;
    }
    loadingMoreRef.current = false;
    setIsLoadingMore(false);
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

    let detail: ClubAdminFinanceObligationDetailResponse;
    try {
      detail = await queryClient.fetchQuery(
        adminFinanceObligationDetailQueryOptions(clubId, obligationId),
      );
    } catch {
      setLoadingDetailIds((current) => current.filter((id) => id !== obligationId));
      const message = "재정 상세를 불러오지 못했습니다.";
      setObligationDetailErrors((current) => ({ ...current, [obligationId]: message }));
      return null;
    }

    setLoadingDetailIds((current) => current.filter((id) => id !== obligationId));
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
      setObligationPeriodId("");
      setObligationAccountId("");
      setObligationScheduleId("");
      setRecurrenceFrequency("NONE");
      setRecurrenceInterval("1");
      setRecurrenceEndDate("");
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
      setExpensePeriodId("");
      setExpenseAccountId("");
      setExpenseScheduleId("");
    });
  };

  const handleCreateObligation = async () => {
    if (!finance.canManageBilling || isCreating) {
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
    const parsedRecurrenceInterval = Number(recurrenceInterval);
    if (recurrenceFrequency !== "NONE" && !dueAtDate) {
      showToast("반복 회비는 첫 납부 마감일이 필요합니다.", "error");
      return;
    }
    if (!Number.isInteger(parsedRecurrenceInterval) || parsedRecurrenceInterval < 1 || parsedRecurrenceInterval > 24) {
      showToast("반복 간격은 1에서 24 사이의 정수여야 합니다.", "error");
      return;
    }

    setIsCreating(true);
    clearToast();
    const result = await createObligationMutation.mutateAsync({
      title: title.trim(),
      amount: parsedAmount,
      dueAt: combineDateTimeValue(dueAtDate, dueAtTime),
      note: note || null,
      targetScopeCode: targetScope,
      clubProfileIds: targetScope === "SELECTED_MEMBERS" ? selectedMemberIds : undefined,
      financePeriodId: obligationPeriodId ? Number(obligationPeriodId) : null,
      financeAccountId: obligationAccountId ? Number(obligationAccountId) : null,
      linkedScheduleEventId: obligationScheduleId ? Number(obligationScheduleId) : null,
      recurrenceFrequency,
      recurrenceInterval: parsedRecurrenceInterval,
      recurrenceEndDate: recurrenceFrequency === "NONE" ? null : recurrenceEndDate || null,
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
    void invalidateClubQueries(queryClient, clubId);
    setShowCreateModal(false);
    resetCreateForm();
    showToast(`${result.data.title} 항목을 ${result.data.createdCount}명에게 발행했습니다.`, "success");
  };

  const handleCreateExpense = async () => {
    if (!finance.canCreateExpenses || isCreatingExpense) {
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
    const result = await createExpenseMutation.mutateAsync({
      title: expenseTitle.trim(),
      categoryCode: expenseCategory,
      amount: parsedAmount,
      spentAt: combineDateTimeValue(expenseSpentDate, expenseSpentTime),
      relatedEventName: expenseRelatedEventName.trim() || null,
      note: expenseNote.trim() || null,
      financePeriodId: expensePeriodId ? Number(expensePeriodId) : null,
      financeAccountId: expenseAccountId ? Number(expenseAccountId) : null,
      linkedScheduleEventId: expenseScheduleId ? Number(expenseScheduleId) : null,
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
    void invalidateClubQueries(queryClient, clubId);
    setShowExpenseModal(false);
    resetExpenseForm();
    showToast(`${result.data.title} 지출을 장부에 추가했습니다.`, "success");
  };

  const handleUpdateStatus = async (
    obligationId: number,
    paymentId: number,
    paymentStatus: "PENDING" | "PAID" | "WAIVED",
    financeAccountId?: number | null,
    paymentMethodCode?: string | null,
  ) => {
    if (activePaymentId != null) {
      return;
    }

    setActivePaymentId(paymentId);
    clearToast();
    const result = await updatePaymentStatusMutation.mutateAsync({
      paymentId,
      paymentStatusCode: paymentStatus,
      financeAccountId,
      paymentMethodCode,
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
    void invalidateClubQueries(queryClient, clubId);
    showToast(`${result.data.memberDisplayName} 재정 상태를 변경했습니다.`, "success");
  };

  const handleDeleteObligation = async (obligation: ClubAdminFinanceObligation) => {
    if (!obligation.canDelete || activeObligationId != null) {
      return;
    }

    setActiveObligationId(obligation.obligationId);
    clearToast();
    const result = await deleteObligationMutation.mutateAsync(obligation.obligationId);
    setActiveObligationId(null);

    if (!result.ok) {
      showToast(result.message ?? "재정 항목 삭제에 실패했습니다.", "error");
      return;
    }

    const [overview] = await Promise.all([reloadOverview(), loadObligationFeed("reset")]);
    if (!overview) {
      return;
    }
    void invalidateClubQueries(queryClient, clubId);
    showToast(`${obligation.title} 재정 항목을 삭제했습니다.`, "success");
  };

  const handleReviewRequest = async (
    requestId: number,
    statusCode: "APPROVED" | "REJECTED",
  ) => {
    if (!finance.canReviewRequests) {
      showToast("재정 요청을 검토할 권한이 없습니다.", "error");
      return;
    }
    if (activeRequestId != null) {
      return;
    }

    setActiveRequestId(requestId);
    clearToast();
    const result = await reviewFinanceRequestMutation.mutateAsync({
      requestId,
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
    void invalidateClubQueries(queryClient, clubId);
    showToast(
      statusCode === "APPROVED"
        ? `${result.data.requestTypeLabel}을 승인하고 지출 원장에 반영했습니다.`
        : `${result.data.requestTypeLabel}을 반려했습니다.`,
      "success",
    );
  };

  const handleSaveAccount = async (request: UpsertFinanceAccountRequest) => {
    if (!request.displayName || operationsBusyKey) {
      showToast("계좌·결제수단 이름을 입력해주세요.", "error");
      return;
    }
    const editingAccount = accountEditor ?? null;
    setOperationsBusyKey("account:save");
    const result = editingAccount
      ? await updateAccountMutation.mutateAsync({ financeAccountId: editingAccount.financeAccountId, request })
      : await createAccountMutation.mutateAsync(request);
    setOperationsBusyKey(null);
    if (!result.ok) {
      showToast(result.message ?? "계좌·결제수단을 저장하지 못했습니다.", "error");
      return;
    }
    if (!(await reloadOperations())) return;
    setAccountEditor(undefined);
    showToast("계좌·결제수단을 저장했습니다.", "success");
  };

  const handleDeactivateAccount = async (account: FinanceAccount) => {
    if (operationsBusyKey) return;
    setOperationsBusyKey(`account:${account.financeAccountId}`);
    const result = await deactivateAccountMutation.mutateAsync(account.financeAccountId);
    setOperationsBusyKey(null);
    if (!result.ok) {
      showToast(result.message ?? "계좌·결제수단을 비활성화하지 못했습니다.", "error");
      return;
    }
    if (!(await reloadOperations())) return;
    showToast(`${account.displayName}을 비활성화했습니다.`, "success");
  };

  const handleCreatePeriod = async (request: CreateFinancePeriodRequest) => {
    if (!request.title || !request.startDate || !request.endDate || operationsBusyKey) {
      showToast("기간 이름과 시작일, 종료일을 모두 입력해주세요.", "error");
      return;
    }
    if (request.startDate > request.endDate) {
      showToast("종료일은 시작일보다 빠를 수 없습니다.", "error");
      return;
    }
    setOperationsBusyKey("period:create");
    const result = await createPeriodMutation.mutateAsync(request);
    setOperationsBusyKey(null);
    if (!result.ok) {
      showToast(result.message ?? "재정 기간을 만들지 못했습니다.", "error");
      return;
    }
    if (!(await reloadOperations())) return;
    setShowPeriodEditor(false);
    showToast("재정 기간을 만들었습니다.", "success");
  };

  const handleSaveBudget = async (request: UpsertFinanceBudgetRequest) => {
    if (!budgetPeriod || !Number.isFinite(request.allocatedAmount) || request.allocatedAmount < 0 || operationsBusyKey) {
      showToast("예산은 0 이상의 숫자로 입력해주세요.", "error");
      return;
    }
    setOperationsBusyKey(`period:${budgetPeriod.financePeriodId}`);
    const result = await upsertBudgetMutation.mutateAsync({ financePeriodId: budgetPeriod.financePeriodId, request });
    setOperationsBusyKey(null);
    if (!result.ok) {
      showToast(result.message ?? "예산을 저장하지 못했습니다.", "error");
      return;
    }
    if (!(await reloadOperations())) return;
    setBudgetPeriod(null);
    showToast("카테고리 예산을 저장했습니다.", "success");
  };

  const handleClosePeriod = async (period: FinancePeriod) => {
    if (operationsBusyKey) return;
    setOperationsBusyKey(`period:${period.financePeriodId}`);
    const result = await closePeriodMutation.mutateAsync(period.financePeriodId);
    setOperationsBusyKey(null);
    if (!result.ok) {
      showToast(result.message ?? "재정 기간을 마감하지 못했습니다.", "error");
      return;
    }
    if (!(await reloadOperations())) return;
    showToast(`${period.title} 기간을 마감했습니다.`, "success");
  };

  const handleExport = async (financePeriodId: number | null) => {
    if (operationsBusyKey) return;
    setOperationsBusyKey(`export:${financePeriodId ?? "all"}`);
    const result = await exportClubFinanceCsv(clubId, financePeriodId);
    setOperationsBusyKey(null);
    if (!result.ok || result.data == null) {
      showToast(result.message ?? "CSV 파일을 만들지 못했습니다.", "error");
      return;
    }
    const blobUrl = URL.createObjectURL(new Blob([result.data], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = `semo-finance-${financePeriodId ?? "all"}.csv`;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
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
    <div className="min-h-screen bg-[var(--background-light)] text-slate-900">
      <div className="min-h-screen bg-[#f8f6f6]">
        <ClubPageHeader
          title="재정 관리"
          subtitle={finance.clubName}
          icon="payments"
          theme="admin"
          containerClassName="semo-page-admin-wide"
        />

        <main className="semo-page-admin-wide semo-nav-bottom-space space-y-5 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold tracking-wide text-slate-400">재무 운영</p>
                <h2 className="mt-2 text-2xl font-bold">모임의 재정 흐름을 한곳에서 관리하세요.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  회비 발행과 수납 현황부터 회원 요청, 운영 지출까지 필요한 업무를 빠르게 이어갈 수 있습니다.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <PermissionChip label="조회" enabled />
                  <PermissionChip label="발행" enabled={finance.canIssue} />
                  <PermissionChip label="납부 완료" enabled={finance.canMarkPaid} />
                  <PermissionChip label="면제" enabled={finance.canMarkWaive} />
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-3 xl:max-w-[420px]">
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
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {ADMIN_FINANCE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  aria-pressed={activeTab === tab.key}
                  className={`w-full rounded-full px-4 py-2.5 text-sm font-bold transition sm:w-auto sm:shrink-0 ${
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
            <DashboardTabPanel
              finance={finance}
              pendingRequestCount={pendingRequestCount}
              expenseCount={expenses.length}
              reduceMotion={reduceMotion}
            />
          ) : null}

          {activeTab === "BILLING" ? (
            <BillingTabPanel
              obligations={obligations}
              obligationFilter={obligationFilter}
              searchQuery={searchQuery}
              reduceMotion={reduceMotion}
              activeObligationId={activeObligationId}
              hasNext={hasNext}
              isLoadingMore={isLoadingMore}
              loadError={loadError}
              onFilterChange={setObligationFilter}
              onSearchQueryChange={setSearchQuery}
              onOpenDetail={handleOpenObligationDetail}
              onDeleteRequest={setPendingDeleteObligation}
              onSetSentinelNode={setSentinelNode}
            />
          ) : null}

          {activeTab === "EXPENSES" ? (
            <ExpensesTabPanel
              clubId={clubId}
              pendingRequestCount={pendingRequestCount}
              totalExpenseAmountLabel={totalExpenseAmountLabel}
              advanceRequestItems={advanceRequestItems}
              expenses={expenses}
              canReview={finance.canReviewRequests}
              activeRequestId={activeRequestId}
              reduceMotion={reduceMotion}
              onReviewRequest={(requestId, decision) => void handleReviewRequest(requestId, decision)}
              onOpenExpense={setSelectedExpense}
            />
          ) : null}

          {activeTab === "SETTLEMENTS" ? (
            <SettlementsTabPanel
              clubId={clubId}
              settlementRequestItems={settlementRequestItems}
              canReview={finance.canReviewRequests}
              activeRequestId={activeRequestId}
              reduceMotion={reduceMotion}
              onReviewRequest={(requestId, decision) => void handleReviewRequest(requestId, decision)}
            />
          ) : null}

          {activeTab === "OPERATIONS" ? (
            <FinanceOperationsPanel
              operations={operations}
              reduceMotion={reduceMotion}
              busyKey={operationsBusyKey}
              onCreateAccount={() => setAccountEditor(null)}
              onEditAccount={setAccountEditor}
              onDeactivateAccount={(account) => void handleDeactivateAccount(account)}
              onCreatePeriod={() => setShowPeriodEditor(true)}
              onEditBudget={setBudgetPeriod}
              onClosePeriod={(period) => void handleClosePeriod(period)}
              onExport={(financePeriodId) => void handleExport(financePeriodId)}
            />
          ) : null}

        </main>

        {finance.canManageBilling || finance.canCreateExpenses ? (
          <button
            type="button"
            aria-label="재정 입력 메뉴"
            onClick={() => setShowActionSheet(true)}
            className={`fixed ${FAB_RIGHT_OFFSET_CLASS_NAME} ${getActionFabBottomClass(true)} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#ec5b13] text-white transition-transform active:scale-95`}
            style={{ boxShadow: "0 6px 16px rgba(236, 91, 19, 0.32)" }}
          >
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">add</span>
          </button>
        ) : null}

        <AnimatePresence>
          {detailObligationId && activeObligationSummary ? (
            <ObligationDetailModal
              obligation={activeObligationSummary}
              detail={activeObligationDetail}
              loading={activeDetailLoading}
              error={activeDetailError}
              canMarkPaid={finance.canMarkPaid}
              canMarkWaive={finance.canMarkWaive}
              canRestoreToPending={canRestoreToPending}
              activePaymentId={activePaymentId}
              collectionAccounts={operations.accounts.filter((account) => account.active && account.usageScopeCode !== "EXPENSE")}
              onClose={() => setDetailObligationId(null)}
              onUpdateStatus={(paymentId, paymentStatus, financeAccountId, paymentMethodCode) =>
                void handleUpdateStatus(activeObligationSummary.obligationId, paymentId, paymentStatus, financeAccountId, paymentMethodCode)
              }
            />
          ) : null}

          {showActionSheet ? (
            <FinanceActionSheetModal
              canCreateObligation={finance.canManageBilling}
              canCreateExpense={finance.canCreateExpenses}
              onClose={() => setShowActionSheet(false)}
              onOpenCreate={() => {
                setShowActionSheet(false);
                setShowCreateModal(true);
              }}
              onOpenExpense={() => {
                setShowActionSheet(false);
                setShowExpenseModal(true);
              }}
            />
          ) : null}

          {showCreateModal ? (
            <CreateObligationModal
              finance={finance}
              operations={operations}
              title={title}
              amount={amount}
              dueAtDate={dueAtDate}
              dueAtTime={dueAtTime}
              note={note}
              financePeriodId={obligationPeriodId}
              financeAccountId={obligationAccountId}
              linkedScheduleEventId={obligationScheduleId}
              recurrenceFrequency={recurrenceFrequency}
              recurrenceInterval={recurrenceInterval}
              recurrenceEndDate={recurrenceEndDate}
              targetScope={targetScope}
              selectedMemberIds={selectedMemberIds}
              memberSearchQuery={memberSearchQuery}
              filteredMembers={filteredMembers}
              selectedMemberSet={selectedMemberSet}
              isCreating={isCreating}
              onClose={() => setShowCreateModal(false)}
              onTitleChange={setTitle}
              onAmountChange={setAmount}
              onDueAtDateChange={setDueAtDate}
              onDueAtTimeChange={setDueAtTime}
              onNoteChange={setNote}
              onFinancePeriodIdChange={setObligationPeriodId}
              onFinanceAccountIdChange={setObligationAccountId}
              onLinkedScheduleEventIdChange={setObligationScheduleId}
              onRecurrenceFrequencyChange={setRecurrenceFrequency}
              onRecurrenceIntervalChange={setRecurrenceInterval}
              onRecurrenceEndDateChange={setRecurrenceEndDate}
              onTargetScopeChange={setTargetScope}
              onMemberSearchQueryChange={setMemberSearchQuery}
              onToggleSelectedMember={toggleSelectedMember}
              onCreate={() => void handleCreateObligation()}
            />
          ) : null}

          {showExpenseModal ? (
            <ExpenseEntryModal
              operations={operations}
              title={expenseTitle}
              amount={expenseAmount}
              category={expenseCategory}
              spentDate={expenseSpentDate}
              spentTime={expenseSpentTime}
              relatedEventName={expenseRelatedEventName}
              note={expenseNote}
              financePeriodId={expensePeriodId}
              financeAccountId={expenseAccountId}
              linkedScheduleEventId={expenseScheduleId}
              isCreating={isCreatingExpense}
              onClose={() => setShowExpenseModal(false)}
              onTitleChange={setExpenseTitle}
              onAmountChange={setExpenseAmount}
              onCategoryChange={setExpenseCategory}
              onSpentDateChange={setExpenseSpentDate}
              onSpentTimeChange={setExpenseSpentTime}
              onRelatedEventNameChange={setExpenseRelatedEventName}
              onNoteChange={setExpenseNote}
              onFinancePeriodIdChange={setExpensePeriodId}
              onFinanceAccountIdChange={setExpenseAccountId}
              onLinkedScheduleEventIdChange={setExpenseScheduleId}
              onCreate={() => void handleCreateExpense()}
            />
          ) : null}


          {accountEditor !== undefined ? (
            <FinanceAccountEditorModal
              account={accountEditor}
              busy={operationsBusyKey === "account:save"}
              onClose={() => setAccountEditor(undefined)}
              onSubmit={(request) => void handleSaveAccount(request)}
            />
          ) : null}

          {showPeriodEditor ? (
            <FinancePeriodEditorModal
              busy={operationsBusyKey === "period:create"}
              onClose={() => setShowPeriodEditor(false)}
              onSubmit={(request) => void handleCreatePeriod(request)}
            />
          ) : null}

          {budgetPeriod ? (
            <FinanceBudgetEditorModal
              period={budgetPeriod}
              busy={operationsBusyKey === `period:${budgetPeriod.financePeriodId}`}
              onClose={() => setBudgetPeriod(null)}
              onSubmit={(request) => void handleSaveBudget(request)}
            />
          ) : null}

          {selectedExpense ? (
            <FinanceExpenseDetailModal
              clubId={clubId}
              expense={selectedExpense}
              operations={operations}
              onClose={() => setSelectedExpense(null)}
              onChanged={(updatedExpense) => {
                setExpenses((current) => current.map((item) => item.expenseId === updatedExpense.expenseId ? updatedExpense : item));
                setSelectedExpense(updatedExpense);
                void reloadOperations();
              }}
            />
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
