import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getOwnedBusiness } from "@/lib/auth";
import BusinessDashboardClient from "./BusinessDashboardClient";
import PremiumDashboardClient from "../premium/PremiumDashboardClient";

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
  const user = await getCurrentUser();
  const business = user ? await getOwnedBusiness(user.id, slug) : null;

  if (!business) {
    redirect(`/admin/login?next=${encodeURIComponent(`/business/${slug}/dashboard`)}`);
  }

  return business.plan === "PREMIUM" ? (
    <PremiumDashboardClient slug={slug} />
  ) : (
    <BusinessDashboardClient slug={slug} />
  );
}
