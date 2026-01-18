import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | Zamora",
  description: "Manage your bookings, food orders, and profile settings on Zamora. View past trips and saved properties.",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
