"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { PLATFORM_TENANT_SLUG } from "@florece/shared";

type MeResponse = {
  user: {
    id: number;
    email: string;
    platformRole?: string | null;
  };
  tenant: { slug: string };
};

export function PlatformAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      if (!isAuthenticated()) {
        router.replace("/login?redirect=/admin");
        return;
      }
      try {
        const me = await api<MeResponse>("/auth/me", {
          auth: true,
          tenantSlug: PLATFORM_TENANT_SLUG,
        });
        if (!me.user?.platformRole) {
          // Salon sessions must not be cleared when hitting /admin by mistake.
          router.replace("/login");
          return;
        }
        setReady(true);
      } catch {
        router.replace("/login?redirect=/admin");
      }
    }
    check();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f4ef]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
