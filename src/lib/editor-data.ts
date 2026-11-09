import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { centsToInput } from "./money";
import { addDays, todayISO } from "./dates";
import { getSettings, listCatalog, type FullDocument } from "./data";
import type { EditorInitial } from "@/components/DocumentEditor";

export async function editorProps(type: "quote" | "invoice", doc?: FullDocument, clientId?: number) {
  const [st, cl, cat] = await Promise.all([
    getSettings(),
    db.select().from(clients).orderBy(asc(clients.name)),
    listCatalog(true),
  ]);
  const today = todayISO();
  const initial: EditorInitial = doc
    ? {
        id: doc.id,
        clientId: doc.clientId,
        issueDate: doc.issueDate,
        dueDate: doc.dueDate ?? "",
        eventDate: doc.eventDate ?? "",
        eventType: doc.eventType,
        venue: doc.venue,
        reference: doc.reference,
        notes: doc.notes,
        terms: doc.terms,
        vatEnabled: doc.vatEnabled,
        discount: doc.discount ? centsToInput(doc.discount) : "",
        depositPercent: doc.depositPercent,
        lines: doc.lines.map((l) => ({
          description: l.description,
          details: l.details,
          quantity: String(l.quantity),
          unit: l.unit,
          unitPrice: centsToInput(l.unitPrice),
        })),
      }
    : {
        clientId: clientId ?? cl[0]?.id,
        issueDate: today,
        dueDate: addDays(today, type === "quote" ? st.quoteValidityDays : st.paymentTermsDays),
        eventDate: "",
        eventType: "",
        venue: "",
        reference: "",
        notes: "",
        terms: type === "quote" ? st.quoteTerms : st.invoiceTerms,
        vatEnabled: st.vatRegistered,
        discount: "",
        depositPercent: st.depositPercent,
        lines: [],
      };
  return {
    type,
    initial,
    clients: cl.map((c) => ({ id: c.id, name: c.name, company: c.company, email: c.email })),
    catalog: cat.map((c) => ({ id: c.id, name: c.name, description: c.description, unit: c.unit, unitPrice: c.unitPrice, category: c.category })),
    vatRegistered: st.vatRegistered,
    vatRate: st.vatRate,
  };
}
