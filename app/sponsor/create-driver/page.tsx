import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import CreateDriverForm from "@/app/components/create-driver-form";
import ToDashBoard from "@/app/components/ToDashboard-Button";
import { getCurrentUser } from "@/lib/auth-helpers";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";

export default async function CreateDriverPage() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

  // If admin, fetch all sponsors for the dropdown
  const sponsors = isAdmin
    ? await prisma.sponsor.findMany({
        orderBy: { name: "asc" },
      })
    : undefined;
  const user = await getCurrentUser();

  return (
    <div>
      <SponsorHeader />
      <div className="p-8 max-w-2xl mx-auto pt-20">
        <h1 className="text-3xl font-bold mb-6 text-center">Create New Driver</h1>
        <CreateDriverForm 
          isAdmin={isAdmin} 
          sponsorId={sponsorId}
          sponsors={sponsors}
        />
      </div>
    </div>
  );
}