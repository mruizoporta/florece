"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { forgotPasswordSchema } from "@florece/shared";
import { api, ApiError } from "@/lib/api";
import { useLocale } from "@/components/LocaleProvider";
import { AuthLayout } from "@/components/AuthLayout";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const { tr } = useLocale();
  const [tenantSlug, setTenantSlug] = useState(searchParams.get("salon") ?? "");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const input = forgotPasswordSchema.parse({
        tenantSlug: tenantSlug.trim().toLowerCase() || undefined,
        email: email.trim(),
      });
      await api("/auth/forgot-password", { method: "POST", body: input });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setError(tr("forgot.unknownSalon"));
      else setError(tr("forgot.error"));
    } finally {
      setLoading(false);
    }
  }

  const backToLogin = (
    <Link href="/login" className="font-medium hover:text-brand-ink">
      ← {tr("forgot.backToLogin")}
    </Link>
  );

  if (sent) {
    return (
      <AuthLayout
        title={tr("forgot.sentTitle")}
        hint={tr("forgot.sentBody").replace("{email}", email.trim())}
        footer={backToLogin}
      >
        <Link href="/login" className="btn-primary mt-8 w-full !rounded-xl !py-3.5">
          {tr("forgot.backToLogin")}
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={tr("forgot.title")} hint={tr("forgot.hint")} footer={backToLogin}>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label-field" htmlFor="email">
            {tr("login.email")}
          </label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="vos@tusalon.com"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label-field" htmlFor="tenantSlug">
            {tr("login.salonCode")}{" "}
            <span className="font-normal text-brand-text-muted">({tr("common.optional")})</span>
          </label>
          <input
            id="tenantSlug"
            className="input-field"
            placeholder="ej. mi-salon"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-800 ring-1 ring-red-500/15 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary !mt-6 w-full !rounded-xl !py-3.5 disabled:opacity-50"
        >
          {loading ? tr("forgot.sending") : tr("forgot.submit")}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
