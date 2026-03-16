export function getNoticeAccentClasses(accentTone: string) {
  switch (accentTone) {
    case "amber":
      return {
        badge: "bg-amber-50 text-amber-600",
        icon: "bg-amber-100 text-amber-600",
        iconRing: "ring-amber-500/20",
        chip: "border-amber-200 bg-amber-50 text-amber-700",
        progress: "bg-amber-500",
      };
    case "purple":
      return {
        badge: "bg-purple-50 text-purple-600",
        icon: "bg-purple-100 text-purple-600",
        iconRing: "ring-purple-500/20",
        chip: "border-purple-200 bg-purple-50 text-purple-700",
        progress: "bg-purple-500",
      };
    case "emerald":
      return {
        badge: "bg-emerald-50 text-emerald-600",
        icon: "bg-emerald-100 text-emerald-600",
        iconRing: "ring-emerald-500/20",
        chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
        progress: "bg-emerald-500",
      };
    case "slate":
      return {
        badge: "bg-slate-100 text-slate-600",
        icon: "bg-slate-100 text-slate-600",
        iconRing: "ring-slate-400/20",
        chip: "border-slate-200 bg-slate-50 text-slate-700",
        progress: "bg-slate-500",
      };
    case "blue":
    default:
      return {
        badge: "bg-blue-50 text-blue-600",
        icon: "bg-blue-100 text-[#135bec]",
        iconRing: "ring-[#135bec]/20",
        chip: "border-blue-200 bg-blue-50 text-[#135bec]",
        progress: "bg-[#135bec]",
      };
  }
}
