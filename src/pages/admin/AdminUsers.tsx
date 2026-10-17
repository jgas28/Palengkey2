import { useState, type FormEvent } from "react";
import type React from "react";
import { Menu, ShieldCheck } from "lucide-react";
import { Card } from "@/components/admin/AdminUi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
} from "@/services/api/adminUsers";
import { listAdminMarkets } from "@/services/api/adminLookups";
import { useToastStore } from "@/stores/toastStore";
import type { AdminRole } from "@/types/adminAuth";
import type { AdminManagedUser } from "@/types/adminUser";
import { ManageHeader } from "@/components/admin/AdminManageList";

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

function lastActive(iso: string | null | undefined): string {
  if (!iso) return "Never signed in";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 5) return "Now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}

function closeMenu(event: React.MouseEvent) {
  (event.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute(
    "open",
  );
}

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Admin",
  marketing: "Marketing",
  finance: "Finance",
  owner: "Owner",
  super_admin: "Super admin",
};

interface UserFormState {
  fname: string;
  lname: string;
  mname: string;
  email: string;
  password: string;
  role: AdminRole;
  market_id: number | "";
}

const emptyForm: UserFormState = {
  fname: "",
  lname: "",
  mname: "",
  email: "",
  password: "",
  role: "admin",
  market_id: "",
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminManagedUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminManagedUser | null>(
    null,
  );
  const [newPassword, setNewPassword] = useState("");

  const {
    data: users,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: listAdminUsers,
  });

  const { data: markets = [] } = useQuery({
    queryKey: ["adminMarkets"],
    queryFn: listAdminMarkets,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminUser({
        fname: form.fname,
        lname: form.lname,
        mname: form.mname || undefined,
        email: form.email,
        password: form.password,
        role: form.role,
        market_id:
          form.role === "admin" && form.market_id ? Number(form.market_id) : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showToast("Account created.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create account.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminUser(editingUser!.id, {
        fname: form.fname,
        lname: form.lname,
        mname: form.mname || undefined,
        email: form.email,
        role: form.role,
        market_id:
          form.role === "admin" && form.market_id ? Number(form.market_id) : null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showToast("Account updated.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update account.",
        "error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => deleteAdminUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showToast("Account removed.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not remove account.",
        "error",
      );
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => resetAdminUserPassword(resetPasswordUser!.id, newPassword),
    onSuccess: () => {
      showToast("Password reset.", "success");
      setResetPasswordUser(null);
      setNewPassword("");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not reset password.",
        "error",
      );
    },
  });

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditForm(user: AdminManagedUser) {
    setEditingUser(user);
    setForm({
      fname: user.fname,
      lname: user.lname,
      mname: user.mname ?? "",
      email: user.email,
      password: "",
      role: user.role,
      market_id: user.market_id ?? "",
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.role === "admin" && !form.market_id) {
      showToast("A market is required for the admin role.", "error");
      return;
    }
    if (editingUser) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  function handleDelete(user: AdminManagedUser) {
    if (window.confirm(`Remove ${user.name}'s account?`)) {
      deleteMutation.mutate(user.id);
    }
  }

  const roleMutation = useMutation({
    mutationFn: ({ user, role }: { user: AdminManagedUser; role: AdminRole }) =>
      updateAdminUser(user.id, {
        fname: user.fname,
        lname: user.lname,
        mname: user.mname ?? undefined,
        email: user.email,
        role,
        market_id: role === "admin" ? user.market_id : null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showToast("Role updated.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not change role.",
        "error",
      );
    },
  });

  /** Market admins need a market, so switching to that role opens the full form. */
  function changeRole(user: AdminManagedUser, role: AdminRole) {
    if (role === user.role) return;
    if (role === "admin" && !user.market_id) {
      openEditForm(user);
      setForm((current) => ({ ...current, role }));
      showToast("Choose a market for this admin.", "info");
      return;
    }
    roleMutation.mutate({ user, role });
  }

  const roleCounts = (users ?? []).reduce<Partial<Record<AdminRole, number>>>(
    (counts, user) => ({ ...counts, [user.role]: (counts[user.role] ?? 0) + 1 }),
    {},
  );
  const roleSummary =
    (Object.keys(ROLE_LABELS) as AdminRole[])
      .filter((role) => roleCounts[role])
      .map((role) => `${roleCounts[role]} ${ROLE_LABELS[role].toLowerCase()}`)
      .join(", ") || "No team members yet";

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !users) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ManageHeader
        eyebrow="Super admin only"
        title="Team & roles"
        description="Control CMS access and permissions."
        actionLabel="Invite member"
        onAction={openCreateForm}
      />

      <Card className="flex flex-wrap items-center gap-4 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">
          <ShieldCheck size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">
            Role-based access is enabled
          </span>
          <span className="block text-xs text-slate-500">{roleSummary}</span>
        </span>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Team member</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Last active</th>
              <th className="px-5 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-800">
                      {initials(user.name)}
                    </span>
                    <span>
                      <span className="block font-semibold text-slate-900">
                        {user.name}
                      </span>
                      {user.market_name && (
                        <span className="block text-xs text-slate-500">
                          {user.market_name}
                        </span>
                      )}
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600">{user.email}</td>
                <td className="px-5 py-3">
                  <select
                    aria-label={`${user.name} role`}
                    value={user.role}
                    disabled={roleMutation.isPending}
                    onChange={(e) => changeRole(user, e.target.value as AdminRole)}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    {(Object.keys(ROLE_LABELS) as AdminRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      user.last_active_at
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {user.last_active_at ? "Active" : "Invited"}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  {lastActive(user.last_active_at)}
                </td>
                <td className="px-5 py-3 text-right">
                  <details className="relative inline-block text-left">
                    <summary
                      aria-label={`Actions for ${user.name}`}
                      className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-lg text-slate-500 hover:bg-slate-100 [&::-webkit-details-marker]:hidden"
                    >
                      <Menu size={18} />
                    </summary>
                    <div className="absolute right-0 z-10 mt-1 flex w-40 flex-col rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg">
                      <button
                        type="button"
                        onClick={(e) => {
                          closeMenu(e);
                          openEditForm(user);
                        }}
                        className="rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                      >
                        Edit details
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          closeMenu(e);
                          setResetPasswordUser(user);
                        }}
                        className="rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          closeMenu(e);
                          handleDelete(user);
                        }}
                        className="rounded-lg px-3 py-2 text-left text-rose-600 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editingUser ? "Edit account" : "Add account"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              value={form.fname}
              onChange={(e) => setForm({ ...form, fname: e.target.value })}
              required
            />
            <Input
              label="Last name"
              value={form.lname}
              onChange={(e) => setForm({ ...form, lname: e.target.value })}
              required
            />
          </div>
          <Input
            label="Middle name (optional)"
            value={form.mname}
            onChange={(e) => setForm({ ...form, mname: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          {!editingUser && (
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          )}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Role
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {(Object.keys(ROLE_LABELS) as AdminRole[]).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          {form.role === "admin" && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Market
              <select
                value={form.market_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    market_id: e.target.value ? Number(e.target.value) : "",
                  })
                }
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="">Select a market</option>
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <Button
            type="submit"
            fullWidth
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editingUser ? "Save changes" : "Create account"}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={resetPasswordUser !== null}
        onClose={() => setResetPasswordUser(null)}
        title={`Reset password for ${resetPasswordUser?.name ?? ""}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetPasswordMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <Button type="submit" fullWidth loading={resetPasswordMutation.isPending}>
            Reset password
          </Button>
        </form>
      </Modal>
    </div>
  );
}
