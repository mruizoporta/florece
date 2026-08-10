"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import {
  RoleName,
  STAFF_ROLE_LABELS,
  STAFF_ROLES,
  type StaffRole,
  canManageSalon,
} from "@florece/shared";
import { api } from "@/lib/api";
import { getMe } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";
import {
  AdminModal,
  AdminPageHeader,
  AdminPill,
  AdminPrimaryButton,
  AdminTable,
  LoadingSpinner,
  MessageBanner,
  RoleChip,
} from "@/components/admin/AdminUi";
import { useLocale } from "@/components/LocaleProvider";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  roles: {
    Recepcionista: true,
    Cajero: false,
    Admin: false,
  } as Record<StaffRole, boolean>,
};

function selectedRoles(flags: Record<StaffRole, boolean>): StaffRole[] {
  return STAFF_ROLES.filter((r) => flags[r]);
}

function roleLabel(role: StaffRole) {
  if (role === "Admin") return "Admin";
  if (role === "Recepcionista") return "Agenda";
  return "Caja";
}

function roleHint(role: StaffRole) {
  if (role === RoleName.Admin)
    return "Catálogo, usuarios, ajustes y facturación.";
  if (role === RoleName.Recepcionista) return "Citas, calendario y clientes.";
  return "Órdenes y cobros (POS).";
}

export default function AdminUsersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editRoles, setEditRoles] = useState<Record<StaffRole, boolean>>(emptyForm.roles);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [menuId, setMenuId] = useState<number | null>(null);

  async function load() {
    try {
      const data = await api<AdminUser[]>("/v1/users", {
        tenantSlug: slug,
        auth: true,
      });
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    getMe().then((me) => setIsOwner(canManageSalon(me?.user?.roles)));
  }, [slug]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const roles = selectedRoles(form.roles);
    if (roles.length === 0) {
      setError("Elegí al menos un permiso.");
      return;
    }
    try {
      await api("/v1/users", {
        method: "POST",
        tenantSlug: slug,
        auth: true,
        body: {
          name: form.name,
          email: form.email,
          password: form.password,
          roles,
        },
      });
      setForm(emptyForm);
      setCreateOpen(false);
      setMessage("Usuario creado");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  function openEdit(user: AdminUser) {
    setEditUser(user);
    setEditRoles({
      Admin: (user.roles ?? []).includes(RoleName.Admin),
      Recepcionista: (user.roles ?? []).includes(RoleName.Recepcionista),
      Cajero: (user.roles ?? []).includes(RoleName.Cajero),
    });
    setMenuId(null);
    setError(null);
  }

  async function saveRoles(e: FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    const roles = selectedRoles(editRoles);
    if (roles.length === 0) {
      setError("Cada usuario debe tener al menos un permiso.");
      return;
    }
    setError(null);
    await api(`/v1/users/${editUser.id}/roles`, {
      method: "PATCH",
      tenantSlug: slug,
      auth: true,
      body: { roles },
    });
    setEditUser(null);
    setMessage("Permisos actualizados");
    await load();
  }

  async function submitReset(e: FormEvent) {
    e.preventDefault();
    if (!resetUser || newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    await api(`/v1/users/${resetUser.id}/reset-password`, {
      method: "PATCH",
      tenantSlug: slug,
      auth: true,
      body: { password: newPassword },
    });
    setResetUser(null);
    setNewPassword("");
    setMessage("Contraseña actualizada");
  }

  if (!isOwner) {
    return (
      <div>
        <AdminPageHeader
          title={tr("admin.users")}
          subtitle="Solo el administrador del salón puede crear y editar usuarios."
        />
        <p className="text-sm text-brand-text-muted">
          Pedile al dueño acceso de Administrador si necesitás gestionar el equipo.
        </p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Equipo con acceso"
        subtitle="Quién agenda, quién cobra, o ambos. Creá cuentas y asigná permisos."
        action={
          <AdminPrimaryButton
            onClick={() => {
              setError(null);
              setCreateOpen(true);
            }}
          >
            Nuevo usuario
          </AdminPrimaryButton>
        }
      />

      {message ? (
        <div className="mb-5">
          <MessageBanner message={message} type="success" />
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <AdminTable
          headers={["Nombre", "Email", "Permisos", ""]}
          empty={users.length === 0}
          emptyTitle="Sin usuarios aún"
          emptyDescription="Creá el primero para que alguien pueda entrar al panel."
        >
          {users.map((u) => (
            <tr key={u.id} className="transition hover:bg-brand-warm">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-warm font-serif text-sm text-brand-ink">
                    {u.name.charAt(0)}
                  </span>
                  <span className="font-medium text-brand-ink">{u.name}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-brand-text-muted">{u.email}</td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {STAFF_ROLES.filter((r) => (u.roles ?? []).includes(r)).map(
                    (r) => (
                      <AdminPill key={r} tone="primary">
                        {roleLabel(r)}
                      </AdminPill>
                    ),
                  )}
                </div>
              </td>
              <td className="relative px-5 py-4 text-right">
                <button
                  type="button"
                  onClick={() => setMenuId(menuId === u.id ? null : u.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-text-muted transition hover:bg-brand-warm hover:text-brand-ink"
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuId === u.id ? (
                  <div className="absolute top-12 right-5 z-10 min-w-[10rem] rounded-2xl border border-brand-ink/8 bg-white py-1.5 shadow-xl shadow-brand-ink/10">
                    <button
                      type="button"
                      className="block w-full px-3.5 py-2 text-left text-sm text-brand-ink hover:bg-brand-warm"
                      onClick={() => openEdit(u)}
                    >
                      Editar permisos
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3.5 py-2 text-left text-sm text-brand-ink hover:bg-brand-warm"
                      onClick={() => {
                        setResetUser(u);
                        setNewPassword("");
                        setMenuId(null);
                        setError(null);
                      }}
                    >
                      Reset password
                    </button>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <AdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo usuario"
        description="Combiná Agenda, Caja o Admin según lo que haga."
        footer={
          <button
            type="submit"
            form="create-user-form"
            className="btn-primary w-full !rounded-xl"
          >
            Crear usuario
          </button>
        }
      >
        <form id="create-user-form" onSubmit={handleCreate} className="space-y-3.5">
          <div>
            <label className="label-field">Nombre</label>
            <input
              className="input-field !rounded-xl"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label-field">Email</label>
            <input
              type="email"
              className="input-field !rounded-xl"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label-field">Contraseña</label>
            <input
              type="password"
              className="input-field !rounded-xl"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
              minLength={8}
            />
          </div>
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-text-muted uppercase">
              Permisos
            </p>
            <div className="space-y-1.5">
              {STAFF_ROLES.map((role) => (
                <RoleChip
                  key={role}
                  active={form.roles[role]}
                  label={STAFF_ROLE_LABELS[role]}
                  description={roleHint(role)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      roles: { ...f.roles, [role]: !f.roles[role] },
                    }))
                  }
                />
              ))}
            </div>
          </div>
          {error ? <MessageBanner message={error} type="error" /> : null}
        </form>
      </AdminModal>

      <AdminModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Editar permisos"
        description={editUser?.name}
        footer={
          <button
            type="submit"
            form="edit-roles-form"
            className="btn-primary w-full !rounded-xl"
          >
            Guardar
          </button>
        }
      >
        <form id="edit-roles-form" onSubmit={saveRoles} className="space-y-1.5">
          {STAFF_ROLES.map((role) => (
            <RoleChip
              key={role}
              active={editRoles[role]}
              label={STAFF_ROLE_LABELS[role]}
              description={roleHint(role)}
              onClick={() =>
                setEditRoles((r) => ({ ...r, [role]: !r[role] }))
              }
            />
          ))}
          {error ? <MessageBanner message={error} type="error" /> : null}
        </form>
      </AdminModal>

      <AdminModal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        title="Nueva contraseña"
        description={resetUser?.email}
        footer={
          <button
            type="submit"
            form="reset-password-form"
            className="btn-primary w-full !rounded-xl"
          >
            Actualizar
          </button>
        }
      >
        <form id="reset-password-form" onSubmit={submitReset} className="space-y-3.5">
          <div>
            <label className="label-field">Contraseña (mín. 8)</label>
            <input
              type="password"
              className="input-field !rounded-xl"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {error ? <MessageBanner message={error} type="error" /> : null}
        </form>
      </AdminModal>
    </div>
  );
}
