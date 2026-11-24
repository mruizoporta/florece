"use client";

import { useState } from "react";
import { PlatformAuthGuard } from "@/components/platform/PlatformAuthGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [advanced, setAdvanced] = useState(false);
  return (
    <PlatformAuthGuard>
      <PlatformShell>
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-brand-ink">
            La plataforma se administra en Support
          </h1>
          <p className="mt-3 text-sm text-brand-text-muted">
            Salones, planes, cobros y estado de la cuenta viven en SupportFlow.
            El panel de cada salón (citas, caja, catálogo) sigue en su enlace.
          </p>
          <a
            href="https://support.galilinnovations.com/products"
            className="mt-6 inline-flex rounded-2xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-brand-base"
          >
            Abrir Support
          </a>
          <button
            type="button"
            onClick={() => setAdvanced(true)}
            className="mt-4 block text-sm text-brand-text-muted underline"
          >
            Ajustes que aún no están en Support
          </button>
        </div>
        {advanced ? <div className="mt-8">{children}</div> : null}
      </PlatformShell>
    </PlatformAuthGuard>
  );
}
