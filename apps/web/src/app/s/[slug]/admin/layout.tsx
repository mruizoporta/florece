"use client";

import { AuthGuard } from "@/components/admin/AuthGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { PlanFeatureGate } from "@/components/admin/PlanFeatureGate";
import { use } from "react";

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <AuthGuard slug={slug}>
      <AdminShell slug={slug}>
        <PlanFeatureGate slug={slug}>{children}</PlanFeatureGate>
      </AdminShell>
    </AuthGuard>
  );
}
