"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

interface UserUploadRow {
  name: string;
  email: string;
  role: "driver" | "sponsor" | "admin" | "org";
  sponsorId?: string;
  sponsorName?: string;
  pointsBalance?: number;
  status?: "pending" | "active" | "dropped" | "disabled";
}

export async function massUploadUsers(rows: UserUploadRow[]) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const isAdmin = currentUser.role === "admin";
  const isSponsor = currentUser.role === "sponsor";

  if (!isAdmin && !isSponsor) {
    throw new Error("Only admins and sponsors can bulk upload users");
  }

  // Get sponsor's organization if they're a sponsor
  let sponsorOrgId: string | null = null;
  if (isSponsor) {
    const sponsorUser = await prisma.sponsorUser.findUnique({
      where: { userId: currentUser.id },
    });

    if (!sponsorUser) {
      throw new Error("Sponsor user profile not found");
    }

    sponsorOrgId = sponsorUser.sponsorId;
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const row of rows) {
    try {
      // Validate required fields
      if (!row.name || !row.role) {
        throw new Error(`Missing required fields for row`);
      }

      // PERMISSION CHECK: Only admins can create org (Sponsor) records
      if (row.role === "org" && !isAdmin) {
        throw new Error(`Only admins can create sponsor organizations`);
      }

      // PERMISSION CHECK: Sponsors cannot create admins or orgs
      if (isSponsor && (row.role === "admin" || row.role === "org")) {
        throw new Error(`Sponsors cannot create admin users or organizations (${row.email})`);
      }

      // PERMISSION CHECK: Sponsors can only assign to their own organization
      if (isSponsor) {
        if (row.role === "driver") {
          row.sponsorId = sponsorOrgId!;
        } else if (row.role === "sponsor") {
          row.sponsorId = sponsorOrgId!;
        }
      }

      // For org rows, create a Sponsor record — no user account needed
      if (row.role === "org") {
        await prisma.sponsor.create({
          data: {
            name: row.name,
            pointValue: 0.01,
          },
        });
        results.success++;
        continue;
      }

      // All non-org rows require an email
      if (!row.email) {
        throw new Error(`Email is required`);
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: row.email },
      });

      if (existingUser) {
        throw new Error(`Email ${row.email} already exists`);
      }

      // Validate sponsor exists (if provided)
      if (row.sponsorId) {
        const sponsorExists = await prisma.sponsor.findUnique({
          where: { id: row.sponsorId },
        });

        if (!sponsorExists) {
          throw new Error(`Sponsor ID ${row.sponsorId} not found for ${row.email}`);
        }

        // PERMISSION CHECK: Sponsors can only assign to their own org
        if (isSponsor && row.sponsorId !== sponsorOrgId) {
          throw new Error(`Sponsors can only assign users to their own organization (${row.email})`);
        }
      }

      // Create user + profile in transaction
      await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            id: crypto.randomUUID(),
            name: row.name,
            email: row.email,
            role: row.role as "driver" | "sponsor" | "admin",
            emailVerified: false,
          },
        });

        if (!isSponsor && row.sponsorName && !row.sponsorId) {
          const input = row.sponsorName.trim();

          const sponsor = await prisma.sponsor.findFirst({
            where: {
              OR: [
                { id: input },
                { name: input },
              ],
            },
            select: { id: true },
          });

          if (!sponsor) {
            throw new Error(`Sponsor "${input}" not found for ${row.email}`);
          }

          row.sponsorId = sponsor.id;
        }

        // Create appropriate profile based on role
        if (row.role === "driver") {
          await tx.driverProfile.create({
            data: {
              userId: user.id,
              sponsorId: row.sponsorId || null,
              pointsBalance: row.pointsBalance || 0,
              status: row.status || (row.sponsorId ? "active" : "pending"),
            },
          });
        } else if (row.role === "sponsor") {
          if (!row.sponsorId) {
            throw new Error(`Sponsor users must have a sponsorId (${row.email})`);
          }

          await tx.sponsorUser.create({
            data: {
              userId: user.id,
              sponsorId: row.sponsorId,
              status: "active",
            },
          });
        } else if (row.role === "admin") {
          if (!isAdmin) {
            throw new Error(`Only admins can create admin users`);
          }
          // Admin user record is sufficient — no profile needed
        }
      });

      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`${row.email || row.name}: ${error.message}`);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/sponsor");

  return results;
}