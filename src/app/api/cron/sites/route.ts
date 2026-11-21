import { NextResponse, type NextRequest } from "next/server";
import { runCrawl } from "@/lib/ingest/crawler";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Leitura diária dos sites cadastrados no /admin (vercel.json). */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: "Não autorizado" }, { status: 401 });
  }
  const summary = await runCrawl("cron");
  return NextResponse.json(summary, { status: summary.ok ? 200 : 500 });
}
