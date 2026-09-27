const STORAGE_KEY = "palengkey_device_id";

/** A stable per-install identifier sent as device_id on login/OTP-verify, so the
 * backend can track one Sanctum token per device (Api\CustomerAuthController). */
export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
