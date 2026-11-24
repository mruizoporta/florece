"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useLocale } from "@/components/LocaleProvider";
import { AuthLayout } from "@/components/AuthLayout";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const { tr } = useLocale();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError(tr("reset.tooShort"));
    if (password !== confirm) return setError(tr("reset.mismatch"));
    setLoading(true);
    try {
      await api("/auth/reset-password", { method: "POST", body: { token, password } });
      setDone(true);
    } catch (err) {
      setError(tr(err instanceof ApiError && err.status === 400 ? "reset.invalidLink" : "forgot.error"));
    } finally {
      setLoading(false);
    }
  }

  const loginLink = (
    <Link href="/login" className="font-medium hover:text-brand-ink">
      {tr("forgot.backToLogin")}
    </Link>
  );

  if (!token) {
    return (
      <AuthLayout title={tr("reset.title")} footer={loginLink}>
        <p className="mt-3 text-sm text-brand-text-muted">{tr("reset.invalidLink")}</p>
        <Link href="/olvide-contrasena" className="btn-primary mt-6 w-full !rounded-xl !py-3.5">
          {tr("reset.requestNew")}
        </Link>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title={tr("reset.doneTitle")}>
        <p className="mt-3 text-sm text-brand-text-muted">{tr("reset.doneBody")}</p>
        <Link href="/login" className="btn-primary mt-6 w-full !rounded-xl !py-3.5">
          {tr("login.submit")}
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={tr("reset.title")} hint={tr("reset.hint")} footer={loginLink}>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label-field" htmlFor="password">
            {tr("reset.newPassword")}
          </label>
          <input
            id="password"
            type="password"
            className="input-field"
            autoComplete="new-password"
            autoFocus
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label-field" htmlFor="confirm">
            {tr("reset.confirm")}
          </label>
          <input
            id="confirm"
            type="password"
            className="input-field"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
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
          {loading ? tr("forgot.sending") : tr("reset.submit")}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
