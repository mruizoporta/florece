"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { InstagramFeed } from "@/lib/types";
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

export default function AdminInstagramPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const [feeds, setFeeds] = useState<InstagramFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api<InstagramFeed[]>("/v1/instagram-feeds", {
        tenantSlug: slug,
        auth: true,
      });
      setFeeds(data);
    } catch {
      setFeeds([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [slug]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await api("/v1/instagram-feeds", {
        method: "POST",
        tenantSlug: slug,
        auth: true,
        body: { content },
      });
      setContent("");
      setOpen(false);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    }
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar este embed?")) return;
    await api(`/v1/instagram-feeds/${id}`, {
      method: "DELETE",
      tenantSlug: slug,
      auth: true,
    });
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.instagram")}
        subtitle="Pegá el embed HTML de Instagram para mostrarlo en tu sitio."
        action={
          <AdminPrimaryButton onClick={() => setOpen(true)}>
            Nuevo embed
          </AdminPrimaryButton>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <AdminTable
          headers={["Vista previa", ""]}
          empty={feeds.length === 0}
          emptyTitle="Sin embeds"
          emptyDescription="Agregá un embed de Instagram para tu página."
        >
          {feeds.map((f) => (
            <tr key={f.id} className="transition hover:bg-brand-warm">
              <td className="max-w-xl px-5 py-4 font-mono text-xs text-brand-text-muted">
                {f.content.slice(0, 120)}
                {f.content.length > 120 ? "…" : ""}
              </td>
              <td className="px-5 py-4 text-right">
                <AdminIconButton
                  action="delete"
                  label={tr("admin.delete")}
                  onClick={() => remove(f.id)}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo embed"
        wide
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label-field">HTML de Instagram</label>
            <textarea
              className="input-field min-h-36 font-mono text-xs"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<blockquote>...</blockquote>"
              required
            />
          </div>
          {message ? <MessageBanner message={message} type="error" /> : null}
          <button type="submit" className="btn-primary w-full !rounded-2xl">
            Guardar
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
