"use client";

import { PlatformAuthGuard } from "@/components/platform/PlatformAuthGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlatformAuthGuard>
      <PlatformShell>{children}</PlatformShell>
    </PlatformAuthGuard>
  );
}
