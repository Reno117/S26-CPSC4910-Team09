import DriverHeader from "@/app/components/DriverComponents/DriverHeader";
import { auth } from "@/lib/auth";
import { checkDriverNotDisabled } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function MySponsorPage() {
    await checkDriverNotDisabled();


    const session = await auth.api.getSession({
      headers: await headers(),
    });
    console.log("Session user ID:", session?.user.id);

    let sponsors: { id: string; name: string }[] = [];

    if (session?.user?.id) {
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: session.user.id },
        include: { 
          sponsorships:{
              include: {
                sponsorOrg: true,
              },
            },
        },
      });
      console.log("Driver profile:", JSON.stringify(driverProfile, null, 2));
      sponsors = driverProfile?.sponsorships.map(s => ({
        id: s.sponsorOrg.id,
        name: s.sponsorOrg.name,
      })) ?? [];
    }

    return (
      <div>
        <DriverHeader />
        <div className="pt-16 p-8">
          <h1 className="text-3xl font-bold mb-4">My Sponsor</h1>
          {sponsors.length > 0 ? (
            <ul className="space-y-2">
              {sponsors.map(sponsor => (
                <li key={sponsor.id} className="text-lg text-gray-800">
                  {sponsor.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No sponsor assigned yet.</p>
          )}
        </div>
      </div>
    );
}
