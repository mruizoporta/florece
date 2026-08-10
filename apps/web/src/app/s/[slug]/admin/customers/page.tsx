"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Phone, Mail } from "lucide-react";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import {
  AdminIconButton,
  AdminPageHeader,
  AdminPill,
  AdminSearchField,
  AdminTable,
  AdminToolbar,
  LoadingSpinner,
} from "@/components/admin/AdminUi";
import { useLocale } from "@/components/LocaleProvider";

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function AdminCustomersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const q = search ? `?search=${encodeURIComponent(search)}` : "";
        const data = await api<Customer[]>(`/v1/customers${q}`, {
          tenantSlug: slug,
          auth: true,
        });
        setCustomers(data);
      } catch {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }
    const t = window.setTimeout(load, search ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [slug, search]);

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.customers")}
        subtitle="Personas que han agendado o visitado el salón."
      />

      <AdminToolbar>
        <AdminSearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, email o teléfono"
        />
      </AdminToolbar>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <AdminTable
          headers={["Cliente", "Contacto", "Citas", ""]}
          empty={customers.length === 0}
          emptyTitle="Sin clientes"
          emptyDescription="Aparecerán cuando alguien agende una cita."
        >
          {customers.map((c) => (
            <tr key={c.id} className="transition hover:bg-brand-warm/80">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-warm font-serif text-sm font-medium text-brand-ink">
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-brand-ink">
                      {c.name || "Cliente"}
                    </p>
                    <p className="text-xs text-brand-text-muted">#{c.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-brand-text-muted">
                {c.phone || c.email ? (
                  <div className="space-y-1">
                    {c.phone ? (
                      <p className="flex items-center gap-1.5 text-brand-ink">
                        <Phone size={13} className="shrink-0 opacity-50" />
                        {c.phone}
                      </p>
                    ) : null}
                    {c.email ? (
                      <p className="flex items-center gap-1.5">
                        <Mail size={13} className="shrink-0 opacity-50" />
                        <span className="truncate">{c.email}</span>
                      </p>
                    ) : null}
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-5 py-4">
                <AdminPill
                  tone={(c.appointmentsCount ?? 0) > 0 ? "primary" : "muted"}
                >
                  {c.appointmentsCount ?? 0}
                </AdminPill>
              </td>
              <td className="px-5 py-4 text-right">
                <AdminIconButton
                  action="view"
                  label="Ver ficha"
                  href={`/s/${slug}/admin/customers/${c.id}`}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
