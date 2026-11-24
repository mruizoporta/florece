import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Soporte · Florece",
  description: "Cómo pedir ayuda con Florece: reservas, acceso del equipo y datos personales.",
};

const CONTACTO = "info@floreceapp.com";

const Correo = () => (
  <a className="underline" href={`mailto:${CONTACTO}`}>
    {CONTACTO}
  </a>
);

export default function Soporte() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14 text-brand-ink">
      <Link href="/" className="text-sm font-medium text-brand-text-muted hover:text-brand-ink">
        ← Florece
      </Link>
      <h1 className="mt-6 font-display text-4xl">Soporte</h1>
      <p className="mt-2 text-sm text-brand-text-muted">
        Escribinos a <Correo /> y te respondemos en 1 o 2 días hábiles.
      </p>

      <div className="mt-8 space-y-8 leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:mb-2 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        <section>
          <h2>Si reservaste una cita</h2>
          <ul>
            <li>Tus citas y su estado están en «Mis citas», en el inicio de la app.</li>
            <li>Para cambiar o cancelar una cita, comunicate con el salón donde reservaste.</li>
            <li>No necesitás cuenta para reservar: solo tu nombre y tu teléfono.</li>
          </ul>
        </section>

        <section>
          <h2>Si trabajás en un salón</h2>
          <ul>
            <li>En la app, tocá «¿Trabajás en un salón? Entrá acá» y usá el usuario que te dio el salón.</li>
            <li>
              Si olvidaste tu contraseña, pedila de nuevo en{" "}
              <Link className="underline" href="/olvide-contrasena">
                floreceapp.com/olvide-contrasena
              </Link>{" "}
              o pedile a la dueña del salón que te la restablezca.
            </li>
            <li>
              Para registrar tu salón, entrá a{" "}
              <Link className="underline" href="/registrar-salon">
                floreceapp.com/registrar-salon
              </Link>
              .
            </li>
            <li>
              Dentro del panel del salón también podés abrir un ticket desde el asistente de ayuda.
            </li>
          </ul>
        </section>

        <section>
          <h2>Tus datos</h2>
          <p>
            Para ver, corregir o borrar tus datos, escribinos a <Correo /> indicando el salón y tu teléfono.
            Detalles en la{" "}
            <Link className="underline" href="/privacidad">
              política de privacidad
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
