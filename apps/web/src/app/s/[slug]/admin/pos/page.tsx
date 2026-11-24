"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Landmark,
  Minus,
  Plus,
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
  Wallet,
  Gift,
  BadgePercent,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { itemImageUrl } from "@/lib/images";
import { AdminPageHeader, LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { VOUCHER_STATUS, type Voucher } from "@/lib/vouchers";

type ProductRow = {
  id: number;
  stock: number;
  barcode?: string | null;
  item: { name: string; price: number; image?: string | null; status?: boolean };
};

type ServiceRow = {
  id: number;
  item: { id?: number; name: string; price: number; status?: boolean };
  itemId?: number;
};

type Employee = { id: number; name: string };

/** Lo que se puede vender: un producto (descuenta stock) o un servicio (necesita profesional). */
type Sellable = {
  key: string;
  kind: "product" | "service";
  refId: number;
  name: string;
  price: number;
  stock?: number;
  image?: string | null;
  barcode?: string | null;
};

type CartLine = Sellable & { qty: number };

type PayMethod = "cash" | "card" | "transfer";

const METHODS: Array<{ value: PayMethod; label: string; icon: typeof Banknote }> = [
  { value: "cash", label: "Efectivo", icon: Banknote },
  { value: "card", label: "Tarjeta", icon: CreditCard },
  { value: "transfer", label: "Transferencia", icon: Landmark },
];

type Quote = {
  manualMode: "off" | "admin" | "cashier";
  manualMaxPct: number;
  couponError: string | null;
  discounts: Array<{ key: string; source: string; label: string; amount: number; note: string | null }>;
  total: number;
};

export default function PosPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const searchRef = useRef<HTMLInputElement>(null);

  const [catalog, setCatalog] = useState<Sellable[]>([]);
  const [topNames, setTopNames] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cashOpen, setCashOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanner, setScanner] = useState(false);
  const [scanMiss, setScanMiss] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [method, setMethod] = useState<PayMethod>("cash");
  const [received, setReceived] = useState("");
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<{ id: number; total: number; change: number } | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [manual, setManual] = useState<{ type: "percent" | "amount"; value: string; reason: string } | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const opts = { tenantSlug: slug, auth: true };
    Promise.all([
      api<ProductRow[]>("/v1/catalog/products?for=sale&limit=200", opts).catch(() => []),
      api<ServiceRow[]>("/v1/catalog/services", opts).catch(() => []),
      api<Employee[]>("/v1/employees", opts).catch(() => []),
      api<{ products?: Record<string, { quantity: number }> }>("/v1/orders/reports/products", opts).catch(
        () => null,
      ),
      api<unknown>("/v1/accounting/cash-sessions/current", opts).catch(() => undefined),
      api<{ setting?: { barcodeScanner?: boolean } }>("/v1/settings", opts).catch(() => null),
    ])
      .then(([products, services, emps, report, session, settings]) => {
        // Los ajustes son solo de administradora; para cajeras basta con que haya productos con código.
        setScanner(
          settings ? Boolean(settings.setting?.barcodeScanner) : products.some((p) => p.barcode),
        );
        setCatalog([
          ...products
            .filter((p) => p.item.status !== false)
            .map((p) => ({
              key: `p${p.id}`,
              kind: "product" as const,
              refId: Number(p.id),
              name: p.item.name,
              price: Number(p.item.price),
              stock: p.stock,
              image: p.item.image,
              barcode: p.barcode,
            })),
          ...services
            .filter((s) => s.item.status !== false)
            .map((s) => ({
              key: `s${s.id}`,
              kind: "service" as const,
              // Los servicios se cobran por el id del ítem, no del servicio.
              refId: Number(s.item.id ?? s.itemId ?? s.id),
              name: s.item.name,
              price: Number(s.item.price),
            })),
        ]);
        setEmployees(emps.map((e) => ({ id: Number(e.id), name: e.name })));
        setTopNames(
          Object.entries(report?.products ?? {})
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .map(([name]) => name),
        );
        setCashOpen(session === undefined ? null : Boolean(session));
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const quickPicks = useMemo(() => {
    const ranked = topNames
      .map((name) => catalog.find((c) => c.name === name))
      .filter((c): c is Sellable => Boolean(c));
    const rest = catalog.filter((c) => c.kind === "product" && !ranked.includes(c));
    return [...ranked, ...rest].slice(0, 8);
  }, [catalog, topNames]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return catalog.filter((c) => c.name.toLowerCase().includes(needle)).slice(0, 8);
  }, [catalog, query]);

  const listTotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);
  // Estimado en pantalla; el servidor recalcula el canje exacto al cobrar.
  const voucherCover = useMemo(() => {
    let packageDiscount = 0;
    let packagePaid = 0;
    for (const v of vouchers.filter((x) => x.kind === "package")) {
      let left = v.sessionsTotal - v.sessionsUsed;
      const value = v.price / v.sessionsTotal;
      for (const l of cart) {
        if (l.kind !== "service" || l.refId !== v.serviceItemId || left <= 0) continue;
        const k = Math.min(l.qty, left);
        const per = Math.min(l.price, value);
        packageDiscount += (l.price - per) * k;
        packagePaid += per * k;
        left -= k;
      }
    }
    let due = listTotal - packageDiscount - packagePaid;
    let giftPaid = 0;
    for (const v of vouchers.filter((x) => x.kind === "giftcard")) {
      const use = Math.max(0, Math.min(v.balance, due));
      giftPaid += use;
      due -= use;
    }
    return { total: listTotal - packageDiscount, covered: packagePaid + giftPaid };
  }, [vouchers, cart, listTotal]);
  // Promociones, cupón y descuento a mano: los calcula el servidor (mismas reglas que el ticket).
  useEffect(() => {
    if (cart.length === 0) {
      setQuote(null);
      return;
    }
    const t = setTimeout(() => {
      api<Quote>("/v1/promotions/quote", {
        tenantSlug: slug,
        auth: true,
        method: "POST",
        body: {
          lines: cart.map((l) =>
            l.kind === "product" ? { product_id: l.refId, quantity: l.qty } : { item_id: l.refId, quantity: l.qty },
          ),
          coupon,
          manual: manual && Number(manual.value) > 0 ? { type: manual.type, value: Number(manual.value) } : null,
        },
      })
        .then((q) => {
          setQuote(q);
          if (q.couponError) {
            setVoucherError(q.couponError);
            setCoupon(null);
          }
        })
        .catch(() => setQuote(null));
    }, 250);
    return () => clearTimeout(t);
  }, [cart, coupon, manual, slug]);
  const promoDiscount = quote ? Math.max(0, listTotal - quote.total) : 0;
  const total = Math.max(0, Math.round((voucherCover.total - promoDiscount - voucherCover.covered) * 100) / 100);
  const hasServices = cart.some((l) => l.kind === "service");
  const receivedNum = Number(received) || 0;
  const change = method === "cash" && receivedNum > total ? receivedNum - total : 0;
  const shortCash = method === "cash" && received !== "" && receivedNum < total;
  const manualIncomplete = manual != null && (Number(manual.value) <= 0 || !manual.reason.trim());
  const canCharge = cart.length > 0 && !charging && (!hasServices || employeeId) && !shortCash && !manualIncomplete;

  function add(item: Sellable) {
    setLastSale(null);
    setError(null);
    setScanMiss(null);
    setCart((prev) => {
      const found = prev.find((l) => l.key === item.key);
      if (found) return prev.map((l) => (l.key === item.key ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { ...item, qty: 1 }];
    });
    setQuery("");
    searchRef.current?.focus();
  }

  function setQty(key: string, qty: number) {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const code = query.trim();
    // El lector teclea el código completo + Enter: primero se busca coincidencia exacta.
    const scanned = scanner && code ? catalog.find((c) => c.barcode === code) : undefined;
    if (scanned) add(scanned);
    else if (matches.length > 0) add(matches[0]);
    else if (scanner && code) {
      setScanMiss(`No hay ningún producto con el código ${code}`);
      setQuery("");
    }
  }

  const charge = useCallback(async () => {
    if (!canCharge) return;
    setCharging(true);
    setError(null);
    const opts = { tenantSlug: slug, auth: true };
    let orderId: number | null = null;
    let finalizing = false;
    try {
      const order = await api<{ id: number }>("/v1/orders", {
        ...opts,
        method: "POST",
        body: { name: customerName.trim() || "Consumidor final" },
      });
      orderId = Number(order.id);
      for (const line of cart) {
        await api(`/v1/orders/${orderId}/items`, {
          ...opts,
          method: "POST",
          body:
            line.kind === "product"
              ? { product_id: line.refId, quantity: line.qty, ...(employeeId ? { employee_id: Number(employeeId) } : {}) }
              : { item_id: line.refId, quantity: line.qty, employee_id: Number(employeeId) },
        });
      }
      // Descuentos antes que los bonos (con bonos aplicados el ticket queda fijo).
      if (manual && Number(manual.value) > 0) {
        await api(`/v1/orders/${orderId}/discounts`, {
          ...opts,
          method: "POST",
          body: { type: manual.type, value: Number(manual.value), reason: manual.reason },
        });
      }
      if (coupon) {
        await api(`/v1/orders/${orderId}/coupon`, { ...opts, method: "POST", body: { code: coupon } });
      }
      // Paquetes primero: bajan el total sobre el que se aplica una gift card.
      for (const v of [...vouchers].sort((a, b) => (a.kind === "package" ? -1 : 1) - (b.kind === "package" ? -1 : 1))) {
        await api(`/v1/orders/${orderId}/vouchers`, { ...opts, method: "POST", body: { code: v.code } });
      }
      // El total lo calcula el servidor (precios vigentes); se paga exactamente eso menos los bonos.
      const saved = await api<{ total: number | string; payments?: Array<{ method: string; amount: number | string }> }>(
        `/v1/orders/${orderId}`,
        opts,
      );
      const byVoucher = (saved.payments ?? [])
        .filter((p) => p.method === "voucher")
        .reduce((s, p) => s + Number(p.amount), 0);
      const serverTotal = Math.max(0, Math.round((Number(saved.total) - byVoucher) * 100) / 100);
      await api(`/v1/orders/${orderId}/payments`, {
        ...opts,
        method: "PATCH",
        body: { payments: serverTotal > 0 ? [{ method, amount: serverTotal }] : [] },
      });
      finalizing = true;
      await api(`/v1/orders/${orderId}/finalize`, { ...opts, method: "PATCH", body: {} });
      setLastSale({
        id: orderId,
        total: serverTotal,
        change: method === "cash" && receivedNum > serverTotal ? receivedNum - serverTotal : 0,
      });
      setCart([]);
      setVouchers([]);
      setCoupon(null);
      setManual(null);
      setCustomerName("");
      setReceived("");
      setCatalog((prev) =>
        prev.map((c) => {
          const sold = cart.find((l) => l.key === c.key && l.kind === "product");
          return sold && c.stock != null ? { ...c, stock: c.stock - sold.qty } : c;
        }),
      );
    } catch (err) {
      // Si algo falló a mitad de camino, no dejamos un ticket a medio armar.
      // Pero si el cobro ya se envió pudo haber entrado: anularlo devolvería stock y saldo de bonos ya cobrados.
      if (orderId && finalizing) {
        setError("No sabemos si el cobro entró. Revisá el ticket en Ventas antes de cobrar de nuevo.");
        return;
      }
      if (orderId) {
        await api(`/v1/orders/${orderId}/cancel`, {
          ...opts,
          method: "PATCH",
          body: { reason: "Venta rápida no completada" },
        }).catch(() => undefined);
      }
      setError(err instanceof Error ? err.message : "No se pudo cobrar. Probá de nuevo.");
    } finally {
      setCharging(false);
      searchRef.current?.focus();
    }
  }, [canCharge, slug, customerName, cart, employeeId, method, receivedNum, vouchers, coupon, manual]);

  async function addVoucher(e: FormEvent) {
    e.preventDefault();
    const code = voucherCode.trim();
    if (!code) return;
    setVoucherError(null);
    try {
      const v = await api<Voucher>(`/v1/vouchers/code/${encodeURIComponent(code)}`, { tenantSlug: slug, auth: true });
      if (v.status !== "active") throw new Error(`Ese bono está ${VOUCHER_STATUS[v.status].label.toLowerCase()}`);
      if (vouchers.some((x) => x.code === v.code)) throw new Error("Ese bono ya está aplicado");
      setVouchers((prev) => [...prev, v]);
      setVoucherCode("");
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : "Error");
    }
  }

  // F2 cobra, como en Cifra.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        void charge();
        return;
      }
      // Con lector, si el foco quedó en otro lado, el escaneo vuelve al buscador.
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (scanner && !typing && /^[0-9A-Za-z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [charge, scanner]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Venta rápida"
        subtitle="Cobrá productos o servicios de mostrador en segundos."
        action={
          <Link href={`/s/${slug}/admin/orders`} className="btn-secondary py-2.5 text-sm">
            Ver tickets
          </Link>
        }
      />

      {cashOpen === false ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>No hay una caja abierta. Abrila para que el efectivo cuadre al cierre.</p>
          <Link
            href={`/s/${slug}/admin/accounting/cash`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-xs font-semibold ring-1 ring-current/20 dark:bg-white/10"
          >
            <Wallet size={14} />
            Ir a Caja
          </Link>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="space-y-5">
          <section className="admin-card space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                Producto o servicio
              </p>
              <div className="relative">
                {scanner ? (
                  <ScanBarcode
                    size={17}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-text-muted"
                  />
                ) : (
                  <Search
                    size={16}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-text-muted"
                  />
                )}
                <input
                  ref={searchRef}
                  autoFocus
                  className="input-field !py-3.5 !pr-16 !pl-10"
                  placeholder={
                    scanner
                      ? "Escaneá el código o buscá por nombre…"
                      : "Buscá por nombre y presioná Enter…"
                  }
                  autoComplete="off"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setScanMiss(null);
                  }}
                />
                <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-brand-ink/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-text-muted">
                  Enter
                </kbd>
              </div>
              {scanMiss ? <p className="mt-2 text-sm font-medium text-red-700">{scanMiss}</p> : null}
              {matches.length > 0 ? (
                <ul className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-2xl border border-brand-ink/10 bg-brand-elevated p-1 shadow-lg">
                  {matches.map((m) => (
                    <li key={m.key}>
                      <button
                        type="button"
                        onClick={() => add(m)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-brand-ink/[0.05]"
                      >
                        <span className="min-w-0 flex-1 truncate text-brand-ink">{m.name}</span>
                        <span className="text-xs text-brand-text-muted">
                          {m.kind === "service" ? "Servicio" : `${m.stock ?? 0} en stock`}
                        </span>
                        <span className="w-24 text-right font-semibold tabular-nums text-brand-ink">
                          {formatMoney(m.price)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : query.trim() ? (
                <p className="mt-2 text-sm text-brand-text-muted">Nada coincide con «{query}».</p>
              ) : null}
            </form>

            {quickPicks.length > 0 ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                  {topNames.length > 0 ? "Más vendidos" : "Productos"}
                </p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2">
                  {quickPicks.map((p) => {
                    const image = itemImageUrl(p.image);
                    const out = p.kind === "product" && (p.stock ?? 0) <= 0;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => add(p)}
                        className="group flex items-center gap-2.5 rounded-xl border border-brand-ink/[0.08] bg-brand-elevated/60 p-2.5 text-left transition hover:-translate-y-0.5 hover:border-brand-primary/50"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-warm text-brand-text-muted">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ShoppingCart size={16} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-brand-ink">{p.name}</span>
                          <span className={`block text-xs tabular-nums ${out ? "text-red-700" : "text-brand-text-muted"}`}>
                            {formatMoney(p.price)}
                            {out ? " · agotado" : ""}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <section className="admin-card !p-0">
            <div className="flex items-center gap-2 border-b border-brand-ink/[0.06] px-5 py-3.5">
              <ShoppingCart size={16} className="text-brand-text-muted" />
              <h2 className="font-semibold text-brand-ink">Carrito</h2>
              {cart.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="ml-auto text-xs font-medium text-brand-text-muted hover:text-brand-ink"
                >
                  Vaciar
                </button>
              ) : null}
            </div>
            {lastSale ? (
              <div className="flex flex-wrap items-center gap-3 px-5 py-6">
                <CheckCircle2 size={28} className="text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-ink">
                    Venta registrada · {formatMoney(lastSale.total)}
                  </p>
                  <p className="text-sm text-brand-text-muted">
                    {lastSale.change > 0 ? `Vuelto: ${formatMoney(lastSale.change)} · ` : ""}
                    Ticket #{lastSale.id}
                  </p>
                </div>
                <Link
                  href={`/s/${slug}/admin/orders/${lastSale.id}`}
                  className="btn-secondary py-2 text-sm"
                >
                  Ver / imprimir ticket
                </Link>
              </div>
            ) : cart.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-brand-text-muted">
                Buscá un producto o tocá uno de arriba para empezar.
              </p>
            ) : (
              <ul className="divide-y divide-brand-ink/[0.06]">
                {cart.map((l) => {
                  const overStock = l.kind === "product" && l.stock != null && l.qty > l.stock;
                  return (
                    <li key={l.key} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-brand-ink">{l.name}</p>
                        <p className={`text-xs ${overStock ? "text-red-700" : "text-brand-text-muted"}`}>
                          {formatMoney(l.price)}
                          {l.kind === "service"
                            ? " · servicio"
                            : overStock
                              ? ` · solo hay ${l.stock}`
                              : ""}
                        </p>
                      </div>
                      <div className="flex items-center rounded-xl border border-brand-ink/10">
                        <button
                          type="button"
                          onClick={() => setQty(l.key, l.qty - 1)}
                          aria-label={`Quitar uno de ${l.name}`}
                          className="flex h-8 w-8 items-center justify-center text-brand-text-muted hover:text-brand-ink"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold tabular-nums text-brand-ink">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(l.key, l.qty + 1)}
                          aria-label={`Agregar uno de ${l.name}`}
                          className="flex h-8 w-8 items-center justify-center text-brand-text-muted hover:text-brand-ink"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="w-24 text-right text-sm font-semibold tabular-nums text-brand-ink">
                        {formatMoney(l.price * l.qty)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(l.key, 0)}
                        aria-label={`Sacar ${l.name} del carrito`}
                        className="rounded-lg p-1.5 text-brand-text-muted hover:bg-brand-ink/[0.05] hover:text-red-700"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="admin-card space-y-5 xl:sticky xl:top-24">
          {lastSale ? (
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-3.5">
              <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-emerald-800">Venta registrada · {formatMoney(lastSale.total)}</p>
                {lastSale.change > 0 ? (
                  <p className="text-emerald-800">Vuelto: {formatMoney(lastSale.change)}</p>
                ) : null}
                <Link
                  href={`/s/${slug}/admin/orders/${lastSale.id}`}
                  className="mt-1 inline-block font-semibold text-brand-ink underline underline-offset-2"
                >
                  Ver ticket #{lastSale.id}
                </Link>
              </div>
            </div>
          ) : null}
          <div>
            <label className="label-field">Clienta</label>
            <input
              className="input-field"
              placeholder="Consumidor final (opcional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {cart.length > 0 ? (
            <ModernSelect
              label={hasServices ? "Atendió" : "Vendió (opcional, para su comisión)"}
              placeholder={hasServices ? "Elegí la profesional" : "Nadie"}
              value={employeeId}
              options={[
                ...(hasServices ? [] : [{ value: "", label: "Nadie" }]),
                ...employees.map((e) => ({ value: String(e.id), label: e.name })),
              ]}
              onChange={setEmployeeId}
              required={hasServices}
            />
          ) : null}

          <div>
            <form onSubmit={addVoucher} className="flex gap-2">
              <input
                className="input-field font-mono uppercase"
                placeholder="Código de bono o gift card"
                aria-label="Código de bono o gift card"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
              <button type="submit" className="btn-secondary shrink-0" disabled={!voucherCode.trim()}>
                Usar
              </button>
            </form>
            {voucherError ? <p className="mt-1.5 text-xs text-red-700">{voucherError}</p> : null}
            {vouchers.map((v) => {
              const matches = v.kind === "giftcard" || cart.some((l) => l.kind === "service" && l.refId === v.serviceItemId);
              return (
                <div key={v.code} className="mt-2 flex items-center gap-2 rounded-xl bg-brand-warm/70 px-3 py-2 text-xs">
                  <Gift size={14} className="shrink-0 text-brand-text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-ink">
                      {v.holderName} · <span className="font-mono">{v.code}</span>
                    </p>
                    <p className={matches ? "text-brand-text-muted" : "text-red-700"}>
                      {v.kind === "giftcard"
                        ? `Gift card · saldo ${formatMoney(v.balance)}`
                        : matches
                          ? `Paquete · quedan ${v.sessionsTotal - v.sessionsUsed} de ${v.serviceName}`
                          : `Agregá «${v.serviceName}» al carrito para usar este paquete`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVouchers((prev) => prev.filter((x) => x.code !== v.code))}
                    aria-label={`Quitar bono ${v.code}`}
                    className="text-brand-text-muted hover:text-brand-ink"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            {coupon ? null : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!couponInput.trim()) return;
                  setVoucherError(null);
                  setCoupon(couponInput.trim().toUpperCase());
                  setCouponInput("");
                }}
                className="flex gap-2"
              >
                <input
                  className="input-field font-mono uppercase"
                  placeholder="Código de cupón"
                  aria-label="Código de cupón"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                />
                <button type="submit" className="btn-secondary shrink-0" disabled={!couponInput.trim()}>
                  Aplicar
                </button>
              </form>
            )}
            {(quote?.discounts ?? []).map((d) => (
              <div
                key={d.key}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
                  d.amount > 0 ? "bg-emerald-500/[0.08]" : "border border-dashed border-brand-ink/10"
                }`}
              >
                <BadgePercent size={14} className="shrink-0 text-brand-text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-ink">{d.label}</p>
                  {d.note ? <p className="text-brand-text-muted">{d.note}</p> : null}
                </div>
                {d.amount > 0 ? <span className="tabular-nums font-semibold text-emerald-700">−{formatMoney(d.amount)}</span> : null}
                {d.source === "coupon" || d.source === "manual" ? (
                  <button
                    type="button"
                    onClick={() => (d.source === "coupon" ? setCoupon(null) : setManual(null))}
                    aria-label={`Quitar ${d.label}`}
                    className="text-brand-text-muted hover:text-brand-ink"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            ))}
            {quote && quote.manualMode !== "off" ? (
              manual ? (
                <div className="space-y-2 rounded-xl bg-brand-warm/60 p-2.5">
                  <div className="flex gap-2">
                    <div className="flex rounded-lg bg-brand-ink/[0.05] p-0.5 text-xs" role="radiogroup" aria-label="Tipo de descuento">
                      {(
                        [
                          ["percent", "%"],
                          ["amount", "Monto"],
                        ] as const
                      ).map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={manual.type === v}
                          onClick={() => setManual({ ...manual, type: v })}
                          className={`rounded-md px-2.5 py-1 font-medium ${
                            manual.type === v ? "bg-brand-elevated text-brand-ink shadow-sm" : "text-brand-text-muted"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      className="input-field !py-1.5"
                      aria-label="Valor del descuento"
                      value={manual.value}
                      onChange={(e) => setManual({ ...manual, value: e.target.value })}
                    />
                  </div>
                  <input
                    className="input-field !py-1.5"
                    maxLength={200}
                    placeholder="Motivo (obligatorio)"
                    aria-label="Motivo del descuento"
                    value={manual.reason}
                    onChange={(e) => setManual({ ...manual, reason: e.target.value })}
                  />
                  {quote.manualMode === "cashier" ? (
                    <p className="text-[11px] text-brand-text-muted">La caja puede descontar hasta {quote.manualMaxPct}%.</p>
                  ) : (
                    <p className="text-[11px] text-brand-text-muted">Solo la administración puede dar descuentos a mano.</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setManual({ type: "percent", value: "", reason: "" })}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-ink underline-offset-2 hover:underline"
                >
                  <BadgePercent size={14} />
                  Descuento a mano…
                </button>
              )
            ) : null}
          </div>

          <div>
            <p className="label-field">Forma de pago</p>
            <div className="grid grid-cols-3 gap-1.5">
              {METHODS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethod(value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                    method === value
                      ? "border-brand-primary bg-brand-primary/20 text-brand-ink"
                      : "border-brand-ink/10 text-brand-text-muted hover:text-brand-ink"
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {method === "cash" ? (
            <div>
              <label className="label-field">Recibido</label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                className="input-field tabular-nums"
                placeholder={total ? String(total) : "0"}
                value={received}
                onChange={(e) => setReceived(e.target.value)}
              />
              {change > 0 ? (
                <p className="mt-1.5 text-sm font-semibold text-emerald-700">Vuelto: {formatMoney(change)}</p>
              ) : shortCash ? (
                <p className="mt-1.5 text-sm text-red-700">Faltan {formatMoney(total - receivedNum)}</p>
              ) : null}
            </div>
          ) : null}

          {voucherCover.covered > 0 ? (
            <p className="flex justify-between border-t border-brand-ink/[0.08] pt-3 text-sm text-brand-text-muted">
              <span>Cubre el bono</span>
              <span className="tabular-nums">−{formatMoney(voucherCover.covered + (listTotal - voucherCover.total))}</span>
            </p>
          ) : null}
          {promoDiscount > 0 ? (
            <p className="flex justify-between border-t border-brand-ink/[0.08] pt-3 text-sm text-brand-text-muted">
              <span>Descuentos</span>
              <span className="tabular-nums">−{formatMoney(promoDiscount)}</span>
            </p>
          ) : null}
          <div className="flex items-baseline justify-between border-t border-brand-ink/[0.08] pt-4">
            <span className="font-semibold text-brand-ink">{voucherCover.covered > 0 ? "A pagar" : "Total"}</span>
            <span className="font-serif text-4xl tabular-nums text-brand-ink">{formatMoney(total)}</span>
          </div>

          {error ? <MessageBanner message={error} type="error" /> : null}
          {hasServices && !employeeId ? (
            <p className="text-xs text-brand-text-muted">Elegí quién atendió para cobrar el servicio.</p>
          ) : null}

          <button
            type="button"
            onClick={() => void charge()}
            disabled={!canCharge}
            className="btn-primary flex w-full items-center justify-center gap-2 !py-4 text-base disabled:opacity-40"
          >
            {charging ? "Cobrando…" : `Cobrar · ${formatMoney(total)}`}
            <kbd className="rounded-md border border-current/25 px-1.5 py-0.5 text-[10px] font-semibold opacity-70">
              F2
            </kbd>
          </button>
        </aside>
      </div>
    </div>
  );
}
