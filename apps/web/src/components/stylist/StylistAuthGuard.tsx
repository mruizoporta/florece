"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getMe, isAuthenticated, logout } from "@/lib/auth";
import { isSalonStaff, isStylist, canAccessSalonAdmin } from "@florece/shared";

export function StylistAuthGuard({
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
        router.replace(`/login?redirect=/s/${slug}/stylist`);
        return;
      }
      const me = await getMe();
      if (!me?.user || !isSalonStaff(me.user.roles)) {
        await logout();
        router.replace(`/login?redirect=/s/${slug}/stylist`);
        return;
      }
      if (!isStylist(me.user.roles) && !canAccessSalonAdmin(me.user.roles)) {
        await logout();
        router.replace(`/login?redirect=/s/${slug}/stylist`);
        return;
      }
      if (isStylist(me.user.roles) && !me.user.employeeId && !canAccessSalonAdmin(me.user.roles)) {
        setReady(true);
        return;
      }
      setReady(true);
    }
    check();
  }, [router, slug]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f7f3ea]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
