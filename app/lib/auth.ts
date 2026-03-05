let accessTokenMemory: string | null = null;

const DEFAULT_AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return accessTokenMemory;
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  accessTokenMemory = token;
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  accessTokenMemory = null;
}

export async function beginOAuthLogin(provider = "naver"): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }
  const normalizedProvider = provider?.trim() || "naver";
  window.location.href = `${DEFAULT_AUTH_BASE_URL}/auth/bff/login/semo-front-service?provider=${encodeURIComponent(normalizedProvider)}`;
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${DEFAULT_AUTH_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: { accessToken?: string } };
    const accessToken = payload?.data?.accessToken;
    if (!accessToken) {
      return null;
    }

    setAccessToken(accessToken);
    return accessToken;
  } catch {
    return null;
  }
}
