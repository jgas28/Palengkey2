import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { searchVoucherCustomers } from "@/services/api/adminVouchers";
import type { VoucherCustomer } from "@/types/adminVoucher";

const field =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100";

function customerName(customer: VoucherCustomer): string {
  return [customer.fname, customer.lname].filter(Boolean).join(" ");
}

/**
 * Picks who a voucher is for: search customers by email, click to add, and
 * remove with the × on each chosen customer.
 */
export default function VoucherCustomerPicker({
  selected,
  onChange,
}: {
  selected: VoucherCustomer[];
  onChange: (customers: VoucherCustomer[]) => void;
}) {
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");

  // Search once typing pauses, not on every key.
  useEffect(() => {
    const timer = window.setTimeout(() => setEmail(text.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [text]);

  const canSearch = email.length >= 3;
  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ["voucherCustomerSearch", email],
    queryFn: () => searchVoucherCustomers(email),
    enabled: canSearch,
    staleTime: 30_000,
  });

  const chosenIds = new Set(selected.map((customer) => customer.id));
  const matches = results.filter((customer) => !chosenIds.has(customer.id));

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
        Find customer by email
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. juan@gmail.com"
          className={field}
          autoComplete="off"
        />
      </label>

      {text.trim().length > 0 && text.trim().length < 3 && (
        <p className="text-xs text-text-muted">Type at least 3 characters.</p>
      )}

      {canSearch && (
        <div aria-live="polite">
          {isError ? (
            <p className="text-xs text-red-600">Could not search customers.</p>
          ) : isFetching && results.length === 0 ? (
            <p className="text-xs text-text-muted">Searching…</p>
          ) : matches.length === 0 ? (
            <p className="text-xs text-text-muted">
              {results.length > 0 ? "Already added." : "No customer with that email."}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200">
              {matches.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => onChange([...selected, customer])}
                    className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm text-slate-800">{customer.email}</span>
                    {customerName(customer) && (
                      <span className="text-xs text-text-muted">{customerName(customer)}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-text">
          Customers who can use it ({selected.length})
        </p>
        {selected.length === 0 ? (
          <p className="text-xs text-text-muted">None yet. Search above to add customers.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {selected.map((customer) => (
              <li
                key={customer.id}
                className="flex items-center gap-1 rounded-full bg-primary-50 py-1 pl-3 pr-1 text-xs text-primary-800"
              >
                {customer.email}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((c) => c.id !== customer.id))}
                  aria-label={`Remove ${customer.email}`}
                  className="rounded-full p-1 hover:bg-primary-100"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
