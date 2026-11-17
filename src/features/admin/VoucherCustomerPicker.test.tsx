import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VoucherCustomerPicker from "./VoucherCustomerPicker";
import type { VoucherCustomer } from "@/types/adminVoucher";

vi.mock("@/services/api/adminVouchers", () => ({
  searchVoucherCustomers: vi.fn(),
}));

const { searchVoucherCustomers } = await import("@/services/api/adminVouchers");

const juan: VoucherCustomer = { id: 1, fname: "Juan", lname: "Cruz", email: "juan@gmail.com" };
const ana: VoucherCustomer = { id: 2, fname: "Ana", lname: null, email: "ana@gmail.com" };

function renderPicker(selected: VoucherCustomer[], onChange = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <VoucherCustomerPicker selected={selected} onChange={onChange} />
    </QueryClientProvider>,
  );
  return onChange;
}

describe("VoucherCustomerPicker", () => {
  beforeEach(() => {
    vi.mocked(searchVoucherCustomers).mockReset();
  });

  it("searches by email and adds the clicked customer", async () => {
    vi.mocked(searchVoucherCustomers).mockResolvedValue([juan, ana]);
    const onChange = renderPicker([ana]);

    fireEvent.change(screen.getByLabelText("Find customer by email"), {
      target: { value: "gmail" },
    });

    const result = await screen.findByRole("button", { name: /juan@gmail\.com/ });
    expect(searchVoucherCustomers).toHaveBeenCalledWith("gmail");
    // Ana is already chosen, so she is not offered again.
    expect(screen.queryByRole("button", { name: /^ana@gmail\.com/ })).toBeNull();

    fireEvent.click(result);
    expect(onChange).toHaveBeenCalledWith([ana, juan]);
  });

  it("does not search under 3 characters", async () => {
    renderPicker([]);
    fireEvent.change(screen.getByLabelText("Find customer by email"), {
      target: { value: "ju" },
    });
    expect(await screen.findByText("Type at least 3 characters.")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(searchVoucherCustomers).not.toHaveBeenCalled();
  });

  it("removes a chosen customer", () => {
    const onChange = renderPicker([juan, ana]);
    expect(screen.getByText("Customers who can use it (2)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove juan@gmail.com" }));
    expect(onChange).toHaveBeenCalledWith([ana]);
  });
});
