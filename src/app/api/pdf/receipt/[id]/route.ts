import { getSession } from "@/lib/auth";
import { getPayment, getSettings } from "@/lib/data";
import { pdfResponse } from "@/lib/pdf-response";
import { renderReceiptPdf } from "@/pdf/render";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const p = await getPayment(Number((await params).id));
  if (!p) return new Response("Not found", { status: 404 });
  const buf = await renderReceiptPdf(p, await getSettings());
  return pdfResponse(buf, `iconic-stretch-tents-receipt-${p.receiptNumber}.pdf`, new URL(req.url).searchParams.has("download"));
}
