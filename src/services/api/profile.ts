import { apiClient } from "@/services/api/client";

export interface UpdateProfilePayload {
  fname?: string;
  mname?: string;
  lname?: string;
  phone?: string;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/customer/profile/update",
    payload,
  );
  return data;
}

export async function uploadProfileImage(
  image: File,
): Promise<{ message: string; profile_image: string }> {
  const formData = new FormData();
  formData.append("image", image);

  const { data } = await apiClient.post<{ message: string; profile_image: string }>(
    "/customer/profile/image",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function deleteProfileImage(): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>("/customer/profile/image");
  return data;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/customer/change-password",
    payload,
  );
  return data;
}

export async function requestAccountDeletion(
  channel?: "email" | "sms",
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/customer/account/delete/request",
    { channel },
  );
  return data;
}

export async function confirmAccountDeletion(otp: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/customer/account/delete/confirm",
    { otp },
  );
  return data;
}
