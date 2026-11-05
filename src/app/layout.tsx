import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AnalyticsLoader, CookieSettings } from "@/components/CookieSettings";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { SiteGate } from "@/components/SiteGate";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cycle Found — Community & Garages",
    template: "%s · Cycle Found",
  },
  description:
    "A community hub for bike people. Ask questions, document your garage, share what you know.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ground font-sans text-ink">
        <SiteGate>
          <AuthProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <CookieSettings />
            <AnalyticsLoader />
          </AuthProvider>
        </SiteGate>
      </body>
    </html>
  );
}
