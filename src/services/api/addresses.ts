import { apiClient } from "@/services/api/client";
import type { Address, AddressPayload } from "@/types/address";

export async function listAddresses(): Promise<Address[]> {
  const { data } = await apiClient.get<Address[]>("/customer/addresses");
  return data;
}

export async function createAddress(
  payload: AddressPayload,
): Promise<{ message: string; address: Address }> {
  const { data } = await apiClient.post<{ message: string; address: Address }>(
    "/customer/addresses",
    payload,
  );
  return data;
}

export async function updateAddress(
  addressId: number,
  payload: Partial<AddressPayload>,
): Promise<{ message: string; address: Address }> {
  const { data } = await apiClient.put<{ message: string; address: Address }>(
    `/customer/addresses/${addressId}`,
    payload,
  );
  return data;
}

export async function deleteAddress(addressId: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    `/customer/addresses/${addressId}`,
  );
  return data;
}
