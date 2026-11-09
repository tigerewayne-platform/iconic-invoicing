import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-lexend" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: { default: "Iconic Billing", template: "%s · Iconic Billing" },
  description: "Quotes, invoices and receipts for Iconic Stretch Tents",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0D0D0D" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={`${lexend.variable} ${cormorant.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
