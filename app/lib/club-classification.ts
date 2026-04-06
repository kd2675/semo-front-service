"use client";

export type ActivityCategoryKey =
  | "SPORTS"
  | "STUDY"
  | "CULTURE"
  | "VOLUNTEER"
  | "NETWORKING"
  | "OTHER";

export type ActivityTagKey =
  | "TENNIS"
  | "RUNNING"
  | "HIKING"
  | "CROSSFIT"
  | "CYCLING"
  | "SOCCER"
  | "FUTSAL"
  | "BASKETBALL"
  | "BADMINTON"
  | "SWIMMING"
  | "YOGA"
  | "PILATES"
  | "CLIMBING"
  | "GOLF"
  | "CODING"
  | "ENGLISH"
  | "LANGUAGE"
  | "DESIGN"
  | "MARKETING"
  | "CAREER"
  | "WRITING"
  | "FINANCE"
  | "CERTIFICATION"
  | "AI"
  | "DATA"
  | "READING"
  | "MOVIE"
  | "MUSIC"
  | "BAND"
  | "PHOTOGRAPHY"
  | "DRAWING"
  | "ART"
  | "TRAVEL"
  | "FOOD"
  | "COFFEE"
  | "WINE"
  | "BOARD_GAME"
  | "PERFORMANCE"
  | "EXHIBITION"
  | "VOLUNTEERING"
  | "ENVIRONMENT"
  | "ANIMAL_CARE"
  | "DONATION"
  | "COMMUNITY_SERVICE"
  | "EDUCATION_SUPPORT"
  | "NETWORKING"
  | "MEETUP"
  | "COMMUNITY"
  | "SOCIAL"
  | "FREELANCER"
  | "CREATOR"
  | "PROFESSIONAL";

export type AffiliationTypeKey = "INDEPENDENT" | "SCHOOL" | "COMPANY" | "LOCAL";

type ActivityCategoryOption = {
  key: ActivityCategoryKey;
  label: string;
  description: string;
};

type ActivityTagOption = {
  key: ActivityTagKey;
  label: string;
  category: ActivityCategoryKey;
};

type AffiliationTypeOption = {
  key: AffiliationTypeKey;
  label: string;
  description: string;
};

export const ACTIVITY_CATEGORY_OPTIONS: ActivityCategoryOption[] = [
  { key: "SPORTS", label: "운동", description: "스포츠와 피트니스 중심 모임" },
  { key: "STUDY", label: "스터디", description: "학습, 성장, 커리어 중심 모임" },
  { key: "CULTURE", label: "문화", description: "취향, 감상, 창작 중심 모임" },
  { key: "VOLUNTEER", label: "봉사", description: "공익 활동과 사회 기여 중심 모임" },
  { key: "NETWORKING", label: "교류", description: "직무, 친목, 커뮤니티 교류 중심 모임" },
  { key: "OTHER", label: "기타", description: "위 분류로 묶기 어려운 모임" },
];

export const ACTIVITY_TAG_OPTIONS: ActivityTagOption[] = [
  { key: "TENNIS", label: "테니스", category: "SPORTS" },
  { key: "RUNNING", label: "러닝", category: "SPORTS" },
  { key: "HIKING", label: "등산", category: "SPORTS" },
  { key: "CROSSFIT", label: "크로스핏", category: "SPORTS" },
  { key: "CYCLING", label: "사이클", category: "SPORTS" },
  { key: "SOCCER", label: "축구", category: "SPORTS" },
  { key: "FUTSAL", label: "풋살", category: "SPORTS" },
  { key: "BASKETBALL", label: "농구", category: "SPORTS" },
  { key: "BADMINTON", label: "배드민턴", category: "SPORTS" },
  { key: "SWIMMING", label: "수영", category: "SPORTS" },
  { key: "YOGA", label: "요가", category: "SPORTS" },
  { key: "PILATES", label: "필라테스", category: "SPORTS" },
  { key: "CLIMBING", label: "클라이밍", category: "SPORTS" },
  { key: "GOLF", label: "골프", category: "SPORTS" },
  { key: "CODING", label: "코딩", category: "STUDY" },
  { key: "ENGLISH", label: "영어", category: "STUDY" },
  { key: "LANGUAGE", label: "외국어", category: "STUDY" },
  { key: "DESIGN", label: "디자인", category: "STUDY" },
  { key: "MARKETING", label: "마케팅", category: "STUDY" },
  { key: "CAREER", label: "커리어", category: "STUDY" },
  { key: "WRITING", label: "글쓰기", category: "STUDY" },
  { key: "FINANCE", label: "경제", category: "STUDY" },
  { key: "CERTIFICATION", label: "자격증", category: "STUDY" },
  { key: "AI", label: "AI", category: "STUDY" },
  { key: "DATA", label: "데이터", category: "STUDY" },
  { key: "READING", label: "독서", category: "CULTURE" },
  { key: "MOVIE", label: "영화", category: "CULTURE" },
  { key: "MUSIC", label: "음악", category: "CULTURE" },
  { key: "BAND", label: "밴드", category: "CULTURE" },
  { key: "PHOTOGRAPHY", label: "사진", category: "CULTURE" },
  { key: "DRAWING", label: "드로잉", category: "CULTURE" },
  { key: "ART", label: "미술", category: "CULTURE" },
  { key: "TRAVEL", label: "여행", category: "CULTURE" },
  { key: "FOOD", label: "맛집", category: "CULTURE" },
  { key: "COFFEE", label: "커피", category: "CULTURE" },
  { key: "WINE", label: "와인", category: "CULTURE" },
  { key: "BOARD_GAME", label: "보드게임", category: "CULTURE" },
  { key: "PERFORMANCE", label: "공연", category: "CULTURE" },
  { key: "EXHIBITION", label: "전시", category: "CULTURE" },
  { key: "VOLUNTEERING", label: "봉사", category: "VOLUNTEER" },
  { key: "ENVIRONMENT", label: "환경", category: "VOLUNTEER" },
  { key: "ANIMAL_CARE", label: "동물보호", category: "VOLUNTEER" },
  { key: "DONATION", label: "기부", category: "VOLUNTEER" },
  { key: "COMMUNITY_SERVICE", label: "지역사회", category: "VOLUNTEER" },
  { key: "EDUCATION_SUPPORT", label: "교육지원", category: "VOLUNTEER" },
  { key: "NETWORKING", label: "네트워킹", category: "NETWORKING" },
  { key: "MEETUP", label: "밋업", category: "NETWORKING" },
  { key: "COMMUNITY", label: "커뮤니티", category: "NETWORKING" },
  { key: "SOCIAL", label: "친목", category: "NETWORKING" },
  { key: "FREELANCER", label: "프리랜서", category: "NETWORKING" },
  { key: "CREATOR", label: "창작자", category: "NETWORKING" },
  { key: "PROFESSIONAL", label: "직무교류", category: "NETWORKING" },
];

export const AFFILIATION_TYPE_OPTIONS: AffiliationTypeOption[] = [
  { key: "INDEPENDENT", label: "독립", description: "개인들이 자발적으로 만든 모임" },
  { key: "SCHOOL", label: "학교", description: "학교, 학과, 학생회 기반 모임" },
  { key: "COMPANY", label: "회사", description: "사내 동호회나 직장인 기반 모임" },
  { key: "LOCAL", label: "지역", description: "동네, 지역사회 기반 모임" },
];

const ACTIVITY_CATEGORY_LABELS = Object.fromEntries(
  ACTIVITY_CATEGORY_OPTIONS.map((option) => [option.key, option.label]),
) as Record<ActivityCategoryKey, string>;

const ACTIVITY_TAG_LABELS = Object.fromEntries(
  ACTIVITY_TAG_OPTIONS.map((option) => [option.key, option.label]),
) as Record<ActivityTagKey, string>;

const AFFILIATION_TYPE_LABELS = Object.fromEntries(
  AFFILIATION_TYPE_OPTIONS.map((option) => [option.key, option.label]),
) as Record<AffiliationTypeKey, string>;

export function getActivityTagOptionsByCategory(activityCategory: ActivityCategoryKey | null) {
  if (!activityCategory || activityCategory === "OTHER") {
    return [];
  }
  return ACTIVITY_TAG_OPTIONS.filter((option) => option.category === activityCategory);
}

export function filterCompatibleActivityTags(
  activityCategory: ActivityCategoryKey | null,
  activityTags: ActivityTagKey[],
) {
  if (!activityCategory || activityCategory === "OTHER") {
    return [];
  }
  return activityTags.filter((activityTag) =>
    ACTIVITY_TAG_OPTIONS.some((option) => option.key === activityTag && option.category === activityCategory),
  );
}

export function getActivityCategoryLabel(activityCategory: string | null | undefined) {
  if (!activityCategory) {
    return null;
  }
  return ACTIVITY_CATEGORY_LABELS[activityCategory as ActivityCategoryKey] ?? activityCategory;
}

export function getActivityTagLabel(activityTag: string | null | undefined) {
  if (!activityTag) {
    return null;
  }
  return ACTIVITY_TAG_LABELS[activityTag as ActivityTagKey] ?? activityTag;
}

export function getAffiliationTypeLabel(affiliationType: string | null | undefined) {
  if (!affiliationType) {
    return null;
  }
  return AFFILIATION_TYPE_LABELS[affiliationType as AffiliationTypeKey] ?? affiliationType;
}

export function getPrimaryClubActivityLabel(
  activityTags: Array<string | null | undefined>,
  activityCategory?: string | null,
  categoryKey?: string | null,
) {
  const firstTag = activityTags.find(Boolean);
  const firstTagLabel = getActivityTagLabel(firstTag);
  if (firstTagLabel) {
    return firstTagLabel;
  }
  const activityCategoryLabel = getActivityCategoryLabel(activityCategory);
  if (activityCategoryLabel) {
    return activityCategoryLabel;
  }
  const legacyLabel = getActivityTagLabel(categoryKey);
  if (legacyLabel) {
    return legacyLabel;
  }
  if (categoryKey === "OTHER") {
    return "기타";
  }
  return categoryKey ?? "기타";
}
