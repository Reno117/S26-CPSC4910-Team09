import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return new Response("Not authenticated", { status: 401 });
  }

  const { userId: targetUserId } = await req.json();

  try {
    const requestorRole = session.user.role;

    if (requestorRole !== "admin") {
      if (requestorRole === "sponsor") {
        if (!targetUserId) throw new Error("No target user specified.");

        const sponsorUser = await prisma.sponsorUser.findUnique({
          where: { userId: session.user.id },
          select: { sponsorId: true },
        });

        if (!sponsorUser) throw new Error("Sponsor user record not found.");

        const driverProfile = await prisma.driverProfile.findUnique({
          where: { userId: targetUserId },
          select: {
            sponsorships: {
              where: { sponsorOrgId: sponsorUser.sponsorId },
              select: { id: true },
            },
          },
        });

        if (!driverProfile?.sponsorships.length) {
          throw new Error("You are not authorized to impersonate this user.");
        }

        await prisma.user.update({
          where: { id: session.user.id },
          data: { role: "admin" },
        });

        try {
          const impersonatedResponse = await auth.api.impersonateUser({
            body: { userId: targetUserId },
            headers: req.headers,
            asResponse: true, // <-- returns the raw Response with Set-Cookie
          });

          return impersonatedResponse;
        } finally {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { role: "sponsor" },
          });
        }
      } else {
        throw new Error("You are not authorized to impersonate users.");
      }
    }

    const impersonatedResponse = await auth.api.impersonateUser({
      body: { userId: targetUserId },
      headers: req.headers,
      asResponse: true,
    });

    return impersonatedResponse;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return new Response(message, { status: 403 });
  }
}