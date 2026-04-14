import { NextResponse } from "next/server";
import { listBookingBusinesses } from "@/services/business-catalog";

export async function GET() {
  try {
    const businesses = await listBookingBusinesses();

    return NextResponse.json(businesses);
  } catch (error) {
    console.error("Businesses error:", error);

    return NextResponse.json(
      { error: "Could not load businesses" },
      { status: 500 }
    );
  }
}
