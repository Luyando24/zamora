import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import OfflineIndicator from "@/components/OfflineIndicator";
import "./globals.css";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zamora HMS",
  description: "Cloud-first, Offline-first Hotel Management System for Zambia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <OfflineIndicator />
        {children}
      </body>
    </html>
  );
}
