"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function cancelOrder(orderId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const role = user.role?.trim().toLowerCase();
  const isAdmin = role === "admin";
  const isSponsor = role === "sponsor";
  const isDriver = role === "driver";

  if (isDriver) {
    if (!user.driverProfile || order.driverProfileId !== user.driverProfile.id) {
      throw new Error("Unauthorized");
    }
  } else if (isSponsor) {
    if (!user.sponsorUser || user.sponsorUser.sponsorId !== order.sponsorId) {
      throw new Error("Unauthorized");
    }
  } else if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  // Can only cancel pending orders
  if (order.status !== "pending") {
    throw new Error("Only pending orders can be cancelled");
  }

  // Use transaction for refund
  await prisma.$transaction(async (tx) => {
    // 1. Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    });

    // 2. Refund points to driver
    await tx.driverProfile.update({
      where: { id: order.driverProfileId },
      data: {
        pointsBalance: {
          increment: order.totalPoints,
        },
      },
    });

    // 3. Create point change record (positive for refund)
    await tx.pointChange.create({
      data: {
        driverProfileId: order.driverProfileId,
        sponsorId: order.sponsorId,
        amount: order.totalPoints,
        reason: `Order #${order.id.slice(-8)} - Cancelled (Refund)`,
        changedBy: user.id,
      },
    });
  });

  revalidatePath("/driver/orders");
  revalidatePath(`/driver/orders/${orderId}`);
  revalidatePath("/sponsor/view-orders");

  return { success: true };
}