import { useState, type FormEvent } from "react";
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

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Admin",
  marketing: "Marketing",
  finance: "Finance",
  owner: "Owner",
  super_admin: "Superadmin",
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Admin accounts</h1>
        <Button size="sm" onClick={openCreateForm}>
          Add account
        </Button>
      </div>

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Market</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-text">{user.name}</td>
                <td className="px-4 py-3 text-text-muted">{user.email}</td>
                <td className="px-4 py-3 text-text-muted">{ROLE_LABELS[user.role]}</td>
                <td className="px-4 py-3 text-text-muted">{user.market_name ?? "—"}</td>
                <td className="flex flex-wrap gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openEditForm(user)}
                    className="text-primary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetPasswordUser(user)}
                    className="text-primary"
                  >
                    Reset password
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(user)}
                    className="text-status-cancelled"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
              className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
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
                className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
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
