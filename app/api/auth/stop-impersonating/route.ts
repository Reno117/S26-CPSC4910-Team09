import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const current = await auth.api.getSession({
    headers: req.headers,
  });

  if (!current) {
    return new Response("Not authenticated", { status: 401 });
  }

  const impersonatedBy = (current as { session?: { impersonatedBy?: string } }).session?.impersonatedBy;

  if (!impersonatedBy) {
    return new Response("You are not impersonating anyone", { status: 400 });
  }

  const originalUser = await prisma.user.findUnique({
    where: { id: impersonatedBy },
    select: { role: true },
  });

  const stopResponse = await auth.api.stopImpersonating({
    headers: req.headers,
    asResponse: true,
  });

  if (!stopResponse.ok) {
    return stopResponse;
  }

  const role = (originalUser?.role ?? "driver").toLowerCase();
  const redirectPath = role === "admin" ? "/admin" : role === "sponsor" ? "/sponsor" : "/driver";

  return new Response(JSON.stringify({ redirectPath }), {
    status: 200,
    headers: stopResponse.headers,
  });
}