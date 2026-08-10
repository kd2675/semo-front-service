import type { ClubFeatureSummary } from "@/app/lib/clubs";

export type MoreNavigationGroup = "CONTENT" | "OPERATIONS" | "PEOPLE" | "COMPETITION";

export type MoreNavigationItem = {
  key: string;
  label: string;
  description: string;
  iconName: string;
  href: string;
  group: MoreNavigationGroup;
  featureKeys: string[];
};

const GROUP_LABELS: Record<MoreNavigationGroup, string> = {
  CONTENT: "대표 화면",
  OPERATIONS: "운영 도구",
  PEOPLE: "멤버와 소통",
  COMPETITION: "대회 운영",
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  TODO: "내 배정 업무와 신청 가능한 업무를 확인하고 완료 상태를 관리합니다.",
  FINANCE: "회비 납부 현황과 정산 요청의 처리 상태를 확인합니다.",
  MEMBER_DIRECTORY: "멤버가 공개한 프로필과 직책을 확인합니다.",
  FEEDBACK: "운영진에게 비공개 피드백을 보내고 답변을 확인합니다.",
  JOIN_REQUEST: "가입 신청 대기열을 검토하고 승인 또는 반려합니다.",
  ROLE_MANAGEMENT: "직책별 책임과 세부 권한을 구성하고 멤버에게 배정합니다.",
  TIMELINE: "운영 작업의 감사 기록을 시간순으로 확인합니다.",
};

export function getMoreNavigationGroupLabel(group: MoreNavigationGroup) {
  return GROUP_LABELS[group];
}

function enabledFeatureMap(features: ClubFeatureSummary[]) {
  return new Map(
    features
      .filter((feature) => feature.enabled)
      .map((feature) => [feature.featureKey, feature]),
  );
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
  };
}

function competitionItem(
  featureByKey: Map<string, ClubFeatureSummary>,
  clubId: string,
  admin: boolean,
): MoreNavigationItem | null {
  const tournament = featureByKey.get("TOURNAMENT_RECORD");
  const bracket = featureByKey.get("BRACKET");
  if (!tournament && !bracket) {
    return null;
  }
  const featureKeys = [tournament?.featureKey, bracket?.featureKey].filter(
    (featureKey): featureKey is string => Boolean(featureKey),
  );
  const href = tournament
    ? admin
      ? `/clubs/${clubId}/admin/more/tournaments`
      : `/clubs/${clubId}/more/tournaments`
    : admin
      ? `/clubs/${clubId}/admin/more/brackets`
      : `/clubs/${clubId}/more/brackets`;

  return {
    key: "COMPETITION_CENTER",
    label: tournament && bracket ? "대회·대진표" : tournament ? "대회" : "대진표 초안",
    description: tournament && bracket
      ? "대회 신청부터 승인된 대진표까지 한 흐름에서 관리합니다."
      : tournament
        ? "대회 등록, 참가 신청과 승인 상태를 관리합니다."
        : "대회 참가자용 대진표 초안을 만들고 검토합니다.",
    iconName: "emoji_events",
    href,
    group: "COMPETITION",
    featureKeys,
  };
}

export function buildUserMoreNavigation(
  features: ClubFeatureSummary[],
  clubId: string,
): MoreNavigationItem[] {
  const featureByKey = enabledFeatureMap(
    features.filter((feature) => feature.navigationScope !== "ADMIN_ONLY"),
  );
  const items: MoreNavigationItem[] = [];

  const todo = featureByKey.get("TODO");
  const finance = featureByKey.get("FINANCE");
  const members = featureByKey.get("MEMBER_DIRECTORY");
  const feedback = featureByKey.get("FEEDBACK");

  if (todo) items.push(featureItem(todo, "OPERATIONS", { label: "내 할 일", href: `/clubs/${clubId}/more/todos` }));
  if (finance) items.push(featureItem(finance, "OPERATIONS", { label: "회비·정산", href: `/clubs/${clubId}/more/finance` }));
  if (members) items.push(featureItem(members, "PEOPLE", { label: "멤버·조직", href: `/clubs/${clubId}/more/members` }));
  if (feedback) items.push(featureItem(feedback, "PEOPLE", { href: `/clubs/${clubId}/more/feedback` }));

  const competition = competitionItem(featureByKey, clubId, false);
  if (competition) items.push(competition);
  return items;
}

export function buildAdminMoreNavigation(
  features: ClubFeatureSummary[],
  clubId: string,
): MoreNavigationItem[] {
  const featureByKey = enabledFeatureMap(features);
  const items: MoreNavigationItem[] = [];
  const notice = featureByKey.get("NOTICE");
  const schedule = featureByKey.get("SCHEDULE_MANAGE");
  const poll = featureByKey.get("POLL");
  const attendance = featureByKey.get("ATTENDANCE");

  if (notice) {
    items.push(featureItem(notice, "CONTENT", {
      label: "게시 콘텐츠",
      description: "공지와 게시판 공유 콘텐츠를 대표 게시판에서 관리합니다.",
      iconName: "forum",
      href: `/clubs/${clubId}/board`,
    }));
  }
  if (schedule || poll || attendance) {
    const source = schedule ?? poll ?? attendance!;
    items.push({
      ...featureItem(source, "CONTENT", {
        label: "일정·투표·참석",
        description: "일정 생성부터 참가 응답과 투표까지 대표 캘린더에서 관리합니다.",
        iconName: "calendar_month",
        href: `/clubs/${clubId}/schedule`,
      }),
      key: "SCHEDULE_CONTENT",
      featureKeys: [schedule?.featureKey, poll?.featureKey, attendance?.featureKey].filter(
        (featureKey): featureKey is string => Boolean(featureKey),
      ),
    });
  }

  const joinRequest = featureByKey.get("JOIN_REQUEST");
  const members = featureByKey.get("MEMBER_DIRECTORY");
  const feedback = featureByKey.get("FEEDBACK");
  if (joinRequest) items.push(featureItem(joinRequest, "PEOPLE", { label: "가입 신청", href: `/clubs/${clubId}/admin/more/join-requests` }));
  if (members) items.push(featureItem(members, "PEOPLE", { label: "멤버 공개 설정", href: `/clubs/${clubId}/admin/more/members` }));
  if (feedback) items.push(featureItem(feedback, "PEOPLE", { label: "피드백 검토", href: `/clubs/${clubId}/admin/more/feedback` }));

  const roles = featureByKey.get("ROLE_MANAGEMENT");
  const todo = featureByKey.get("TODO");
  const finance = featureByKey.get("FINANCE");
  const timeline = featureByKey.get("TIMELINE");
  if (roles) items.push(featureItem(roles, "OPERATIONS", { label: "조직·권한", href: `/clubs/${clubId}/admin/more/roles` }));
  if (todo) items.push(featureItem(todo, "OPERATIONS", { label: "업무 운영", href: `/clubs/${clubId}/admin/more/todos` }));
  if (finance) items.push(featureItem(finance, "OPERATIONS", { label: "재정 운영", href: `/clubs/${clubId}/admin/more/finance` }));
  if (timeline) items.push(featureItem(timeline, "OPERATIONS", { label: "운영 기록", href: `/clubs/${clubId}/admin/logs` }));

  const competition = competitionItem(featureByKey, clubId, true);
  if (competition) items.push(competition);
  return items;
}
