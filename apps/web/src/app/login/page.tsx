"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, isSalonStaff, salonStaffHomePath } from "@florece/shared";
import { login, logout } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale } from "@/components/LocaleProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tr } = useLocale();
  const redirectParam = searchParams.get("redirect");
  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const input = loginSchema.parse({
        tenantSlug: tenantSlug.trim().toLowerCase(),
        email: email.trim(),
        password,
      });
      const result = await login(input);
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
      const salonHome = salonStaffHomePath(input.tenantSlug, result.user.roles);
      const dest =
        redirectParam?.startsWith(`/s/${input.tenantSlug}/`)
          ? redirectParam
          : salonHome;
      router.push(dest);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError("No se pudo iniciar sesión. Revisá tus datos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(155deg,#12100e_0%,#1a1714_45%,#2a241c_100%)]" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 20%, rgba(196,165,116,0.22), transparent 42%), radial-gradient(circle at 85% 70%, rgba(196,165,116,0.1), transparent 40%)",
        }}
      />

      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 sm:top-6 sm:right-6">
        <LanguageToggle tone="onDark" />
        <ThemeToggle className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/15" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-center lg:gap-16 lg:px-8 lg:py-10">
        <div className="mb-8 w-full max-w-md text-center text-white lg:mb-0 lg:flex-1 lg:text-left">
          <Link
            href="/"
            className="font-serif text-3xl font-semibold tracking-tight"
          >
            Florece
          </Link>
          <p className="mt-5 font-serif text-3xl leading-tight font-medium md:text-4xl">
            {tr("login.panelTitle")}
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/65 md:text-base lg:mx-0">
            {tr("login.panelHint")}
          </p>
        </div>

        <div className="w-full max-w-md shrink-0 lg:flex-1">
          <div className="rounded-[1.5rem] border border-brand-ink/10 bg-brand-elevated p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)] sm:p-8">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">
              {tr("login.title")}
            </h1>
            <p className="mt-2 text-sm text-brand-text-muted">
              {tr("login.hint")}
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label className="label-field" htmlFor="tenantSlug">
                  {tr("login.salonCode")}
                </label>
                <input
                  id="tenantSlug"
                  className="input-field"
                  placeholder="ej. mi-salon"
                  autoComplete="organization"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  required
                />
              </div>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label-field" htmlFor="password">
                  {tr("login.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error ? (
                <p className="rounded-2xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-800 ring-1 ring-red-500/15">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-1 w-full !rounded-2xl disabled:opacity-50"
              >
                {loading ? "…" : tr("login.submit")}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-brand-text-muted">
              {tr("login.noSalon")}{" "}
              <Link
                href="/registrar-salon"
                className="font-semibold text-brand-ink underline-offset-2 hover:underline"
              >
                {tr("login.register")}
              </Link>
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-white/45">
            <Link href="/" className="hover:text-white/70">
              {tr("login.backHome")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
