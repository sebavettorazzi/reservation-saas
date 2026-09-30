import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedBusiness } from "@/lib/auth";
import { getBusinessPremiumDashboardBySlug } from "@/services/business-premium";

type Context = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(req: Request, context: Context) {
  try {
    const { slug } = await context.params;
    const user = await getCurrentUser();

    if (!user || !(await getOwnedBusiness(user.id, slug))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const fallbackMonth = new Date().toISOString().slice(0, 7);
    const month = searchParams.get("month") ?? fallbackMonth;
    const months = Number(searchParams.get("months") ?? 1);

    const payload = await getBusinessPremiumDashboardBySlug(
      slug,
      /^\d{4}-\d{2}$/.test(month) ? month : fallbackMonth,
      Number.isFinite(months) ? months : 1
    );

    if (!payload) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Premium dashboard error:", error);

    return NextResponse.json(
      { error: "Could not load premium dashboard" },
      { status: 500 }
    );
  }
}
