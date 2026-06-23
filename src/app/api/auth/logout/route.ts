import { NextResponse } from "next/server";
import { deleteCurrentSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  await deleteCurrentSession();

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
