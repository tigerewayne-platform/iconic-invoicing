import { Sidebar } from "@/components/Sidebar";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen">
      <Sidebar userName={user.name} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
