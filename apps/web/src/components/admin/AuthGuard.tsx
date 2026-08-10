"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getMe, isAuthenticated, logout } from "@/lib/auth";
import { isSalonStaff } from "@florece/shared";

export function AuthGuard({
  children,
  slug,
}: {
  children: ReactNode;
  slug: string;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      if (!isAuthenticated()) {
        router.replace(`/login?redirect=/s/${slug}/admin`);
        return;
      }
      const me = await getMe();
      if (!me?.user || !isSalonStaff(me.user.roles)) {
        await logout();
        router.replace(`/login?redirect=/s/${slug}/admin`);
        return;
      }
      setReady(true);
    }
    check();
  }, [router, slug]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
