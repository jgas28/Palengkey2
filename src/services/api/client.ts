import axios from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/authStore";
import { ApiError } from "@/services/api/apiError";
import { getDeviceId } from "@/utils/deviceId";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Identifies a signed-out visitor's cart server-side (CartController::resolveCart)
  // — harmless to send when authenticated too, the backend only reads it otherwise.
  config.headers["X-Device-Id"] = getDeviceId();
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is missing/expired/revoked server-side — drop the local session so
      // route guards send the customer back to /login.
      void useAuthStore.getState().clearSession();
    }

    // Normalize backend errors into a shape the UI can show without leaking
    // stack traces / SQLSTATE codes to customers (palengkey-frontend skill §27).
    const message =
      error.response?.data?.message ?? "Something went wrong. Please try again.";
    return Promise.reject(
      new ApiError(message, error.response?.data?.error_code, error.response?.data),
    );
  },
);
