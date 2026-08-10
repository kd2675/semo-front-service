import { RouterLink } from "@/app/components/RouterLink";
import {
  getMoreNavigationGroupLabel,
  type MoreNavigationGroup,
  type MoreNavigationItem,
} from "@/app/lib/featureNavigation";

type MoreNavigationMenuProps = {
  items: MoreNavigationItem[];
  mode: "user" | "admin";
  onNavigate: () => void;
};

const GROUP_ORDER: MoreNavigationGroup[] = ["CONTENT", "OPERATIONS", "PEOPLE", "COMPETITION"];

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
      {GROUP_ORDER.map((group) => {
        const groupItems = items.filter((item) => item.group === group);
        if (groupItems.length === 0) return null;
        return (
          <section key={group} aria-labelledby={`more-group-${mode}-${group}`}>
            <h2
              id={`more-group-${mode}-${group}`}
              className="mb-2 px-1 text-xs font-bold tracking-wide text-slate-400"
            >
              {getMoreNavigationGroupLabel(group)}
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {groupItems.map((item) => (
                <RouterLink
                  key={item.key}
                  href={item.href}
                  onClick={onNavigate}
                  className={`group flex min-h-18 items-center gap-3 rounded-[var(--radius-card)] border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 ${focusClassName}`}
                >
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${iconSurfaceClassName} ${accentClassName}`}>
                    <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{item.iconName}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-800">{item.label}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-500">{item.description}</span>
                  </span>
                </RouterLink>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
