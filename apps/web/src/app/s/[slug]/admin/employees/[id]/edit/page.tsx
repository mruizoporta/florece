"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { useLocale } from "@/components/LocaleProvider";

export default function EmployeeEditPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = Number(params.id);
  const { tr } = useLocale();

  return (
    <div>
      <AdminPageHeader
        title="Editar profesional"
        subtitle="Actualizá foto, datos y horario de atención."
        action={
          <Link
            href={`/s/${slug}/admin/employees`}
            className="btn-secondary py-2.5 text-sm"
          >
            {tr("admin.cancel")}
          </Link>
        }
      />
      <EmployeeForm employeeId={id} />
    </div>
  );
}
