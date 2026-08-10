# Propuesta: Landing Florece SaaS

## Objetivo
Landing pública premium para captar dueños de salones de belleza. Producto comercial serio, vendido por Galil Innovations LLC.

---

## 1. Estructura de secciones

| # | Sección | Descripción |
|---|---------|-------------|
| 1 | **Nav** | Logo Florece, enlaces ancla (Beneficios, Módulos, Precios, FAQ), CTA "Crear mi salón" |
| 2 | **Hero** | Headline potente, subheadline, CTA principal, imagen/ilustración |
| 3 | **Propuesta de valor** | 3–4 bullets claros (uno por columna) |
| 4 | **Beneficios** | Grid de iconos + texto (6–8 beneficios) |
| 5 | **Módulos** | Cards: Agenda, Equipo, Ventas, Reportes, etc. |
| 6 | **Cómo funciona** | 3 pasos (Crear salón → Configurar → Operar) |
| 7 | **Pricing** | 3 planes: Básico, Pro, Premium (Pro destacado) |
| 8 | **FAQ** | Acordeón con 6–8 preguntas |
| 9 | **CTA final** | "Listo para digitalizar tu salón?" + botón |
| 10 | **Footer** | Galil Innovations LLC, links, legal mínimo |

---

## 2. Copy propuesto

### Hero
- **Headline:** *Tu salón, organizado. Agenda, equipo y ventas en un solo lugar.*
- **Subheadline:** *Florece es el sistema para salones de belleza que te permite enfocarte en lo que importa: tus clientes.*

### Propuesta de valor (3 puntos)
1. **Simple de usar** — Configura en minutos. Tu equipo lo adopta rápido.
2. **Todo en uno** — Agenda, inventario, ventas y reportes. Sin complicaciones.
3. **Hecho para salones** — Diseñado pensando en peluquerías, spas y centros de belleza.

### Módulos principales
- **Agenda inteligente** — Reservas online, recordatorios, vista por estilista.
- **Gestión de equipo** — Empleados, horarios, comisiones y desempeño.
- **Ventas e inventario** — Productos, servicios, tickets y reportes.
- **Reportes** — Ingresos, citas, servicios más vendidos.

### CTA
- Principal: **Crear mi salón** (lleva a /registrar-salon)
- Secundario: **Ver planes**

---

## 3. Branding visual

- **Tipografía:** Fuente elegante y legible (Cormorant Garamond o similar para headlines, DM Sans o Inter para body).
- **Paleta:**
  - Principal: Rosa suave / coral (#E8A4A4, #D4A5A5) + tonos nude
  - Acento: Dorado sutil (#C9A961) para destacar
  - Neutros: Gris cálido (#5C5C5C), blanco, off-white
- **Estilo:** Premium, femenino-profesional, limpio. Coherente con Galil Innovations LLC (empresa de belleza/estética).
- **Iconos:** Línea delgada (Lucide, Phosphor) o emojis discretos.

---

## 4. Pricing (datos reales)

| Plan | Empleados | Servicios | Precio/mes* |
|------|-----------|-----------|-------------|
| **Básico** | 3 | 10 | $X (NI) / $Y (US) |
| **Pro** | Ilimitados | Ilimitados | $X (NI) / $Y (US) |
| **Premium** | Ilimitados | Ilimitados | $X (NI) / $Y (US) |

*Los precios se cargan desde configuración o planes. Por ahora placeholders editables.
- **Trial:** 7 días gratis en todos los planes.
- **Recomendado:** Pro (badge "Más popular").

---

## 5. Integración con registro

- **URL:** `/registrar-salon`
- **Query param:** `?plan=pro` para precargar plan seleccionado.
- **Flujo:** Landing → Clic "Crear mi salón" → /registrar-salon (o /registrar-salon?plan=pro) → Formulario → Dashboard.
- **Mejora UX:** Formulario de registro con mismo estilo visual que la landing (colores, tipografía).

---

## 6. Arquitectura frontend

- **Stack:** Blade + Livewire.
- **Layout:** Nuevo `layouts.landing` (Tailwind, sin dependencia de Section/Setting de tenant).
- **Componentes:** Livewire `LandingPage` como contenedor; subvistas Blade para cada sección (o includes).
- **Ruta:** `/` → Landing Florece (pública).
- **Ruta legacy:** El contenido actual de welcome (salón público) puede moverse a `/s/{slug}` o mantenerse bajo otra ruta si aplica.

---

## 7. Fases de implementación

| Fase | Entregable |
|------|------------|
| **1** | Layout landing, Nav, Hero |
| **2** | Propuesta de valor, Beneficios, Módulos, Cómo funciona |
| **3** | Pricing (Básico/Pro/Premium), CTA |
| **4** | FAQ, CTA final, Footer |
| **5** | Integración registro, precarga plan, UX consistente |

---

## 8. Plan Premium

Se añadirá plan Premium al seeder y modelo (orderRank = 3). Límites: ilimitados. Diferenciador: soporte prioritario, reportes avanzados, etc. (copy por definir).
