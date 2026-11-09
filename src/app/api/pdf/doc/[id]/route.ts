import { getSession } from "@/lib/auth";
import { getDocument, getSettings } from "@/lib/data";
import { pdfResponse } from "@/lib/pdf-response";
import { documentFilename, renderDocumentPdf } from "@/pdf/render";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const doc = await getDocument(Number((await params).id));
  if (!doc) return new Response("Not found", { status: 404 });
  const st = await getSettings();
  const buf = await renderDocumentPdf(doc, st);
  return pdfResponse(buf, documentFilename(doc, st), new URL(req.url).searchParams.has("download"));
}
