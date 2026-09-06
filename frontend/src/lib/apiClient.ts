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

export function setSession(token: string, refreshToken: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
  document.cookie = `careplus_token=${token}; path=/; max-age=1800; samesite=strict`;
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  document.cookie = "careplus_token=; path=/; max-age=0";
}

// Single-flight refresh: concurrent 401s share one refresh call.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken =
        typeof window === "undefined" ? null : window.localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) throw new Error("No refresh token");
      const { data } = await axios.post<{ data: { token: string; refreshToken: string } }>(
        `${baseURL()}/auth/refresh`,
        { refreshToken },
        { timeout: 15000 },
      );
      setSession(data.data.token, data.data.refreshToken);
      return data.data.token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    clearSession();
    window.location.href = "/login";
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

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
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
