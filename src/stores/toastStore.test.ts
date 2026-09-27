import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "./toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds a toast", () => {
    useToastStore.getState().showToast("Added to cart", "success");

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ message: "Added to cart", variant: "success" });
  });

  it("dismisses a toast by id", () => {
    useToastStore.getState().showToast("Added to cart");
    const { id } = useToastStore.getState().toasts[0];

    useToastStore.getState().dismissToast(id);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("auto-dismisses after the given duration", () => {
    vi.useFakeTimers();

    useToastStore.getState().showToast("Added to cart", "info", 1000);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(1000);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
