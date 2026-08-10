import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme-preference";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Florece — Software para salones",
  description: "Agenda, equipo y catálogo para tu salón de belleza.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

const themeInitScript = `
(function(){
  try {
    var key=${JSON.stringify(THEME_STORAGE_KEY)};
    var pref=localStorage.getItem(key);
    var resolved=pref==='dark'?'dark':'light';
    document.documentElement.dataset.theme=resolved;
    document.documentElement.style.colorScheme=resolved;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${dmSans.variable} ${cormorant.variable} antialiased`}>
        <LocaleProvider initialLocale="es">
          <ThemeProvider>{children}</ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
