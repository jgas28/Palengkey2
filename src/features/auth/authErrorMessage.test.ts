import { describe, expect, it } from "vitest";
import { ApiError } from "@/services/api/apiError";
import { authErrorMessage } from "@/features/auth/authErrorMessage";

describe("authErrorMessage", () => {
  it("explains a connection problem when there was no response", () => {
    expect(
      authErrorMessage(new ApiError("Something went wrong. Please try again.")),
    ).toMatch(/can't reach Palengkey/);
  });

  it("asks to wait after too many attempts", () => {
    expect(
      authErrorMessage(new ApiError("Too Many Attempts.", undefined, {}, 429)),
    ).toMatch(/Too many login attempts/);
  });

  it("rewords the old 'Invalid credentials' reply", () => {
    expect(
      authErrorMessage(new ApiError("Invalid credentials", undefined, {}, 401)),
    ).toBe("Incorrect email or password.");
  });

  it("shows the first validation message", () => {
    const error = new ApiError(
      "The given data was invalid.",
      undefined,
      { errors: { email: ["The email field must be a valid email address."] } },
      422,
    );
    expect(authErrorMessage(error)).toBe(
      "The email field must be a valid email address.",
    );
  });

  it("hides server errors behind a friendly message", () => {
    expect(authErrorMessage(new ApiError("SQLSTATE[HY000]", undefined, {}, 500))).toMatch(
      /on our side/,
    );
  });

  it("passes through the server's own message otherwise", () => {
    const message = 'This account uses Google sign-in. Tap "Continue with Google".';
    expect(authErrorMessage(new ApiError(message, "google_account", {}, 401))).toBe(
      message,
    );
  });
});
