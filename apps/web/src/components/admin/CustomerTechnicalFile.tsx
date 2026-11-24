"use client";

import { useEffect, useState } from "react";
import { Camera, FlaskConical, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { api, apiBlobUrl, apiUpload } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { MessageBanner } from "@/components/admin/AdminUi";

type CustomerRecord = {
  id: number;
  employeeId: number | null;
  employeeName: string | null;
  serviceName: string | null;
  formula: string | null;
  notes: string | null;
  beforePhoto: string | null;
  afterPhoto: string | null;
  recordedAt: string;
};

type Draft = {
  id?: number;
  date: string;
  service: string;
  employeeId: string;
  formula: string;
  notes: string;
  before: string;
  after: string;
};

const today = () => new Date().toLocaleDateString("en-CA");
const emptyDraft = (): Draft => ({
  date: today(),
  service: "",
  employeeId: "",
  formula: "",
  notes: "",
  before: "",
  after: "",
});

/** Las fotos de la ficha no son públicas: se piden con la sesión y se muestran como blob. */
function usePrivatePhoto(path: string | null | undefined, slug: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    // "/private/{slug}/customers/{archivo}" → "/v1/storage/private/customers/{archivo}"
    const m = path?.match(/^\/private\/[^/]+\/([a-z]+)\/([^/]+)$/);
    if (!m) {
      setUrl(null);
      return;
    }
    let local: string | null = null;
    let alive = true;
    apiBlobUrl(`/v1/storage/private/${m[1]}/${m[2]}`, slug)
      .then((u) => {
        local = u;
        if (alive) setUrl(u);
        else URL.revokeObjectURL(u);
      })
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
      if (local) URL.revokeObjectURL(local);
    };
  }, [path, slug]);
  return url;
}

function RecordPhoto({ path, label, alt, slug }: { path: string; label: string; alt: string; slug: string }) {
  const src = usePrivatePhoto(path, slug);
  return (
    <a
      href={src ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-brand-warm/50"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : null}
      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
        {label}
      </span>
    </a>
  );
}

function PhotoSlot({
  label,
  value,
  onChange,
  slug,
}: {
  label: string;
  value: string;
  onChange: (path: string) => void;
  slug: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = usePrivatePhoto(value, slug);

  async function pick(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "customers");
      const res = await apiUpload<{ path: string }>("/v1/storage/upload", form, { tenantSlug: slug, auth: true });
      onChange(res.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="label-field">{label}</p>
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-brand-ink/15 bg-brand-warm/50">
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src ? <img src={src} alt={label} className="h-full w-full object-cover" /> : null}
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={`Quitar foto ${label.toLowerCase()}`}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X size={15} />
            </button>
          </>
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 text-xs text-brand-text-muted">
            <Camera size={22} />
            {uploading ? "Subiendo…" : "Tomar o subir foto"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function CustomerTechnicalFile({
  slug,
  customerId,
  initialAllergies,
  serviceSuggestions,
}: {
  slug: string;
  customerId: string;
  initialAllergies: string | null;
  serviceSuggestions: string[];
}) {
  const opts = { tenantSlug: slug, auth: true };
  const [allergies, setAllergies] = useState(initialAllergies ?? "");
  const [savedAllergies, setSavedAllergies] = useState(initialAllergies ?? "");
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; name: string }>>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<CustomerRecord[]>(`/v1/customers/${customerId}/records`, opts)
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
    api<Array<{ id: number | string; name: string }>>("/v1/employees", opts)
      .then((rows) => setEmployees(rows.map((e) => ({ id: Number(e.id), name: e.name }))))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, customerId]);

  async function saveAllergies() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ allergies: string | null }>(`/v1/customers/${customerId}/allergies`, {
        ...opts,
        method: "PATCH",
        body: { allergies },
      });
      setAllergies(res.allergies ?? "");
      setSavedAllergies(res.allergies ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function saveRecord() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        recorded_at: `${draft.date}T12:00:00`,
        service_name: draft.service,
        employee_id: draft.employeeId ? Number(draft.employeeId) : null,
        formula: draft.formula,
        notes: draft.notes,
        before_photo: draft.before || null,
        after_photo: draft.after || null,
      };
      const saved = await api<CustomerRecord>(
        `/v1/customers/${customerId}/records${draft.id ? `/${draft.id}` : ""}`,
        { ...opts, method: draft.id ? "PATCH" : "POST", body },
      );
      setRecords((prev) =>
        [saved, ...prev.filter((r) => r.id !== saved.id)].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
      );
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function removeRecord(r: CustomerRecord) {
    if (!window.confirm("¿Borrar esta ficha? No se puede deshacer.")) return;
    setError(null);
    try {
      await api(`/v1/customers/${customerId}/records/${r.id}`, { ...opts, method: "DELETE" });
      setRecords((prev) => prev.filter((x) => x.id !== r.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  function edit(r: CustomerRecord) {
    setDraft({
      id: r.id,
      date: new Date(r.recordedAt).toLocaleDateString("en-CA"),
      service: r.serviceName ?? "",
      employeeId: r.employeeId ? String(r.employeeId) : "",
      formula: r.formula ?? "",
      notes: r.notes ?? "",
      before: r.beforePhoto ?? "",
      after: r.afterPhoto ?? "",
    });
  }

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  return (
    <div className="space-y-4">
      {error ? <MessageBanner message={error} type="error" /> : null}

      <section className={`admin-card ${savedAllergies ? "border-l-4 !border-l-red-500" : ""}`}>
        <div className="mb-2 flex items-center gap-2">
          <TriangleAlert size={16} className={savedAllergies ? "text-red-600" : "text-brand-text-muted"} />
          <h2 className="font-serif text-lg text-brand-ink">Alergias y cuidados</h2>
        </div>
        <textarea
          className="input-field min-h-[4.5rem] text-sm"
          placeholder="Ej: alérgica al amoníaco, cuero cabelludo sensible, embarazada…"
          aria-label="Alergias y cuidados"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
        />
        {allergies !== savedAllergies ? (
          <div className="mt-2 flex justify-end">
            <button type="button" className="btn-primary" disabled={busy} onClick={saveAllergies}>
              Guardar
            </button>
          </div>
        ) : null}
      </section>

      <section className="admin-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg text-brand-ink">Ficha técnica</h2>
            <p className="text-sm text-brand-text-muted">Fórmulas de color, cómo quedó y fotos de antes y después.</p>
          </div>
          {!draft ? (
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-1.5"
              onClick={() => setDraft(emptyDraft())}
            >
              <Plus size={16} />
              Nueva ficha
            </button>
          ) : null}
        </div>

        {draft ? (
          <form
            className="mb-5 space-y-3 rounded-2xl border border-brand-ink/10 bg-brand-warm/40 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveRecord();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label-field" htmlFor="rec-date">Fecha</label>
                <input
                  id="rec-date"
                  type="date"
                  className="input-field"
                  value={draft.date}
                  max={today()}
                  onChange={(e) => set({ date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label-field" htmlFor="rec-service">Servicio</label>
                <input
                  id="rec-service"
                  className="input-field"
                  list="rec-service-options"
                  placeholder="Ej: Balayage"
                  value={draft.service}
                  onChange={(e) => set({ service: e.target.value })}
                />
                <datalist id="rec-service-options">
                  {serviceSuggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <ModernSelect
                label="Profesional"
                placeholder="Quién lo hizo"
                value={draft.employeeId}
                options={[{ value: "", label: "Sin indicar" }, ...employees.map((e) => ({ value: String(e.id), label: e.name }))]}
                onChange={(v) => set({ employeeId: v })}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="rec-formula">Fórmula</label>
              <textarea
                id="rec-formula"
                className="input-field min-h-[4.5rem] font-mono text-sm"
                placeholder="Ej: 7.1 + 7.0 (30 g c/u) · oxidante 20 vol · 35 min"
                value={draft.formula}
                onChange={(e) => set({ formula: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="rec-notes">Notas</label>
              <textarea
                id="rec-notes"
                className="input-field min-h-[4rem] text-sm"
                placeholder="Cómo quedó, qué pidió para la próxima…"
                value={draft.notes}
                onChange={(e) => set({ notes: e.target.value })}
              />
            </div>
            <div className="grid max-w-md grid-cols-2 gap-3">
              <PhotoSlot label="Antes" value={draft.before} onChange={(p) => set({ before: p })} slug={slug} />
              <PhotoSlot label="Después" value={draft.after} onChange={(p) => set({ after: p })} slug={slug} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setDraft(null)} disabled={busy}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Guardando…" : "Guardar ficha"}
              </button>
            </div>
          </form>
        ) : null}

        {records.length === 0 && !draft ? (
          <div className="rounded-2xl border border-dashed border-brand-ink/12 px-4 py-10 text-center text-sm text-brand-text-muted">
            <FlaskConical size={22} className="mx-auto mb-2" />
            Todavía no hay fichas. Anotá la fórmula la próxima vez que la atiendan y no se pierde.
          </div>
        ) : (
          <ul className="space-y-3">
            {records.map((r) => (
              <li key={r.id} className="rounded-2xl border border-brand-ink/8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-brand-ink">{r.serviceName || "Visita"}</p>
                    <p className="text-xs text-brand-text-muted">
                      {formatDate(r.recordedAt)}
                      {r.employeeName ? ` · ${r.employeeName}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => edit(r)}
                      aria-label="Editar ficha"
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-brand-text-muted transition hover:bg-brand-warm hover:text-brand-ink"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecord(r)}
                      aria-label="Borrar ficha"
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-brand-text-muted transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {r.formula ? (
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-brand-warm/70 px-3 py-2 font-mono text-sm text-brand-ink">
                    {r.formula}
                  </p>
                ) : null}
                {r.notes ? <p className="mt-2 whitespace-pre-wrap text-sm text-brand-ink">{r.notes}</p> : null}
                {r.beforePhoto || r.afterPhoto ? (
                  <div className="mt-3 grid max-w-sm grid-cols-2 gap-2">
                    {(
                      [
                        ["Antes", r.beforePhoto],
                        ["Después", r.afterPhoto],
                      ] as const
                    ).map(([label, path]) =>
                      path ? (
                        <RecordPhoto
                          key={label}
                          path={path}
                          label={label}
                          alt={`${label} — ${r.serviceName ?? "visita"}`}
                          slug={slug}
                        />
                      ) : (
                        <div key={label} />
                      ),
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
