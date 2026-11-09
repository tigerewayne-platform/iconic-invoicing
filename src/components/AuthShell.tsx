import Image from "next/image";

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(252,1,1,0.10),transparent_60%)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Image src="/brand/logo-reversed-for-dark-bg.png" alt="Iconic Stretch Tents" width={190} height={114} priority />
        </div>
        <div className="rounded-xl border border-white/10 bg-panel p-7">
          <p className="eyebrow mb-1">Billing desk</p>
          <h1 className="font-serif text-3xl font-semibold text-cream">{title}</h1>
          <p className="mt-1 text-sm text-sand">{sub}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-sand/60">Built for the Cape.</p>
      </div>
    </div>
  );
}
