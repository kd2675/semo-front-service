import type { ClubAdminMember, ClubPositionSummary } from "@/app/lib/clubs";

export const DEFAULT_ROLE_COLOR = "#904e00";

export const ROLE_ICON_OPTIONS = [
  "shield",
  "workspace_premium",
  "verified",
  "stars",
  "military_tech",
  "campaign",
  "calendar_month",
  "poll",
  "forum",
  "manage_accounts",
] as const;

export const ROLE_COLOR_OPTIONS = [
  DEFAULT_ROLE_COLOR,
  "#0053dd",
  "#49636f",
  "#a83836",
  "#0f172a",
  "#15803d",
  "#7c3aed",
] as const;

export type RoleFormValue = {
  displayName: string;
  positionCode: string;
  description: string;
  iconName: string;
  colorHex: string;
  active: boolean;
  permissionKeys: string[];
};

export function buildRoleFormValue(initialPosition?: ClubPositionSummary | null): RoleFormValue {
  return {
    displayName: initialPosition?.displayName ?? "",
    positionCode: initialPosition?.positionCode ?? "",
    description: initialPosition?.description ?? "",
    iconName: initialPosition?.iconName ?? "shield",
    colorHex: initialPosition?.colorHex ?? DEFAULT_ROLE_COLOR,
    active: initialPosition?.active ?? true,
    permissionKeys: initialPosition?.permissionKeys ?? [],
  };
}

export function makeInitials(value: string, fallback = "MB") {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 2).toUpperCase() : fallback;
}

export function getRoleMemberSubtitle(member: ClubAdminMember) {
  return member.tagline?.trim() || member.roleCode;
}

export function getRoleToneClass(member: ClubAdminMember) {
  switch (member.roleCode) {
    case "OWNER":
      return "bg-amber-100 text-amber-800";
    case "ADMIN":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(4, "0").slice(0, 4);
}

export function createAutoPositionCode(displayName: string, clubId: string) {
  const normalized = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const base = normalized.length > 0 ? normalized : "CUSTOM_ROLE";
  const suffix = hashText(`${clubId}:${displayName.trim() || "role"}`);
  return `ROLE_${base}_${suffix}`.slice(0, 50);
}
