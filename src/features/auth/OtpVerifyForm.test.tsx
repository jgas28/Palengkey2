import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OtpVerifyForm from "./OtpVerifyForm";

vi.mock("@/services/api/auth", () => ({
  resendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  me: vi.fn(),
}));

const { resendOtp } = await import("@/services/api/auth");

function renderOtp(channels: string[] = ["email"]) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: "/verify-otp", state: { email: "juan@example.com", channels } }]}
    >
      <Routes>
        <Route path="/verify-otp" element={<OtpVerifyForm />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Let the auto-send promise settle under fake timers. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("OtpVerifyForm resend countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.mocked(resendOtp).mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("counts down a minute after sending, then allows a resend", async () => {
    vi.mocked(resendOtp).mockResolvedValue({ message: "sent" });
    renderOtp();
    await flush();

    const resend = screen.getByRole("button", { name: /resend code/i });
    expect(resend).toHaveTextContent("Resend code in 1:00");
    expect(resend).toBeDisabled();

    act(() => vi.advanceTimersByTime(18_000));
    expect(resend).toHaveTextContent("Resend code in 0:42");

    act(() => vi.advanceTimersByTime(42_000));
    expect(resend).toHaveTextContent(/^Resend code$/);
    expect(resend).toBeEnabled();

    fireEvent.click(resend);
    await flush();
    expect(resendOtp).toHaveBeenCalledTimes(2);
    expect(resend).toHaveTextContent("Resend code in 1:00");
  });

  it("sends one code to both email and phone in a single request", async () => {
    vi.mocked(resendOtp).mockResolvedValue({ message: "sent" });
    renderOtp(["email", "sms"]);
    await flush();

    expect(resendOtp).toHaveBeenCalledTimes(1);
    expect(resendOtp).toHaveBeenCalledWith("juan@example.com", ["email", "sms"]);
  });

  it("uses the server's remaining wait when a code was sent recently", async () => {
    vi.mocked(resendOtp).mockRejectedValue(
      new Error("Please wait 25 seconds before requesting a new code."),
    );
    renderOtp();
    await flush();

    const resend = screen.getByRole("button", { name: /resend code/i });
    expect(resend).toHaveTextContent("Resend code in 0:25");
    expect(resend).toBeDisabled();
  });
});
