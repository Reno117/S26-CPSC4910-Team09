import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import CreateDriverForm from "@/app/components/create-driver-form";

export default async function CreateDriverPage() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

  // If admin, fetch all sponsors for the dropdown
  const sponsors = isAdmin
    ? await prisma.sponsor.findMany({
        orderBy: { name: "asc" },
      })
    : undefined;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Driver</h1>
      <CreateDriverForm 
        isAdmin={isAdmin} 
        sponsorId={sponsorId}
        sponsors={sponsors}
      />
    </div>
  );
}