"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import {
  getMe,
  listBranches,
  switchBranch,
  type BranchInfo,
} from "@/lib/auth";

export default function BranchesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [name, setName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  async function reload() {
    const list = await listBranches(slug);
    setBranches(list);
  }

  useEffect(() => {
    Promise.all([getMe(), listBranches(slug)])
      .then(([me, list]) => {
        setIsOwner(me?.user?.orgRole === "OWNER" || Boolean(me?.user?.roles?.includes("Admin")));
        setBranches(list);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const created = await api<BranchInfo>("/organizations/branches", {
        method: "POST",
        auth: true,
        tenantSlug: slug,
        body: { name, slug: newSlug },
      });
      setMessageType("success");
      setMessage(`Sucursal “${created.name}” creada`);
      setName("");
      setNewSlug("");
      await reload();
    } catch {
      setMessageType("error");
      setMessage("No se pudo crear la sucursal (¿slug en uso?)");
    } finally {
      setSaving(false);
    }
  }

  async function goToBranch(branch: BranchInfo) {
    if (branch.slug === slug) {
      router.push(`/s/${slug}/admin`);
      return;
    }
    await switchBranch({ slug: branch.slug }, slug);
    router.push(`/s/${branch.slug}/admin`);
    router.refresh();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-brand-ink">Sucursales</h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Cada sucursal tiene su propia caja, clientes y catálogo. La suscripción
          Florece es única para toda la cuenta.
        </p>
      </div>

      {message ? (
        <MessageBanner type={messageType} message={message} />
      ) : null}

      <div className="mb-10 overflow-hidden rounded-2xl border border-brand-ink/[0.06] bg-brand-elevated/70">
        <ul>
          {branches.map((branch) => (
            <li
              key={branch.id}
              className="flex items-center justify-between gap-3 border-b border-brand-ink/[0.04] px-4 py-3 last:border-0"
            >
              <div>
                <p className="font-medium text-brand-ink">{branch.name}</p>
                <p className="text-xs text-brand-text-muted">/{branch.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => goToBranch(branch)}
                className="rounded-xl border border-brand-ink/10 px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand-ink/[0.04]"
              >
                {branch.slug === slug ? "Actual" : "Entrar"}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {isOwner ? (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-brand-ink/[0.06] bg-brand-elevated/70 p-5"
        >
          <h2 className="font-serif text-xl text-brand-ink">Agregar sucursal</h2>
          <p className="mt-1 text-sm text-brand-text-muted">
            Se crea vacía: agenda, caja y catálogo propios.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-brand-text-muted">Nombre</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-brand-ink/10 px-3 py-2"
                placeholder="Sucursal Centro"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-brand-text-muted">Slug (URL)</span>
              <input
                required
                value={newSlug}
                onChange={(e) =>
                  setNewSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                      .replace(/-+/g, "-"),
                  )
                }
                className="w-full rounded-xl border border-brand-ink/10 px-3 py-2"
                placeholder="centro"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary mt-4"
          >
            {saving ? "Creando…" : "Crear sucursal"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
