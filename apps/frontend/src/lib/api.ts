// apps/frontend/src/lib/api.ts
import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const getAccessToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("sakani_token") : null;

const getRefreshToken = (): string | null =>
  typeof window !== "undefined"
    ? localStorage.getItem("sakani_refresh_token")
    : null;

const saveTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("sakani_token", accessToken);
  if (refreshToken) {
    localStorage.setItem("sakani_refresh_token", refreshToken);
  }
};

const clearAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("sakani_token");
  localStorage.removeItem("sakani_refresh_token");
  localStorage.removeItem("sakani_user");
};

const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  const pathParts = window.location.pathname.split("/");
  const locale = ["ar", "en"].includes(pathParts[1]) ? pathParts[1] : "ar";
  window.location.href = `/${locale}/login`;
};

// ── Refresh-token state (prevent concurrent refresh races) ────────────────────
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (err: unknown, token: string | null) => {
  refreshQueue.forEach((prom) => {
    if (err) prom.reject(err);
    else if (token) prom.resolve(token);
  });
  refreshQueue = [];
};

// ── Request Interceptor ────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

const mapListingTypes = (data: any): any => {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map(mapListingTypes);
  }
  // مواءمة حقل نوع العقار وحالة طلب المعاينة
  if (data.unitType && !data.type) {
    data.type = data.unitType;
  }
  
  // فحص الكائنات المتداخلة
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && typeof data[key] === "object") {
      data[key] = mapListingTypes(data[key]);
    }
  }
  return data;
};

// ── Response Interceptor ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Unwrap { success: true, data: ... } envelope
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data
    ) {
      if (response.data.success === true) {
        const rawData = response.data.data ?? response.data;
        response.data = mapListingTypes(rawData);
        return response;
      }
      if (response.data.success === false) {
        const err = new Error(
          response.data.message || "حدث خطأ في الطلب"
        ) as Error & { response: typeof response };
        err.response = response;
        return Promise.reject(err);
      }
    }
    return response;
  },

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ── 401 → try to refresh token ────────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{
          accessToken: string;
          refreshToken?: string;
        }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

        const newAccessToken = data.accessToken;
        saveTokens(newAccessToken, data.refreshToken);

        // Update the default header for future requests
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Extract friendly message from server ──────────────────────────────────
    const serverMessage = (error.response?.data as { message?: string })
      ?.message;
    if (serverMessage) {
      (error as AxiosError & { friendlyMessage: string }).friendlyMessage =
        serverMessage;
    }

    return Promise.reject(error);
  }
);

export default api;
