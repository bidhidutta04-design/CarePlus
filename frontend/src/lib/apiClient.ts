import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const TOKEN_KEY = "careplus_token";
const REFRESH_KEY = "careplus_refresh_token";

function baseURL(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
}

export const apiClient = axios.create({
  baseURL: baseURL(),
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

// Tell the server to revoke the refresh session. Best-effort: local sign-out
// always proceeds even if the network call fails.
export async function revokeServerSession(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;
  try {
    await axios.post(`${baseURL()}/auth/logout`, { refreshToken }, { timeout: 8000 });
  } catch {
    // logout must never trap the user — local state is cleared regardless
  }
}

export function setSession(token: string, refreshToken: string, role?: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
  document.cookie = `careplus_token=${token}; path=/; max-age=1800; samesite=strict`;
  if (role) {
    document.cookie = `careplus_role=${role}; path=/; max-age=1800; samesite=strict`;
  }
}

export function setRoleCookie(role: string): void {
  document.cookie = `careplus_role=${role}; path=/; max-age=1800; samesite=strict`;
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  document.cookie = "careplus_token=; path=/; max-age=0";
  document.cookie = "careplus_role=; path=/; max-age=0";
}

// Role lives inside the access token payload — reading it here keeps the
// role cookie sliding with every refresh (previously it expired 30 min after
// login no matter how active the session was).
function getRoleFromToken(token: string): string | null {
  try {
    const segment = (token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(segment)) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

// Single-flight refresh: concurrent 401s share one refresh call.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken =
        typeof window === "undefined" ? null : window.localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) throw new Error("No refresh token");
      const { data } = await axios.post<{
        data: { token: string; refreshToken: string; role?: string };
      }>(`${baseURL()}/auth/refresh`, { refreshToken }, { timeout: 15000 });
      const role = data.data.role ?? getRoleFromToken(data.data.token);
      setSession(data.data.token, data.data.refreshToken, role ?? undefined);
      return data.data.token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function getRoleCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)careplus_role=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    const back = window.location.pathname;
    clearSession();
    window.location.href =
      back.startsWith("/login") || back === "/"
        ? "/login"
        : `/login?redirect=${encodeURIComponent(back)}`;
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

function isAuthRequest(config: RetryableConfig | undefined): boolean {
  return !!config?.url?.includes("/auth/");
}

export function getApiErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : "Something went wrong. Please try again.";
  }
  const status = err.response?.status;
  if (err.code === "ECONNABORTED") {
    return "Request timed out. Please check your connection and try again.";
  }
  if (!err.response) {
    return "Cannot reach the server. Please make sure the backend is running and try again.";
  }
  const serverMsg = (err.response.data as { error?: { message?: string } } | undefined)?.error
    ?.message;
  switch (status) {
    case 400:
      return serverMsg ?? "Invalid request. Please check the highlighted fields.";
    case 401:
      return "Invalid email or password. Please try again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return serverMsg ?? "Requested record was not found.";
    case 409:
      return serverMsg ?? "This conflicts with existing data. Please review and retry.";
    case 422:
      return serverMsg ?? "Some fields need attention. Please review and retry.";
    case 429:
      return "Too many attempts. Please wait a minute and try again.";
    default:
      if (status && status >= 500) {
        return "Server error. Please try again in a moment.";
      }
      return serverMsg ?? "Something went wrong. Please try again.";
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    // Never refresh or redirect for auth endpoints themselves (login page):
    // a failed login must surface its error instead of reloading the page.
    if (isAuthRequest(config)) {
      return Promise.reject(error);
    }
    if (error?.response?.status === 401 && config && !config._retried) {
      config._retried = true;
      try {
        const token = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return apiClient(config);
      } catch {
        redirectToLogin();
        return Promise.reject(error);
      }
    }
    if (error?.response?.status === 401) {
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);
