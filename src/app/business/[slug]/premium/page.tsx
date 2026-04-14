import type { Metadata } from "next";
import PremiumDashboardClient from "./PremiumDashboardClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BusinessPremiumPage({ params }: PageProps) {
  const { slug } = await params;

  return <PremiumDashboardClient slug={slug} />;
}
