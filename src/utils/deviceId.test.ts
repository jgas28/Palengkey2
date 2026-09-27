import { beforeEach, describe, expect, it } from "vitest";
import { getDeviceId } from "./deviceId";

describe("getDeviceId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("generates and persists an id on first call", () => {
    const id = getDeviceId();
    expect(id).toBeTruthy();
    expect(localStorage.getItem("palengkey_device_id")).toBe(id);
  });

  it("returns the same id on subsequent calls", () => {
    const first = getDeviceId();
    const second = getDeviceId();
    expect(second).toBe(first);
  });
});
