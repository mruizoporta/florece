"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { employeeImageUrl } from "@/lib/images";
import type { PublicEmployee } from "@/lib/types";
import {
  AdminEmptyState,
  AdminIconButton,
  AdminPageHeader,
  AdminPill,
  AdminSearchField,
  AdminToolbar,
  LoadingSpinner,
} from "@/components/admin/AdminUi";
import { useLocale } from "@/components/LocaleProvider";

export default function AdminEmployeesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const [employees, setEmployees] = useState<PublicEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api<PublicEmployee[]>("/v1/employees", {
          tenantSlug: slug,
          auth: true,
        });
        setEmployees(Array.isArray(data) ? data : []);
      } catch {
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees.filter((e) => e.status !== false);
    return employees.filter(
      (e) =>
        e.status !== false &&
        (e.name.toLowerCase().includes(q) ||
          (e.description ?? "").toLowerCase().includes(q)),
    );
  }, [employees, search]);

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.employees")}
        subtitle="Profesionales que atienden y aparecen en la agenda."
        actionHref={`/s/${slug}/admin/employees/create`}
        actionLabel={tr("admin.employeesCreate")}
      />

      <AdminToolbar>
        <AdminSearchField
          value={search}
          onChange={setSearch}
          placeholder={tr("admin.search")}
        />
      </AdminToolbar>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          title="Sin profesionales"
          description="Agregá el primero para poder asignar citas."
          action={
            <Link
              href={`/s/${slug}/admin/employees/create`}
              className="btn-primary py-2.5 text-sm"
            >
              {tr("admin.employeesCreate")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => {
            const photo = employeeImageUrl(e.image);
            return (
              <article
                key={e.id}
                className="group overflow-hidden rounded-[1.25rem] border border-brand-ink/[0.06] bg-white shadow-[0_16px_40px_-28px_rgba(29,31,36,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-24px_rgba(29,31,36,0.45)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#eceae6]">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={e.name}
                      className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-serif text-5xl text-brand-ink/25">
                        {e.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-xl font-medium text-brand-ink">
                        {e.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-brand-text-muted">
                        {e.description || "Sin descripción"}
                      </p>
                    </div>
                    <AdminPill tone="primary">Activo</AdminPill>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-ink/5 pt-4">
                    <p className="truncate text-xs text-brand-text-muted">
                      {e.personalInfo?.phone ?? e.phone ?? "Sin teléfono"}
                    </p>
                    <AdminIconButton
                      action="edit"
                      label={tr("admin.edit")}
                      href={`/s/${slug}/admin/employees/${e.id}/edit`}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
