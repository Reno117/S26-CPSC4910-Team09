"use server";

import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { createAlert } from "@/app/actions/alerts/create-alert";
import { revalidatePath } from "next/cache";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Sponsors can only update their own orders
  if (!isAdmin && order.sponsorId !== sponsorId) {
    throw new Error("Unauthorized");
  }

  // Can't update a cancelled or delivered order
  if (order.status === "cancelled") {
    throw new Error("Cannot update a cancelled order");
  }

  if (order.status === "delivered" && status !== "cancelled") {
    throw new Error("Cannot update a delivered order");
  }

  // Get driver info for alerts
  const driverProfile = await prisma.driverProfile.findUnique({
    where: { id: order.driverProfileId },
    select: { userId: true },
  });

  // If cancelling, refund the driver's points
  if (status === "cancelled") {
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      // Refund points
      await tx.driverProfile.update({
        where: { id: order.driverProfileId },
        data: {
          pointsBalance: {
            increment: order.totalPoints,
          },
        },
      });

      // Create point change record
      await tx.pointChange.create({
        data: {
          driverProfileId: order.driverProfileId,
          sponsorId: order.sponsorId,
          amount: order.totalPoints,
          reason: `Order #${order.id.slice(-8)} - Cancelled by ${isAdmin ? "Admin" : "Sponsor"} (Refund)`,
          changedBy: order.driverProfileId, // Use driverProfileId as reference
        },
      });
    });

    if (driverProfile) {
      await createAlert(
        driverProfile.userId,
        "ORDER",
        `Your order #${order.id.slice(-8)} has been cancelled and ${order.totalPoints} points have been refunded.`
      );
    }
  } else {
    // Just update the status
    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Create status update alert
    if (driverProfile) {
      const statusMessages: Record<string, string> = {
        "processing": "Your order is now being processed.",
        "shipped": "Your order has been shipped!",
        "delivered": "Your order has been delivered!",
      };
      const message = statusMessages[status] || `Your order status has been updated to ${status}.`;
      await createAlert(
        driverProfile.userId,
        "ORDER",
        message
      );
    }
  }

  revalidatePath("/sponsor/orders");

  return { success: true };
}