import { DocumentList } from "@/components/DocumentList";

export const metadata = { title: "Quotes" };

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  return <DocumentList type="quote" status={status} q={q} />;
}
