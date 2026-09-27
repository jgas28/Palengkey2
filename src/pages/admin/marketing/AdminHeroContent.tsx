import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-pill bg-background p-1">
          {(["home", "global"] as HeroPageName[]).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setPageName(name)}
              className={`rounded-pill px-4 py-1.5 text-sm font-medium capitalize ${
                pageName === name ? "bg-gradient-brand text-white shadow-soft" : "text-text-muted"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openCreateForm}>
          Add hero
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {heroes && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {heroes.map((hero) => (
            <button
              key={hero.id}
              type="button"
              onClick={() => openEditForm(hero)}
              className="flex flex-col overflow-hidden rounded-card border border-border bg-surface text-left"
            >
              <img
                src={hero.image_url}
                alt={hero.title}
                className="aspect-video w-full object-cover"
              />
              <div className="flex flex-col gap-1 p-3">
                <span className="text-sm font-medium text-text">{hero.title}</span>
                <span
                  className={`text-xs font-semibold ${
                    hero.is_active ? "text-status-delivered" : "text-text-muted"
                  }`}
                >
                  {hero.is_active ? `Active · #${hero.sequence}` : "Inactive"}
                </span>
              </div>
            </button>
          ))}
        </div>
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
