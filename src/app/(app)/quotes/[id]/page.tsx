import { DocumentView } from "@/components/DocumentView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <DocumentView id={Number((await params).id)} type="quote" />;
}
