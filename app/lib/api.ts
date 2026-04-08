import axios from "axios";
import type { ResponseEnvelope } from "@/app/types/response";
import {
  clearAccessToken,
  getAccessToken,
  notifyAuthExpired,
  refreshAccessToken,
} from "@/app/lib/auth";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type ApiResult<T> = {
  ok: boolean;
  status?: number;
  data: T | null;
  message?: string;
  code?: string | number;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

const apiClient = axios.create({
  baseURL: API_BASE,
  transformResponse: [(value) => value],
  validateStatus: () => true,
});

function isEnvelope<T>(value: unknown): value is ResponseEnvelope<T> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.success === "boolean" &&
    (typeof record.code === "number" || typeof record.code === "string") &&
    typeof record.message === "string" &&
    "data" in record
  );
}

function shouldSendCredentials(credentials?: RequestCredentials): boolean {
  return (credentials ?? "include") === "include";
}

async function requestJson<T>(
  path: string,
  options: RequestOptions = {},
  retried = false,
): Promise<ApiResult<T>> {
  const method = options.method ?? "GET";
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await apiClient.request<string>({
      url: path,
      method,
      headers,
      withCredentials: shouldSendCredentials(options.credentials),
      data: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (response.status === 401 && !retried && path !== "/auth/refresh") {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return requestJson<T>(path, options, true);
      }
      clearAccessToken();
      notifyAuthExpired("refresh_failed");
    }

    const text = response.data;
    const parsed: unknown = text ? JSON.parse(text) : null;

    if (isEnvelope<T>(parsed)) {
      if (response.status >= 200 && response.status < 300 && parsed.success) {
        return {
          ok: true,
          status: response.status,
          data: parsed.data ?? null,
          message: parsed.message,
          code: parsed.code,
        };
      }

      return {
        ok: false,
        status: response.status,
        data: null,
        message: parsed.message,
        code: parsed.code,
      };
    }

    if (response.status >= 200 && response.status < 300) {
      return {
        ok: true,
        status: response.status,
        data: (parsed as T) ?? null,
      };
    }

    return {
      ok: false,
      status: response.status,
      data: null,
      message: response.statusText || "요청 처리에 실패했습니다.",
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        ok: false,
        data: null,
        message: error.message,
      };
    }

    return {
      ok: false,
      data: null,
      message: "알 수 없는 네트워크 오류가 발생했습니다.",
    };
  }
}

export function getJson<T>(
  path: string,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson(path, { method: "GET", headers });
}

export function postJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson(path, { method: "POST", body, headers });
}

export function putJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson(path, { method: "PUT", body, headers });
}

export function patchJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson(path, { method: "PATCH", body, headers });
}

export function deleteJson<T>(
  path: string,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson(path, { method: "DELETE", headers });
}
