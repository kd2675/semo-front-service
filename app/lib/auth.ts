const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

let accessTokenMemory: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

type LoginPayload = {
  accessToken?: string;
};

type ResponseEnvelope<T> = {
  success?: boolean;
  data?: T;
};

function resolveAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.accessToken === "string") {
    return record.accessToken;
  }

  const data = record.data;
  if (data && typeof data === "object") {
    const typed = data as LoginPayload;
    if (typeof typed.accessToken === "string") {
      return typed.accessToken;
    }
  }

  return null;
}

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

export function setAccessToken(token: string): void {
  accessTokenMemory = token;
}

export function clearAccessToken(): void {
  accessTokenMemory = null;
}

async function requestRefreshAccessToken(): Promise<string | null> {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  const accessToken = resolveAccessToken(parsed as ResponseEnvelope<LoginPayload>);
  if (!accessToken) {
    return null;
  }

  setAccessToken(accessToken);
  return accessToken;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = requestRefreshAccessToken().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function ensureAccessToken(): Promise<string | null> {
  if (accessTokenMemory) {
    return accessTokenMemory;
  }
  return refreshAccessToken();
}

export async function logout(): Promise<void> {
  const token = getAccessToken();
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({}),
  });
}
