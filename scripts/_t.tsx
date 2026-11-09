import { renderToFile, Document, Page, View, Text } from "@react-pdf/renderer";
import { registerFonts } from "../src/pdf/theme";
registerFonts();
const m = { color: "#777", lineHeight: 1.45 };
const m2 = { color: "#777" };
renderToFile(<Document><Page size="A6" style={{ fontFamily: "Lexend", fontSize: 8.5, padding: 20 }}>
  <View style={{ flexDirection: "row", gap: 24 }}>
    <View style={{ flex: 1 }}><Text style={m}>One</Text><Text style={m}>Two</Text><Text style={m}>Three</Text></View>
    <View style={{ flex: 1 }}><Text style={m2}>One</Text><Text style={m2}>Two</Text><Text style={m2}>Three</Text></View>
  </View></Page></Document>, "/tmp/claude-0/e2e/t.pdf").then(()=>console.log("ok"));
