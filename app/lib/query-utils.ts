import type { ApiResult } from "@/app/lib/api";

export class ApiResultError extends Error {
  status?: number;
  code?: string | number;

  constructor(message: string, options?: { status?: number; code?: string | number }) {
    super(message);
    this.name = "ApiResultError";
    this.status = options?.status;
    this.code = options?.code;
  }
}

export function requireApiData<T>(
  result: ApiResult<T>,
  fallbackMessage: string,
): T {
  if (result.ok && result.data != null) {
    return result.data;
  }

  throw new ApiResultError(result.message ?? fallbackMessage, {
    status: result.status,
    code: result.code,
  });
}

export function getApiDataOrFallback<T>(
  result: ApiResult<T>,
  fallbackValue: T,
): T {
  if (result.ok && result.data != null) {
    return result.data;
  }

  return fallbackValue;
}

export function getQueryErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
