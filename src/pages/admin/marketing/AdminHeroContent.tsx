import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card, EmptyPanel } from "@/components/admin/AdminUi";
import { ManageTabs, PagerBar } from "@/components/admin/AdminManageList";
import usePagedRows from "@/hooks/usePagedRows";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  createAdminHeroContent,
  deleteAdminHeroContent,
  listAdminHeroContent,
  updateAdminHeroContent,
  type HeroContentPayload,
} from "@/services/api/adminHeroContent";
import { useToastStore } from "@/stores/toastStore";
import type {
  AdminHeroContent as AdminHeroContentEntry,
  HeroPageName,
  HeroStat,
} from "@/types/adminHeroContent";

interface FormState {
  title: string;
  subtitle: string;
  description: string;
  image: File | null;
  cta_text: string;
  cta_link: string;
  cta_text_2: string;
  cta_link_2: string;
  is_active: boolean;
  stats: HeroStat[];
}

const emptyForm: FormState = {
  title: "",
  subtitle: "",
  description: "",
  image: null,
  cta_text: "",
  cta_link: "",
  cta_text_2: "",
  cta_link_2: "",
  is_active: true,
  stats: [],
};

export default function AdminHeroContent() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [pageName, setPageName] = useState<HeroPageName>("home");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminHeroContentEntry | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const {
    data: heroes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminHeroContent", pageName],
    queryFn: () => listAdminHeroContent(pageName),
  });

  function buildPayload(): HeroContentPayload {
    return {
      page_name: pageName,
      title: form.title,
      subtitle: form.subtitle || undefined,
      description: form.description || undefined,
      image: form.image ?? undefined,
      cta_text: form.cta_text,
      cta_link: form.cta_link,
      cta_text_2: form.cta_text_2 || undefined,
      cta_link_2: form.cta_link_2 || undefined,
      is_active: form.is_active,
      stats: form.stats.filter((stat) => stat.label.trim() || stat.value.trim()),
    };
  }

  const createMutation = useMutation({
    mutationFn: () => createAdminHeroContent(buildPayload()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminHeroContent"] });
      showToast("Hero content created.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create hero content.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAdminHeroContent(editing!.id, buildPayload()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminHeroContent"] });
      showToast("Hero content updated.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update hero content.",
        "error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdminHeroContent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminHeroContent"] });
      showToast("Hero content deleted.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not delete hero content.",
        "error",
      );
    },
  });

  function openCreateForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditForm(hero: AdminHeroContentEntry) {
    setEditing(hero);
    setForm({
      title: hero.title,
      subtitle: hero.subtitle ?? "",
      description: hero.description ?? "",
      image: null,
      cta_text: hero.cta_text,
      cta_link: hero.cta_link,
      cta_text_2: hero.cta_text_2 ?? "",
      cta_link_2: hero.cta_link_2 ?? "",
      is_active: hero.is_active,
      stats: hero.stats_json ?? [],
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing && !form.image) {
      showToast("Add an image.", "error");
      return;
    }
    if (editing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  const paged = usePagedRows(heroes, 6, pageName);

  const toggleMutation = useMutation({
    mutationFn: (hero: AdminHeroContentEntry) =>
      updateAdminHeroContent(hero.id, {
        page_name: hero.page_name,
        title: hero.title,
        subtitle: hero.subtitle ?? undefined,
        description: hero.description ?? undefined,
        cta_text: hero.cta_text,
        cta_link: hero.cta_link,
        cta_text_2: hero.cta_text_2 ?? undefined,
        cta_link_2: hero.cta_link_2 ?? undefined,
        is_active: !hero.is_active,
        stats: hero.stats_json ?? [],
      }),
    onSuccess: (_data, hero) => {
      void queryClient.invalidateQueries({ queryKey: ["adminHeroContent"] });
      showToast(hero.is_active ? "Moved to draft." : "Published.", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not update.", "error");
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ManageTabs
          label="Page"
          tabs={[
            { value: "home" as HeroPageName, label: "Homepage" },
            { value: "global" as HeroPageName, label: "Other pages" },
          ]}
          value={pageName}
          onChange={setPageName}
        />
        <button
          type="button"
          onClick={openCreateForm}
          className="flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          <Plus size={16} aria-hidden="true" /> New campaign
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {heroes && heroes.length === 0 && (
        <Card>
          <EmptyPanel
            title="No hero banners yet."
            description="Add a banner to headline this page."
          />
        </Card>
      )}

      {heroes && heroes.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {paged.rows.map((hero) => (
            <Card key={hero.id} className="flex overflow-hidden">
              <button
                type="button"
                onClick={() => openEditForm(hero)}
                className="w-2/5 shrink-0 bg-slate-100"
                aria-label={`Edit ${hero.title}`}
              >
                <img
                  src={hero.image_url}
                  alt=""
                  loading="lazy"
                  className="h-full min-h-[150px] w-full object-cover"
                />
              </button>
              <div className="flex min-w-0 flex-1 flex-col p-4">
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    hero.is_active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {hero.is_active ? `Published · #${hero.sequence}` : "Draft"}
                </span>
                <h3 className="mt-2 line-clamp-2 font-display text-lg font-semibold text-slate-900">
                  {hero.title}
                </h3>
                <p className="line-clamp-2 text-xs text-slate-500">
                  {hero.subtitle ||
                    [hero.cta_text, hero.cta_text_2].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => openEditForm(hero)}
                    className="text-xs font-semibold text-primary-700 hover:underline"
                  >
                    Edit content
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={hero.is_active}
                    aria-label={hero.is_active ? "Unpublish" : "Publish"}
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(hero)}
                    className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                      hero.is_active ? "bg-primary-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        hero.is_active ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {heroes && heroes.length > 0 && (
        <Card className="overflow-hidden">
          <PagerBar
            className="border-t-0"
            page={paged.page}
            lastPage={paged.lastPage}
            total={paged.total}
            perPage={paged.perPage}
            onPage={paged.setPage}
          />
        </Card>
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? "Edit hero content" : "Add hero content"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Subtitle (optional)"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Description (optional)
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            {editing ? "Replace image (optional)" : "Image"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, image: e.target.files?.[0] ?? null })}
              className="text-sm text-text-muted"
            />
          </label>
          {editing && (
            <img
              src={editing.image_url}
              alt={editing.title}
              className="h-24 w-full rounded-card object-cover"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CTA text"
              value={form.cta_text}
              onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
              required
            />
            <Input
              label="CTA link"
              value={form.cta_link}
              onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="2nd CTA text (optional)"
              value={form.cta_text_2}
              onChange={(e) => setForm({ ...form, cta_text_2: e.target.value })}
            />
            <Input
              label="2nd CTA link (optional)"
              value={form.cta_link_2}
              onChange={(e) => setForm({ ...form, cta_link_2: e.target.value })}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-text">
              Stats (optional)
            </legend>
            {form.stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={stat.label}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stats: form.stats.map((row, i) =>
                        i === index ? { ...row, label: e.target.value } : row,
                      ),
                    })
                  }
                  placeholder="50+"
                  aria-label={`Stat ${index + 1} number`}
                  className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <input
                  value={stat.value}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stats: form.stats.map((row, i) =>
                        i === index ? { ...row, value: e.target.value } : row,
                      ),
                    })
                  }
                  placeholder="Local markets"
                  aria-label={`Stat ${index + 1} label`}
                  className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, stats: form.stats.filter((_, i) => i !== index) })
                  }
                  className="text-xs font-medium text-status-cancelled"
                >
                  Remove
                </button>
              </div>
            ))}
            {form.stats.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, stats: [...form.stats, { label: "", value: "" }] })
                }
                className="self-start text-sm font-medium text-primary hover:underline"
              >
                + Add stat
              </button>
            )}
          </fieldset>

          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>

          <div className="flex gap-3">
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Save changes" : "Create hero"}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Delete "${editing.title}"?`)) {
                    deleteMutation.mutate(editing.id);
                    closeForm();
                  }
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
