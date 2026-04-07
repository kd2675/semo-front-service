import axios, { AxiosError, type AxiosRequestConfig } from "axios";

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

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

async function requestJson<T>(
  path: string,
  config: AxiosRequestConfig = {},
  retried = false,
): Promise<ApiResult<T>> {
  try {
    const response = await client.request<unknown>({
      url: path,
      ...config,
    });

    const parsed = response.data;

    if (isEnvelope<T>(parsed)) {
      if (parsed.success) {
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

    return {
      ok: true,
      status: response.status,
      data: (parsed as T) ?? null,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;

      if (status === 401 && !retried) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          return requestJson<T>(path, config, true);
        }
        clearAccessToken();
        notifyAuthExpired("refresh_failed");
      }

      const parsed = error.response?.data as unknown;

      if (isEnvelope<T>(parsed)) {
        return {
          ok: false,
          status,
          data: null,
          message: parsed.message,
          code: parsed.code,
        };
      }

      return {
        ok: false,
        status,
        data: null,
        message: error.response?.statusText || "요청 처리에 실패했습니다.",
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

export function postJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson(path, { method: "POST", data: body, headers });
}

export function putJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson(path, { method: "PUT", data: body, headers });
}

export function patchJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson(path, { method: "PATCH", data: body, headers });
}

export function deleteJson<T>(
  path: string,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson(path, { method: "DELETE", headers });
}
