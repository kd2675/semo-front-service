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

  const groups = Array.from(Map.groupBy(items, (item) => item.group));

  return (
    <div className="space-y-5">
      {groups.map(([group, groupItems]) => (
        <section key={group} aria-labelledby={`more-navigation-${mode}-${group}`}>
          <h2 id={`more-navigation-${mode}-${group}`} className="mb-2 px-1 text-xs font-bold tracking-wide text-slate-500">
            {getMoreNavigationGroupLabel(group)}
          </h2>
          <div className="semo-list">
            {groupItems.map((item) => (
              <RouterLink
                key={item.key}
                href={item.href}
                onClick={() => onNavigate(item)}
                className={`semo-list-row group text-left focus-visible:outline-none focus-visible:ring-2 ${focusClassName}`}
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${iconSurfaceClassName} ${accentClassName}`}>
                  <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{item.iconName}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-slate-800">{item.label}</span>
                    {item.favorite ? (
                      <span className="material-symbols-outlined text-[17px] text-amber-500" aria-hidden="true">star</span>
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
                <span className="material-symbols-outlined text-[18px] text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true">chevron_right</span>
              </RouterLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
