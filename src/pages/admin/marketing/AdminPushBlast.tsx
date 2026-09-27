import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Skeleton } from "@/components/common/LoadingState";
import { getPushBlastStats, sendPushBlast } from "@/services/api/adminBlasts";
import { useToastStore } from "@/stores/toastStore";
import type { PushAudience } from "@/types/adminBlast";

export default function AdminPushBlast() {
  const showToast = useToastStore((state) => state.showToast);
  const [audience, setAudience] = useState<PushAudience>("opted_in");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["pushBlastStats"],
    queryFn: getPushBlastStats,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendPushBlast({ audience, title, body, url: url || undefined }),
    onSuccess: ({ message }) => {
      showToast(message, "success");
      setTitle("");
      setBody("");
      setUrl("");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not send push blast.",
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
              {stats.customers_with_device}
            </span>
            <span className="text-xs text-text-muted">With a registered device</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-card border border-border p-3">
            <span className="text-base font-semibold text-text">
              {stats.push_opted_in}
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
            onChange={(e) => setAudience(e.target.value as PushAudience)}
            className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="opted_in">Opted in to push notifications</option>
            <option value="all_with_device">
              All customers with a registered device
            </option>
          </select>
        </label>

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
        />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={255}
            required
            className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </label>

        <Input
          label="Link to open on tap (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/shop"
        />

        <Button type="submit" fullWidth loading={sendMutation.isPending}>
          Send push blast
        </Button>
      </form>
    </div>
  );
}
