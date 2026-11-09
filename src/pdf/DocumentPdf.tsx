import { Document as PdfDoc, Page, Text, View } from "@react-pdf/renderer";
import type { Settings } from "@/db/schema";
import type { FullDocument } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatZAR } from "@/lib/money";
import { C, s } from "./theme";
import { Banking, Footer, FromBlock, Header, Lines } from "./parts";

function qty(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function documentTitle(type: "quote" | "invoice", st: Settings, vatEnabled: boolean) {
  if (type === "quote") return "QUOTATION";
  return st.vatRegistered && vatEnabled ? "TAX INVOICE" : "INVOICE";
}

export function DocumentPdf({ doc, st }: { doc: FullDocument; st: Settings }) {
  const isQuote = doc.type === "quote";
  const title = documentTitle(doc.type, st, doc.vatEnabled);
  const balance = doc.total - doc.amountPaid;
  const deposit = doc.depositPercent > 0 ? Math.round((doc.total * doc.depositPercent) / 100) : 0;
  const c = doc.client;

  return (
    <PdfDoc title={`${title} ${doc.number}`} author={st.businessName} creator={st.businessName}>
      <Page size="A4" style={s.page}>
        <View style={s.topBar} fixed />
        <View style={s.body}>
          <Header
            title={title}
            number={doc.number}
            meta={[
              ["Date", formatDate(doc.issueDate)],
              [isQuote ? "Valid until" : "Due date", formatDate(doc.dueDate)],
              ["Reference", doc.reference],
            ]}
          />
          <View style={s.rule} />
          <View style={s.cols}>
            <FromBlock st={st} />
            <View style={s.col}>
              <Text style={s.label}>{isQuote ? "Prepared for" : "Bill to"}</Text>
              <Text style={s.strong}>{c.company || c.name}</Text>
              <Lines items={[c.company && `Attn: ${c.name}`, c.vatNumber && `VAT No. ${c.vatNumber}`, c.address, c.phone, c.email]} />
            </View>
            {doc.eventDate || doc.venue || doc.eventType ? (
              <View style={s.col}>
                <Text style={s.label}>Event</Text>
                {doc.eventType ? <Text style={s.strong}>{doc.eventType}</Text> : null}
                <Lines items={[doc.eventDate && formatDate(doc.eventDate), doc.venue]} />
              </View>
            ) : null}
          </View>

          <View style={s.table}>
            <View style={s.th} fixed>
              <Text style={s.cDesc}>Description</Text>
              <Text style={s.cQty}>Qty</Text>
              <Text style={s.cPrice}>Unit price</Text>
              <Text style={s.cTotal}>Amount</Text>
            </View>
            {doc.lines.map((l) => (
              <View key={l.id} style={s.tr} wrap={false}>
                <View style={s.cDesc}>
                  <Text style={s.lineTitle}>{l.description}</Text>
                  {l.details ? <Text style={s.lineDetails}>{l.details}</Text> : null}
                </View>
                <Text style={s.cQty}>
                  {qty(l.quantity)}
                  {l.unit && l.unit !== "each" ? ` ${l.unit}` : ""}
                </Text>
                <Text style={s.cPrice}>{formatZAR(l.unitPrice)}</Text>
                <Text style={[s.cTotal, { color: C.ink, fontWeight: 500 }]}>{formatZAR(l.lineTotal)}</Text>
              </View>
            ))}
          </View>

          <View style={s.totalsWrap} wrap={false}>
            <View style={{ flex: 1, paddingRight: 30 }}>
              {doc.notes ? (
                <>
                  <Text style={s.label}>Notes</Text>
                  <Text style={s.muted}>{doc.notes}</Text>
                </>
              ) : null}
            </View>
            <View style={s.totals}>
              <View style={s.tRow}>
                <Text style={{ color: C.muted }}>Subtotal</Text>
                <Text>{formatZAR(doc.subtotal)}</Text>
              </View>
              {doc.discount > 0 ? (
                <View style={s.tRow}>
                  <Text style={{ color: C.muted }}>Discount</Text>
                  <Text>-{formatZAR(doc.discount)}</Text>
                </View>
              ) : null}
              {doc.vatEnabled ? (
                <View style={s.tRow}>
                  <Text style={{ color: C.muted }}>VAT ({doc.vatRate}%)</Text>
                  <Text>{formatZAR(doc.vatAmount)}</Text>
                </View>
              ) : null}
              <View style={s.tGrand}>
                <Text style={s.tGrandLabel}>Total</Text>
                <Text style={s.tGrandValue}>{formatZAR(doc.total)}</Text>
              </View>
              {!isQuote && doc.amountPaid > 0 ? (
                <>
                  <View style={[s.tRow, { marginTop: 6 }]}>
                    <Text style={{ color: C.muted }}>Paid to date</Text>
                    <Text>-{formatZAR(doc.amountPaid)}</Text>
                  </View>
                  <View style={s.tRow}>
                    <Text style={{ color: C.ink, fontWeight: 600 }}>Balance due</Text>
                    <Text style={{ color: C.red, fontWeight: 600 }}>{formatZAR(balance)}</Text>
                  </View>
                </>
              ) : null}
              {deposit > 0 && doc.amountPaid < deposit && doc.status !== "void" ? (
                <View style={s.callout}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: C.ink, fontWeight: 600 }}>
                      {isQuote ? "Deposit to confirm" : "Deposit due now"} ({doc.depositPercent}%)
                    </Text>
                    <Text style={{ color: C.red, fontWeight: 600 }}>{formatZAR(deposit - doc.amountPaid)}</Text>
                  </View>
                  <Text style={[s.muted, { marginTop: 2, fontSize: 7 }]}>
                    Balance of {formatZAR(doc.total - deposit)} payable before installation.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[s.cols, { marginTop: 26 }]} wrap={false}>
            <Banking st={st} reference={doc.number} />
            {doc.terms ? (
              <View style={{ flex: 1.3 }}>
                <Text style={s.label}>Terms</Text>
                <Text style={s.terms}>{doc.terms}</Text>
              </View>
            ) : null}
          </View>
          {isQuote && doc.acceptedAt ? (
            <Text style={[s.muted, { marginTop: 14 }]}>
              Accepted {formatDate(doc.acceptedAt.toISOString())} by {doc.acceptedBy}
            </Text>
          ) : null}
        </View>
        {!isQuote && doc.status === "paid" ? <Text style={s.stamp}>PAID</Text> : null}
        {doc.status === "void" ? <Text style={s.stamp}>VOID</Text> : null}
        <Footer st={st} />
      </Page>
    </PdfDoc>
  );
}
