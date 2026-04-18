import { requireSponsorUser } from "@/lib/auth-helpers";
import SalesBySponsorReportClient from "./SalesBySponsorReportClient";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireSponsorUser();
  const sponsorName = user.sponsorUser?.sponsor?.name ?? "";

  return <SalesBySponsorReportClient searchParams={searchParams} sponsorId={sponsorName} />;
}
