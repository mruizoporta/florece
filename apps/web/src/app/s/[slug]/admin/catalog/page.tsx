"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  formatStockQty,
  isRecipeUsage,
  PRODUCT_UNIT_LABELS,
  PRODUCT_USAGE_LABELS,
  type ProductUnit,
  type ProductUsage,
} from "@florece/shared";
import { api, apiUpload } from "@/lib/api";
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
import { Upload } from "lucide-react";

type ServiceRow = {
  id: number;
  durationTime: number;
  consumablesCount?: number;
  consumables?: Array<{
    productId: number;
    quantity: number;
    productName?: string;
    unit?: ProductUnit;
  }>;
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
  minStock: number;
  lowStock: boolean;
  usage?: ProductUsage;
  unit?: ProductUnit;
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

type MovementRow = {
  id: number | string;
  type: string;
  quantity: number;
  stockAfter: number;
  reason?: string | null;
  createdAt?: string | null;
  user?: { id: number | string; name: string } | null;
  order?: { id: number | string; name?: string | null; status?: string } | null;
};

type EditTarget =
  | { kind: "service"; row: ServiceRow }
  | { kind: "product"; row: ProductRow }
  | { kind: "category"; row: Category }
  | null;

const MOVEMENT_LABEL: Record<string, string> = {
  sale: "Venta",
  consume: "Insumo",
  restore: "Reverso",
  receive: "Ingreso",
  adjustment: "Ajuste",
};

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
  const [canRecipes, setCanRecipes] = useState(false);
  const [recipeLines, setRecipeLines] = useState<
    Array<{ productId: string; quantity: string }>
  >([]);
  const [lowOnly, setLowOnly] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<ProductRow | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    direction: "out" as "in" | "out",
    qty: "1",
    reason: "",
  });
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const OUT_REASONS = [
    "Regalía",
    "Rifa / sorteo",
    "Daño / merma",
    "Uso interno",
    "Devolución a proveedor",
    "Otro",
  ];
  const IN_REASONS = [
    "Compra / ingreso",
    "Devolución de clienta",
    "Conteo / corrección",
    "Otro",
  ];
  const [historyProduct, setHistoryProduct] = useState<ProductRow | null>(null);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const lowCount = useMemo(
    () => products.filter((p) => p.lowStock).length,
    [products],
  );

  const visibleProducts = useMemo(
    () => (lowOnly ? products.filter((p) => p.lowStock) : products),
    [products, lowOnly],
  );
  const recipeProducts = useMemo(
    () => products.filter((p) => isRecipeUsage(p.usage ?? "retail")),
    [products],
  );

  async function load() {
    setLoading(true);
    try {
      const [svc, prod, cats, status] = await Promise.all([
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
        api<{
          entitlements?: { features?: { service_consumables?: boolean } };
        }>("/billing/account-status", { tenantSlug: slug, auth: true }).catch(
          () => null,
        ),
      ]);
      setServices(svc);
      setProducts(prod);
      setCategories(cats);
      setCanRecipes(
        Boolean(status?.entitlements?.features?.service_consumables),
      );
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
    setForm(tab === "products" ? { stock: "0", min_stock: "5", usage: "retail", unit: "unit" } : {});
    setRecipeLines([]);
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
    setRecipeLines(
      (row.consumables ?? []).map((c) => ({
        productId: String(c.productId),
        quantity: String(c.quantity),
      })),
    );
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
      min_stock: String(row.minStock ?? 0),
      usage: row.usage ?? "retail",
      unit: row.unit ?? "unit",
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

  function openAdjust(row: ProductRow) {
    setAdjustProduct(row);
    setAdjustForm({ direction: "out", qty: "1", reason: "" });
    setAdjustError(null);
  }

  async function openHistory(row: ProductRow) {
    setHistoryProduct(row);
    setHistoryLoading(true);
    setMovements([]);
    try {
      const rows = await api<MovementRow[]>(
        `/v1/catalog/products/${row.id}/movements`,
        { tenantSlug: slug, auth: true },
      );
      setMovements(rows);
    } catch {
      setMovements([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleAdjust(e: FormEvent) {
    e.preventDefault();
    if (!adjustProduct) return;
    const qty = Math.trunc(Number(adjustForm.qty));
    if (!Number.isFinite(qty) || qty <= 0) {
      setAdjustError("Indicá una cantidad mayor a 0");
      return;
    }
    const reason = adjustForm.reason.trim();
    if (!reason) {
      setAdjustError("Elegí o escribí un motivo");
      return;
    }
    setAdjustError(null);
    setAdjustSaving(true);
    try {
      const delta = adjustForm.direction === "out" ? -qty : qty;
      await api(`/v1/catalog/products/${adjustProduct.id}/adjust`, {
        method: "POST",
        tenantSlug: slug,
        auth: true,
        body: {
          delta,
          reason,
          type: adjustForm.direction === "out" ? "adjustment" : "receive",
        },
      });
      setAdjustProduct(null);
      await load();
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : "Error");
    } finally {
      setAdjustSaving(false);
    }
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
        let serviceId: number;
        if (isEdit && editing?.kind === "service") {
          await api(`/v1/catalog/services/${editing.row.id}`, {
            method: "PATCH",
            tenantSlug: slug,
            auth: true,
            body,
          });
          serviceId = editing.row.id;
        } else {
          const created = await api<{ id: number | string }>(
            "/v1/catalog/services",
            {
              method: "POST",
              tenantSlug: slug,
              auth: true,
              body,
            },
          );
          serviceId = Number(created.id);
        }
        if (canRecipes && Number.isFinite(serviceId)) {
          const items = recipeLines
            .filter((r) => r.productId)
            .map((r) => ({
              product_id: Number(r.productId),
              quantity: Math.max(1, Math.trunc(Number(r.quantity) || 1)),
            }));
          await api(`/v1/catalog/services/${serviceId}/consumables`, {
            method: "PUT",
            tenantSlug: slug,
            auth: true,
            body: { items },
          });
        }
      } else if (kind === "products" || kind === "product") {
        const usage = form.usage || "retail";
        const body: Record<string, unknown> = {
          category_id: Number(form.category_id),
          name: form.name,
          slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
          price:
            usage === "internal" && !form.price
              ? 0
              : Number(form.price),
          description: form.description ?? "",
          image: form.image || undefined,
          status: true,
          min_stock: Number(form.min_stock ?? 0),
          usage,
          unit: form.unit || "unit",
        };
        if (isEdit && editing?.kind === "product") {
          await api(`/v1/catalog/products/${editing.row.id}`, {
            method: "PATCH",
            tenantSlug: slug,
            auth: true,
            body,
          });
        } else {
          body.stock = Number(form.stock ?? 0);
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
  const isProductEdit = editing?.kind === "product";

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
        subtitle="Servicios, productos e inventario simple en un solo lugar."
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
          {lowCount > 0 ? ` · ${lowCount} bajo` : ""}
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

      {tab === "products" && !loading ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-ink">
            <input
              type="checkbox"
              className="rounded border-brand-ink/20"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
            />
            Solo stock bajo
          </label>
          {lowCount > 0 ? (
            <span className="text-xs text-amber-800">
              {lowCount} producto{lowCount === 1 ? "" : "s"} en o bajo el mínimo
            </span>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : tab === "services" ? (
        <AdminTable
          headers={["", "Nombre", "Duración", "Insumos", "Precio", ""]}
          empty={services.length === 0}
          emptyTitle="Sin servicios"
          emptyDescription="Creá el primero para que se pueda agendar."
        >
          {services.map((s) => {
            const photo = itemImageUrl(s.item.image);
            const insumos = s.consumablesCount ?? s.consumables?.length ?? 0;
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
                <td className="px-5 py-4 text-brand-text-muted">
                  {canRecipes ? (
                    insumos > 0 ? (
                      <AdminPill>{insumos}</AdminPill>
                    ) : (
                      <span className="text-xs">—</span>
                    )
                  ) : (
                    <span className="text-xs">Pro</span>
                  )}
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
          headers={["", "Nombre", "Uso", "Stock", "Mínimo", "Precio", ""]}
          empty={visibleProducts.length === 0}
          emptyTitle={lowOnly ? "Ninguno bajo mínimo" : "Sin productos"}
          emptyDescription={
            lowOnly
              ? "Todo el inventario está por encima del mínimo."
              : undefined
          }
        >
          {visibleProducts.map((p) => {
            const photo = itemImageUrl(p.item.image);
            const usage = (p.usage ?? "retail") as ProductUsage;
            const unit = (p.unit ?? "unit") as ProductUnit;
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
                  <AdminPill>{PRODUCT_USAGE_LABELS[usage]}</AdminPill>
                </td>
                <td className="px-5 py-4">
                  <AdminPill>
                    {formatStockQty(p.stock, unit)}
                    {p.lowStock ? " · bajo" : ""}
                  </AdminPill>
                </td>
                <td className="px-5 py-4 text-brand-text-muted">
                  {formatStockQty(p.minStock, unit)}
                </td>
                <td className="px-5 py-4 font-semibold">
                  {usage === "internal"
                    ? "—"
                    : formatMoney(Number(p.item.price))}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <AdminIconButton
                      action="stock"
                      label="Ajustar stock"
                      onClick={() => openAdjust(p)}
                    />
                    <AdminIconButton
                      action="view"
                      label="Movimientos"
                      onClick={() => openHistory(p)}
                    />
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

          {isServiceForm && canRecipes ? (
            <div className="space-y-3 rounded-2xl border border-brand-ink/10 bg-brand-warm/40 p-4">
              <div>
                <p className="text-sm font-medium text-brand-ink">
                  Insumos del servicio
                </p>
                <p className="mt-0.5 text-xs text-brand-text-muted">
                  Solo productos de uso interno o «Ambos». Stock en la unidad del
                  producto (g, ml o und); se descuenta al cobrar.
                </p>
              </div>
              {recipeProducts.length === 0 ? (
                <p className="text-xs text-brand-text-muted">
                  Creá primero un producto con uso «Insumo» o «Ambos» (ej. tinte
                  en gramos).
                </p>
              ) : null}
              {recipeLines.map((line, idx) => {
                const selected = recipeProducts.find(
                  (p) => String(p.id) === line.productId,
                );
                const unitLabel =
                  PRODUCT_UNIT_LABELS[(selected?.unit ?? "unit") as ProductUnit];
                return (
                <div key={idx} className="grid grid-cols-[1fr_88px_auto] gap-2">
                  <ModernSelect
                    label={idx === 0 ? "Insumo" : undefined}
                    placeholder="Elegir insumo"
                    value={line.productId}
                    options={recipeProducts.map((p) => ({
                      value: String(p.id),
                      label: `${p.item.name} (${formatStockQty(p.stock, p.unit ?? "unit")})`,
                    }))}
                    onChange={(v) =>
                      setRecipeLines((rows) =>
                        rows.map((r, i) =>
                          i === idx ? { ...r, productId: v } : r,
                        ),
                      )
                    }
                  />
                  <div>
                    {idx === 0 ? (
                      <label className="label-field">Cant. ({unitLabel})</label>
                    ) : null}
                    <input
                      className="input-field"
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        setRecipeLines((rows) =>
                          rows.map((r, i) =>
                            i === idx
                              ? { ...r, quantity: e.target.value }
                              : r,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className={idx === 0 ? "pt-7" : "pt-1"}>
                    <AdminIconButton
                      action="delete"
                      label="Quitar"
                      onClick={() =>
                        setRecipeLines((rows) =>
                          rows.filter((_, i) => i !== idx),
                        )
                      }
                    />
                  </div>
                </div>
                );
              })}
              <button
                type="button"
                className="text-sm font-medium text-brand-ink underline-offset-2 hover:underline"
                onClick={() =>
                  setRecipeLines((rows) => [
                    ...rows,
                    { productId: "", quantity: "1" },
                  ])
                }
              >
                + Agregar insumo
              </button>
            </div>
          ) : null}

          {isServiceForm && !canRecipes ? (
            <p className="rounded-2xl bg-brand-warm/50 px-4 py-3 text-xs text-brand-text-muted">
              Insumos por servicio (control de stock al cobrar) disponible en
              plan Pro o Premium.
            </p>
          ) : null}

          {isProductForm ? (
            <div className="grid grid-cols-2 gap-3">
              <ModernSelect
                label="Uso"
                value={form.usage ?? "retail"}
                options={[
                  { value: "retail", label: "Vitrina (venta)" },
                  { value: "internal", label: "Insumo (recetas)" },
                  { value: "both", label: "Ambos" },
                ]}
                onChange={(v) => setForm((f) => ({ ...f, usage: v }))}
              />
              <ModernSelect
                label="Unidad de stock"
                value={form.unit ?? "unit"}
                options={[
                  { value: "unit", label: "Unidades (und)" },
                  { value: "g", label: "Gramos (g)" },
                  { value: "ml", label: "Mililitros (ml)" },
                ]}
                onChange={(v) => setForm((f) => ({ ...f, unit: v }))}
              />
              {!isProductEdit ? (
                <div>
                  <label className="label-field">
                    Stock inicial ({PRODUCT_UNIT_LABELS[(form.unit ?? "unit") as ProductUnit]})
                  </label>
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
              ) : (
                <div>
                  <label className="label-field">Stock actual</label>
                  <p className="input-field bg-brand-warm/50 text-brand-ink">
                    {formatStockQty(
                      editing.row.stock,
                      (editing.row.unit ?? form.unit ?? "unit") as ProductUnit,
                    )}{" "}
                    <span className="text-xs font-normal text-brand-text-muted">
                      (usar Ajustar)
                    </span>
                  </p>
                </div>
              )}
              <div>
                <label className="label-field">
                  Stock mínimo ({PRODUCT_UNIT_LABELS[(form.unit ?? "unit") as ProductUnit]})
                </label>
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  value={form.min_stock ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, min_stock: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="label-field">
                  Precio {form.usage === "internal" ? "(opcional para insumos)" : ""}
                </label>
                <input
                  className="input-field"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  required={form.usage !== "internal"}
                />
              </div>
            </div>
          ) : null}

          {(isServiceForm || isProductForm) && (
            <div>
              <label className="label-field">Imagen</label>
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
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="btn-secondary inline-flex cursor-pointer items-center gap-2 !rounded-xl px-3 py-2 text-sm">
                    <Upload size={14} />
                    Subir
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          fd.append("kind", "items");
                          const res = await apiUpload<{ path: string }>(
                            "/v1/storage/upload",
                            fd,
                            { tenantSlug: slug, auth: true },
                          );
                          setForm((f) => ({ ...f, image: res.path }));
                        } catch (err) {
                          setMessage(
                            err instanceof Error
                              ? err.message
                              : "Error al subir imagen",
                          );
                        }
                      }}
                    />
                  </label>
                  <input
                    className="input-field font-mono text-xs"
                    value={form.image ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, image: e.target.value }))
                    }
                    placeholder="/storage/… o /demo/services/corte.jpg"
                  />
                </div>
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

      <AdminModal
        open={Boolean(adjustProduct)}
        onClose={() => setAdjustProduct(null)}
        title={
          adjustProduct
            ? `Ajustar · ${adjustProduct.item.name}`
            : "Ajustar stock"
        }
      >
        {adjustProduct ? (
          <form onSubmit={handleAdjust} className="space-y-4">
            <p className="text-sm text-brand-text-muted">
              Stock actual:{" "}
              <strong className="text-brand-ink">
                {formatStockQty(
                  adjustProduct.stock,
                  adjustProduct.unit ?? "unit",
                )}
              </strong>
              {" · "}mínimo{" "}
              {formatStockQty(
                adjustProduct.minStock,
                adjustProduct.unit ?? "unit",
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  adjustForm.direction === "out"
                    ? "bg-brand-ink text-white"
                    : "bg-brand-warm text-brand-ink hover:bg-brand-primary/30"
                }`}
                onClick={() =>
                  setAdjustForm((f) => ({
                    ...f,
                    direction: "out",
                    reason: "",
                  }))
                }
              >
                Salida
              </button>
              <button
                type="button"
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  adjustForm.direction === "in"
                    ? "bg-brand-ink text-white"
                    : "bg-brand-warm text-brand-ink hover:bg-brand-primary/30"
                }`}
                onClick={() =>
                  setAdjustForm((f) => ({
                    ...f,
                    direction: "in",
                    reason: "",
                  }))
                }
              >
                Ingreso
              </button>
            </div>
            <div>
              <label className="label-field">Cantidad</label>
              <input
                className="input-field"
                type="number"
                min={1}
                step={1}
                value={adjustForm.qty}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, qty: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label-field">Motivo</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {(adjustForm.direction === "out"
                  ? OUT_REASONS
                  : IN_REASONS
                ).map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      adjustForm.reason === label
                        ? "bg-brand-primary/50 text-brand-ink"
                        : "bg-brand-warm text-brand-text-muted hover:text-brand-ink"
                    }`}
                    onClick={() =>
                      setAdjustForm((f) => ({ ...f, reason: label }))
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                className="input-field"
                value={adjustForm.reason}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, reason: e.target.value }))
                }
                placeholder={
                  adjustForm.direction === "out"
                    ? "Ej. regalía clienta VIP, frasco roto…"
                    : "Ej. factura #123, inventario…"
                }
                required
              />
            </div>
            {adjustError ? (
              <MessageBanner message={adjustError} type="error" />
            ) : null}
            <button
              type="submit"
              disabled={adjustSaving}
              className="btn-primary w-full !rounded-2xl disabled:opacity-50"
            >
              {adjustSaving
                ? tr("admin.saving")
                : adjustForm.direction === "out"
                  ? "Registrar salida"
                  : "Registrar ingreso"}
            </button>
          </form>
        ) : null}
      </AdminModal>

      <AdminModal
        open={Boolean(historyProduct)}
        onClose={() => setHistoryProduct(null)}
        title={
          historyProduct
            ? `Movimientos · ${historyProduct.item.name}`
            : "Movimientos"
        }
        wide
      >
        {historyLoading ? (
          <LoadingSpinner />
        ) : movements.length === 0 ? (
          <p className="text-sm text-brand-text-muted">Sin movimientos aún.</p>
        ) : (
          <div className="max-h-[50vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-brand-text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Fecha</th>
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 font-medium">Δ</th>
                  <th className="py-2 pr-3 font-medium">Queda</th>
                  <th className="py-2 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={String(m.id)} className="border-t border-brand-ink/5">
                    <td className="py-2.5 pr-3 text-brand-text-muted whitespace-nowrap">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      {MOVEMENT_LABEL[m.type] ?? m.type}
                    </td>
                    <td
                      className={`py-2.5 pr-3 font-medium ${
                        m.quantity < 0 ? "text-red-700" : "text-emerald-700"
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-2.5 pr-3">{m.stockAfter}</td>
                    <td className="py-2.5 text-brand-text-muted">
                      {m.reason ?? "—"}
                      {m.user?.name ? ` · ${m.user.name}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
