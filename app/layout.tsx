import type { Metadata } from "next";
import { Inter } from "next/font/google";
import OfflineIndicator from "@/components/OfflineIndicator";
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: '%s | Zamora',
    default: 'Zamora | Best Accommodation & Hotels in Zambia',
  },
  description: 'Discover and book top-rated hotels, lodges, safari camps, and guest houses in Zambia. Affordable rates, verified reviews, and instant confirmation for your Zambian adventure.',
  keywords: ['Accommodation in Zambia', 'Hotels in Lusaka', 'Safari Lodges', 'Zambia Tourism', 'Book Hotels Zambia', 'Cheap Stays Zambia', 'Livingstone Hotels', 'Guest Houses Zambia', 'Lodges in Zambia'],
  openGraph: {
    type: 'website',
    locale: 'en_ZM',
    url: 'https://zamoraapp.com',
    siteName: 'Zamora',
    title: 'Zamora | Best Accommodation & Hotels in Zambia',
    description: 'Discover and book top-rated hotels, lodges, safari camps, and guest houses in Zambia.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Zamora - Accommodation in Zambia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zamora | Best Accommodation & Hotels in Zambia',
    description: 'Discover and book top-rated hotels, lodges, safari camps, and guest houses in Zambia.',
  },
  manifest: '/manifest.json',
  themeColor: '#198a00',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Zamora',
  },
  verification: {
    google: 'fRS8wtMg8Flx-XpTmv7ovgt6HSihTn7UD5MQXR11byU',
  },
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
