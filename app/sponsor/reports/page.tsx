import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import SponsorAuditClient from "./ReportClient";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  const sponsorId = (session?.user as any)?.sponsorUser?.sponsorId ?? "";
    const user = await prisma.user.findUnique({
      where: {id: session?.user?.id},
      select: {
          name: true,
          email: true,
          role: true,
          image: true,
      },
  });

    if(!user)
  {
    return null;
  }

  return (
    <>
    <SponsorHeader userSettings= {user} />
   <SponsorAuditClient sponsorId={sponsorId} />;
   </>
  )
}