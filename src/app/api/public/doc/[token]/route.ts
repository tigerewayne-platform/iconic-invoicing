import { getDocumentByToken, getSettings } from "@/lib/data";
import { pdfResponse } from "@/lib/pdf-response";
import { documentFilename, renderDocumentPdf } from "@/pdf/render";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const doc = await getDocumentByToken((await params).token);
  if (!doc || doc.status === "draft") return new Response("Not found", { status: 404 });
  const st = await getSettings();
  const buf = await renderDocumentPdf(doc, st);
  return pdfResponse(buf, documentFilename(doc, st), new URL(req.url).searchParams.has("download"));
}
