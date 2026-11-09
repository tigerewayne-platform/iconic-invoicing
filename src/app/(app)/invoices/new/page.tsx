import { DocumentEditor } from "@/components/DocumentEditor";
import { PageHeader } from "@/components/ui";
import { editorProps } from "@/lib/editor-data";

export const metadata = { title: "New invoice" };

export default async function Page({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const props = await editorProps("invoice", undefined, client ? Number(client) : undefined);
  return (
    <>
      <PageHeader back={{ href: "/invoices", label: "Invoices" }} eyebrow="New" title="New invoice" />
      <DocumentEditor {...props} />
    </>
  );
}
