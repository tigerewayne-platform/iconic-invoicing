import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  doublePrecision,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "staff"]);
export const docTypeEnum = pgEnum("doc_type", ["quote", "invoice"]);
export const docStatusEnum = pgEnum("doc_status", [
  "draft",
  "sent",
  "accepted",
  "declined",
  "converted",
  "partially_paid",
  "paid",
  "void",
]);
export const payMethodEnum = pgEnum("pay_method", ["eft", "cash", "card", "snapscan", "other"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("staff"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Single-row table (id = 1) holding business details, banking, VAT and numbering. */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  businessName: text("business_name").notNull().default("Iconic Stretch Tents"),
  legalName: text("legal_name").notNull().default(""),
  regNumber: text("reg_number").notNull().default(""),
  vatRegistered: boolean("vat_registered").notNull().default(false),
  vatNumber: text("vat_number").notNull().default(""),
  vatRate: doublePrecision("vat_rate").notNull().default(15),
  address: text("address").notNull().default("Cape Town, Western Cape"),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  website: text("website").notNull().default("iconicstretchtents.co.za"),
  bankName: text("bank_name").notNull().default(""),
  accountName: text("account_name").notNull().default(""),
  accountNumber: text("account_number").notNull().default(""),
  branchCode: text("branch_code").notNull().default(""),
  accountType: text("account_type").notNull().default(""),
  quotePrefix: text("quote_prefix").notNull().default("Q"),
  invoicePrefix: text("invoice_prefix").notNull().default("INV"),
  receiptPrefix: text("receipt_prefix").notNull().default("RCT"),
  nextQuoteNo: integer("next_quote_no").notNull().default(1001),
  nextInvoiceNo: integer("next_invoice_no").notNull().default(1001),
  nextReceiptNo: integer("next_receipt_no").notNull().default(1001),
  quoteValidityDays: integer("quote_validity_days").notNull().default(14),
  paymentTermsDays: integer("payment_terms_days").notNull().default(7),
  depositPercent: integer("deposit_percent").notNull().default(50),
  quoteTerms: text("quote_terms").notNull().default(""),
  invoiceTerms: text("invoice_terms").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    company: text("company").notNull().default(""),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    vatNumber: text("vat_number").notNull().default(""),
    address: text("address").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("clients_name_idx").on(t.name)],
);

export const catalogItems = pgTable("catalog_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Extras"),
  unit: text("unit").notNull().default("each"),
  /** VAT-exclusive price in cents */
  unitPrice: integer("unit_price").notNull().default(0),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    type: docTypeEnum("type").notNull(),
    number: text("number").notNull(),
    status: docStatusEnum("status").notNull().default("draft"),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    issueDate: date("issue_date", { mode: "string" }).notNull(),
    /** Quote: valid until. Invoice: due date. */
    dueDate: date("due_date", { mode: "string" }),
    eventDate: date("event_date", { mode: "string" }),
    eventType: text("event_type").notNull().default(""),
    venue: text("venue").notNull().default(""),
    reference: text("reference").notNull().default(""),
    notes: text("notes").notNull().default(""),
    terms: text("terms").notNull().default(""),
    vatEnabled: boolean("vat_enabled").notNull().default(false),
    vatRate: doublePrecision("vat_rate").notNull().default(15),
    /** VAT-exclusive discount in cents */
    discount: integer("discount").notNull().default(0),
    subtotal: integer("subtotal").notNull().default(0),
    vatAmount: integer("vat_amount").notNull().default(0),
    total: integer("total").notNull().default(0),
    amountPaid: integer("amount_paid").notNull().default(0),
    /** Invoice only: share of the total requested as deposit (percent), 0 = full amount */
    depositPercent: integer("deposit_percent").notNull().default(0),
    sourceQuoteId: integer("source_quote_id"),
    publicToken: text("public_token").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedBy: text("accepted_by").notNull().default(""),
    createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("documents_type_number_idx").on(t.type, t.number),
    uniqueIndex("documents_token_idx").on(t.publicToken),
    index("documents_client_idx").on(t.clientId),
  ],
);

export const documentLines = pgTable(
  "document_lines",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    description: text("description").notNull(),
    details: text("details").notNull().default(""),
    quantity: doublePrecision("quantity").notNull().default(1),
    unit: text("unit").notNull().default("each"),
    /** VAT-exclusive cents */
    unitPrice: integer("unit_price").notNull().default(0),
    lineTotal: integer("line_total").notNull().default(0),
  },
  (t) => [index("lines_doc_idx").on(t.documentId)],
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    receiptNumber: text("receipt_number").notNull().unique(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => documents.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull(),
    method: payMethodEnum("method").notNull().default("eft"),
    reference: text("reference").notNull().default(""),
    paidAt: date("paid_at", { mode: "string" }).notNull(),
    notes: text("notes").notNull().default(""),
    publicToken: text("public_token").notNull().unique(),
    createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_invoice_idx").on(t.invoiceId)],
);

export const activity = pgTable(
  "activity",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    userName: text("user_name").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_doc_idx").on(t.documentId)],
);

export const clientsRelations = relations(clients, ({ many }) => ({ documents: many(documents) }));
export const documentsRelations = relations(documents, ({ one, many }) => ({
  client: one(clients, { fields: [documents.clientId], references: [clients.id] }),
  lines: many(documentLines),
  payments: many(payments),
  activity: many(activity),
}));
export const linesRelations = relations(documentLines, ({ one }) => ({
  document: one(documents, { fields: [documentLines.documentId], references: [documents.id] }),
}));
export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(documents, { fields: [payments.invoiceId], references: [documents.id] }),
}));
export const activityRelations = relations(activity, ({ one }) => ({
  document: one(documents, { fields: [activity.documentId], references: [documents.id] }),
}));

export type User = typeof users.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentLine = typeof documentLines.$inferSelect;
export type Payment = typeof payments.$inferSelect;
