import { NextResponse, type NextRequest } from "next/server";
import { runImport } from "@/lib/ingest/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Chamado pela Vercel Cron (vercel.json). A Vercel envia "Authorization: Bearer $CRON_SECRET". */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: "Não autorizado" }, { status: 401 });
  }
  const summary = await runImport("cron");
  return NextResponse.json(summary, { status: summary.ok ? 200 : 500 });
}
