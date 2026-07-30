import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastContainer } from "@/components/Toast";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OfflineBanner from "@/components/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { I18nProvider } from "@/lib/i18n/provider";
import { HtmlDirSync } from "@/components/HtmlDirSync";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-ibm-plex-mono-source",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-space-grotesk-source",
});

export const metadata: Metadata = {
  title: "Stellar-Spend — Convert Stablecoins to Fiat",
  description: "Off-ramp Stellar USDC/USDT to fiat currencies seamlessly.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stellar-Spend",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var t=s;if(!t){if(window.matchMedia('(prefers-contrast: more)').matches){t='high-contrast';}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){t='dark';}else{t='light';}}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t==='light'?'light':'dark';}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${ibmPlexMono.variable} ${spaceGrotesk.variable} font-ibm-plex-mono`}
      >
        <I18nProvider>
          <HtmlDirSync />
          <ThemeProvider>
            <ToastProvider>
              <OfflineBanner />
              <ErrorBoundary>{children}</ErrorBoundary>
              <ToastContainer />
              <ServiceWorkerRegistration />
              <PWAInstallPrompt />
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
