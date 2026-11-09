import type { Settings } from "@/db/schema";
import type { FullDocument, FullPayment } from "./data";
import { formatDate } from "./dates";
import { formatZAR } from "./money";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

export function documentMessage(doc: FullDocument, st: Settings, link: string) {
  const name = firstName(doc.client.name);
  const event = [doc.eventType, doc.eventDate ? formatDate(doc.eventDate) : "", doc.venue].filter(Boolean).join(", ");
  if (doc.type === "quote") {
    const deposit = doc.depositPercent > 0 ? Math.round((doc.total * doc.depositPercent) / 100) : 0;
    return {
      subject: `Your Iconic Stretch Tents quote ${doc.number}${event ? ` for ${event}` : ""}`,
      text: `Hi ${name},

Thank you for considering Iconic Stretch Tents. Please find your quote ${doc.number} attached${event ? ` for ${event}` : ""}.

Total: ${formatZAR(doc.total)}${deposit ? `\nDeposit to confirm your date (${doc.depositPercent}%): ${formatZAR(deposit)}` : ""}${doc.dueDate ? `\nValid until: ${formatDate(doc.dueDate)}` : ""}

You can view and accept the quote online here:
${link}

Any questions, just reply to this email.

Kind regards,
${st.businessName}${st.phone ? `\n${st.phone}` : ""}`,
    };
  }
  const balance = doc.total - doc.amountPaid;
  const deposit = doc.depositPercent > 0 ? Math.round((doc.total * doc.depositPercent) / 100) : 0;
  const dueNow = deposit > doc.amountPaid ? deposit - doc.amountPaid : balance;
  return {
    subject: `Invoice ${doc.number} from Iconic Stretch Tents`,
    text: `Hi ${name},

Please find invoice ${doc.number} attached${event ? ` for ${event}` : ""}.

Amount due${deposit > doc.amountPaid ? ` now (${doc.depositPercent}% deposit)` : ""}: ${formatZAR(dueNow)}${doc.dueDate ? `\nDue by: ${formatDate(doc.dueDate)}` : ""}
${st.bankName ? `\nBank: ${st.bankName}\nAccount: ${st.accountNumber}\nBranch code: ${st.branchCode}` : ""}
Reference: ${doc.number}

View or download it online:
${link}

Kind regards,
${st.businessName}${st.phone ? `\n${st.phone}` : ""}`,
  };
}

export function receiptMessage(p: FullPayment, st: Settings, link: string) {
  const balance = p.invoice.total - p.invoice.amountPaid;
  return {
    subject: `Receipt ${p.receiptNumber} from Iconic Stretch Tents`,
    text: `Hi ${firstName(p.invoice.client.name)},

Thank you, we've received your payment of ${formatZAR(p.amount)} against invoice ${p.invoice.number}. Your receipt ${p.receiptNumber} is attached.
${balance > 0 ? `\nBalance outstanding: ${formatZAR(balance)}` : "\nYour invoice is now paid in full."}

View or download it online:
${link}

Kind regards,
${st.businessName}${st.phone ? `\n${st.phone}` : ""}`,
  };
}

export function whatsappLink(phone: string, text: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "27" + digits.slice(1);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
