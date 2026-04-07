'use server'

import { prisma } from '@/lib/prisma';
import { createAlert } from '@/app/actions/alerts/create-alert';
import { revalidatePath } from 'next/cache';

export async function fireDriver(driverProfileId: string) {
  // Verify the driver exists
  const driverProfile = await prisma.driverProfile.findUnique({
    where: { id: driverProfileId },
    select: { userId: true },
  });

  if (!driverProfile) {
    throw new Error('Driver not found');
  }

  await prisma.driverProfile.update({
    where: { id: driverProfileId },
    data: {
      sponsorId: null,
      status: 'dropped',
      pointsBalance: 0,
    },
  });

  // Create alert for the driver
  await createAlert(
    driverProfile.userId,
    'STATUS',
    'You have been removed as a driver from the sponsor.'
  );

  revalidatePath('/sponsor/catalog');
  revalidatePath('/sponsor/viewDrivers');
  revalidatePath('/sponsor');
}