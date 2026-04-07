import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireSponsorUser } from "@/lib/auth-helpers";
import PointChangeReportPage from "./PointReportClient";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireSponsorUser();
  const sponsorName = user.sponsorUser?.sponsor?.name ?? "";

  return <PointChangeReportPage searchParams={searchParams} sponsorId={sponsorName} />;
}