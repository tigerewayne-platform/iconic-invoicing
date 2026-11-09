import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { Settings } from "@/db/schema";
import type { FullDocument, FullPayment } from "@/lib/data";
import { registerFonts } from "./theme";
import { DocumentPdf, documentTitle } from "./DocumentPdf";
import { ReceiptPdf } from "./ReceiptPdf";

export async function renderDocumentPdf(doc: FullDocument, st: Settings) {
  registerFonts();
  return renderToBuffer(<DocumentPdf doc={doc} st={st} />);
}

export async function renderReceiptPdf(p: FullPayment, st: Settings) {
  registerFonts();
  return renderToBuffer(<ReceiptPdf p={p} st={st} />);
}

export function documentFilename(doc: FullDocument, st: Settings) {
  const t = documentTitle(doc.type, st, doc.vatEnabled).toLowerCase().replace(/\s+/g, "-");
  return `iconic-stretch-tents-${t}-${doc.number}.pdf`;
}
