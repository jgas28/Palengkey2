import { apiClient } from "@/services/api/client";
import type { DiscountIdStatusInfo, DiscountIdType } from "@/types/discountId";

export const discountIdQueryKey = ["discountId"] as const;

export async function getDiscountId(): Promise<DiscountIdStatusInfo | null> {
  const { data } = await apiClient.get<{ discount_id: DiscountIdStatusInfo | null }>(
    "/customer/discount-id",
  );
  return data.discount_id;
}

export interface DiscountIdUpload {
  type: DiscountIdType;
  id_number: string;
  full_name: string;
  front: File;
  back: File;
  selfie?: File | null;
}

export async function submitDiscountId(upload: DiscountIdUpload): Promise<DiscountIdStatusInfo> {
  const form = new FormData();
  form.append("type", upload.type);
  form.append("id_number", upload.id_number);
  form.append("full_name", upload.full_name);
  form.append("front", upload.front);
  form.append("back", upload.back);
  if (upload.selfie) form.append("selfie", upload.selfie);

  const { data } = await apiClient.post<{ discount_id: DiscountIdStatusInfo }>(
    "/customer/discount-id",
    form,
  );
  return data.discount_id;
}
