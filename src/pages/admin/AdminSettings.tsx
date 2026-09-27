import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { getAdminSettings, updateAdminSettings } from "@/services/api/adminSettings";
import { useToastStore } from "@/stores/toastStore";
import type { SettingGroups } from "@/types/adminSetting";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [values, setValues] = useState<Record<string, string>>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: getAdminSettings,
  });

  useEffect(() => {
    if (!data) return;
    const initial: Record<string, string> = {};
    Object.values(data)
      .flat()
      .forEach((field) => {
        initial[field.key] = String(field.value);
      });
    setValues(initial);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => updateAdminSettings(values),
    onSuccess: (fresh: SettingGroups) => {
      queryClient.setQueryData(["adminSettings"], fresh);
      showToast("Settings saved.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not save settings.",
        "error",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-lg font-semibold">Settings</h1>

      {Object.entries(data).map(([group, fields]) => (
        <div key={group} className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {group}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type={
                  field.type === "number"
                    ? "number"
                    : field.type === "time"
                      ? "time"
                      : "text"
                }
                value={values[field.key] ?? ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              />
            ))}
          </div>
        </div>
      ))}

      <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
        Save settings
      </Button>
    </div>
  );
}
