import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let refreshPromise: Promise<unknown> | null = null;

function isAuthRoute(url: string | undefined, ...paths: string[]) {
  return Boolean(url && paths.some((p) => url.includes(p)));
}

// on a 401, try a single silent refresh (POST /auth/refresh, which
// reads the longer-lived "refreshToken" cookie and issues a new "accessToken"
// cookie) and retry the original request once. Only if the refresh itself
// fails do we treat the session as truly over and bounce to /login — this is
// what lets a 15-minute access token feel invisible to the user instead of
// forcing a re-login every 15 minutes.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    const isUnauthorized = error?.response?.status === 401;
    const isAuthEndpoint = isAuthRoute(
      originalRequest?.url,
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
    );

    if (
      typeof window === "undefined" ||
      !isUnauthorized ||
      isAuthEndpoint ||
      originalRequest?._retrivedAfterRefresh
    ) {
      return Promise.reject(error);
    }

    originalRequest._retrivedAfterRefresh = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api.post("/auth/refresh").finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;

      return api(originalRequest);
    } catch (error) {
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  },
);

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ||
      fallback
    );
  }
  return fallback;
}
