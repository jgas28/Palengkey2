import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DiscountIdPanel from "./DiscountIdPanel";

vi.mock("@/services/api/discountId", () => ({
  discountIdQueryKey: ["discountId"],
  getDiscountId: vi.fn(),
  submitDiscountId: vi.fn(),
}));

const { getDiscountId, submitDiscountId } = await import("@/services/api/discountId");

const base = {
  id: 1,
  type: "pwd" as const,
  type_label: "PWD",
  id_number: "PWD-123",
  full_name: "Juan Cruz",
  review_notes: null,
  submitted_at: "2026-11-21T00:00:00Z",
  reviewed_at: null,
};

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <DiscountIdPanel />
    </QueryClientProvider>,
  );
}

const photo = (name: string) => new File(["x"], name, { type: "image/jpeg" });

describe("DiscountIdPanel", () => {
  beforeEach(() => {
    vi.mocked(getDiscountId).mockReset();
    vi.mocked(submitDiscountId).mockReset();
  });

  it("asks for everything before uploading, then submits", async () => {
    vi.mocked(getDiscountId).mockResolvedValue(null);
    vi.mocked(submitDiscountId).mockResolvedValue({ ...base, status: "pending" });
    renderPanel();

    const submit = await screen.findByRole("button", { name: "Submit ID for review" });
    fireEvent.click(submit);
    expect(await screen.findByText("Add a photo of the front of the ID.")).toBeInTheDocument();
    expect(submitDiscountId).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("ID type"), { target: { value: "senior" } });
    fireEvent.change(screen.getByLabelText(/^ID number/), { target: { value: " SC-9 " } });
    fireEvent.change(screen.getByLabelText(/^Full name on the ID/), { target: { value: "Ana Reyes" } });
    fireEvent.change(screen.getByLabelText(/^Front of the ID/), { target: { files: [photo("f.jpg")] } });
    fireEvent.change(screen.getByLabelText(/^Back of the ID/), { target: { files: [photo("b.jpg")] } });
    fireEvent.click(submit);

    await waitFor(() => expect(submitDiscountId).toHaveBeenCalled());
    expect(vi.mocked(submitDiscountId).mock.calls[0][0]).toMatchObject({
      type: "senior",
      id_number: "SC-9",
      full_name: "Ana Reyes",
      selfie: null,
    });
    expect(await screen.findByText("Your ID is being reviewed")).toBeInTheDocument();
  });

  it("shows approval without a form", async () => {
    vi.mocked(getDiscountId).mockResolvedValue({ ...base, status: "approved" });
    renderPanel();
    expect(await screen.findByText("Your ID is approved")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit ID for review" })).toBeNull();
  });

  it("shows the rejection reason and lets the customer upload again", async () => {
    vi.mocked(getDiscountId).mockResolvedValue({
      ...base,
      status: "rejected",
      review_notes: "Photo is blurry",
    });
    renderPanel();
    expect(await screen.findByText(/Reason: Photo is blurry/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit ID for review" })).toBeInTheDocument();
  });
});
