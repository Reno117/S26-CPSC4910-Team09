import { setupCreateAlertProcedure } from "@/app/actions/alerts/create-alert";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await setupCreateAlertProcedure();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}