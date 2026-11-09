import { ClientForm } from "@/components/ClientForm";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "New client" };

export default function Page() {
  return (
    <>
      <PageHeader back={{ href: "/clients", label: "Clients" }} eyebrow="New" title="New client" />
      <ClientForm />
    </>
  );
}
