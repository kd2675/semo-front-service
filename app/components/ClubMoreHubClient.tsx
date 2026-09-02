"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubRouteErrorState, ClubRouteLoadingState } from "@/app/components/ClubRouteState";
import { RouterLink } from "@/app/components/RouterLink";
import { useAppToast } from "@/app/hooks/useAppToast";
import {
  buildAdminMoreNavigation,
  buildDelegatedAdminNavigation,
  buildUserMoreNavigation,
  decorateMoreNavigationItems,
  getMoreNavigationGroupLabel,
  type MoreNavigationItem,
} from "@/app/lib/featureNavigation";
import {
  markClubMoreFeatureUsedMutationOptions,
  updateClubMoreFavoriteMutationOptions,
} from "@/app/lib/react-query/club/mutations";
import { clubMoreSummaryQueryOptions, clubQueryKeys } from "@/app/lib/react-query/club/queries";

type ClubMoreHubClientProps = {
  clubId: string;
  mode: "user" | "admin";
};

function formatRecentUsage(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ClubMoreHubClient({ clubId, mode }: ClubMoreHubClientProps) {
  const isAdmin = mode === "admin";
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  const summaryQuery = useQuery(clubMoreSummaryQueryOptions(clubId));
  const favoriteMutation = useMutation(updateClubMoreFavoriteMutationOptions(clubId));
  const usageMutation = useMutation(markClubMoreFeatureUsedMutationOptions(clubId));
  const [favoritePendingItemKey, setFavoritePendingItemKey] = useState<string | null>(null);
  const summary = summaryQuery.data ?? null;

  const items = useMemo(() => {
    if (!summary) return [];
    if (isAdmin) {
      const adminItems = summary.fullAdmin
        ? buildAdminMoreNavigation(summary.features, clubId)
        : buildDelegatedAdminNavigation(summary.features, clubId, summary.adminToolFeatureKeys);
      return decorateMoreNavigationItems(adminItems, summary.featureStatuses, "admin");
    }

    const userItems = decorateMoreNavigationItems(
      buildUserMoreNavigation(summary.features, clubId),
      summary.featureStatuses,
      "user",
    );
    if (summary.fullAdmin) return userItems;
    return [
      ...userItems,
      ...decorateMoreNavigationItems(
        buildDelegatedAdminNavigation(summary.features, clubId, summary.adminToolFeatureKeys),
        summary.featureStatuses,
        "admin",
      ),
    ];
  }, [clubId, isAdmin, summary]);

  const attentionItems = items.filter((item) => (item.pendingCount ?? 0) > 0);
  const favoriteItems = items.filter((item) => item.favorite);
  const recentItems = items
    .filter((item) => item.lastUsedAt)
    .toSorted((left, right) => (right.lastUsedAt ?? "").localeCompare(left.lastUsedAt ?? ""))
    .slice(0, 3);
  const groups = Array.from(Map.groupBy(items, (item) => item.group));
  const pendingCount = items.reduce((total, item) => total + (item.pendingCount ?? 0), 0);
  const overdueCount = items.reduce((total, item) => total + (item.overdueCount ?? 0), 0);
  const backHref = isAdmin ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`;
  const theme = isAdmin ? "admin" : "user";

  const handleNavigate = (item: MoreNavigationItem) => {
    if (item.featureKeys.length === 0) return;
    void Promise.allSettled(item.featureKeys.map((featureKey) => usageMutation.mutateAsync(featureKey)))
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: clubQueryKeys.moreSummary(clubId) });
      });
  };

  const handleFavorite = async (item: MoreNavigationItem) => {
    if (item.featureKeys.length === 0) return;
    setFavoritePendingItemKey(item.key);
    try {
      const results = await Promise.all(item.featureKeys.map((featureKey) => favoriteMutation.mutateAsync({
        featureKey,
        favorite: !item.favorite,
      })));
      const failedResult = results.find((result) => !result.ok);
      if (failedResult) {
        showToast(failedResult.message ?? "즐겨찾기를 저장하지 못했습니다.", "error");
        return;
      }
      showToast(item.favorite ? "즐겨찾기에서 해제했습니다." : "즐겨찾기에 추가했습니다.", "success");
    } catch {
      showToast("즐겨찾기를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setFavoritePendingItemKey(null);
      void queryClient.invalidateQueries({ queryKey: clubQueryKeys.moreSummary(clubId) });
    }
  };

  if (summaryQuery.isError && !summary) {
    return (
      <ClubRouteErrorState
        title={isAdmin ? "운영 허브" : "더보기"}
        message="더보기 운영 정보를 불러오지 못했습니다."
        backHref={backHref}
        theme={theme}
        onRetry={() => void summaryQuery.refetch()}
      />
    );
  }

  if (!summary) {
    return <ClubRouteLoadingState title={isAdmin ? "운영 허브를 준비하고 있습니다" : "더보기를 준비하고 있습니다"} theme={theme} />;
  }

  return (
    <div className="semo-app-shell text-slate-900">
      <ClubPageHeader
        title={isAdmin ? "운영 허브" : "더보기"}
        subtitle={summary.clubName}
        icon={isAdmin ? "space_dashboard" : "apps"}
        theme={theme}
      />

      <main className={`semo-nav-bottom-space px-4 py-5 ${isAdmin ? "semo-page-admin" : "semo-page-user"}`}>
        {pendingCount > 0 ? (
        <section className={`semo-feature-surface overflow-hidden border-0 p-5 text-white ${isAdmin ? "bg-slate-900" : "bg-[var(--primary)]"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white/65">지금 확인할 운영 항목</p>
              <p className="mt-2 text-3xl font-black tracking-tight">{pendingCount}건</p>
              <p className="mt-1 text-sm text-white/75">기능별 대기 항목을 한곳에서 확인하세요.</p>
            </div>
            <span className="material-symbols-outlined rounded-2xl bg-white/12 p-3 text-[28px]" aria-hidden="true">
              inbox
            </span>
          </div>
          {overdueCount > 0 ? (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-400/20 px-3 py-1.5 text-xs font-bold text-rose-100">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">warning</span>
              지연 {overdueCount}건 우선 확인
            </div>
          ) : null}
        </section>
        ) : (
          <section className="semo-status-strip" aria-label="처리할 항목 없음">
            <span className="material-symbols-outlined text-emerald-600" aria-hidden="true">task_alt</span>
            <div>
              <p className="text-sm font-bold text-slate-800">지금 확인할 항목이 없습니다.</p>
              <p className="mt-0.5 text-xs text-slate-500">필요한 기능은 아래 목록에서 바로 열 수 있습니다.</p>
            </div>
          </section>
        )}

        {attentionItems.length > 0 ? (
          <HubSection title="확인 필요" description="대기 또는 지연 상태가 있는 기능입니다.">
            <div className="semo-list">
              {attentionItems.map((item) => (
                <HubFeatureRow
                  key={`attention-${item.key}`}
                  item={item}
                  onNavigate={handleNavigate}
                  onFavorite={handleFavorite}
                  favoritePending={favoritePendingItemKey === item.key}
                />
              ))}
            </div>
          </HubSection>
        ) : null}

        {favoriteItems.length > 0 ? (
          <HubSection title="즐겨찾기" description="자주 쓰는 기능을 빠르게 열 수 있습니다.">
            <div className="semo-list">
              {favoriteItems.map((item) => (
                <HubFeatureRow
                  key={`favorite-${item.key}`}
                  item={item}
                  onNavigate={handleNavigate}
                  onFavorite={handleFavorite}
                  favoritePending={favoritePendingItemKey === item.key}
                />
              ))}
            </div>
          </HubSection>
        ) : null}

        {recentItems.length > 0 ? (
          <HubSection title="최근 사용" description="최근에 열어 본 기능입니다.">
            <div className="flex flex-wrap gap-2">
              {recentItems.map((item) => (
                <RouterLink
                  key={`recent-${item.key}`}
                  href={item.href}
                  onClick={() => handleNavigate(item)}
                  className="semo-control inline-flex items-center gap-2 border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{item.iconName}</span>
                  {item.label}
                  <span className="text-xs font-medium text-slate-400">{formatRecentUsage(item.lastUsedAt)}</span>
                </RouterLink>
              ))}
            </div>
          </HubSection>
        ) : null}

        <HubSection title="전체 기능" description="관리자가 설정한 순서와 내 접근 권한을 반영합니다.">
          {groups.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {groups.map(([group, groupItems]) => (
                <section key={group} aria-labelledby={`more-hub-group-${mode}-${group}`}>
                  <h3 id={`more-hub-group-${mode}-${group}`} className="mb-2 px-1 text-xs font-bold tracking-wide text-slate-400">
                    {getMoreNavigationGroupLabel(group)}
                  </h3>
                  <div className="semo-list">
                    {groupItems.map((item) => (
                      <HubFeatureRow
                        key={item.key}
                        item={item}
                        onNavigate={handleNavigate}
                        onFavorite={handleFavorite}
                        favoritePending={favoritePendingItemKey === item.key}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-card)] border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-300" aria-hidden="true">apps_outage</span>
              <p className="mt-2 text-sm font-bold text-slate-600">사용할 수 있는 기능이 없습니다.</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">기능 활성화 또는 직책 권한 설정을 확인해주세요.</p>
            </div>
          )}
        </HubSection>
      </main>
    </div>
  );
}

function HubSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="mb-3 px-1">
        <h2 className="text-base font-black text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function HubFeatureRow({
  item,
  onNavigate,
  onFavorite,
  favoritePending,
}: {
  item: MoreNavigationItem;
  onNavigate: (item: MoreNavigationItem) => void;
  onFavorite: (item: MoreNavigationItem) => void;
  favoritePending: boolean;
}) {
  const pendingCount = item.pendingCount ?? 0;
  const overdueCount = item.overdueCount ?? 0;
  const accentClassName = "bg-[var(--primary)]/10 text-[var(--primary)]";

  return (
    <article className="semo-list-row min-h-20 gap-2 px-3 py-2.5">
      <RouterLink
        href={item.href}
        onClick={() => onNavigate(item)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
        aria-label={`${item.label}${pendingCount > 0 ? `, 미처리 ${pendingCount}건` : ""}`}
      >
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accentClassName}`}>
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{item.iconName}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-slate-800">{item.label}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {pendingCount > 0 ? (
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${overdueCount > 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                {overdueCount > 0 ? `지연 ${overdueCount} · 전체 ${pendingCount}` : `대기 ${pendingCount}`}
              </span>
            ) : <span className="text-xs font-medium text-slate-500">바로가기</span>}
          </span>
        </span>
      </RouterLink>
      <button
        type="button"
        onClick={() => void onFavorite(item)}
        disabled={favoritePending}
        className={`semo-icon-control shrink-0 transition ${item.favorite ? "text-amber-500" : "text-slate-300 hover:bg-slate-50 hover:text-amber-500"}`}
        aria-label={item.favorite ? `${item.label} 즐겨찾기 해제` : `${item.label} 즐겨찾기 추가`}
        aria-pressed={Boolean(item.favorite)}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          aria-hidden="true"
          style={item.favorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {favoritePending ? "progress_activity" : "star"}
        </span>
      </button>
    </article>
  );
}
