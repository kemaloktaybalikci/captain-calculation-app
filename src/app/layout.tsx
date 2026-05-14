import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kaptan Hesap",
  description:
    "Sezon öncesi maç başı maliyet ve sezon sonu lig ücreti mahsuplaşma aracı.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-100 text-zinc-900">{children}</body>
    </html>
  );
}
