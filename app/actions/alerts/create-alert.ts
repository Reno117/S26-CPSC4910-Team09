"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type AlertType = "PASSWORD_CHANGE" | "POINT_CHANGE" | "ADMIN_CHANGE" | "ORDER" | "APPLICATION" | "STATUS";

async function getCurrentUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user.id;
}

export async function setupCreateAlertProcedure() {
  try {
    await prisma.$executeRawUnsafe(`DROP PROCEDURE IF EXISTS create_alert_if_enabled`);
    console.log("Dropped old procedure");
  } catch (e) {
    console.error("Failed to drop procedure:", e);
  }

  try {
  await prisma.$executeRawUnsafe(`
    CREATE PROCEDURE create_alert_if_enabled(
      IN p_user_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      IN p_alert_type VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      IN p_alert_content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    )
    BEGIN
      DECLARE v_enabled BOOLEAN DEFAULT FALSE;

      INSERT INTO alert_preferences (userId)
      VALUES (p_user_id)
      ON DUPLICATE KEY UPDATE userId = userId;

      SELECT
        CASE p_alert_type
          WHEN 'PASSWORD_CHANGE' THEN passwordChangeAlert
          WHEN 'POINT_CHANGE'    THEN pointChangeAlert
          WHEN 'ADMIN_CHANGE'    THEN adminChangeAlert
          WHEN 'ORDER'           THEN orderAlert
          WHEN 'APPLICATION'     THEN applicationAlert
          WHEN 'STATUS'          THEN statusAlert
          ELSE FALSE
        END
      INTO v_enabled
      FROM alert_preferences
      WHERE userId = p_user_id;

      IF v_enabled THEN
        INSERT INTO alert (id, userId, alertType, alertContent, createdAt, isRead)
        VALUES (
          CONCAT('c', LPAD(HEX(FLOOR(RAND() * 0xFFFFFFFFFFFF)), 20, '0')),
          p_user_id,
          p_alert_type,
          p_alert_content,
          NOW(),
          FALSE
        );
      END IF;
    END
  `);
  } catch (e) {
    console.error("Failed to create procedure:", e);
    throw e;
  }
}

export async function createAlert(
  userId: string,
  alertType: AlertType,
  alertContent: string
) {
  await prisma.$executeRaw`
    CALL create_alert_if_enabled(${userId}, ${alertType}, ${alertContent})
  `;
}

export async function testCreateAlert() {
  await setupCreateAlertProcedure();

  const testUserId = await getCurrentUserId();

  await createAlert(
    testUserId,
    "ORDER",
    `A new order #TESTORD1 has been placed for 100 points.`
  );

  const alert = await prisma.alert.findFirst({
    where: { userId: testUserId, alertType: "ORDER" },
    orderBy: { createdAt: "desc" },
  });

  console.log("Alert created:", alert);
  return alert;
}