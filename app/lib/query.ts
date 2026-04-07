import type { ApiResult } from "@/app/lib/api";

/**
 * API 에러를 React Query가 인식할 수 있도록 Error 객체로 변환한다.
 * React Query는 queryFn이 throw하면 에러 상태로 전환한다.
 */
export class ApiError extends Error {
  status?: number;
  code?: string | number;

  constructor(result: ApiResult<unknown>) {
    super(result.message ?? "요청에 실패했습니다.");
    this.name = "ApiError";
    this.status = result.status;
    this.code = result.code;
  }
}

/**
 * 기존 getJson/postJson 등이 반환하는 ApiResult<T>를
 * React Query queryFn 규격에 맞게 변환한다.
 *
 * - ok === true  → data를 그대로 반환 (T)
 * - ok === false → ApiError를 throw
 *
 * @example
 * useQuery({
 *   queryKey: ["clubs", clubId],
 *   queryFn: () => unwrap(getMyClub(clubId)),
 * });
 */
export async function unwrap<T>(promise: Promise<ApiResult<T>>): Promise<T> {
  const result = await promise;

  if (!result.ok) {
    throw new ApiError(result);
  }

  return result.data as T;
}
