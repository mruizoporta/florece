"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { HelpManual } from "@/components/admin/help/HelpManual";
import { LoadingSpinner } from "@/components/admin/AdminUi";

export default function AdminHelpPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HelpManual slug={slug} />
    </Suspense>
  );
}
