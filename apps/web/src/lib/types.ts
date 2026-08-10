export type CatalogItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  status?: boolean;
  image?: string | null;
  categoryId?: number;
  category?: { id: number; name: string; slug: string } | null;
};

export type CatalogService = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  durationTime: number;
  categoryId?: number;
  categoryName?: string;
  item?: CatalogItem;
};

export type CatalogProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  categoryId?: number;
  categoryName?: string;
  item?: CatalogItem;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type PublicCatalog = {
  services: CatalogService[];
  products: CatalogProduct[];
  categories?: Category[];
};

export type PublicEmployee = {
  id: number;
  name: string;
  description: string;
  image: string;
  phone?: string | null;
  email?: string | null;
  status?: boolean;
  personalInfo?: { phone?: string; email?: string } | null;
  schedules?: ScheduleEntry[];
  socials?: { socialId: number; href: string; social?: { name: string } }[];
};

export type ScheduleEntry = {
  id?: number;
  weekday: number;
  startTime?: string;
  endTime?: string;
  start_time?: string;
  end_time?: string;
  status?: boolean;
};

export type Appointment = {
  id: number;
  name: string;
  phone?: string | null;
  startTime: string;
  endTime?: string | null;
  employeeId?: number | null;
  employee?: { id: number; name: string; image?: string | null } | null;
  status?: { id: number; name: string; color?: string | null };
  statusId?: number;
  type?: { id: number; name: string };
  services?: { id: number; name: string; durationTime?: number }[];
  customer?: { id: number; name: string; phone?: string } | null;
};

export type AvailableSlotsResponse = {
  hasSchedule: boolean;
  slots: { start: string; end: string }[];
};

export type TimeSlot = {
  time: string;
  available: boolean;
};

export type TenantSetting = {
  companyName?: string | null;
  mailContact?: string | null;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  currencySymbol?: string;
  whatsapp?: string | null;
  instagramHref?: string | null;
  embeddedContentMap?: string | null;
  logo?: string;
  banner?: string;
  aboutUs?: string | null;
  schedules?: string | null;
  imageLeft?: string;
  imageRight?: string;
  imageParallax?: string;
  buttonsBackgroundColor?: string;
  buttonsTextColor?: string;
  iconsColor?: string;
  titlesColor?: string;
  footerBackgroundColor?: string;
  footerTextColor?: string;
  btnWhatsappBackgroundColor?: string;
  btnWhatsappTextColor?: string;
  activeAppointment?: boolean;
  appointmentType?: string;
};

export type TenantSection = {
  aboutUsShowSection?: boolean;
  aboutUsText?: string;
  aboutUsIcon?: string;
  employeesShowSection?: boolean;
  employeesText?: string;
  employeesIcon?: string;
  servicesShowSection?: boolean;
  servicesText?: string;
  servicesIcon?: string;
  productsShowSection?: boolean;
  productsText?: string;
  productsIcon?: string;
  instagramShowSection?: boolean;
  instagramText?: string;
  instagramIcon?: string;
  whatsappShowSection?: boolean;
  whatsappTitle1?: string;
  whatsappTitle2?: string;
  whatsappTitle3?: string;
  whatsappIcon?: string;
  btnWhatsappButtonText?: string;
};

export type Sponsor = {
  id: number;
  name: string;
  image: string;
  href?: string | null;
};

export type InstagramFeed = {
  id: number;
  content: string;
  order?: number;
};

export type PublicPageData = {
  tenant: { id: number; name: string; slug: string; locale?: string };
  setting: TenantSetting;
  section: TenantSection;
  sponsors: Sponsor[];
  instagramFeeds: InstagramFeed[];
  services: CatalogService[];
  products: CatalogProduct[];
  employees: PublicEmployee[];
};

export type TenantSettings = Record<string, string>;

export type BillingInfo = {
  tenant?: {
    subscriptionStatus: string;
    plan?: { id: number; name: string; slug: string } | null;
    scheduledPlan?: { id: number; name: string; slug: string } | null;
    trialEndsAt?: string | null;
    subscriptionEndsAt?: string | null;
    billingRegion?: string;
    billingEmail?: string | null;
  };
  subscription?: {
    stripeStatus?: string;
    onTrial?: boolean;
    endsAt?: string | null;
  } | null;
  subscriptionStatus?: string;
  planName?: string;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  checkoutUrl?: string | null;
};

export type DashboardSummary = {
  income?: number;
  incomeToday?: number;
  appointmentsToday?: number;
  todayAppointments?: number;
  todayCount?: number;
  waiting?: number;
  pending?: number;
  topProducts?: { name: string; quantity: number; revenue: number }[];
  topServices?: {
    name: string;
    quantity: number;
    revenue: number;
    count?: number;
  }[];
  weekAppointments?: number;
  activeEmployees?: number;
};

export type Order = {
  id: number;
  name: string;
  status: string;
  total?: number;
  subtotal?: number;
  createdAt?: string;
  customer?: { id: number; name: string } | null;
  employee?: { id: number; name: string } | null;
  items?: OrderItem[];
  payments?: OrderPayment[];
};

export type OrderItem = {
  id: number;
  quantity: number;
  unitPrice?: number;
  lineDiscount?: number;
  item?: { id: number; name: string; price?: number };
  product?: { id: number; stock?: number; item?: { name: string; price?: number } };
};

export type OrderPayment = {
  id?: number;
  method: string;
  amount: number;
  reference?: string | null;
  paidAt?: string | null;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  roles?: string[];
  createdAt?: string;
};

export type Customer = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  appointmentsCount?: number;
};

export type AppointmentStatus = {
  id: number;
  name: string;
  color?: string | null;
};
