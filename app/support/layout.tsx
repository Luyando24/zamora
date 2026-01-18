import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Support & FAQ | Zamora",
  description: "Get help with your Zamora bookings. Contact our support team or browse frequently asked questions regarding hotels and travel in Zambia.",
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
