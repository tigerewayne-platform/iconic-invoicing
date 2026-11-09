"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FileText, Home, LogOut, Menu, Package, Receipt, Settings, Users, X, FileSignature } from "lucide-react";
import { logout } from "@/app/actions/auth";

const NAV = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/quotes", label: "Quotes", icon: FileSignature },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/catalogue", label: "Catalogue", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ userName }: { userName: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
            active(href) ? "bg-white/[0.06] text-cream" : "text-sand hover:bg-white/[0.03] hover:text-cream"
          }`}
        >
          <Icon size={16} strokeWidth={1.6} className={active(href) ? "text-brand" : "text-sand/70 group-hover:text-cream"} />
          {label}
          {active(href) ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" /> : null}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/[0.06] px-6 py-5">
      <p className="text-xs text-sand">Signed in as</p>
      <p className="truncate text-sm text-cream">{userName}</p>
      <form action={logout}>
        <button className="mt-3 inline-flex items-center gap-2 text-xs text-sand hover:text-brand">
          <LogOut size={13} /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-ink px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center">
          <Image src="/brand/logo-reversed-for-dark-bg.png" alt="Iconic Stretch Tents" width={92} height={55} priority />
        </Link>
        <button onClick={() => setOpen(true)} className="text-cream" aria-label="Open menu">
          <Menu size={22} />
        </button>
      </header>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink">
            <div className="flex items-center justify-between px-6 py-5">
              <Image src="/brand/logo-reversed-for-dark-bg.png" alt="Iconic Stretch Tents" width={110} height={66} />
              <button onClick={() => setOpen(false)} className="text-sand" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      ) : null}
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-ink lg:flex">
        <div className="px-6 pb-8 pt-7">
          <Link href="/">
            <Image src="/brand/logo-reversed-for-dark-bg.png" alt="Iconic Stretch Tents" width={150} height={90} priority />
          </Link>
          <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-brand">Billing desk</p>
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
