export type HelpLocale = "es" | "en";

export type HelpCategoryId =
  | "start"
  | "agenda"
  | "caja"
  | "negocio"
  | "presencia"
  | "cuenta";

export type Localized = Record<HelpLocale, string>;

export type HelpArticle = {
  id: string;
  category: HelpCategoryId;
  title: Localized;
  summary: Localized;
  steps?: Localized[];
  tips?: Localized[];
  /** Relative path under /s/{slug}/admin */
  href?: string;
  keywords: string[];
};

export const HELP_CATEGORIES: {
  id: HelpCategoryId | "all";
  label: Localized;
}[] = [
  { id: "all", label: { es: "Todo", en: "All" } },
  { id: "start", label: { es: "Primeros pasos", en: "Getting started" } },
  { id: "agenda", label: { es: "Agenda", en: "Schedule" } },
  { id: "caja", label: { es: "Caja", en: "POS" } },
  { id: "negocio", label: { es: "Negocio", en: "Business" } },
  { id: "presencia", label: { es: "Presencia", en: "Presence" } },
  { id: "cuenta", label: { es: "Cuenta", en: "Account" } },
];

export const HELP_QUICK_START: {
  id: string;
  title: Localized;
  description: Localized;
  href: string;
  articleId: string;
}[] = [
  {
    id: "qs-team",
    title: { es: "Arma tu equipo", en: "Set up your team" },
    description: {
      es: "Agrega profesionales y sus horarios.",
      en: "Add professionals and their schedules.",
    },
    href: "/employees",
    articleId: "equipo",
  },
  {
    id: "qs-catalog",
    title: { es: "Define servicios", en: "Define services" },
    description: {
      es: "Catálogo con precios y duración.",
      en: "Catalog with prices and duration.",
    },
    href: "/catalog",
    articleId: "catalogo",
  },
  {
    id: "qs-booking",
    title: { es: "Recibe citas", en: "Take bookings" },
    description: {
      es: "Agenda desde el panel o tu sitio.",
      en: "Book from the panel or your site.",
    },
    href: "/appointments",
    articleId: "citas",
  },
  {
    id: "qs-pos",
    title: { es: "Cobra en caja", en: "Charge at the register" },
    description: {
      es: "Tickets, pagos e impresión.",
      en: "Tickets, payments, and printing.",
    },
    href: "/orders",
    articleId: "caja",
  },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "panel",
    category: "start",
    title: { es: "El panel de Florece", en: "The Florece panel" },
    summary: {
      es: "Desde el panel administrás agenda, caja, equipo y la presencia pública de tu salón.",
      en: "From the panel you manage schedule, POS, team, and your public presence.",
    },
    steps: [
      {
        es: "Entrá con el slug de tu salón, email y contraseña.",
        en: "Sign in with your salon slug, email, and password.",
      },
      {
        es: "El menú izquierdo agrupa Operación, Negocio, Presencia y Cuenta.",
        en: "The left menu groups Operations, Business, Presence, and Account.",
      },
      {
        es: "Arriba podés abrir el sitio público o cambiar de sucursal si tenés más de una.",
        en: "At the top you can open the public site or switch branches if you have more than one.",
      },
    ],
    tips: [
      {
        es: "En móvil usá el botón de menú para abrir la navegación.",
        en: "On mobile, use the menu button to open navigation.",
      },
    ],
    href: "",
    keywords: ["inicio", "panel", "dashboard", "login", "menú"],
  },
  {
    id: "roles",
    category: "start",
    title: { es: "Roles y permisos", en: "Roles and permissions" },
    summary: {
      es: "Administrador ve todo; recepción maneja agenda; cajero opera la caja.",
      en: "Admin sees everything; reception manages the schedule; cashier runs the POS.",
    },
    steps: [
      {
        es: "Andá a Usuarios y creá cuentas para tu staff.",
        en: "Go to Users and create accounts for your staff.",
      },
      {
        es: "Asigná Admin, Recepcionista y/o Cajero según lo que necesiten.",
        en: "Assign Admin, Receptionist, and/or Cashier as needed.",
      },
      {
        es: "Cada persona entra con el mismo slug del salón y su email.",
        en: "Each person signs in with the salon slug and their email.",
      },
    ],
    href: "/users",
    keywords: ["roles", "permisos", "usuarios", "admin", "cajero", "recepción"],
  },
  {
    id: "citas",
    category: "agenda",
    title: { es: "Crear y gestionar citas", en: "Create and manage appointments" },
    summary: {
      es: "Agendá citas desde el panel o deja que clientas reserven en tu sitio.",
      en: "Book appointments from the panel or let clients reserve on your site.",
    },
    steps: [
      {
        es: "Abrí Citas → Nueva cita (o usá el Tablero / Calendario).",
        en: "Open Appointments → New appointment (or use Board / Calendar).",
      },
      {
        es: "Elegí servicios, profesional, fecha y hora.",
        en: "Choose services, professional, date, and time.",
      },
      {
        es: "Completá el contacto de la clienta y confirmá.",
        en: "Fill in the client contact and confirm.",
      },
      {
        es: "Podés reprogramar, cambiar estado o cancelar desde el detalle.",
        en: "You can reschedule, change status, or cancel from the detail view.",
      },
    ],
    tips: [
      {
        es: "El enlace público /agendar usa los colores de Apariencia.",
        en: "The public /agendar link uses your Appearance colors.",
      },
    ],
    href: "/appointments",
    keywords: ["citas", "agenda", "reservar", "agendar", "booking"],
  },
  {
    id: "tablero",
    category: "agenda",
    title: { es: "Tablero del día", en: "Day board" },
    summary: {
      es: "Vista tipo kanban para mover citas entre estados durante el servicio.",
      en: "Kanban-style view to move appointments between statuses during service.",
    },
    steps: [
      {
        es: "Abrí Tablero para ver las citas del día por columnas de estado.",
        en: "Open Board to see today's appointments by status columns.",
      },
      {
        es: "Actualizá el estado cuando la clienta llega, está en servicio o terminó.",
        en: "Update status when the client arrives, is in service, or is done.",
      },
    ],
    href: "/board",
    keywords: ["tablero", "kanban", "estados", "día"],
  },
  {
    id: "calendario",
    category: "agenda",
    title: { es: "Calendario", en: "Calendar" },
    summary: {
      es: "Vista semanal/mensual para planificar la ocupación del salón.",
      en: "Weekly/monthly view to plan salon occupancy.",
    },
    href: "/calendar",
    keywords: ["calendario", "semana", "mes", "ocupación"],
  },
  {
    id: "caja",
    category: "caja",
    title: { es: "Cobrar en caja", en: "Charge at the register" },
    summary: {
      es: "Cada ticket se factura en la sucursal activa. No se cobra desde otra sucursal.",
      en: "Each ticket is billed at the active branch. You don't charge from another branch.",
    },
    steps: [
      {
        es: "Abrí Caja y creá una orden (o partí de una cita concluida si aplica).",
        en: "Open POS and create an order (or start from a completed appointment if applicable).",
      },
      {
        es: "Agregá servicios o productos al ticket.",
        en: "Add services or products to the ticket.",
      },
      {
        es: "Registrá el pago y finalizá la orden.",
        en: "Record payment and finalize the order.",
      },
      {
        es: "Imprimí el ticket si la clienta lo necesita.",
        en: "Print the ticket if the client needs it.",
      },
    ],
    tips: [
      {
        es: "Si tenés varias sucursales, el dueño ve el consolidado en Resumen sucursales; la caja sigue siendo local.",
        en: "With multiple branches, the owner sees the rollup in Branch sales; POS stays local.",
      },
    ],
    href: "/orders",
    keywords: ["caja", "ticket", "pago", "pos", "facturar", "orden"],
  },
  {
    id: "equipo",
    category: "negocio",
    title: { es: "Equipo y horarios", en: "Team and schedules" },
    summary: {
      es: "Los profesionales y sus turnos definen quién aparece al agendar.",
      en: "Professionals and their shifts define who appears when booking.",
    },
    steps: [
      {
        es: "En Equipo creá cada profesional con foto y descripción.",
        en: "In Team, create each professional with photo and description.",
      },
      {
        es: "Configurá el horario semanal (días y franjas).",
        en: "Set the weekly schedule (days and time ranges).",
      },
      {
        es: "Desactivá temporalmente a quien no esté disponible.",
        en: "Temporarily deactivate anyone who is unavailable.",
      },
    ],
    href: "/employees",
    keywords: ["equipo", "empleados", "horario", "profesional", "staff"],
  },
  {
    id: "catalogo",
    category: "negocio",
    title: { es: "Catálogo de servicios y productos", en: "Services and products catalog" },
    summary: {
      es: "Servicios para agenda y productos para venta en caja.",
      en: "Services for booking and products for POS sales.",
    },
    steps: [
      {
        es: "Creá categorías para organizar el menú.",
        en: "Create categories to organize the menu.",
      },
      {
        es: "Agregá servicios con duración y precio.",
        en: "Add services with duration and price.",
      },
      {
        es: "Agregá productos si vendés retail en caja.",
        en: "Add products if you sell retail at the register.",
      },
    ],
    href: "/catalog",
    keywords: ["catálogo", "servicios", "productos", "precios", "categorías"],
  },
  {
    id: "clientes",
    category: "negocio",
    title: { es: "Clientes", en: "Customers" },
    summary: {
      es: "Historial de clientas por sucursal: citas y actividad reciente.",
      en: "Per-branch client history: appointments and recent activity.",
    },
    href: "/customers",
    keywords: ["clientes", "historial", "crm"],
  },
  {
    id: "sitio",
    category: "presencia",
    title: { es: "Sitio público y apariencia", en: "Public site and appearance" },
    summary: {
      es: "Tu marca online: colores, secciones, imágenes e Instagram.",
      en: "Your online brand: colors, sections, images, and Instagram.",
    },
    steps: [
      {
        es: "En Apariencia elegí colores del salón (afectan el sitio y el agendar).",
        en: "In Appearance choose salon colors (they affect the site and booking).",
      },
      {
        es: "Editá Secciones e Imágenes para el contenido del landing.",
        en: "Edit Sections and Images for landing content.",
      },
      {
        es: "Compartí /s/tu-slug y /s/tu-slug/agendar con tus clientas.",
        en: "Share /s/your-slug and /s/your-slug/agendar with clients.",
      },
    ],
    href: "/appearance",
    keywords: ["sitio", "apariencia", "colores", "marca", "landing"],
  },
  {
    id: "sucursales",
    category: "cuenta",
    title: { es: "Varias sucursales", en: "Multiple branches" },
    summary: {
      es: "Una cuenta Florece puede tener varias sucursales. Cada una tiene su caja y datos.",
      en: "One Florece account can have several branches. Each has its own POS and data.",
    },
    steps: [
      {
        es: "En Sucursales, el dueño puede agregar una nueva (slug único).",
        en: "In Branches, the owner can add a new one (unique slug).",
      },
      {
        es: "Usá el selector del encabezado para cambiar de sucursal.",
        en: "Use the header switcher to change branches.",
      },
      {
        es: "Revisá Resumen sucursales para ver ventas consolidadas (solo lectura).",
        en: "Check Branch sales for consolidated revenue (read-only).",
      },
    ],
    tips: [
      {
        es: "La suscripción a Florece es una sola para toda la cuenta.",
        en: "The Florece subscription is one for the whole account.",
      },
    ],
    href: "/branches",
    keywords: ["sucursales", "multi", "branches", "consolidado"],
  },
  {
    id: "facturacion",
    category: "cuenta",
    title: { es: "Plan y pagos a Florece", en: "Plan and Florece payments" },
    summary: {
      es: "Tu plan SaaS se gestiona con Florece (transferencia / depósito). No es la caja del salón.",
      en: "Your SaaS plan is managed with Florece (transfer / deposit). It is not salon POS.",
    },
    steps: [
      {
        es: "Abrí Facturación para ver plan, estado y historial de pagos.",
        en: "Open Billing to see plan, status, and payment history.",
      },
      {
        es: "Si el trial venció o hay pago pendiente, contactá a Florece por WhatsApp.",
        en: "If the trial ended or payment is due, contact Florece on WhatsApp.",
      },
    ],
    href: "/billing",
    keywords: ["plan", "suscripción", "pago", "trial", "florece", "billing"],
  },
  {
    id: "contabilidad",
    category: "negocio",
    title: {
      es: "Utilidad, egresos y cierre de caja",
      en: "Profit, expenses, and cash close",
    },
    summary: {
      es: "Contabilidad operativa: ingresos de caja, gastos categorizados y cierre diario de efectivo.",
      en: "Operational books: POS income, categorized expenses, and daily cash close.",
    },
    steps: [
      {
        es: "En Utilidad elegí un período para ver ingresos − egresos.",
        en: "In Profit pick a period to see income − expenses.",
      },
      {
        es: "Registrá egresos (alquiler, insumos, sueldos…) con método de pago.",
        en: "Record expenses (rent, supplies, payroll…) with payment method.",
      },
      {
        es: "Abrí Cierre de caja con fondo inicial; al cerrar contá el efectivo.",
        en: "Open Cash close with a float; when closing, count the cash.",
      },
      {
        es: "El sistema calcula esperado = fondo + efectivo cobrado − egresos en efectivo.",
        en: "The system computes expected = float + cash sales − cash expenses.",
      },
    ],
    tips: [
      {
        es: "Con varias sucursales, el dueño ve Utilidad sucursales (solo consulta).",
        en: "With multiple branches, the owner sees Branch profit (read-only).",
      },
    ],
    href: "/accounting",
    keywords: [
      "contabilidad",
      "utilidad",
      "egresos",
      "gastos",
      "cierre",
      "caja",
      "profit",
      "expenses",
    ],
  },
  {
    id: "datos",
    category: "cuenta",
    title: { es: "Datos del salón", en: "Salon details" },
    summary: {
      es: "Nombre, dirección, teléfono y WhatsApp que se muestran en el sitio.",
      en: "Name, address, phone, and WhatsApp shown on the site.",
    },
    href: "/settings",
    keywords: ["datos", "configuración", "whatsapp", "dirección", "settings"],
  },
];

export function tHelp(value: Localized, locale: HelpLocale): string {
  return value[locale] ?? value.es;
}

export function filterHelpArticles(
  query: string,
  category: HelpCategoryId | "all",
): HelpArticle[] {
  const q = query.trim().toLowerCase();
  return HELP_ARTICLES.filter((article) => {
    if (category !== "all" && article.category !== category) return false;
    if (!q) return true;
    const haystack = [
      article.id,
      ...Object.values(article.title),
      ...Object.values(article.summary),
      ...article.keywords,
      ...(article.steps?.flatMap((s) => Object.values(s)) ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
