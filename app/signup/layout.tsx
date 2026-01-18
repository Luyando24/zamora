import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an Account | Zamora",
  description: "Join Zamora today to book the best hotels, lodges, and experiences in Zambia. Sign up for free.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
