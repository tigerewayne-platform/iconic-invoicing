import { Image, Text, View } from "@react-pdf/renderer";
import type { Settings } from "@/db/schema";
import { LOGO, s } from "./theme";

export function Header({ title, number, meta }: { title: string; number: string; meta: [string, string][] }) {
  return (
    <View style={s.header}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={LOGO} style={s.logo} />
      <View style={s.titleBlock}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.number}>{number}</Text>
        <View style={{ marginTop: 8 }}>
          {meta
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <View key={k} style={s.metaRow}>
                <Text style={s.metaLabel}>{k}</Text>
                <Text style={s.metaValue}>{v}</Text>
              </View>
            ))}
        </View>
      </View>
    </View>
  );
}

/** One Text with line breaks: avoids react-pdf spacing glitches between sibling Text nodes. */
export function Lines({ items }: { items: (string | false | null | undefined)[] }) {
  const t = items.filter(Boolean).join("\n");
  return t ? <Text style={s.muted}>{t}</Text> : null;
}

export function FromBlock({ st }: { st: Settings }) {
  return (
    <View style={s.col}>
      <Text style={s.label}>From</Text>
      <Text style={s.strong}>{st.legalName || st.businessName}</Text>
      <Lines
        items={[
          st.regNumber && `Reg. ${st.regNumber}`,
          st.vatRegistered && st.vatNumber && `VAT No. ${st.vatNumber}`,
          st.address,
          st.phone,
          st.email,
        ]}
      />
    </View>
  );
}

export function Footer({ st }: { st: Settings }) {
  const bits = [st.website, st.email, st.phone].filter(Boolean).join("   ·   ");
  return (
    <View style={s.footer} fixed>
      <View style={s.footerInner}>
        <Text>{st.businessName}  ·  Built for the Cape.</Text>
        <Text>{bits}</Text>
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
      <View style={s.footerBar} />
    </View>
  );
}

export function Banking({ st, reference }: { st: Settings; reference: string }) {
  if (!st.bankName && !st.accountNumber) return null;
  const rows: [string, string][] = [
    ["Bank", st.bankName],
    ["Account name", st.accountName || st.legalName || st.businessName],
    ["Account no.", st.accountNumber],
    ["Branch code", st.branchCode],
    ["Account type", st.accountType],
    ["Reference", reference],
  ];
  return (
    <View style={s.box}>
      <Text style={s.label}>Banking details</Text>
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <View key={k} style={{ flexDirection: "row", marginBottom: 2 }}>
            <Text style={{ width: 72, color: "#7A756C" }}>{k}</Text>
            <Text style={{ color: "#0D0D0D", fontWeight: k === "Reference" ? 600 : 400 }}>{v}</Text>
          </View>
        ))}
    </View>
  );
}
