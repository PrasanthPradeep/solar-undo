import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://solarundo.prasanthp.tech"),
  title: {
    default: "Solar ഉണ്ടോ? | KSEB Solar Slot Availability Checker",
    template: "%s | Solar ഉണ്ടോ?",
  },
  description:
    "Check rooftop solar capacity availability for your KSEB connection. Find your transformer (DTR), available solar headroom, and transformer-wise feasibility before applying for rooftop solar.",
  keywords: [
    "Solar Undo",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
