import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/admin/AdminUi";
import Input from "@/components/ui/Input";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { getAdminSettings, updateAdminSettings } from "@/services/api/adminSettings";
import { useToastStore } from "@/stores/toastStore";
import type { SettingGroups } from "@/types/adminSetting";
import { ManageHeader, ManageIcon } from "@/components/admin/AdminManageList";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [values, setValues] = useState<Record<string, string>>({});
  const [openGroup, setOpenGroup] = useState<string | null>(null);

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

  const changed = Object.values(data)
    .flat()
    .some((field) => String(field.value) !== (values[field.key] ?? ""));

  return (
    <div className="flex flex-col gap-6">
      <ManageHeader
        eyebrow="Administration"
        title="Settings"
        description="App-wide fees, cutoffs and business rules."
        extra={
          <button
            type="button"
            disabled={saveMutation.isPending || !changed}
            onClick={() => saveMutation.mutate()}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            <Check size={16} aria-hidden="true" />
            {saveMutation.isPending ? "Saving…" : "Save settings"}
          </button>
        }
      />

      <Card className="overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {Object.entries(data).map(([group, fields]) => {
            const open = openGroup === group;
            return (
              <li key={group}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenGroup(open ? null : group)}
                  className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-slate-50/70"
                >
                  <ManageIcon icon={<SlidersHorizontal size={18} />} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold capitalize text-slate-900">
                      {group}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {fields
                        .slice(0, 3)
                        .map((field) => field.label)
                        .join(" · ")}
                      {fields.length > 3 ? ` · +${fields.length - 3} more` : ""}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-primary-700">
                    {open ? "Close" : "Configure"}
                  </span>
                  <ChevronRight
                    size={18}
                    className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
                  />
                </button>
                {open && (
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:grid-cols-2">
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
                        onChange={(e) =>
                          setValues({ ...values, [field.key]: e.target.value })
                        }
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
