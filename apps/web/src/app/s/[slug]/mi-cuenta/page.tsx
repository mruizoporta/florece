"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Sin cuenta de cliente: las citas se agendan desde la web pública. */
export default function MiCuentaRedirectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  useEffect(() => {
    router.replace(`/s/${slug}/agendar`);
  }, [router, slug]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-warm px-4">
      <p className="text-sm text-brand-text-muted">
        Redirigiendo a agendar…
      </p>
    </div>
  );
}
