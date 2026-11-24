import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad · Florece",
  description: "Qué datos usa Florece, para qué y cómo pedir que se borren.",
};

const ACTUALIZADA = "4 de noviembre de 2026";
const CONTACTO = "info@floreceapp.com";

export default function Privacidad() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14 text-brand-ink">
      <Link href="/" className="text-sm font-medium text-brand-text-muted hover:text-brand-ink">
        ← Florece
      </Link>
      <h1 className="mt-6 font-display text-4xl">Política de privacidad</h1>
      <p className="mt-2 text-sm text-brand-text-muted">Última actualización: {ACTUALIZADA}</p>

      <div className="mt-8 space-y-8 leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:mb-2 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        <section>
          <p>
            Florece es un sistema para salones de belleza y barberías: agenda, reservas en línea, caja y equipo. Lo
            ofrece Galil Innovations a través del sitio floreceapp.com y de la app Florece para Android e iOS. Esta
            política explica qué datos usamos, para qué y qué podés hacer con ellos.
          </p>
        </section>

        <section>
          <h2>Si reservás una cita</h2>
          <ul>
            <li>Tu nombre y tu teléfono o WhatsApp; el correo solo si lo escribís.</li>
            <li>La cita: salón, servicios, profesional, día y hora, y su estado.</li>
            <li>Si te anotás en lista de espera, el día y los servicios que buscabas.</li>
          </ul>
          <p className="mt-2">
            Estos datos los recibe el salón donde reservás, que los usa para atenderte, confirmarte la cita y
            enviarte recordatorios. Cada salón es responsable de los datos de sus clientas; Florece los guarda y
            procesa por cuenta del salón.
          </p>
          <p className="mt-2">
            La app guarda en tu teléfono los salones que abriste y un código de cada cita para mostrártela en «Mis
            citas». No necesitás crear una cuenta para reservar.
          </p>
        </section>

        <section>
          <h2>Si trabajás en un salón</h2>
          <ul>
            <li>Tu nombre, correo y contraseña (guardada cifrada; nadie puede leerla).</li>
            <li>Tu rol en el salón y la actividad que registrás: citas, ventas, caja.</li>
          </ul>
          <p className="mt-2">
            En la app, la sesión se guarda cifrada en el almacenamiento seguro del teléfono y se borra al cerrar
            sesión.
          </p>
        </section>

        <section>
          <h2>Lo que no hacemos</h2>
          <ul>
            <li>No vendemos ni alquilamos datos personales.</li>
            <li>No usamos publicidad ni rastreadores de terceros en la app.</li>
            <li>No pedimos acceso a tu ubicación, contactos, cámara ni micrófono.</li>
          </ul>
        </section>

        <section>
          <h2>Dónde se guardan y con quién se comparten</h2>
          <p>
            Los datos se guardan en servidores de DigitalOcean en Estados Unidos, con conexión cifrada (HTTPS). Los
            correos de confirmación y recuperación de contraseña se envían por Google Workspace. Solo compartimos
            datos con estos proveedores para que el servicio funcione, o si una ley nos obliga.
          </p>
        </section>

        <section>
          <h2>Cuánto tiempo</h2>
          <p>
            Mientras el salón use Florece, conservamos su agenda e historial para que pueda consultarlos. Si un salón
            deja Florece, borramos sus datos cuando nos lo pide o después de 12 meses sin uso.
          </p>
        </section>

        <section>
          <h2>Tus derechos</h2>
          <p>
            Podés pedir ver, corregir o borrar tus datos. Si sos clienta de un salón, podés pedírselo al salón o
            escribirnos a{" "}
            <a className="underline" href={`mailto:${CONTACTO}`}>
              {CONTACTO}
            </a>{" "}
            indicando el salón y tu teléfono; respondemos en un plazo de 30 días. Para borrar lo que la app guarda
            en tu teléfono, alcanza con desinstalarla.
          </p>
        </section>

        <section>
          <h2>Menores de edad</h2>
          <p>Florece no está dirigido a menores de 13 años y no recopila sus datos a sabiendas.</p>
        </section>

        <section>
          <h2>Cambios y contacto</h2>
          <p>
            Si cambiamos esta política, actualizamos la fecha de arriba. Para cualquier consulta:{" "}
            <a className="underline" href={`mailto:${CONTACTO}`}>
              {CONTACTO}
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
