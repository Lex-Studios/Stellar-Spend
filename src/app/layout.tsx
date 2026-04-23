import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/Toast";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1a1a2e" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`${ibmPlexMono.variable} ${spaceGrotesk.variable} font-ibm-plex-mono`}>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
