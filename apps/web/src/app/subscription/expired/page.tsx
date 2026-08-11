import Link from "next/link";
import { FloreceLogo } from "@/components/brand/FloreceLogo";

export default function SubscriptionExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-warm px-4">
      <div className="max-w-md rounded-2xl border border-brand-ink/8 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex justify-center">
          <FloreceLogo variant="badge" className="!h-16 !w-16 rounded-3xl" />
        </div>
        <h1 className="font-serif mb-4 text-3xl text-brand-ink">
          Suscripción vencida
        </h1>
        <p className="mb-8 text-brand-text-muted leading-relaxed">
          La suscripción de este salón ha expirado. Contacta al administrador
          para reactivar el servicio.
        </p>
        <Link href="/" className="btn-primary inline-flex items-center justify-center gap-2">
          <FloreceLogo variant="mark" tone="ink" size="sm" />
          Volver a Florece
        </Link>
      </div>
    </div>
  );
}
