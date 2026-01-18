import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Hotels, Lodges & Resorts in Zambia",
  description: "Browse top-rated accommodation in Zambia. Filter by price, location, and amenities to find your perfect stay in Lusaka, Livingstone, and beyond.",
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
