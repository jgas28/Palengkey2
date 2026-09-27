import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    const { value } = await SecureStoragePlugin.get({ key });
    return value;
  } catch {
    return null;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  await SecureStoragePlugin.set({ key, value });
}

export async function removeSecureItem(key: string): Promise<void> {
  try {
    await SecureStoragePlugin.remove({ key });
  } catch {
    // Already absent — nothing to remove.
  }
}
