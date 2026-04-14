import type { Metadata } from "next";
import BusinessDashboardClient from "./BusinessDashboardClient";

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

export default async function BusinessDashboardPage({ params }: PageProps) {
  const { slug } = await params;

  return <BusinessDashboardClient slug={slug} />;
}
