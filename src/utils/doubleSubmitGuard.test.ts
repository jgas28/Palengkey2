import { beforeAll, describe, expect, it, vi } from "vitest";
import { installDoubleSubmitGuard } from "./doubleSubmitGuard";

beforeAll(() => installDoubleSubmitGuard());

function submitEvent(timeStamp: number): Event {
  const event = new Event("submit", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "timeStamp", { value: timeStamp });
  return event;
}

describe("double-submit guard", () => {
  it("lets a form submit once and blocks a second submit right after", () => {
    const form = document.createElement("form");
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener("submit", onSubmit);
    document.body.append(form);

    form.dispatchEvent(submitEvent(1_000));
    form.dispatchEvent(submitEvent(1_200));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // A real second attempt (after an error, say) still goes through.
    form.dispatchEvent(submitEvent(2_500));
    expect(onSubmit).toHaveBeenCalledTimes(2);
    form.remove();
  });

  it("blocks a double click on a data-submit-once button", () => {
    const button = document.createElement("button");
    button.setAttribute("data-submit-once", "");
    button.innerHTML = "<span>Confirm order</span>";
    const onClick = vi.fn();
    button.addEventListener("click", onClick);
    document.body.append(button);

    const label = button.querySelector("span")!;
    label.click();
    label.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    button.remove();
  });

  it("leaves other buttons alone", () => {
    const button = document.createElement("button");
    const onClick = vi.fn();
    button.addEventListener("click", onClick);
    document.body.append(button);

    button.click();
    button.click();
    expect(onClick).toHaveBeenCalledTimes(2);
    button.remove();
  });
});
