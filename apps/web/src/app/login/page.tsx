"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loginSchema,
  isSalonStaff,
  salonStaffHomePath,
  type LoginSalonChoice,
} from "@florece/shared";
import { login, logout } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { useLocale } from "@/components/LocaleProvider";
import { AuthLayout } from "@/components/AuthLayout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tr } = useLocale();
  const redirectParam = searchParams.get("redirect");
  const salonParam = searchParams.get("salon") ?? "";
  const [tenantSlug, setTenantSlug] = useState(salonParam);
  const [showSalon, setShowSalon] = useState(Boolean(salonParam));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [salons, setSalons] = useState<LoginSalonChoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(slug?: string) {
    setError(null);
    setLoading(true);
    try {
      const input = loginSchema.parse({
        tenantSlug: slug || undefined,
        email: email.trim(),
        password,
      });
      const result = await login(input);
      if ("needsSalon" in result) {
        setSalons(result.salons);
        return;
      }
      if (result.user.platformRole) {
        const dest =
          redirectParam?.startsWith("/admin") ? redirectParam : "/admin";
        router.push(dest);
        return;
      }
      if (!isSalonStaff(result.user.roles)) {
        setError(
          "Esta cuenta no tiene acceso al panel del salón. Pedile al dueño que te asigne un rol.",
        );
        await logout();
        return;
      }
      const salonSlug = result.tenant?.slug ?? input.tenantSlug ?? "";
      const salonHome = salonStaffHomePath(salonSlug, result.user.roles);
      const dest =
        redirectParam?.startsWith(`/s/${salonSlug}/`)
          ? redirectParam
          : salonHome;
      router.push(dest);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setError(tr("login.invalid"));
      else if (err instanceof ApiError && err.status === 404) setError(tr("forgot.unknownSalon"));
      else if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError("No se pudo iniciar sesión. Revisá tus datos.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void signIn(showSalon ? tenantSlug.trim().toLowerCase() : undefined);
  }

  const footer = (
    <>
      {tr("login.noSalon")}{" "}
      <Link
        href="/registrar-salon"
        className="font-semibold text-brand-ink underline-offset-2 hover:underline"
      >
        {tr("login.register")}
      </Link>
    </>
  );

  const errorBox = error ? (
    <p
      role="alert"
      className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-800 ring-1 ring-red-500/15 dark:text-red-300"
    >
      {error}
    </p>
  ) : null;

  if (salons) {
    return (
      <AuthLayout title={tr("login.chooseTitle")} hint={tr("login.chooseHint")} footer={footer}>
        <ul className="mt-7 space-y-2.5">
          {salons.map((s) => (
            <li key={s.slug}>
              <button
                type="button"
                disabled={loading}
                onClick={() => signIn(s.slug)}
                className="group flex w-full items-center justify-between rounded-xl border border-brand-ink/10 bg-brand-elevated px-4 py-3.5 text-left transition hover:border-brand-primary disabled:opacity-50"
              >
                <span>
                  <span className="block text-sm font-semibold text-brand-ink">{s.name}</span>
                  <span className="block text-xs text-brand-text-muted">{s.slug}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-brand-text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-ink" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4">{errorBox}</div>
        <button
          type="button"
          onClick={() => setSalons(null)}
          className="mt-4 text-sm font-medium text-brand-text-muted hover:text-brand-ink"
        >
          ← {tr("login.chooseBack")}
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={tr("login.title")} hint={tr("login.hint")} footer={footer}>
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
          <div className="flex items-baseline justify-between gap-3">
            <label className="label-field" htmlFor="password">
              {tr("login.password")}
            </label>
            <Link
              href={showSalon && tenantSlug ? `/olvide-contrasena?salon=${encodeURIComponent(tenantSlug.trim())}` : "/olvide-contrasena"}
              className="text-xs font-medium text-brand-text-muted underline-offset-2 hover:text-brand-ink hover:underline"
            >
              {tr("login.forgot")}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="input-field pr-11"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-brand-text-muted transition hover:text-brand-ink"
              aria-label={tr(showPassword ? "login.hidePassword" : "login.showPassword")}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {showSalon ? (
          <div>
            <label className="label-field" htmlFor="tenantSlug">
              {tr("login.salonCode")}
            </label>
            <input
              id="tenantSlug"
              className="input-field"
              placeholder="ej. mi-salon"
              autoComplete="organization"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              required
            />
          </div>
        ) : null}

        {errorBox}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary !mt-6 w-full !rounded-xl !py-3.5 disabled:opacity-50"
        >
          {loading ? tr("login.submitting") : tr("login.submit")}
        </button>

        <button
          type="button"
          onClick={() => setShowSalon((v) => !v)}
          className="block w-full text-center text-xs font-medium text-brand-text-muted hover:text-brand-ink"
        >
          {tr(showSalon ? "login.withoutCode" : "login.withCode")}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
