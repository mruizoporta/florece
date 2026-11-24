"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowRight, Check, Plus, Store } from "lucide-react";
import {
  AdminPageHeader,
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
        body: { name: name.trim(), slug: slugify(name) },
      });
      setMessageType("success");
      setMessage(`Sucursal “${created.name}” creada`);
      setName("");
      await reload();
    } catch {
      setMessageType("error");
      setMessage("No se pudo crear la sucursal. Probá con otro nombre: puede que ya exista uno igual.");
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
    <div className="pb-16">
      <AdminPageHeader
        title="Sucursales"
        subtitle="Cada sucursal tiene su propia agenda, caja, clientes y catálogo. La suscripción es una sola para toda la cuenta."
      />

      {message ? (
        <MessageBanner type={messageType} message={message} />
      ) : null}

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => {
          const current = branch.slug === slug;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => goToBranch(branch)}
              className={`admin-card group flex flex-col gap-5 text-left transition hover:-translate-y-0.5 hover:border-brand-primary/40 ${
                current ? "!border-brand-primary/50 ring-1 ring-brand-primary/30" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/20 text-brand-primary-dark">
                  <Store size={20} strokeWidth={1.8} />
                </span>
                {current ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/20 px-2.5 py-1 text-[11px] font-semibold text-brand-primary-dark">
                    <Check size={12} strokeWidth={2.5} />
                    Actual
                  </span>
                ) : null}
              </div>
              <div>
                <p className="font-serif text-xl text-brand-ink">{branch.name}</p>
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-text-muted transition group-hover:text-brand-ink">
                  {current ? "Ir al panel" : "Entrar"}
                  <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {isOwner ? (
        <form onSubmit={handleCreate} className="admin-card max-w-2xl !p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/20 text-brand-primary-dark">
              <Plus size={18} strokeWidth={2} />
            </span>
            <div>
              <h2 className="font-serif text-xl text-brand-ink">Agregar sucursal</h2>
              <p className="text-sm text-brand-text-muted">
                Se crea vacía, con su propia agenda, caja y catálogo.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="label-field">Nombre de la sucursal</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Ej. Sucursal Centro"
              />
            </label>
            <button
              type="submit"
              disabled={saving || !slugify(name)}
              className="btn-primary shrink-0 disabled:opacity-50"
            >
              {saving ? "Creando…" : "Crear sucursal"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

// Dirección interna de la sucursal, derivada del nombre: el usuario no la ve.
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
