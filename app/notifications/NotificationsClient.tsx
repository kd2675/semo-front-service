"use client";

import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouterLink } from "@/app/components/RouterLink";
import { useAppToast } from "@/app/hooks/useAppToast";
import type { ClubNotificationFeed, ClubNotificationItem } from "@/app/lib/clubs";
import {
  markAllNotificationsReadMutationOptions,
  markNotificationReadMutationOptions,
} from "@/app/lib/react-query/notification/mutations";
import {
  notificationFeedInfiniteQueryOptions,
  notificationQueryKeys,
} from "@/app/lib/react-query/notification/queries";

type NotificationsClientProps = {
  backHref: string;
};

const NOTIFICATION_META: Record<string, { icon: string; label: string; tone: string }> = {
  JOIN_REQUEST_REVIEW: { icon: "group_add", label: "가입", tone: "bg-violet-50 text-violet-700" },
  TODO_APPLICATION_REVIEW: { icon: "task_alt", label: "업무", tone: "bg-blue-50 text-blue-700" },
  FINANCE_REQUEST_REVIEW: { icon: "receipt_long", label: "재정", tone: "bg-emerald-50 text-emerald-700" },
  FEEDBACK_STATUS: { icon: "forum", label: "피드백", tone: "bg-amber-50 text-amber-700" },
  TOURNAMENT_REVIEW: { icon: "emoji_events", label: "대회", tone: "bg-orange-50 text-orange-700" },
  TOURNAMENT_APPLICATION_REVIEW: { icon: "how_to_reg", label: "대회 신청", tone: "bg-orange-50 text-orange-700" },
  BRACKET_REVIEW: { icon: "account_tree", label: "대진표", tone: "bg-cyan-50 text-cyan-700" },
};

function notificationMeta(type: string) {
  return NOTIFICATION_META[type] ?? {
    icon: "notifications",
    label: "알림",
    tone: "bg-slate-100 text-slate-700",
  };
}

export function NotificationsClient({ backHref }: NotificationsClientProps) {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  const feedQuery = useInfiniteQuery(notificationFeedInfiniteQueryOptions(unreadOnly));
  const markReadMutation = useMutation(markNotificationReadMutationOptions());
  const markAllMutation = useMutation(markAllNotificationsReadMutationOptions());
  const items = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [feedQuery.data],
  );
  const unreadCount = feedQuery.data?.pages[0]?.unreadCount ?? 0;

  const updateReadCaches = (notificationId: number, nextUnreadCount: number) => {
    for (const feedUnreadOnly of [false, true]) {
      queryClient.setQueryData<InfiniteData<ClubNotificationFeed>>(
        notificationQueryKeys.feed(feedUnreadOnly),
        (current) => current ? {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            unreadCount: nextUnreadCount,
            items: feedUnreadOnly
              ? page.items.filter((item) => item.notificationId !== notificationId)
              : page.items.map((item) => item.notificationId === notificationId
                  ? { ...item, read: true }
                  : item),
          })),
        } : current,
      );
    }
    queryClient.setQueryData(notificationQueryKeys.summary(), { unreadCount: nextUnreadCount });
  };

  const updateAllReadCaches = () => {
    queryClient.setQueryData<InfiniteData<ClubNotificationFeed>>(
      notificationQueryKeys.feed(false),
      (current) => current ? {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          unreadCount: 0,
          items: page.items.map((item) => ({ ...item, read: true })),
        })),
      } : current,
    );
    queryClient.setQueryData<InfiniteData<ClubNotificationFeed>>(
      notificationQueryKeys.feed(true),
      (current) => current ? {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          unreadCount: 0,
          hasNext: false,
          nextCursor: null,
          items: [],
        })),
      } : current,
    );
    queryClient.setQueryData(notificationQueryKeys.summary(), { unreadCount: 0 });
  };

  const handleRead = (item: ClubNotificationItem) => {
    if (item.read || markReadMutation.isPending) return;
    markReadMutation.mutate(item.notificationId, {
      onSuccess: (result) => updateReadCaches(item.notificationId, result.unreadCount),
      onError: (error) => showToast(error.message, "error"),
    });
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || markAllMutation.isPending) return;
    markAllMutation.mutate(undefined, {
      onSuccess: () => {
        updateAllReadCaches();
        showToast("모든 알림을 읽음 처리했습니다.", "success");
      },
      onError: (error) => showToast(error.message, "error"),
    });
  };

  return (
    <div className="semo-user-theme min-h-screen bg-[var(--background-light)] text-slate-900">
      <ClubPageHeader
        title="알림함"
        subtitle={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}건` : "새 알림이 없습니다"}
        icon="notifications"
        showNotifications={false}
        leftSlot={(
          <RouterLink
            href={backHref}
            aria-label="이전 화면으로 이동"
            className="semo-icon-control -ml-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          </RouterLink>
        )}
        rightSlot={unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markAllMutation.isPending}
            className="semo-control border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            {markAllMutation.isPending ? "처리 중" : "모두 읽음"}
          </button>
        ) : null}
      />

      <main className="semo-page-user px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        <div className="mb-5 grid grid-cols-2 rounded-[var(--radius-control)] bg-slate-100 p-1" role="tablist" aria-label="알림 필터">
          {([
            { value: false, label: "전체" },
            { value: true, label: `읽지 않음${unreadCount > 0 ? ` ${unreadCount}` : ""}` },
          ] as const).map((tab) => (
            <button
              key={String(tab.value)}
              type="button"
              role="tab"
              aria-selected={unreadOnly === tab.value}
              onClick={() => setUnreadOnly(tab.value)}
              className={`min-h-10 rounded-[calc(var(--radius-control)-4px)] px-3 text-sm font-bold transition ${
                unreadOnly === tab.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {feedQuery.isPending ? (
          <NotificationLoading />
        ) : feedQuery.isError ? (
          <section className="semo-card px-5 py-8 text-center" role="alert">
            <span className="material-symbols-outlined text-3xl text-rose-500" aria-hidden="true">error</span>
            <h2 className="mt-3 text-base font-bold">알림을 불러오지 못했습니다</h2>
            <p className="mt-1 text-sm text-slate-500">연결 상태를 확인한 뒤 다시 시도해주세요.</p>
            <button
              type="button"
              onClick={() => void feedQuery.refetch()}
              className="semo-control mt-5 bg-[var(--primary)] px-4 text-sm font-bold text-white"
            >
              다시 시도
            </button>
          </section>
        ) : items.length === 0 ? (
          <section className="semo-card px-5 py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300" aria-hidden="true">
              {unreadOnly ? "done_all" : "notifications_none"}
            </span>
            <h2 className="mt-3 text-base font-bold text-slate-700">
              {unreadOnly ? "읽지 않은 알림이 없습니다" : "아직 도착한 알림이 없습니다"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              승인과 검토 결과가 생기면 이곳에 안전하게 보관됩니다.
            </p>
          </section>
        ) : (
          <div className="space-y-3" role="feed" aria-label="알림 목록">
            {items.map((item) => (
              <NotificationCard key={item.notificationId} item={item} onRead={handleRead} />
            ))}
          </div>
        )}

        {feedQuery.hasNextPage ? (
          <button
            type="button"
            onClick={() => void feedQuery.fetchNextPage()}
            disabled={feedQuery.isFetchingNextPage}
            className="semo-control mt-5 w-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            {feedQuery.isFetchingNextPage ? "불러오는 중" : "이전 알림 더 보기"}
          </button>
        ) : null}
      </main>
    </div>
  );
}

function NotificationCard({
  item,
  onRead,
}: {
  item: ClubNotificationItem;
  onRead: (item: ClubNotificationItem) => void;
}) {
  const meta = notificationMeta(item.notificationType);
  const content = (
    <>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{meta.icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{meta.label}</span>
          {!item.read ? <span className="size-2 rounded-full bg-rose-500" aria-label="읽지 않음" /> : null}
          <time dateTime={item.createdAt ?? undefined} className="ml-auto text-[11px] text-slate-400">
            {item.createdAtLabel}
          </time>
        </span>
        <span className="mt-2 block text-sm font-bold leading-5 text-slate-900">{item.title}</span>
        <span className="mt-1 block break-keep text-xs leading-5 text-slate-500">{item.message}</span>
      </span>
      {item.targetPath ? (
        <span className="material-symbols-outlined shrink-0 self-center text-[20px] text-slate-300" aria-hidden="true">
          chevron_right
        </span>
      ) : null}
    </>
  );
  const className = `flex w-full items-start gap-3 rounded-[var(--radius-card)] border p-4 text-left transition ${
    item.read
      ? "border-slate-200 bg-white hover:border-slate-300"
      : "border-blue-100 bg-blue-50/45 hover:border-blue-200"
  }`;

  if (item.targetPath) {
    return (
      <RouterLink href={item.targetPath} onClick={() => onRead(item)} className={className}>
        {content}
      </RouterLink>
    );
  }

  return (
    <button type="button" onClick={() => onRead(item)} className={className} disabled={item.read}>
      {content}
    </button>
  );
}

function NotificationLoading() {
  return (
    <div className="space-y-3" role="status" aria-label="알림을 불러오는 중">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-28 animate-pulse rounded-[var(--radius-card)] bg-slate-200/65" aria-hidden="true" />
      ))}
    </div>
  );
}
