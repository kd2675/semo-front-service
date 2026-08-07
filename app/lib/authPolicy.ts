export const SEMO_UNSUPPORTED_ROLE_MESSAGE =
  "SEMO는 일반 사용자 또는 플랫폼 관리자 계정으로 이용할 수 있습니다.";

export function normalizeRole(role?: string | null): string | null {
  if (!role) {
    return null;
  }

  const normalized = role.trim().toUpperCase();
  return normalized.startsWith("ROLE_") ? normalized.slice(5) : normalized;
}

export function isSemoAccountRole(role?: string | null): boolean {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "USER" || normalizedRole === "ADMIN";
}
