import { Document as PdfDoc, Page, Text, View } from "@react-pdf/renderer";
import type { Settings } from "@/db/schema";
import type { FullPayment } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatZAR } from "@/lib/money";
import { C, s } from "./theme";
import { Footer, FromBlock, Header, Lines } from "./parts";

export const METHOD_LABEL: Record<string, string> = {
  eft: "EFT / bank transfer",
  cash: "Cash",
  card: "Card",
  snapscan: "SnapScan / QR",
  other: "Other",
};

export function ReceiptPdf({ p, st }: { p: FullPayment; st: Settings }) {
  const inv = p.invoice;
  const c = inv.client;
  const paidBefore = inv.payments
    .filter((x) => x.paidAt < p.paidAt || (x.paidAt === p.paidAt && x.id < p.id))
    .reduce((a, x) => a + x.amount, 0);
  const balanceAfter = inv.total - paidBefore - p.amount;

  return (
    <PdfDoc title={`Receipt ${p.receiptNumber}`} author={st.businessName}>
      <Page size="A4" style={s.page}>
        <View style={s.topBar} fixed />
        <View style={s.body}>
          <Header
            title="RECEIPT"
            number={p.receiptNumber}
            meta={[
              ["Date paid", formatDate(p.paidAt)],
              ["Invoice", inv.number],
            ]}
          />
          <View style={s.rule} />
          <View style={s.cols}>
            <FromBlock st={st} />
            <View style={s.col}>
              <Text style={s.label}>Received from</Text>
              <Text style={s.strong}>{c.company || c.name}</Text>
              <Lines items={[c.company && `Attn: ${c.name}`, c.address, c.email]} />
            </View>
          </View>

          <View style={{ marginTop: 34, alignItems: "center" }}>
            <Text style={[s.label, { marginBottom: 8 }]}>Amount received</Text>
            <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 44, color: C.ink }}>
              {formatZAR(p.amount)}
            </Text>
            <Text style={[s.muted, { marginTop: 4 }]}>with thanks</Text>
          </View>

          <View style={[s.table, { marginTop: 34 }]}>
            <View style={s.th}>
              <Text style={{ flex: 1 }}>Details</Text>
              <Text style={{ width: 160, textAlign: "right" }}> </Text>
            </View>
            {(
              [
                ["Payment method", METHOD_LABEL[p.method] ?? p.method],
                ["Payment reference", p.reference],
                ["Invoice", `${inv.number} (${formatDate(inv.issueDate)})`],
                ["Event", [inv.eventType, inv.eventDate ? formatDate(inv.eventDate) : "", inv.venue].filter(Boolean).join(", ")],
                ["Invoice total", formatZAR(inv.total)],
                ["Previously paid", formatZAR(paidBefore)],
                ["This payment", formatZAR(p.amount)],
              ] as [string, string][]
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <View key={k} style={s.tr}>
                  <Text style={{ flex: 1, color: C.muted }}>{k}</Text>
                  <Text style={{ width: 260, textAlign: "right", color: C.ink }}>{v}</Text>
                </View>
              ))}
            <View style={[s.tGrand, { marginTop: 0 }]}>
              <Text style={s.tGrandLabel}>{balanceAfter <= 0 ? "Paid in full" : "Balance outstanding"}</Text>
              <Text style={s.tGrandValue}>{formatZAR(Math.max(0, balanceAfter))}</Text>
            </View>
          </View>
          {p.notes ? (
            <View style={{ marginTop: 18 }}>
              <Text style={s.label}>Notes</Text>
              <Text style={s.muted}>{p.notes}</Text>
            </View>
          ) : null}
        </View>
        {balanceAfter <= 0 ? <Text style={[s.stamp, { top: 250 }]}>PAID</Text> : null}
        <Footer st={st} />
      </Page>
    </PdfDoc>
  );
}
