import { notFound, redirect } from "next/navigation";
import { DocumentEditor } from "@/components/DocumentEditor";
import { PageHeader } from "@/components/ui";
import { getDocument } from "@/lib/data";
import { editorProps } from "@/lib/editor-data";

export const metadata = { title: "Edit quote" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const doc = await getDocument(Number((await params).id));
  if (!doc || doc.type !== "quote") notFound();
  if (doc.status === "converted" || doc.status === "void" || doc.amountPaid > 0) redirect("/quotes/" + doc.id);
  const props = await editorProps("quote", doc);
  return (
    <>
      <PageHeader back={{ href: "/quotes/" + doc.id, label: doc.number }} eyebrow="Edit" title={doc.number} />
      <DocumentEditor {...props} />
    </>
  );
}
