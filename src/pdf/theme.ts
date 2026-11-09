import path from "path";
import { Font, StyleSheet } from "@react-pdf/renderer";

const assets = path.join(process.cwd(), "assets");
let registered = false;
export function registerFonts() {
  if (registered) return;
  Font.register({
    family: "Lexend",
    fonts: [
      { src: path.join(assets, "fonts/Lexend-300.ttf"), fontWeight: 300 },
      { src: path.join(assets, "fonts/Lexend-400.ttf"), fontWeight: 400 },
      { src: path.join(assets, "fonts/Lexend-500.ttf"), fontWeight: 500 },
      { src: path.join(assets, "fonts/Lexend-600.ttf"), fontWeight: 600 },
    ],
  });
  Font.register({
    family: "Cormorant",
    fonts: [
      { src: path.join(assets, "fonts/Cormorant-500.ttf"), fontWeight: 500 },
      { src: path.join(assets, "fonts/Cormorant-600.ttf"), fontWeight: 600 },
    ],
  });
  registered = true;
}

export const LOGO = path.join(assets, "brand/logo-full-colour.png");

export const C = {
  red: "#FC0101",
  ink: "#0D0D0D",
  text: "#2D2A26",
  muted: "#7A756C",
  line: "#E6E1D8",
  cream: "#F5F2ED",
  paper: "#FFFFFF",
};

export const s = StyleSheet.create({
  page: { fontFamily: "Lexend", fontSize: 8.5, color: C.text, paddingTop: 0, paddingBottom: 70, paddingHorizontal: 0, backgroundColor: C.paper },
  topBar: { height: 6, backgroundColor: C.red },
  body: { paddingHorizontal: 42 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 26 },
  logo: { width: 150, height: 90, objectFit: "contain", objectPositionX: 0 },
  titleBlock: { alignItems: "flex-end" },
  title: { fontFamily: "Cormorant", fontWeight: 600, fontSize: 30, color: C.ink, letterSpacing: 1.5 },
  number: { fontSize: 10, fontWeight: 500, color: C.red, marginTop: 2, letterSpacing: 1 },
  metaRow: { flexDirection: "row", marginTop: 3 },
  metaLabel: { color: C.muted, width: 70, textAlign: "right", marginRight: 8 },
  metaValue: { color: C.ink, fontWeight: 500, minWidth: 70, textAlign: "right" },
  rule: { height: 1, backgroundColor: C.line, marginVertical: 18 },
  cols: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },
  label: { fontSize: 6.5, letterSpacing: 1.6, color: C.red, fontWeight: 500, marginBottom: 5, textTransform: "uppercase" },
  strong: { fontWeight: 500, color: C.ink, fontSize: 9.5, marginBottom: 2 },
  muted: { color: C.muted, fontSize: 8.5, lineHeight: 1.5 },
  table: { marginTop: 22 },
  th: { flexDirection: "row", backgroundColor: C.ink, color: C.cream, paddingVertical: 7, paddingHorizontal: 10, fontSize: 6.5, letterSpacing: 1.2, fontWeight: 500, textTransform: "uppercase" },
  tr: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 0.75, borderBottomColor: C.line },
  cDesc: { flex: 1, paddingRight: 10 },
  cQty: { width: 60, textAlign: "right" },
  cPrice: { width: 80, textAlign: "right" },
  cTotal: { width: 85, textAlign: "right" },
  lineTitle: { color: C.ink, fontWeight: 500 },
  lineDetails: { color: C.muted, marginTop: 2, lineHeight: 1.4, fontSize: 7.5 },
  totalsWrap: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  totals: { width: 230 },
  tRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.5 },
  tGrand: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.ink, color: C.paper, marginTop: 6 },
  tGrandLabel: { fontSize: 7, letterSpacing: 1.4, fontWeight: 500, textTransform: "uppercase", color: C.cream, marginTop: 2 },
  tGrandValue: { fontSize: 12, fontWeight: 600 },
  callout: { borderLeftWidth: 2.5, borderLeftColor: C.red, backgroundColor: C.cream, paddingVertical: 8, paddingHorizontal: 10, marginTop: 8 },
  box: { backgroundColor: C.cream, padding: 12, flex: 1 },
  terms: { fontSize: 7, color: C.muted, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  footerInner: { paddingHorizontal: 42, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", fontSize: 6.5, color: C.muted, borderTopWidth: 0.75, borderTopColor: C.line },
  footerBar: { height: 4, backgroundColor: C.ink },
  stamp: { position: "absolute", top: 470, left: 70, borderWidth: 2.5, borderColor: C.red, color: C.red, paddingVertical: 6, paddingHorizontal: 14, fontSize: 22, fontWeight: 600, letterSpacing: 4, transform: "rotate(-12deg)", opacity: 0.85 },
});
