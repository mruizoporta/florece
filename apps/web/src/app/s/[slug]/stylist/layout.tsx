"use client";

import { use } from "react";
import { StylistAuthGuard } from "@/components/stylist/StylistAuthGuard";
import { SalonMoneyProvider } from "@/components/admin/SalonMoneyProvider";

export default function StylistLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <StylistAuthGuard slug={slug}>
      <SalonMoneyProvider slug={slug}>{children}</SalonMoneyProvider>
    </StylistAuthGuard>
  );
}
