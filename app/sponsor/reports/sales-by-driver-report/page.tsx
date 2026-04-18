import { requireSponsorUser } from "@/lib/auth-helpers";
import SalesByDriverReportClient from "./SalesByDriverReportClient";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireSponsorUser();
  const sponsorName = user.sponsorUser?.sponsor?.name ?? "";

  return <SalesByDriverReportClient searchParams={searchParams} sponsorId={sponsorName} />;
}
