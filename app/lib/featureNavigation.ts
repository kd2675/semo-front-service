import type { ClubFeatureSummary, ClubMoreFeatureStatus } from "@/app/lib/clubs";

export type MoreNavigationGroup = "CONTENT" | "OPERATIONS" | "PEOPLE" | "COMPETITION" | "DELEGATED";

export type MoreNavigationItem = {
  key: string;
  label: string;
  description: string;
  iconName: string;
  href: string;
  group: MoreNavigationGroup;
  featureKeys: string[];
  sortOrder: number;
  pendingCount?: number;
  overdueCount?: number;
  favorite?: boolean;
  lastUsedAt?: string | null;
};

const GROUP_LABELS: Record<MoreNavigationGroup, string> = {
  CONTENT: "대표 화면",
  OPERATIONS: "운영 도구",
  PEOPLE: "멤버와 소통",
  COMPETITION: "대회 운영",
  DELEGATED: "위임받은 운영 도구",
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  TODO: "내 배정 업무와 신청 가능한 업무를 확인하고 완료 상태를 관리합니다.",
  FINANCE: "회비 납부 현황과 정산 요청의 처리 상태를 확인합니다.",
  MEMBER_DIRECTORY: "멤버가 공개한 프로필과 직책을 확인합니다.",
  FEEDBACK: "운영진에게 비공개 피드백을 보내고 답변을 확인합니다.",
  JOIN_REQUEST: "가입 신청 대기열을 검토하고 승인 또는 반려합니다.",
  ROLE_MANAGEMENT: "직책별 책임과 세부 권한을 구성하고 멤버에게 배정합니다.",
  HANDOVER: "운영 임기, 집행부, 미완료 업무와 다음 담당자 메모를 한곳에서 관리합니다.",
};

const SCHEDULE_FEATURE_KEYS = new Set(["SCHEDULE_MANAGE", "POLL", "ATTENDANCE"]);
const COMPETITION_FEATURE_KEYS = new Set(["TOURNAMENT_RECORD", "BRACKET"]);

export function getMoreNavigationGroupLabel(group: MoreNavigationGroup) {
  return GROUP_LABELS[group];
}

function orderedEnabledFeatures(features: ClubFeatureSummary[]) {
  return features
    .filter((feature) => feature.enabled)
    .toSorted((left, right) => left.sortOrder - right.sortOrder || left.featureKey.localeCompare(right.featureKey));
}

function featureItem(
  feature: ClubFeatureSummary,
  group: MoreNavigationGroup,
  overrides?: Partial<Pick<MoreNavigationItem, "label" | "description" | "iconName" | "href">>,
): MoreNavigationItem {
  return {
    key: feature.featureKey,
    label: overrides?.label ?? feature.displayName,
    description: overrides?.description ?? FEATURE_DESCRIPTIONS[feature.featureKey] ?? feature.description ?? "클럽 운영 기능",
    iconName: overrides?.iconName ?? feature.iconName,
    href: overrides?.href ?? feature.userPath,
    group,
    featureKeys: [feature.featureKey],
    sortOrder: feature.sortOrder,
  };
}

function combinedItem(
  orderedFeatures: ClubFeatureSummary[],
  featureKeys: Set<string>,
  item: Omit<MoreNavigationItem, "featureKeys" | "sortOrder">,
): MoreNavigationItem | null {
  const matched = orderedFeatures.filter((feature) => featureKeys.has(feature.featureKey));
  if (matched.length === 0) return null;
  return {
    ...item,
    featureKeys: matched.map((feature) => feature.featureKey),
    sortOrder: matched[0].sortOrder,
  };
}

function competitionItem(
  orderedFeatures: ClubFeatureSummary[],
  clubId: string,
  admin: boolean,
): MoreNavigationItem | null {
  const tournament = orderedFeatures.find((feature) => feature.featureKey === "TOURNAMENT_RECORD");
  const bracket = orderedFeatures.find((feature) => feature.featureKey === "BRACKET");
  if (!tournament && !bracket) return null;
  const source = tournament ?? bracket!;
  return combinedItem(orderedFeatures, COMPETITION_FEATURE_KEYS, {
    key: "COMPETITION_CENTER",
    label: tournament && bracket ? "대회·대진표" : tournament ? "대회" : "대진표 초안",
    description: tournament && bracket
      ? "대회 신청부터 승인된 대진표까지 한 흐름에서 관리합니다."
      : tournament
        ? "대회 등록, 참가 신청과 승인 상태를 관리합니다."
        : "대회 참가자용 대진표 초안을 만들고 검토합니다.",
    iconName: "emoji_events",
    href: admin ? source.adminPath : source.userPath,
    group: "COMPETITION",
  });
}

function pushOnceAtFeature(
  items: MoreNavigationItem[],
  emittedKeys: Set<string>,
  currentFeatureKey: string,
  item: MoreNavigationItem | null,
) {
  if (!item || !item.featureKeys.includes(currentFeatureKey) || emittedKeys.has(item.key)) return;
  emittedKeys.add(item.key);
  items.push(item);
}

export function buildUserMoreNavigation(features: ClubFeatureSummary[], clubId: string): MoreNavigationItem[] {
  const ordered = orderedEnabledFeatures(features).filter((feature) => feature.navigationScope !== "ADMIN_ONLY");
  const competition = competitionItem(ordered, clubId, false);
  const items: MoreNavigationItem[] = [];
  const emittedKeys = new Set<string>();

  for (const feature of ordered) {
    switch (feature.featureKey) {
      case "TODO":
        items.push(featureItem(feature, "OPERATIONS", { label: "내 할 일", href: `/clubs/${clubId}/more/todos` }));
        break;
      case "FINANCE":
        items.push(featureItem(feature, "OPERATIONS", { label: "회비·정산", href: `/clubs/${clubId}/more/finance` }));
        break;
      case "MEMBER_DIRECTORY":
        items.push(featureItem(feature, "PEOPLE", { label: "멤버·조직", href: `/clubs/${clubId}/more/members` }));
        break;
      case "FEEDBACK":
        items.push(featureItem(feature, "PEOPLE", { href: `/clubs/${clubId}/more/feedback` }));
        break;
      case "TOURNAMENT_RECORD":
      case "BRACKET":
        pushOnceAtFeature(items, emittedKeys, feature.featureKey, competition);
        break;
    }
  }
  return items;
}

export function buildAdminMoreNavigation(features: ClubFeatureSummary[], clubId: string): MoreNavigationItem[] {
  const ordered = orderedEnabledFeatures(features);
  const schedule = combinedItem(ordered, SCHEDULE_FEATURE_KEYS, {
    key: "SCHEDULE_CONTENT",
    label: "일정·투표·참석",
    description: "일정 생성부터 참가 응답, 실제 출석 확인과 투표까지 대표 캘린더에서 관리합니다.",
    iconName: "calendar_month",
    href: `/clubs/${clubId}/schedule`,
    group: "CONTENT",
  });
  const competition = competitionItem(ordered, clubId, true);
  const items: MoreNavigationItem[] = [];
  const emittedKeys = new Set<string>();

  for (const feature of ordered) {
    switch (feature.featureKey) {
      case "NOTICE":
        items.push(featureItem(feature, "CONTENT", {
          label: "게시 콘텐츠",
          description: "공지와 게시판 공유 콘텐츠를 대표 게시판에서 관리합니다.",
          iconName: "forum",
          href: `/clubs/${clubId}/board`,
        }));
        break;
      case "SCHEDULE_MANAGE":
      case "POLL":
      case "ATTENDANCE":
        pushOnceAtFeature(items, emittedKeys, feature.featureKey, schedule);
        break;
      case "JOIN_REQUEST":
        items.push(featureItem(feature, "PEOPLE", { label: "가입 신청", href: `/clubs/${clubId}/admin/more/join-requests` }));
        break;
      case "MEMBER_DIRECTORY":
        items.push(featureItem(feature, "PEOPLE", { label: "멤버 공개 설정", href: `/clubs/${clubId}/admin/more/members` }));
        break;
      case "FEEDBACK":
        items.push(featureItem(feature, "PEOPLE", { label: "피드백 검토", href: `/clubs/${clubId}/admin/more/feedback` }));
        break;
      case "ROLE_MANAGEMENT":
        items.push(featureItem(feature, "OPERATIONS", { label: "조직·권한", href: `/clubs/${clubId}/admin/more/roles` }));
        break;
      case "HANDOVER":
        items.push(featureItem(feature, "OPERATIONS", { label: "인수인계 센터", href: `/clubs/${clubId}/admin/more/handover` }));
        break;
      case "TODO":
        items.push(featureItem(feature, "OPERATIONS", { label: "업무 운영", href: `/clubs/${clubId}/admin/more/todos` }));
        break;
      case "FINANCE":
        items.push(featureItem(feature, "OPERATIONS", { label: "재정 운영", href: `/clubs/${clubId}/admin/more/finance` }));
        break;
      case "TOURNAMENT_RECORD":
      case "BRACKET":
        pushOnceAtFeature(items, emittedKeys, feature.featureKey, competition);
        break;
    }
  }
  return items;
}

export function buildDelegatedAdminNavigation(
  features: ClubFeatureSummary[],
  clubId: string,
  adminToolFeatureKeys: string[],
): MoreNavigationItem[] {
  const allowedFeatureKeys = new Set(adminToolFeatureKeys);
  return buildAdminMoreNavigation(features, clubId)
    .filter((item) => item.group !== "CONTENT")
    .filter((item) => item.featureKeys.some((featureKey) => allowedFeatureKeys.has(featureKey)))
    .map((item) => ({ ...item, key: `DELEGATED_${item.key}`, group: "DELEGATED" }));
}

export function decorateMoreNavigationItems(
  items: MoreNavigationItem[],
  statuses: ClubMoreFeatureStatus[],
  mode: "user" | "admin",
): MoreNavigationItem[] {
  const statusByFeatureKey = new Map(statuses.map((status) => [status.featureKey, status]));

  return items.map((item) => {
    const itemStatuses = item.featureKeys
      .map((featureKey) => statusByFeatureKey.get(featureKey))
      .filter((status): status is ClubMoreFeatureStatus => Boolean(status));
    const primaryStatus = statusByFeatureKey.get(item.featureKeys[0] ?? "");

    return {
      ...item,
      pendingCount: itemStatuses.reduce(
        (total, status) => total + (mode === "admin" ? status.adminPendingCount : status.userPendingCount),
        0,
      ),
      overdueCount: itemStatuses.reduce(
        (total, status) => total + (mode === "admin" ? status.adminOverdueCount : status.userOverdueCount),
        0,
      ),
      favorite: primaryStatus?.favorite ?? false,
      lastUsedAt: primaryStatus?.lastUsedAt ?? null,
    };
  });
}
