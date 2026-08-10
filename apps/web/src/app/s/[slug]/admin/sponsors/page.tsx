"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Sponsor } from "@/lib/types";
import {
  AdminIconButton,
  AdminModal,
  AdminPageHeader,
  AdminPrimaryButton,
  AdminTable,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useLocale } from "@/components/LocaleProvider";

export default function AdminSponsorsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState({ name: "", image: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api<Sponsor[]>("/v1/sponsors", {
        tenantSlug: slug,
        auth: true,
      });
      setSponsors(data);
    } catch {
      setSponsors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [slug]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", image: "" });
    setMessage(null);
    setOpen(true);
  }

  function openEdit(sponsor: Sponsor) {
    setEditing(sponsor);
    setForm({ name: sponsor.name, image: sponsor.image });
    setMessage(null);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
    setForm({ name: "", image: "" });
    setMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      if (editing) {
        await api(`/v1/sponsors/${editing.id}`, {
          method: "PATCH",
          tenantSlug: slug,
          auth: true,
          body: { name: form.name, image: form.image },
        });
      } else {
        await api("/v1/sponsors", {
          method: "POST",
          tenantSlug: slug,
          auth: true,
          body: { name: form.name, image: form.image },
        });
      }
      closeModal();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar este sponsor?")) return;
    await api(`/v1/sponsors/${id}`, {
      method: "DELETE",
      tenantSlug: slug,
      auth: true,
    });
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.sponsors")}
        subtitle="Logos de marcas o aliados. Se muestran en una franja cerca del pie del sitio público."
        action={
          <AdminPrimaryButton onClick={openCreate}>
            Nuevo sponsor
          </AdminPrimaryButton>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <AdminTable
          headers={["Logo", "Nombre", ""]}
          empty={sponsors.length === 0}
          emptyTitle="Sin sponsors"
          emptyDescription="Agregá el logo de una marca para mostrarlo en tu sitio."
        >
          {sponsors.map((s) => (
            <tr key={s.id} className="transition hover:bg-brand-warm">
              <td className="px-5 py-4">
                <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-lg border border-brand-ink/10 bg-brand-elevated p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.image}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </td>
              <td className="px-5 py-4 font-medium text-brand-ink">{s.name}</td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-1.5">
                  <AdminIconButton
                    action="edit"
                    label={tr("admin.edit")}
                    onClick={() => openEdit(s)}
                  />
                  <AdminIconButton
                    action="delete"
                    label={tr("admin.delete")}
                    onClick={() => remove(s.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <AdminModal
        open={open}
        onClose={closeModal}
        title={editing ? "Editar sponsor" : "Nuevo sponsor"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Nombre de la marca</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Olaplex"
              required
            />
          </div>
          <div>
            <label className="label-field">Logo (ruta o URL)</label>
            <input
              className="input-field"
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              placeholder="/demo/sponsors/olaplex.svg"
              required
            />
            {form.image ? (
              <div className="mt-3 flex h-16 w-28 items-center justify-center overflow-hidden rounded-xl border border-brand-ink/10 bg-brand-elevated p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.image}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : null}
            <p className="mt-1.5 text-xs text-brand-text-muted">
              Usá el logo de la marca (PNG/SVG preferible). En el sitio se ve
              como una tarjeta con el logo, no como foto de producto.
            </p>
          </div>
          {message ? <MessageBanner message={message} type="error" /> : null}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full !rounded-2xl disabled:opacity-50"
          >
            {saving
              ? tr("admin.saving")
              : editing
                ? tr("admin.save")
                : "Crear"}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
