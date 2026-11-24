# Instrucciones para IAs (Cursor, Claude, Copilot, etc.)

Antes de tocar servidores, despliegues o dependencias, lee **`../infra/SERVIDOR_PRODUCCION.md`** (ruta relativa a `~/Development/Proyectos`).

Reglas críticas (resumen):

1. **Next.js:** nunca instalar versiones vulnerables a React2Shell (CVE-2025-66478) ni a sus DoS posteriores. Mínimos: 15.2.x → **15.2.9**, 15.5.x → **15.5.10**, 16.0.x → **16.0.11**, 16.1.x → **16.1.5**, 14.x → **14.2.35** (tabla completa en el doc). **15.2.4 está PROHIBIDA**: con ella instalaron mineros en el servidor en 2026. Usar siempre la última versión de la línea y correr `npm audit`.
2. **Servidor de producción:** `galil-prod-01`, 137.184.112.101 (DigitalOcean SFO3). El servidor viejo 143.198.171.89 está comprometido: no copiar nada de ahí.
3. Las apps corren como usuario `app-<nombre>`, **nunca como root**. Prohibido `chmod 777`.
4. Las apps escuchan solo en 127.0.0.1; el acceso público es solo por nginx.
5. No instalar contenedores Docker ni servicios desconocidos.
6. Después de instalar dependencias en apps con Prisma: `prisma generate`.
7. dealerflow envía recordatorios de cobro automáticos: no levantar copias con datos reales sin desactivar sus jobs.
8. No guardar secretos en el código; van en `.env` (permisos 600).
