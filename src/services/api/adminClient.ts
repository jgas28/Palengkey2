import axios from "axios";
import { env } from "@/config/env";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { ApiError } from "@/services/api/apiError";

export const adminApiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    Accept: "application/json",
  },
});

adminApiClient.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      void useAdminAuthStore.getState().clearSession();
    }

    const message =
      error.response?.data?.message ?? "Something went wrong. Please try again.";
    return Promise.reject(
      new ApiError(
        message,
        error.response?.data?.error_code,
        error.response?.data,
        error.response?.status,
      ),
    );
  },
);
