"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";
import {
  AdminIconButton,
  AdminModal,
  AdminPageHeader,
  AdminPill,
  AdminPrimaryButton,
  AdminTable,
  LoadingSpinner,
  MessageBanner,
  TabButton,
} from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { useLocale } from "@/components/LocaleProvider";
import { itemImageUrl } from "@/lib/images";

type ServiceRow = {
  id: number;
  durationTime: number;
  item: {
    name: string;
    price: number;
    description: string;
    slug: string;
    image?: string | null;
    categoryId?: number | string;
    category?: { id: number };
    status?: boolean;
  };
};

type ProductRow = {
  id: number;
  stock: number;
  item: {
    name: string;
    price: number;
    description: string;
    slug: string;
    image?: string | null;
    categoryId?: number | string;
    category?: { id: number };
    status?: boolean;
  };
};

type EditTarget =
  | { kind: "service"; row: ServiceRow }
  | { kind: "product"; row: ProductRow }
  | { kind: "category"; row: Category }
  | null;

export default function AdminCatalogPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const { formatMoney } = useSalonMoney();
  const [tab, setTab] = useState<"services" | "products" | "categories">(
    "services",
  );
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [svc, prod, cats] = await Promise.all([
        api<ServiceRow[]>("/v1/catalog/services", {
          tenantSlug: slug,
          auth: true,
        }),
        api<ProductRow[]>("/v1/catalog/products", {
          tenantSlug: slug,
          auth: true,
        }),
        api<Category[]>("/v1/catalog/categories", {
          tenantSlug: slug,
          auth: true,
        }),
      ]);
      setServices(svc);
      setProducts(prod);
      setCategories(cats);
    } catch {
      setServices([]);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [slug]);

  function openCreate() {
    setEditing(null);
    setForm({});
    setMessage(null);
    setOpen(true);
  }

  function categoryIdOf(item: {
    categoryId?: number | string;
    category?: { id: number };
  }) {
    return String(item.categoryId ?? item.category?.id ?? "");
  }

  function openEditService(row: ServiceRow) {
    setEditing({ kind: "service", row });
    setForm({
      category_id: categoryIdOf(row.item),
      name: row.item.name,
      slug: row.item.slug,
      description: row.item.description ?? "",
      price: String(row.item.price ?? ""),
      duration_time: String(row.durationTime ?? 30),
      image: row.item.image ?? "",
    });
    setMessage(null);
    setOpen(true);
  }

  function openEditProduct(row: ProductRow) {
    setEditing({ kind: "product", row });
    setForm({
      category_id: categoryIdOf(row.item),
      name: row.item.name,
      slug: row.item.slug,
      description: row.item.description ?? "",
      price: String(row.item.price ?? ""),
      stock: String(row.stock ?? 0),
      image: row.item.image ?? "",
    });
    setMessage(null);
    setOpen(true);
  }

  function openEditCategory(row: Category) {
    setEditing({ kind: "category", row });
    setForm({
      name: row.name,
      slug: row.slug ?? "",
    });
    setMessage(null);
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const isEdit = Boolean(editing);
      const kind = editing?.kind ?? tab;

      if (kind === "services" || kind === "service") {
        const body = {
          category_id: Number(form.category_id),
          name: form.name,
          slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
          price: Number(form.price),
          description: form.description ?? "",
          image: form.image || undefined,
          status: true,
          duration_time: Number(form.duration_time ?? 30),
        };
        if (isEdit && editing?.kind === "service") {
          await api(`/v1/catalog/services/${editing.row.id}`, {
            method: "PATCH",
            tenantSlug: slug,
            auth: true,
            body,
          });
        } else {
          await api("/v1/catalog/services", {
            method: "POST",
            tenantSlug: slug,
            auth: true,
            body,
          });
        }
      } else if (kind === "products" || kind === "product") {
        const body = {
          category_id: Number(form.category_id),
          name: form.name,
          slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
          price: Number(form.price),
          description: form.description ?? "",
          image: form.image || undefined,
          status: true,
          stock: Number(form.stock ?? 0),
        };
        if (isEdit && editing?.kind === "product") {
          await api(`/v1/catalog/products/${editing.row.id}`, {
            method: "PATCH",
            tenantSlug: slug,
            auth: true,
            body,
          });
        } else {
          await api("/v1/catalog/products", {
            method: "POST",
            tenantSlug: slug,
            auth: true,
            body,
          });
        }
      } else {
        const body = {
          name: form.name,
          slug: form.slug || undefined,
        };
        if (isEdit && editing?.kind === "category") {
          await api(`/v1/catalog/categories/${editing.row.id}`, {
            method: "PATCH",
            tenantSlug: slug,
            auth: true,
            body,
          });
        } else {
          await api("/v1/catalog/categories", {
            method: "POST",
            tenantSlug: slug,
            auth: true,
            body,
          });
        }
      }

      setForm({});
      setEditing(null);
      setOpen(false);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function archiveService(id: number) {
    await api(`/v1/catalog/services/${id}/archive`, {
      method: "PATCH",
      tenantSlug: slug,
      auth: true,
    });
    await load();
  }

  async function archiveProduct(id: number) {
    await api(`/v1/catalog/products/${id}/archive`, {
      method: "PATCH",
      tenantSlug: slug,
      auth: true,
    });
    await load();
  }

  async function deleteCategory(id: number) {
    if (!confirm("¿Eliminar categoría?")) return;
    await api(`/v1/catalog/categories/${id}`, {
      method: "DELETE",
      tenantSlug: slug,
      auth: true,
    });
    await load();
  }

  const modalKind = editing?.kind ?? tab;
  const isServiceForm = modalKind === "services" || modalKind === "service";
  const isProductForm = modalKind === "products" || modalKind === "product";
  const isCategoryForm =
    modalKind === "categories" || modalKind === "category";

  const createLabel =
    tab === "categories"
      ? "Nueva categoría"
      : tab === "products"
        ? "Nuevo producto"
        : "Nuevo servicio";

  const modalTitle = editing
    ? editing.kind === "category"
      ? "Editar categoría"
      : editing.kind === "product"
        ? "Editar producto"
        : "Editar servicio"
    : createLabel;

  const previewImage = itemImageUrl(form.image);

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.catalog")}
        subtitle="Servicios, productos y categorías en un solo lugar."
        action={
          <AdminPrimaryButton onClick={openCreate}>{createLabel}</AdminPrimaryButton>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton
          active={tab === "services"}
          onClick={() => {
            setTab("services");
            setMessage(null);
          }}
        >
          Servicios · {services.length}
        </TabButton>
        <TabButton
          active={tab === "products"}
          onClick={() => {
            setTab("products");
            setMessage(null);
          }}
        >
          Productos · {products.length}
        </TabButton>
        <TabButton
          active={tab === "categories"}
          onClick={() => {
            setTab("categories");
            setMessage(null);
          }}
        >
          {tr("admin.categories")} · {categories.length}
        </TabButton>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tab === "services" ? (
        <AdminTable
          headers={["", "Nombre", "Duración", "Precio", ""]}
          empty={services.length === 0}
          emptyTitle="Sin servicios"
          emptyDescription="Creá el primero para que se pueda agendar."
        >
          {services.map((s) => {
            const photo = itemImageUrl(s.item.image);
            return (
              <tr key={s.id} className="transition hover:bg-brand-warm">
                <td className="px-5 py-3">
                  <div className="flex h-11 w-11 overflow-hidden rounded-xl bg-brand-warm">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="m-auto font-serif text-sm text-brand-ink/40">
                        {s.item.name.charAt(0)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-brand-ink">{s.item.name}</p>
                  {s.item.description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-brand-text-muted">
                      {s.item.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-5 py-4">
                  <AdminPill>{s.durationTime} min</AdminPill>
                </td>
                <td className="px-5 py-4 font-semibold text-brand-ink">
                  {formatMoney(Number(s.item.price))}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <AdminIconButton
                      action="edit"
                      label={tr("admin.edit")}
                      onClick={() => openEditService(s)}
                    />
                    <AdminIconButton
                      action="archive"
                      label={tr("admin.archive")}
                      onClick={() => archiveService(s.id)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      ) : tab === "products" ? (
        <AdminTable
          headers={["", "Nombre", "Stock", "Precio", ""]}
          empty={products.length === 0}
          emptyTitle="Sin productos"
        >
          {products.map((p) => {
            const photo = itemImageUrl(p.item.image);
            return (
              <tr key={p.id} className="transition hover:bg-brand-warm">
                <td className="px-5 py-3">
                  <div className="flex h-11 w-11 overflow-hidden rounded-xl bg-brand-warm">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="m-auto font-serif text-sm text-brand-ink/40">
                        {p.item.name.charAt(0)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-brand-ink">{p.item.name}</p>
                  {p.item.description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-brand-text-muted">
                      {p.item.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-5 py-4">
                  <AdminPill>{p.stock}</AdminPill>
                </td>
                <td className="px-5 py-4 font-semibold">
                  {formatMoney(Number(p.item.price))}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <AdminIconButton
                      action="edit"
                      label={tr("admin.edit")}
                      onClick={() => openEditProduct(p)}
                    />
                    <AdminIconButton
                      action="archive"
                      label={tr("admin.archive")}
                      onClick={() => archiveProduct(p.id)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      ) : (
        <AdminTable
          headers={["Nombre", "Slug", ""]}
          empty={categories.length === 0}
          emptyTitle="Sin categorías"
        >
          {categories.map((c) => (
            <tr key={c.id} className="transition hover:bg-brand-warm">
              <td className="px-5 py-4 font-medium text-brand-ink">{c.name}</td>
              <td className="px-5 py-4 text-brand-text-muted">{c.slug}</td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-1.5">
                  <AdminIconButton
                    action="edit"
                    label={tr("admin.edit")}
                    onClick={() => openEditCategory(c)}
                  />
                  <AdminIconButton
                    action="delete"
                    label={tr("admin.delete")}
                    onClick={() => deleteCategory(c.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <AdminModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={modalTitle}
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {(isServiceForm || isProductForm) && (
            <ModernSelect
              label="Categoría"
              placeholder="Elegir categoría"
              value={form.category_id ?? ""}
              options={categories.map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              onChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
              required
            />
          )}
          <div>
            <label className="label-field">Nombre</label>
            <input
              className="input-field"
              value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          {!isCategoryForm ? (
            <div>
              <label className="label-field">Descripción</label>
              <textarea
                className="input-field min-h-20"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          ) : null}

          {isServiceForm ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Minutos</label>
                <input
                  className="input-field"
                  type="number"
                  min={5}
                  value={form.duration_time ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration_time: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label-field">Precio</label>
                <input
                  className="input-field"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
          ) : null}

          {isProductForm ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Stock</label>
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  value={form.stock ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label-field">Precio</label>
                <input
                  className="input-field"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
          ) : null}

          {(isServiceForm || isProductForm) && (
            <div>
              <label className="label-field">Imagen (ruta o filename)</label>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-warm">
                  {previewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="m-auto text-xs text-brand-text-muted">
                      —
                    </span>
                  )}
                </div>
                <input
                  className="input-field"
                  value={form.image ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, image: e.target.value }))
                  }
                  placeholder="/demo/services/corte.jpg"
                />
              </div>
            </div>
          )}

          {isCategoryForm ? (
            <div>
              <label className="label-field">Slug</label>
              <input
                className="input-field"
                value={form.slug ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
              />
            </div>
          ) : null}

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
