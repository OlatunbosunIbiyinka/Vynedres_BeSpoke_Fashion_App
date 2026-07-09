import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VYNEDRES Atelier — Bespoke Fit Intelligence",
  description:
    "The atelier platform for independent tailors and fashion houses — clients, measurements, fittings and fit intelligence in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-vynedres-paper font-sans text-vynedres-ink antialiased">
        {children}
      </body>
    </html>
  );
}
