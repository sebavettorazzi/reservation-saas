import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
  redirect(`/business/${slug}/dashboard`);
}
