import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Providers from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";

export const metadata: Metadata = {
  title: "RFID Inventory Manager",
  description: "Web Dashboard for managing UHF RFID Tags",
};

import { Toaster } from 'react-hot-toast';

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
return (
<html lang="vi">
  <body
    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
  >
    <Providers>
      <AuthProvider>
        <Toaster position="top-right" />
        {children}
      </AuthProvider>
    </Providers>
  </body>
</html>
);
};

export default RootLayout;
