"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { useLocale } from "@/components/LocaleProvider";

export default function EmployeeCreatePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.employeesCreate")}
        subtitle="Sumá un profesional al equipo y definí su horario."
        action={
          <Link
            href={`/s/${slug}/admin/employees`}
            className="btn-secondary py-2.5 text-sm"
          >
            {tr("admin.cancel")}
          </Link>
        }
      />
      <EmployeeForm />
    </div>
  );
}
