import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hotel Deals & Promotions in Zambia",
  description: "Exclusive discounts on hotels, safari lodges, and activities in Zambia. Save on your next trip with Zamora's limited-time offers.",
};

export default function PromotionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
