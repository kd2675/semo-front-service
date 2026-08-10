import axios from "axios";
import type { ResponseEnvelope } from "@/app/types/response";
import {
  clearAccessToken,
  getAccessToken,
  getUserFromToken,
  notifyAuthExpired,
  refreshAccessToken,
} from "@/app/lib/auth";

const API_MODE = process.env.NEXT_PUBLIC_API_MODE ?? "direct";
function getLocalApiBase(port: number) {
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return `http://localhost:${port}`;
}

const DEFAULT_GATEWAY_API_BASE = getLocalApiBase(8080);
const DEFAULT_DIRECT_SEMO_API_BASE = getLocalApiBase(20280);
const DEFAULT_DIRECT_AUTH_API_BASE = getLocalApiBase(9000);
const isGatewayMode = API_MODE === "gateway";

export const SEMO_API_BASE =
  process.env.NEXT_PUBLIC_SEMO_API_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? (isGatewayMode ? DEFAULT_GATEWAY_API_BASE : DEFAULT_DIRECT_SEMO_API_BASE);

export const AUTH_API_BASE =
  process.env.NEXT_PUBLIC_AUTH_API_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? (isGatewayMode ? DEFAULT_GATEWAY_API_BASE : DEFAULT_DIRECT_AUTH_API_BASE);

export const API_BASE = SEMO_API_BASE;
export const SEMO_CLIENT_ID =
  process.env.NEXT_PUBLIC_CLIENT_ID ?? "semo-front-service";

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
  baseUrl?: string;
};

const apiClient = axios.create({
  timeout: 10_000,
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
    typeof record.message === "string"
  );
}

function parseResponseBody(text: string): unknown {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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
    if (!isGatewayMode) {
      const user = getUserFromToken(token);
      if (user?.username) {
        headers["X-User-Name"] = encodeURIComponent(user.username);
      }
      if (user?.userKey) {
        headers["X-User-Key"] = user.userKey;
      }
      if (user?.role) {
        headers["X-User-Role"] = user.role;
      }
    }
  }

  try {
    const response = await apiClient.request<string>({
      url: path,
      baseURL: options.baseUrl ?? SEMO_API_BASE,
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
    const parsed = parseResponseBody(text);

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
      message:
        (typeof parsed === "string" && parsed.trim()) ||
        response.statusText ||
        "요청 처리에 실패했습니다.",
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      return {
        ok: false,
        data: null,
        message: "서버 응답이 지연되고 있습니다. 연결 상태를 확인한 뒤 다시 시도해주세요.",
      };
    }
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

export function postAuthJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson(path, { method: "POST", body, headers, baseUrl: AUTH_API_BASE });
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
