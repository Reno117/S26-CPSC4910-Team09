import { requireSponsorUser } from "@/lib/auth-helpers";
import CreateDriverForm from "@/app/components/create-driver-form";

export default async function CreateDriverPage() {
  await requireSponsorUser(); // Ensure they're a sponsor

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Driver</h1>
      <CreateDriverForm />
    </div>
  );
}