import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ env: { googleClientId: "web-client.apps.googleusercontent.com" } }));

import { startGoogleRedirect, takeGoogleRedirectResult } from "./googleSignIn";

function fakeIdToken(nonce: string): string {
  const payload = btoa(JSON.stringify({ nonce, email: "suki@example.com" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.signature`;
}

/** Starts a redirect and returns the URL it would send the tab to. */
function start(from?: string): URL {
  const assign = vi.fn();
  vi.stubGlobal("location", { ...window.location, assign, origin: "https://palengkey.test", pathname: "/login" });
  startGoogleRedirect(from);
  vi.unstubAllGlobals();
  return new URL(assign.mock.calls[0][0] as string);
}

function returnWith(hash: string) {
  window.history.replaceState(null, "", `/login#${hash}`);
}

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("Google same-tab redirect", () => {
  it("sends the tab to Google with this page as the return address", () => {
    const url = start();
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("redirect_uri")).toBe("https://palengkey.test/login");
    expect(url.searchParams.get("response_type")).toBe("id_token");
  });

  it("returns the ID token and the page to go back to, then clears the URL", () => {
    const url = start("/cart");
    const nonce = url.searchParams.get("nonce")!;
    const token = fakeIdToken(nonce);
    returnWith(`state=${url.searchParams.get("state")}&id_token=${token}`);

    expect(takeGoogleRedirectResult()).toEqual({ idToken: token, from: "/cart" });
    expect(window.location.hash).toBe("");
    expect(takeGoogleRedirectResult()).toBeNull(); // only once
  });

  it("ignores a return whose state doesn't match", () => {
    const url = start();
    returnWith(`state=someone-else&id_token=${fakeIdToken(url.searchParams.get("nonce")!)}`);
    expect(takeGoogleRedirectResult()).toBeNull();
  });

  it("rejects a token issued for a different nonce", () => {
    const url = start();
    returnWith(`state=${url.searchParams.get("state")}&id_token=${fakeIdToken("other")}`);
    expect(() => takeGoogleRedirectResult()).toThrow();
  });

  it("treats closing Google's picker as a cancel", () => {
    const url = start();
    returnWith(`state=${url.searchParams.get("state")}&error=access_denied`);
    expect(() => takeGoogleRedirectResult()).toThrow("cancelled");
  });

  it("does nothing on a normal visit to the login page", () => {
    window.history.replaceState(null, "", "/login");
    expect(takeGoogleRedirectResult()).toBeNull();
  });
});
