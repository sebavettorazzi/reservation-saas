import { NextResponse } from "next/server";
import { createUserSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !body.password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        businesses: {
          orderBy: { createdAt: "asc" },
          select: { slug: true },
          take: 1,
        },
      },
    });

    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    }

    if (!user.passwordHash.includes(":")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(body.password) },
      });
    }

    const redirectTo = user.businesses[0]?.slug ? `/business/${user.businesses[0].slug}/dashboard` : "/";
    const { token, expiresAt } = await createUserSession(user.id);
    const response = NextResponse.json({ name: user.name, email: user.email, redirectTo });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "No se pudo iniciar sesión." }, { status: 500 });
  }
}
