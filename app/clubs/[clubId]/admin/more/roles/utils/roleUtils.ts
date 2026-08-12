import type {
  ClubAdminMember,
  ClubFeatureAccessLevel,
  ClubPermissionGroup,
  ClubPositionFeatureGrant,
  ClubPositionFeatureGrantInput,
  ClubPositionSummary,
  ClubPositionTemplate,
} from "@/app/lib/clubs";
import { getClubRoleLabel } from "@/app/lib/roleLabels";

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
  "event_available",
  "payments",
  "admin_panel_settings",
] as const;

export const ROLE_ICON_LABELS: Record<(typeof ROLE_ICON_OPTIONS)[number], string> = {
  shield: "방패",
  workspace_premium: "인증 배지",
  verified: "승인 배지",
  stars: "별",
  military_tech: "메달",
  campaign: "공지",
  calendar_month: "달력",
  poll: "투표",
  forum: "대화",
  manage_accounts: "멤버 관리",
  event_available: "행사",
  payments: "재정",
  admin_panel_settings: "운영 관리",
};

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
  version: number;
  featureGrants: RoleFeatureGrantValue[];
};

export type RoleFeatureGrantValue = ClubPositionFeatureGrantInput & Partial<Pick<
  ClubPositionFeatureGrant,
  "policyVersion" | "currentPolicyVersion" | "status"
>>;

export function buildRoleFormValue(initialPosition?: ClubPositionSummary | null): RoleFormValue {
  return {
    displayName: initialPosition?.displayName ?? "",
    positionCode: initialPosition?.positionCode ?? "",
    description: initialPosition?.description ?? "",
    iconName: initialPosition?.iconName ?? "shield",
    colorHex: initialPosition?.colorHex ?? DEFAULT_ROLE_COLOR,
    active: initialPosition?.active ?? true,
    version: initialPosition?.version ?? 0,
    featureGrants: (initialPosition?.featureGrants ?? []).map(toGrantInput),
  };
}

export function applyRoleTemplate(
  current: RoleFormValue,
  template: ClubPositionTemplate,
): RoleFormValue {
  return {
    ...current,
    displayName: current.displayName.trim() ? current.displayName : template.displayName,
    description: current.description.trim() ? current.description : template.description,
    iconName: template.iconName,
    colorHex: template.colorHex,
    featureGrants: template.featureGrants.map((grant) => ({
      featureKey: grant.featureKey,
      accessLevel: grant.accessLevel,
      sensitivePermissionKeys: [],
    })),
  };
}

export function hasRoleFormChanges(left: RoleFormValue, right: RoleFormValue) {
  return (
    left.displayName.trim() !== right.displayName.trim() ||
    left.description.trim() !== right.description.trim() ||
    left.iconName !== right.iconName ||
    left.colorHex.toLowerCase() !== right.colorHex.toLowerCase() ||
    left.active !== right.active ||
    !hasSameFeatureGrants(left.featureGrants, right.featureGrants)
  );
}

function toGrantInput(grant: ClubPositionFeatureGrant | ClubPositionFeatureGrantInput): RoleFeatureGrantValue {
  return {
    featureKey: grant.featureKey,
    accessLevel: grant.accessLevel,
    sensitivePermissionKeys: [...grant.sensitivePermissionKeys],
    ...("currentPolicyVersion" in grant ? {
      policyVersion: grant.policyVersion,
      currentPolicyVersion: grant.currentPolicyVersion,
      status: grant.status,
    } : {}),
  };
}

function normalizeGrants(grants: RoleFeatureGrantValue[]) {
  return grants
    .map((grant) => ({
      featureKey: grant.featureKey,
      accessLevel: grant.accessLevel,
      policyVersion: grant.policyVersion ?? 0,
      sensitivePermissionKeys: [...grant.sensitivePermissionKeys].sort(),
    }))
    .sort((left, right) => left.featureKey.localeCompare(right.featureKey));
}

function hasSameFeatureGrants(left: RoleFeatureGrantValue[], right: RoleFeatureGrantValue[]) {
  const normalizedLeft = normalizeGrants(left);
  const normalizedRight = normalizeGrants(right);
  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }
  return normalizedLeft.every((grant, index) => {
    const other = normalizedRight[index];
    return grant.featureKey === other.featureKey
      && grant.accessLevel === other.accessLevel
      && grant.policyVersion === other.policyVersion
      && grant.sensitivePermissionKeys.join("\0") === other.sensitivePermissionKeys.join("\0");
  });
}

export function getFeatureAccessSelection(
  group: ClubPermissionGroup,
  featureGrants: RoleFeatureGrantValue[],
) {
  const grant = featureGrants.find((item) => item.featureKey === group.featureKey) ?? null;
  const accessLevelCode = grant?.accessLevel ?? "NONE";
  const accessLevel = group.accessLevels.find((level) => level.accessLevel === accessLevelCode) ?? null;

  return {
    grant,
    accessLevel,
    custom: grant != null && accessLevel == null,
    selectedSensitiveKeys: grant?.sensitivePermissionKeys ?? [],
  };
}

export function replaceFeatureAccessLevel(
  group: ClubPermissionGroup,
  featureGrants: RoleFeatureGrantValue[],
  accessLevel: ClubFeatureAccessLevel,
) {
  const otherGrants = featureGrants.filter((grant) => grant.featureKey !== group.featureKey);
  if (accessLevel.accessLevel === "NONE") {
    return otherGrants;
  }
  const previous = featureGrants.find((grant) => grant.featureKey === group.featureKey);
  return [...otherGrants, {
    ...previous,
    featureKey: group.featureKey,
    accessLevel: accessLevel.accessLevel,
    policyVersion: group.policyVersion,
    currentPolicyVersion: group.policyVersion,
    status: "CURRENT",
    sensitivePermissionKeys: previous?.sensitivePermissionKeys ?? [],
  }];
}

export function toggleFeatureSensitivePermission(
  group: ClubPermissionGroup,
  featureGrants: RoleFeatureGrantValue[],
  permissionKey: string,
) {
  const selection = getFeatureAccessSelection(group, featureGrants);
  const currentGrant = selection.grant;
  if (currentGrant == null) {
    return featureGrants;
  }
  const selectedKeys = currentGrant.sensitivePermissionKeys.includes(permissionKey)
    ? currentGrant.sensitivePermissionKeys.filter((item) => item !== permissionKey)
    : [...currentGrant.sensitivePermissionKeys, permissionKey];
  return featureGrants.map((grant) => grant.featureKey === group.featureKey
    ? { ...grant, sensitivePermissionKeys: selectedKeys }
    : grant);
}

export function getPositionFeatureAccessLabels(
  permissionGroups: ClubPermissionGroup[],
  featureGrants: RoleFeatureGrantValue[],
) {
  return permissionGroups.flatMap((group) => {
    const selection = getFeatureAccessSelection(group, featureGrants);
    const sensitiveCount = selection.selectedSensitiveKeys.length;
    if (selection.grant == null) {
      return [];
    }
    const levelLabel = selection.custom
      ? "기존 맞춤 설정"
      : selection.accessLevel?.displayName ?? "기존 맞춤 설정";
    return [`${group.displayName} · ${levelLabel}${sensitiveCount > 0 ? ` +추가 ${sensitiveCount}` : ""}`];
  });
}

export function applyLatestFeaturePolicy(
  group: ClubPermissionGroup,
  featureGrants: RoleFeatureGrantValue[],
) {
  return featureGrants.map((grant) => grant.featureKey === group.featureKey
    ? {
        ...grant,
        policyVersion: group.policyVersion,
        currentPolicyVersion: group.policyVersion,
        status: "CURRENT",
      }
    : grant);
}

export function hasRoleGrantChanges(left: RoleFormValue, right: RoleFormValue) {
  return !hasSameFeatureGrants(left.featureGrants, right.featureGrants);
}

export function toFeatureGrantRequests(featureGrants: RoleFeatureGrantValue[]): ClubPositionFeatureGrantInput[] {
  return featureGrants.map(({ featureKey, accessLevel, policyVersion, sensitivePermissionKeys }) => ({
    featureKey,
    accessLevel,
    policyVersion,
    sensitivePermissionKeys: [...sensitivePermissionKeys],
  }));
}

export function makeInitials(value: string, fallback = "MB") {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 2).toUpperCase() : fallback;
}

export function getRoleMemberSubtitle(member: ClubAdminMember) {
  return member.tagline?.trim() || getClubRoleLabel(member.roleCode);
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
