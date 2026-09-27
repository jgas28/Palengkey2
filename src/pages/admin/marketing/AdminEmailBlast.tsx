import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Skeleton } from "@/components/common/LoadingState";
import { getEmailBlastStats, sendEmailBlast } from "@/services/api/adminBlasts";
import { useToastStore } from "@/stores/toastStore";
import type { EmailAudience } from "@/types/adminBlast";

export default function AdminEmailBlast() {
  const showToast = useToastStore((state) => state.showToast);
  const [audience, setAudience] = useState<EmailAudience>("opted_in");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["emailBlastStats"],
    queryFn: getEmailBlastStats,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendEmailBlast({ audience, subject, body }),
    onSuccess: ({ message }) => {
      showToast(message, "success");
      setSubject("");
      setBody("");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not send email blast.",
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
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center gap-0.5 rounded-card border border-border p-3">
            <span className="text-base font-semibold text-text">
              {stats.customers_with_email}
            </span>
            <span className="text-xs text-text-muted">With email</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-card border border-border p-3">
            <span className="text-base font-semibold text-text">
              {stats.email_opted_in}
            </span>
            <span className="text-xs text-text-muted">Opted in</span>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Audience
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as EmailAudience)}
            className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="opted_in">Opted in to promotions</option>
            <option value="all_with_email">All customers with an email</option>
          </select>
        </label>

        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={150}
          required
        />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Body (HTML supported)
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            required
            className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </label>

        <Button type="submit" fullWidth loading={sendMutation.isPending}>
          Send email blast
        </Button>
      </form>
    </div>
  );
}
