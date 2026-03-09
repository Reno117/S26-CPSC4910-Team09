"use client";

import { useRouter, useSearchParams } from "next/navigation";
import SponsorDropdown from "./catalog-dropdown";

interface Props {
  driverId: string | null;
  defaultSponsorId?: string | null;
}

export default function DriverSettings({ driverId, defaultSponsorId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSponsorId = searchParams.get("sponsorId");
  return (
    <SponsorDropdown
      driverId={driverId}
      defaultSponsorId={defaultSponsorId}
      onSponsorChange={(sponsorId) => {
        router.push(`?sponsorId=${sponsorId}`);
      }}
    />
  );
}