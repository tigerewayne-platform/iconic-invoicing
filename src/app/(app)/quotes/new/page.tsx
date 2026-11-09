import { DocumentEditor } from "@/components/DocumentEditor";
import { PageHeader } from "@/components/ui";
import { editorProps } from "@/lib/editor-data";

export const metadata = { title: "New quote" };

export default async function Page({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const props = await editorProps("quote", undefined, client ? Number(client) : undefined);
  return (
    <>
      <PageHeader back={{ href: "/quotes", label: "Quotes" }} eyebrow="New" title="New quote" />
      <DocumentEditor {...props} />
    </>
  );
}
