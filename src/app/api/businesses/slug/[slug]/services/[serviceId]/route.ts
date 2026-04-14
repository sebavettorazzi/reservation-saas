import { NextResponse } from "next/server";
import { UpdateServicePriceSchema } from "@/contracts/service.contract";
import { updateBusinessServicePriceBySlug } from "@/services/business-admin";

type Context = {
  params: Promise<{
    slug: string;
    serviceId: string;
  }>;
};

export async function PATCH(req: Request, context: Context) {
  try {
    const { slug, serviceId } = await context.params;
    const body = await req.json();
    const parsed = UpdateServicePriceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid service payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await updateBusinessServicePriceBySlug(
      slug,
      serviceId,
      parsed.data.price
    );

    if (result.status === "business_not_found") {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (result.status === "service_not_found") {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.service);
  } catch (error) {
    console.error("Service price error:", error);

    return NextResponse.json(
      { error: "Could not update service price" },
      { status: 500 }
    );
  }
}
