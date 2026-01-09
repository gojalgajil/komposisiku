import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KOMPOSISIKU - Cek Komposisi Produk",
  description: "Aplikasi untuk mengecek komposisi dan informasi produk kesehatan, kosmetik, dan makanan",
  icons: {
    icon: '/logoK.png',
    shortcut: '/logoK.png',
    apple: '/logoK.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
