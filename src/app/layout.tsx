import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import PwaRegistration from "@/components/common/PwaRegistration";
import SupportButton from "@/components/support/SupportButton";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://solarundo.prasanthp.tech"),
  title: {
    default: "Solar Undo? | KSEB Solar Slot Availability Checker",
    template: "%s | Solar Undo?",
  },
  description:
    "Check rooftop solar capacity availability for your KSEB connection. Find your transformer (DTR), available solar headroom, and transformer-wise feasibility before applying for rooftop solar.",
  keywords: [
    "Solar Undo",
    "Solar Undo App",
    "Solar Undo KSEB",
    "Solar Undo Kerala",
    "Solar ekiran",
    "Solar Undo Slot Checker",
    "Solar Undo Slot Checker App",
    "Solar ഉണ്ടോ",
    "KSEB Solar Slot Checker",
    "KSEB Solar Availability",
    "KSEB Rooftop Solar",
    "Kerala Solar",
    "DTR Capacity",
    "Transformer Capacity",
    "Net Metering Kerala",
    "Solar Feasibility",
    "Solar Availability Checker",
    "KSEB Solar Application",
    "KSEB Solar Registration",
    "KSEB Solar Feasibility",
    "KSEB Solar Capacity",
    "KSEB Solar Availability Checker",
  ],
  authors: [
    {
      name: "Prasanth P",
      url: "https://prasanthp.tech",
    },
  ],
  creator: "Prasanth P",
  publisher: "Solar ഉണ്ടോ?",
  applicationName: "Solar ഉണ്ടോ?",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Solar Undo",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Solar ഉണ്ടോ?",
    description:
      "Instantly check transformer-wise rooftop solar availability for your KSEB connection.",
    url: "https://solarundo.prasanthp.tech",
    siteName: "Solar ഉണ്ടോ?",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Solar ഉണ്ടോ? - KSEB Solar Slot Checker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solar ഉണ്ടോ?",
    description:
      "Check KSEB transformer-wise rooftop solar availability instantly.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://solarundo.prasanthp.tech",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegistration />
        <SupportButton />
      </body>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-B7MGNTVSGV"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-B7MGNTVSGV');
        `}
      </Script>
    </html>
  );
}
