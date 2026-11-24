"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  History,
  Minus,
  PackageX,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import {
  formatStockQty,
  PRODUCT_USAGE_LABELS,
  type ProductUnit,
  type ProductUsage,
} from "@florece/shared";
import { api } from "@/lib/api";
import { itemImageUrl } from "@/lib/images";
import { AdminPageHeader, LoadingSpinner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import {
  StockAdjustModal,
  StockHistoryModal,
} from "@/components/admin/StockDialogs";

type ProductRow = {
  id: number;
  stock: number;
  minStock: number;
  lowStock: boolean;
  usage?: ProductUsage;
  unit?: ProductUnit;
  cost?: number;
  item: {
    name: string;
    price: number;
    image?: string | null;
    status?: boolean;
    category?: { name?: string } | null;
  };
};

type StockFilter = "all" | "low" | "out";
type UsageFilter = "all" | "sale" | "internal";

function stockState(p: ProductRow): "out" | "low" | "ok" {
  if (p.stock <= 0) return "out";
  if (p.lowStock || p.stock <= p.minStock) return "low";
  return "ok";
}

const STATE_STYLE = {
  out: { label: "Agotado", pill: "bg-red-500/12 text-red-700", bar: "bg-red-500" },
  low: { label: "Stock bajo", pill: "bg-amber-500/15 text-amber-800", bar: "bg-amber-500" },
  ok: { label: "En stock", pill: "bg-emerald-500/12 text-emerald-700", bar: "bg-emerald-500" },
} as const;

export default function InventoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");
  const [adjust, setAdjust] = useState<{ product: ProductRow; direction: "in" | "out" } | null>(null);
  const [history, setHistory] = useState<ProductRow | null>(null);

  async function load() {
    try {
      // shortcut: la API devuelve hasta 200 productos; paginar si un salón pasa de eso.
      const rows = await api<ProductRow[]>("/v1/catalog/products?limit=200", {
        tenantSlug: slug,
        auth: true,
      });
      setProducts(rows.filter((p) => p.item.status !== false));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const counts = useMemo(() => {
    let low = 0;
    let out = 0;
    let saleValue = 0;
    let costValue = 0;
    for (const p of products) {
      costValue += Math.max(p.stock, 0) * Number(p.cost || 0);
      const st = stockState(p);
      if (st === "low") low++;
      if (st === "out") out++;
      if (p.usage !== "internal") saleValue += Math.max(p.stock, 0) * Number(p.item.price || 0);
    }
    return { low, out, saleValue, costValue };
  }, [products]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products
      .filter((p) => {
        const st = stockState(p);
        if (stockFilter === "low" && st !== "low") return false;
        if (stockFilter === "out" && st !== "out") return false;
        if (usageFilter === "sale" && p.usage === "internal") return false;
        if (usageFilter === "internal" && p.usage === "retail") return false;
        return !needle || p.item.name.toLowerCase().includes(needle);
      })
      // Lo que hay que reponer primero, arriba.
      .sort((a, b) => {
        const rank = { out: 0, low: 1, ok: 2 };
        return rank[stockState(a)] - rank[stockState(b)] || a.item.name.localeCompare(b.item.name);
      });
  }, [products, query, stockFilter, usageFilter]);

  if (loading) return <LoadingSpinner />;

  const tiles = [
    { label: "Productos", value: products.length, icon: Boxes, accent: "124, 58, 237", light: "196, 181, 253", filter: "all" as const },
    { label: "Stock bajo", value: counts.low, icon: AlertTriangle, accent: "217, 119, 6", light: "252, 211, 77", filter: "low" as const },
    { label: "Agotados", value: counts.out, icon: PackageX, accent: "220, 38, 38", light: "252, 165, 165", filter: "out" as const },
    {
      label: "Valor en venta",
      value: formatMoney(counts.saleValue),
      sub: counts.costValue > 0 ? `Al costo ${formatMoney(counts.costValue)}` : undefined,
      icon: Wallet,
      accent: "5, 150, 105",
      light: "110, 231, 183",
      filter: null,
    },
  ];

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="Inventario"
        subtitle="Cuánto te queda de cada producto, qué hay que reponer y cada entrada o salida."
        action={
          <Link href={`/s/${slug}/admin/catalog`} className="btn-secondary py-2.5 text-sm">
            Productos del catálogo
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          const active = t.filter !== null && t.filter !== "all" && stockFilter === t.filter;
          return (
            <button
              key={t.label}
              type="button"
              disabled={t.filter === null}
              onClick={() => t.filter && setStockFilter(active ? "all" : t.filter)}
              className={`admin-stat-card text-left disabled:cursor-default ${active ? "ring-2 ring-offset-0" : ""}`}
              style={
                {
                  "--accent": t.accent,
                  "--accent-light": t.light,
                  "--tw-ring-color": `rgba(${t.accent}, 0.45)`,
                } as CSSProperties
              }
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                  {t.label}
                </p>
                <span className="admin-stat-icon">
                  <Icon size={17} strokeWidth={2} />
                </span>
              </div>
              <p
                className={`mt-3 font-serif font-semibold leading-none tracking-tight text-brand-ink ${
                  typeof t.value === "string" ? "text-[1.6rem]" : "text-[2.1rem]"
                }`}
              >
                {t.value}
              </p>
              {"sub" in t && t.sub ? (
                <p className="mt-1.5 text-xs text-brand-text-muted">{t.sub}</p>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="admin-card !p-0">
        <div className="flex flex-col gap-3 border-b border-brand-ink/[0.06] p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-text-muted"
            />
            <input
              type="search"
              className="input-field !pl-10"
              placeholder="Buscar producto…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1 rounded-xl bg-brand-ink/[0.05] p-1 text-sm">
            {(
              [
                ["all", "Todos"],
                ["sale", "Venta"],
                ["internal", "Uso interno"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setUsageFilter(value)}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  usageFilter === value
                    ? "bg-brand-elevated text-brand-ink shadow-sm"
                    : "text-brand-text-muted hover:text-brand-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-serif text-xl text-brand-ink">
              {products.length === 0 ? "Todavía no tenés productos" : "Nada por aquí"}
            </p>
            <p className="mt-1 text-sm text-brand-text-muted">
              {products.length === 0
                ? "Cargalos en el catálogo y acá vas a ver su stock."
                : stockFilter !== "all"
                  ? "Ningún producto en ese estado. ¡Bien!"
                  : "Ningún producto coincide con la búsqueda."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-brand-ink/[0.06]">
            {visible.map((p) => {
              const st = stockState(p);
              const style = STATE_STYLE[st];
              const unit = p.unit ?? "unit";
              // La barra se llena al doble del mínimo: por debajo del mínimo queda claramente corta.
              const fill = Math.min(100, (Math.max(p.stock, 0) / Math.max(p.minStock * 2, 1)) * 100);
              const image = itemImageUrl(p.item.image);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:flex-nowrap">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-warm text-brand-text-muted">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Boxes size={18} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-ink">{p.item.name}</p>
                      <p className="truncate text-xs text-brand-text-muted">
                        {PRODUCT_USAGE_LABELS[p.usage ?? "retail"]}
                        {p.usage !== "internal" ? ` · ${formatMoney(p.item.price)}` : ""}
                        {p.cost ? ` · costo ${formatMoney(p.cost)}` : ""}
                        {p.cost && p.usage !== "internal" && Number(p.item.price) > 0
                          ? ` · margen ${Math.round(((Number(p.item.price) - p.cost) / Number(p.item.price)) * 100)}%`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-52">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold tabular-nums text-brand-ink">
                        {formatStockQty(p.stock, unit)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.pill}`}>
                        {style.label}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-ink/[0.07]">
                      <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${fill}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-brand-text-muted">
                      Mínimo {formatStockQty(p.minStock, unit)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAdjust({ product: p, direction: "in" })}
                      className="inline-flex items-center gap-1 rounded-xl bg-brand-primary/20 px-3 py-2 text-xs font-semibold text-brand-ink transition hover:bg-brand-primary/35"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      Ingreso
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjust({ product: p, direction: "out" })}
                      aria-label={`Registrar salida de ${p.item.name}`}
                      title="Salida"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-ink/10 text-brand-text-muted transition hover:text-brand-ink"
                    >
                      <Minus size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistory(p)}
                      aria-label={`Movimientos de ${p.item.name}`}
                      title="Movimientos"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-ink/10 text-brand-text-muted transition hover:text-brand-ink"
                    >
                      <History size={15} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <StockAdjustModal
        slug={slug}
        product={adjust?.product ?? null}
        initialDirection={adjust?.direction}
        onClose={() => setAdjust(null)}
        onSaved={load}
      />
      <StockHistoryModal slug={slug} product={history} onClose={() => setHistory(null)} />
    </div>
  );
}
