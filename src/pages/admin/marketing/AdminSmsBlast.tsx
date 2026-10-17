import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Skeleton } from "@/components/common/LoadingState";
import { getSmsBlastStats, sendSmsBlast } from "@/services/api/adminBlasts";
import { useToastStore } from "@/stores/toastStore";
import type { SmsAudience } from "@/types/adminBlast";

const SMS_LIMIT = 160;

export default function AdminSmsBlast() {
  const showToast = useToastStore((state) => state.showToast);
  const [category, setCategory] = useState<"promo" | "advertisement" | "announcement">(
    "promo",
  );
  const [audience, setAudience] = useState<SmsAudience>("opted_in");
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["smsBlastStats"],
    queryFn: getSmsBlastStats,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      sendSmsBlast({
        category,
        audience,
        numbers: audience === "manual" ? numbers : undefined,
        message,
        sendername: senderName || undefined,
      }),
    onSuccess: ({ message: resultMessage }) => {
      showToast(resultMessage, "success");
      setMessage("");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not send SMS blast.",
        "error",
      );
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMutation.mutate();
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-3">
            <span className="text-base font-semibold text-text">
              {stats.customers_with_phone}
            </span>
            <span className="text-xs text-text-muted">With phone</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-3">
            <span className="text-base font-semibold text-text">
              {stats.sms_opted_in}
            </span>
            <span className="text-xs text-text-muted">Opted in</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-3">
            <span className="text-base font-semibold text-text">
              {stats.verified_with_phone}
            </span>
            <span className="text-xs text-text-muted">Verified</span>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            <option value="promo">Promo</option>
            <option value="advertisement">Advertisement</option>
            <option value="announcement">Announcement</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Audience
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as SmsAudience)}
            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            <option value="opted_in">Opted in to promotions</option>
            <option value="verified">Verified customers</option>
            <option value="all_with_phone">All customers with a phone number</option>
            <option value="manual">Manual numbers</option>
          </select>
        </label>

        {audience === "manual" && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Phone numbers (one per line or comma-separated)
            <textarea
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              rows={4}
              placeholder="+639171234567"
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
        )}

        <Input
          label="Sender name (optional, max 11 chars)"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          maxLength={11}
        />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={SMS_LIMIT}
            required
            className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <span className="text-right text-xs text-text-muted">
            {message.length} / {SMS_LIMIT}
          </span>
        </label>

        <Button type="submit" fullWidth loading={sendMutation.isPending}>
          Send SMS blast
        </Button>
      </form>
    </div>
  );
}
