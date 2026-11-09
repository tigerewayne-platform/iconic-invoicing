CREATE TYPE "public"."doc_status" AS ENUM('draft', 'sent', 'accepted', 'declined', 'converted', 'partially_paid', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."doc_type" AS ENUM('quote', 'invoice');--> statement-breakpoint
CREATE TYPE "public"."pay_method" AS ENUM('eft', 'cash', 'card', 'snapscan', 'other');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'staff');--> statement-breakpoint
CREATE TABLE "activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer,
	"message" text NOT NULL,
	"user_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Extras' NOT NULL,
	"unit" text DEFAULT 'each' NOT NULL,
	"unit_price" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"vat_number" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"quantity" double precision DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'each' NOT NULL,
	"unit_price" integer DEFAULT 0 NOT NULL,
	"line_total" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "doc_type" NOT NULL,
	"number" text NOT NULL,
	"status" "doc_status" DEFAULT 'draft' NOT NULL,
	"client_id" integer NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date,
	"event_date" date,
	"event_type" text DEFAULT '' NOT NULL,
	"venue" text DEFAULT '' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"terms" text DEFAULT '' NOT NULL,
	"vat_enabled" boolean DEFAULT false NOT NULL,
	"vat_rate" double precision DEFAULT 15 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"vat_amount" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"deposit_percent" integer DEFAULT 0 NOT NULL,
	"source_quote_id" integer,
	"public_token" text NOT NULL,
	"sent_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"accepted_by" text DEFAULT '' NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_number" text NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"method" "pay_method" DEFAULT 'eft' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"paid_at" date NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"public_token" text NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_receipt_number_unique" UNIQUE("receipt_number"),
	CONSTRAINT "payments_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"business_name" text DEFAULT 'Iconic Stretch Tents' NOT NULL,
	"legal_name" text DEFAULT '' NOT NULL,
	"reg_number" text DEFAULT '' NOT NULL,
	"vat_registered" boolean DEFAULT false NOT NULL,
	"vat_number" text DEFAULT '' NOT NULL,
	"vat_rate" double precision DEFAULT 15 NOT NULL,
	"address" text DEFAULT 'Cape Town, Western Cape' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"website" text DEFAULT 'iconicstretchtents.co.za' NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL,
	"account_name" text DEFAULT '' NOT NULL,
	"account_number" text DEFAULT '' NOT NULL,
	"branch_code" text DEFAULT '' NOT NULL,
	"account_type" text DEFAULT '' NOT NULL,
	"quote_prefix" text DEFAULT 'Q' NOT NULL,
	"invoice_prefix" text DEFAULT 'INV' NOT NULL,
	"receipt_prefix" text DEFAULT 'RCT' NOT NULL,
	"next_quote_no" integer DEFAULT 1001 NOT NULL,
	"next_invoice_no" integer DEFAULT 1001 NOT NULL,
	"next_receipt_no" integer DEFAULT 1001 NOT NULL,
	"quote_validity_days" integer DEFAULT 14 NOT NULL,
	"payment_terms_days" integer DEFAULT 7 NOT NULL,
	"deposit_percent" integer DEFAULT 50 NOT NULL,
	"quote_terms" text DEFAULT '' NOT NULL,
	"invoice_terms" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_lines" ADD CONSTRAINT "document_lines_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_documents_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_doc_idx" ON "activity" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "clients_name_idx" ON "clients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "lines_doc_idx" ON "document_lines" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_type_number_idx" ON "documents" USING btree ("type","number");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_token_idx" ON "documents" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "documents_client_idx" ON "documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_id");