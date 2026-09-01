import { RouterLink } from "@/app/components/RouterLink";
import { getMoreNavigationGroupLabel, type MoreNavigationItem } from "@/app/lib/featureNavigation";

type MoreNavigationMenuProps = {
  items: MoreNavigationItem[];
  mode: "user" | "admin";
  onNavigate: (item: MoreNavigationItem) => void;
};

export function MoreNavigationMenu({ items, mode, onNavigate }: MoreNavigationMenuProps) {
  const accentClassName = mode === "admin" ? "text-[var(--color-admin-primary)]" : "text-[var(--primary)]";
  const iconSurfaceClassName = mode === "admin" ? "bg-orange-50" : "bg-blue-50";
  const focusClassName = mode === "admin"
    ? "focus-visible:ring-[var(--color-admin-primary)]/30"
    : "focus-visible:ring-[var(--primary)]/30";

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] bg-slate-50 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-slate-600">사용할 수 있는 운영 기능이 없습니다.</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">관리자가 기능을 활성화하면 이곳에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.map((item, index) => {
        const showGroupLabel = index === 0 || items[index - 1]?.group !== item.group;
        return (
          <div key={item.key}>
            {showGroupLabel ? (
              <h2 className="mb-2 px-1 text-xs font-bold tracking-wide text-slate-400">
                {getMoreNavigationGroupLabel(item.group)}
              </h2>
            ) : null}
            <RouterLink
              href={item.href}
              onClick={() => onNavigate(item)}
              className={`group flex min-h-18 items-center gap-3 rounded-[var(--radius-card)] border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 ${focusClassName}`}
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${iconSurfaceClassName} ${accentClassName}`}>
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{item.iconName}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-slate-800">{item.label}</span>
                  {item.favorite ? (
                    <span className="material-symbols-outlined text-[17px] text-amber-500" aria-hidden="true">
                      star
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-500">{item.description}</span>
              </span>
              {(item.pendingCount ?? 0) > 0 ? (
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
                    (item.overdueCount ?? 0) > 0
                      ? "bg-rose-50 text-rose-700"
                      : mode === "admin"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-blue-50 text-blue-700"
                  }`}
                  aria-label={`${item.label} 미처리 ${item.pendingCount}건${(item.overdueCount ?? 0) > 0 ? `, 지연 ${item.overdueCount}건` : ""}`}
                >
                  {(item.overdueCount ?? 0) > 0 ? `지연 ${item.overdueCount}` : item.pendingCount}
                </span>
              ) : null}
            </RouterLink>
          </div>
        );
      })}
    </div>
  );
}
