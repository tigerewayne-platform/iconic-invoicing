import Image from "next/image";
import type { Settings } from "@/db/schema";

export function PublicShell({ st, children }: { st: Settings; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <a href={`https://${st.website.replace(/^https?:\/\//, "")}`}>
            <Image src="/brand/logo-reversed-for-dark-bg.png" alt={st.businessName} width={120} height={72} priority />
          </a>
          <p className="hidden text-right font-serif text-lg italic text-sand sm:block">Built for the Cape.</p>
        </div>
        <div className="h-1 bg-brand" />
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      <footer className="mx-auto max-w-4xl px-4 pb-10 text-center text-xs text-mute sm:px-6">
        {[st.businessName, st.phone, st.email, st.website].filter(Boolean).join("  ·  ")}
      </footer>
    </div>
  );
}
