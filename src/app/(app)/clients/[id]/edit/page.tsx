import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { ClientForm } from "@/components/ClientForm";
import { PageHeader } from "@/components/ui";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const [c] = await db.select().from(clients).where(eq(clients.id, Number((await params).id)));
  if (!c) notFound();
  return (
    <>
      <PageHeader back={{ href: `/clients/${c.id}`, label: c.company || c.name }} eyebrow="Edit client" title={c.company || c.name} />
      <ClientForm client={c} />
    </>
  );
}
