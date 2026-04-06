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

  await prisma.alertPreferences.update({
    where: { userId: session.user.id },
    data: {
      adminChangeAlert: body.adminChangeAlert,
      pointChangeAlert: body.pointChangeAlert,
      applicationAlert: body.applicationAlert,
      orderAlert: body.orderAlert,
      passwordChangeAlert: body.passwordChangeAlert,
      statusAlert: body.statusAlert,
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await prisma.alertPreferences.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(prefs);
}