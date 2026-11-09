import { notFound, redirect } from "next/navigation";
import { DocumentEditor } from "@/components/DocumentEditor";
import { PageHeader } from "@/components/ui";
import { getDocument } from "@/lib/data";
import { editorProps } from "@/lib/editor-data";

export const metadata = { title: "Edit invoice" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const doc = await getDocument(Number((await params).id));
  if (!doc || doc.type !== "invoice") notFound();
  if (doc.status === "converted" || doc.status === "void" || doc.amountPaid > 0) redirect("/invoices/" + doc.id);
  const props = await editorProps("invoice", doc);
  return (
    <>
      <PageHeader back={{ href: "/invoices/" + doc.id, label: doc.number }} eyebrow="Edit" title={doc.number} />
      <DocumentEditor {...props} />
    </>
  );
}
