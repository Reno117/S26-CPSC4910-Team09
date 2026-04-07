import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";


export async function PATCH(req: Request) {
const body = await req.json();
const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.alertPreferences.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      adminChangeAlert: body.adminChangeAlert ?? true,
      pointChangeAlert: body.pointChangeAlert ?? true,
      applicationAlert: body.applicationAlert ?? true,
      orderAlert: body.orderAlert ?? true,
      passwordChangeAlert: body.passwordChangeAlert ?? true,
      statusAlert: body.statusAlert ?? true,
    },
    update: {
      adminChangeAlert: body.adminChangeAlert ?? true,
      pointChangeAlert: body.pointChangeAlert ?? true,
      applicationAlert: body.applicationAlert ?? true,
      orderAlert: body.orderAlert ?? true,
      passwordChangeAlert: body.passwordChangeAlert ?? true,
      statusAlert: body.statusAlert ?? true,
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await prisma.alertPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  return NextResponse.json(prefs);
}