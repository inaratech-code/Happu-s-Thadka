"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Shield, User } from "lucide-react";
import { PageHeader, Input, Select, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/modal";
import { FormField } from "@/components/forms/form-field";
import { StaffPermissionPicker } from "@/components/staff-permission-picker";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/lib/store";
import type { StaffMember, StaffRole } from "@/lib/types";
import type { AppPermission } from "@/lib/permissions";
import { canManageStaff } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAdminPasswordConfirm } from "@/hooks/use-admin-password-confirm";

type StaffForm = {
  name: string;
  username: string;
  password: string;
  role: StaffRole;
  permissions: AppPermission[];
  active: boolean;
};

const emptyForm = (): StaffForm => ({
  name: "",
  username: "",
  password: "",
  role: "staff",
  permissions: ["pos", "kitchen"],
  active: true,
});

export default function StaffPage() {
  const { session } = useAuth();
  const { state, addStaff, updateStaff, deleteStaff } = useStore();
  const { requestConfirm, modal: adminModal } = useAdminPasswordConfirm();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = canManageStaff(session);

  const openCreate = () => {
    setForm(emptyForm());
    setEditId(null);
    setError("");
    setOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setForm({
      name: member.name,
      username: member.username,
      password: "",
      role: member.role,
      permissions: member.permissions,
      active: member.active,
    });
    setEditId(member.id);
    setError("");
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditId(null);
    setError("");
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError("");

    if (form.role === "staff" && form.permissions.length === 0) {
      setError("Select at least one area of access for staff");
      setSaving(false);
      return;
    }

    const result = editId
      ? await updateStaff(
          editId,
          {
            name: form.name,
            username: form.username,
            role: form.role,
            permissions: form.permissions,
            active: form.active,
          },
          form.password.trim() || undefined
        )
      : await addStaff({
          name: form.name,
          username: form.username,
          password: form.password,
          role: form.role,
          permissions: form.permissions,
        });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    closeModal();
  };

  if (!isAdmin) {
    return (
      <div className="max-w-lg space-y-5">
        <PageHeader title="Staff" subtitle="Team accounts and access" />
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          Only the main admin can manage staff and permissions.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full min-w-0 space-y-5">
      <PageHeader
        title="Staff"
        subtitle="Add team members and choose what each person can use"
        actions={
          <Button size="sm" className="w-full sm:w-auto" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add staff
          </Button>
        }
      />

      <div className="surface-card p-4 text-sm text-muted-foreground">
        <p>
          Default admin: <span className="font-mono text-foreground">admin</span> /{" "}
          <span className="font-mono text-foreground">admin123</span> — change the password after adding your team.
        </p>
      </div>

      {state.staff.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          No staff yet. Add your first team member.
        </div>
      ) : (
        <div className="space-y-2">
          {state.staff.map((member) => (
            <div
              key={member.id}
              className={cn(
                "surface-card p-4 flex flex-col sm:flex-row sm:items-center gap-3",
                !member.active && "opacity-60"
              )}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-charcoal-950">
                  {member.role === "admin" ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{member.name}</p>
                    <Badge variant={member.role === "admin" ? "warning" : "default"}>
                      {member.role === "admin" ? "Admin" : "Staff"}
                    </Badge>
                    {!member.active && <Badge variant="danger">Disabled</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">@{member.username}</p>
                  {member.role === "staff" && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      Access:{" "}
                      {member.permissions.length > 0
                        ? member.permissions.join(", ")
                        : "none"}
                    </p>
                  )}
                  {member.role === "admin" && (
                    <p className="text-[11px] text-muted-foreground mt-1">Full access to all sections</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {member.id !== session?.staffId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400"
                    onClick={() =>
                      requestConfirm({
                        title: "Remove staff member",
                        message: `Enter admin password to remove ${member.name}. They will no longer be able to sign in.`,
                        onConfirm: () => {
                          const res = deleteStaff(member.id);
                          if (!res.ok) window.alert(res.error);
                        },
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={closeModal}
        title={editId ? "Edit staff" : "Add staff"}
        footer={
          <ModalActions
            formId="staff-form"
            onCancel={closeModal}
            onSubmit={() => void submit()}
            submitLabel={editId ? "Save changes" : "Add staff"}
            disabled={saving}
          />
        }
      >
        <form id="staff-form" onSubmit={(e) => void submit(e)} className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
              {error}
            </p>
          )}

          <FormField label="Full name" required>
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Ram Kumar"
            />
          </FormField>

          <FormField label="Username" required hint="Used to sign in (no spaces)">
            <Input
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value.replace(/\s/g, "").toLowerCase() }))
              }
              placeholder="e.g. ram_pos"
              autoComplete="off"
            />
          </FormField>

          <FormField
            label={editId ? "New password (optional)" : "Password"}
            required={!editId}
            hint="At least 4 characters"
          >
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={editId ? "Leave blank to keep current" : "Choose a password"}
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Account type">
            <Select
              value={form.role}
              onChange={(e) => {
                const role = e.target.value as StaffRole;
                setForm((f) => ({
                  ...f,
                  role,
                  permissions: role === "admin" ? [] : f.permissions,
                }));
              }}
              className="w-full"
            >
              <option value="staff">Staff — limited access</option>
              <option value="admin">Admin — full access + manage staff</option>
            </Select>
          </FormField>

          {form.role === "staff" && (
            <StaffPermissionPicker
              value={form.permissions}
              onChange={(permissions) => setForm((f) => ({ ...f, permissions }))}
            />
          )}

          {editId && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded border-[var(--border)]"
              />
              Account active (can sign in)
            </label>
          )}
        </form>
      </Modal>
      {adminModal}
    </div>
  );
}
