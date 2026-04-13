import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

async function createImpersonationSession(
  requestorId: string,
  targetUserId: string
) {
  const targetUser = await prisma.user.findUniqueOrThrow({
    where: { id: targetUserId },
    select: { id: true, email: true, role: true },
  });

  return jwt.sign(
    {
      sub: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      impersonatedBy: requestorId,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );
}