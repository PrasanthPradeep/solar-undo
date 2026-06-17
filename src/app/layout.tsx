import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solar Slot ഉണ്ടോ?",
  description:
    "Check rooftop solar capacity availability on your KSEB transformer. Enter your consumer number and registered mobile to instantly see how much solar headroom is left on your DTR.",
  keywords: ["KSEB", "solar undo", "kseb solar", "solar", "rooftop solar", "net metering", "DTR capacity", "Kerala electricity"],
  openGraph: {
    title: "KSEB Solar Slot Checker",
    description: "Instantly check rooftop solar capacity availability for your KSEB connection in your locality",
    type: "website",
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
