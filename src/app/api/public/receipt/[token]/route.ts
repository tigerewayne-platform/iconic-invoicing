import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { getPayment, getSettings } from "@/lib/data";
import { pdfResponse } from "@/lib/pdf-response";
import { renderReceiptPdf } from "@/pdf/render";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const [row] = await db.select().from(payments).where(eq(payments.publicToken, (await params).token));
  if (!row) return new Response("Not found", { status: 404 });
  const p = await getPayment(row.id);
  if (!p) return new Response("Not found", { status: 404 });
  const buf = await renderReceiptPdf(p, await getSettings());
  return pdfResponse(buf, `iconic-stretch-tents-receipt-${p.receiptNumber}.pdf`, new URL(req.url).searchParams.has("download"));
}
