import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import OfflineIndicator from "@/components/OfflineIndicator";
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker';
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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <OfflineIndicator />
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
