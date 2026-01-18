import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Zamora",
  description: "Sign in to your Zamora account to manage bookings, view orders, and access your profile.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
