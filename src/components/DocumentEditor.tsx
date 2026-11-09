"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveDocument } from "@/app/actions/documents";
import { calcTotals, formatZAR, parseZAR } from "@/lib/money";
import { FormMessage, SubmitButton } from "./forms";

type ClientOpt = { id: number; name: string; company: string; email: string };
type CatalogOpt = { id: number; name: string; description: string; unit: string; unitPrice: number; category: string };
type Line = { key: string; description: string; details: string; quantity: string; unit: string; unitPrice: string };

export type EditorInitial = {
  id?: number;
  clientId?: number;
  issueDate: string;
  dueDate: string;
  eventDate: string;
  eventType: string;
  venue: string;
  reference: string;
  notes: string;
  terms: string;
  vatEnabled: boolean;
  discount: string;
  depositPercent: number;
  lines: Omit<Line, "key">[];
};

const EVENT_TYPES = ["Wedding", "Corporate event", "Private party", "Birthday", "Year-end function", "Funeral / memorial", "Festival", "Launch / activation", "Other"];

let k = 0;
const key = () => `l${++k}`;
const blankLine = (): Line => ({ key: key(), description: "", details: "", quantity: "1", unit: "each", unitPrice: "" });

export function DocumentEditor({
  type,
  initial,
  clients,
  catalog,
  vatRegistered,
  vatRate,
}: {
  type: "quote" | "invoice";
  initial: EditorInitial;
  clients: ClientOpt[];
  catalog: CatalogOpt[];
  vatRegistered: boolean;
  vatRate: number;
}) {
  const [state, action] = useActionState(saveDocument, undefined);
  const [f, setF] = useState(() => ({ ...initial }));
  const [lines, setLines] = useState<Line[]>(() =>
    initial.lines.length ? initial.lines.map((l) => ({ ...l, key: key() })) : [blankLine()],
  );
  const [clientMode, setClientMode] = useState<"existing" | "new">(clients.length && initial.clientId !== undefined ? "existing" : clients.length ? "existing" : "new");
  const [clientId, setClientId] = useState<number | undefined>(initial.clientId);
  const [nc, setNc] = useState({ name: "", company: "", email: "", phone: "", address: "" });
  const [clientFilter, setClientFilter] = useState("");

  const set = <K extends keyof EditorInitial>(k: K, v: EditorInitial[K]) => setF((p) => ({ ...p, [k]: v }));
  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i: number, d: -1 | 1) =>
    setLines((ls) => {
      const j = i + d;
      if (j < 0 || j >= ls.length) return ls;
      const c = [...ls];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const vatOn = vatRegistered && f.vatEnabled;
  const totals = useMemo(
    () =>
      calcTotals(
        lines.map((l) => ({ quantity: Number(l.quantity) || 0, unitPrice: parseZAR(l.unitPrice) })),
        parseZAR(f.discount),
        vatOn,
        vatRate,
      ),
    [lines, f.discount, vatOn, vatRate],
  );
  const deposit = f.depositPercent > 0 ? Math.round((totals.total * f.depositPercent) / 100) : 0;

  const addFromCatalog = (id: string) => {
    const c = catalog.find((x) => String(x.id) === id);
    if (!c) return;
    const line: Line = {
      key: key(),
      description: c.name,
      details: c.description,
      quantity: "1",
      unit: c.unit,
      unitPrice: c.unitPrice ? (c.unitPrice / 100).toFixed(2) : "",
    };
    setLines((ls) => (ls.length === 1 && !ls[0].description && !ls[0].unitPrice ? [line] : [...ls, line]));
  };

  const payload = JSON.stringify({
    id: f.id,
    type,
    clientId: clientMode === "existing" ? clientId : undefined,
    newClient: clientMode === "new" ? nc : undefined,
    issueDate: f.issueDate,
    dueDate: f.dueDate,
    eventDate: f.eventDate,
    eventType: f.eventType,
    venue: f.venue,
    reference: f.reference,
    notes: f.notes,
    terms: f.terms,
    vatEnabled: f.vatEnabled,
    discount: f.discount || "0",
    depositPercent: f.depositPercent,
    lines: lines
      .filter((l) => l.description.trim() || l.unitPrice)
      .map(({ key: _k, ...l }) => ({ ...l, quantity: Number(l.quantity) || 0 })),
  });

  const filteredClients = clientFilter
    ? clients.filter((c) => `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(clientFilter.toLowerCase()))
    : clients;
  const categories = Array.from(new Set(catalog.map((c) => c.category)));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client */}
        <section className="card p-5 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-ink">Client</h2>
            {clients.length ? (
              <button
                type="button"
                onClick={() => setClientMode((m) => (m === "existing" ? "new" : "existing"))}
                className="text-xs text-brand hover:underline"
              >
                {clientMode === "existing" ? "+ New client" : "Choose existing"}
              </button>
            ) : null}
          </div>
          {clientMode === "existing" ? (
            <div className="space-y-2">
              {clients.length > 8 ? (
                <input className="input" placeholder="Filter clients" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} />
              ) : null}
              <select
                className="input"
                size={Math.min(8, Math.max(4, filteredClients.length))}
                value={clientId ?? ""}
                onChange={(e) => setClientId(Number(e.target.value))}
                required
              >
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company ? `${c.company} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <input className="input" placeholder="Contact name *" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} />
              <input className="input" placeholder="Company (optional)" value={nc.company} onChange={(e) => setNc({ ...nc, company: e.target.value })} />
              <input className="input" placeholder="Email" type="email" value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} />
              <input className="input" placeholder="Phone / WhatsApp" value={nc.phone} onChange={(e) => setNc({ ...nc, phone: e.target.value })} />
              <textarea className="input" rows={2} placeholder="Billing address" value={nc.address} onChange={(e) => setNc({ ...nc, address: e.target.value })} />
            </div>
          )}
        </section>

        {/* Details */}
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Event & dates</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className="label">Event type</span>
              <input className="input" list="event-types" value={f.eventType} onChange={(e) => set("eventType", e.target.value)} placeholder="Wedding" />
              <datalist id="event-types">
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
            <label>
              <span className="label">Event date</span>
              <input type="date" className="input" value={f.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
            </label>
            <label>
              <span className="label">Venue / area</span>
              <input className="input" value={f.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Private estate, Constantia" />
            </label>
            <label>
              <span className="label">{type === "quote" ? "Quote date" : "Invoice date"}</span>
              <input type="date" required className="input" value={f.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
            </label>
            <label>
              <span className="label">{type === "quote" ? "Valid until" : "Due date"}</span>
              <input type="date" className="input" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </label>
            <label>
              <span className="label">Client reference / PO</span>
              <input className="input" value={f.reference} onChange={(e) => set("reference", e.target.value)} />
            </label>
          </div>
        </section>
      </div>

      {/* Lines */}
      <section className="card">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-xl font-semibold text-ink">Line items</h2>
          {catalog.length ? (
            <select className="input sm:w-72" value="" onChange={(e) => addFromCatalog(e.target.value)}>
              <option value="">+ Add from catalogue…</option>
              {categories.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {catalog
                    .filter((c) => c.category === cat)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.unitPrice ? ` · ${formatZAR(c.unitPrice)}${c.unit !== "each" ? "/" + c.unit : ""}` : ""}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          ) : null}
        </div>
        <div className="hidden grid-cols-[1fr_80px_80px_120px_120px_64px] gap-3 px-5 pt-3 text-[10px] font-medium uppercase tracking-[0.16em] text-mute md:grid">
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span>Unit</span>
          <span className="text-right">Unit price (R)</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
        <ul className="divide-y divide-line/70">
          {lines.map((l, i) => (
            <li key={l.key} className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-[1fr_80px_80px_120px_120px_64px] md:items-start">
              <div className="col-span-2 space-y-2 md:col-span-1">
                <input
                  className="input font-medium"
                  placeholder="Item"
                  value={l.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                />
                <textarea
                  className="input text-xs text-mute"
                  rows={l.details ? Math.min(4, Math.ceil(l.details.length / 80) + 1) : 1}
                  placeholder="Details (optional)"
                  value={l.details}
                  onChange={(e) => setLine(i, { details: e.target.value })}
                />
              </div>
              <label className="md:contents">
                <span className="label md:hidden">Qty</span>
                <input className="input text-right" inputMode="decimal" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
              </label>
              <label className="md:contents">
                <span className="label md:hidden">Unit</span>
                <input className="input" value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })} />
              </label>
              <label className="md:contents">
                <span className="label md:hidden">Unit price (R)</span>
                <input
                  className="input text-right"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={l.unitPrice}
                  onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                />
              </label>
              <div className="flex items-center justify-end md:h-[38px]">
                <span className="text-sm font-medium text-ink">{formatZAR(totals.lineTotals[i] ?? 0)}</span>
              </div>
              <div className="col-span-2 flex justify-end gap-1 md:col-span-1 md:h-[38px] md:items-center">
                <button type="button" className="p-1 text-sand hover:text-ink" onClick={() => move(i, -1)} aria-label="Move up">
                  <ArrowUp size={14} />
                </button>
                <button type="button" className="p-1 text-sand hover:text-ink" onClick={() => move(i, 1)} aria-label="Move down">
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className="p-1 text-sand hover:text-brand"
                  onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : [blankLine()]))}
                  aria-label="Remove line"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-5 py-3">
          <button type="button" className="btn-quiet px-0" onClick={() => setLines((ls) => [...ls, blankLine()])}>
            <Plus size={14} /> Add blank line
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card space-y-4 p-5 lg:col-span-3">
          <label className="block">
            <span className="label">Notes to client</span>
            <textarea className="input" rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Shown above the totals" />
          </label>
          <label className="block">
            <span className="label">Terms</span>
            <textarea className="input text-xs" rows={5} value={f.terms} onChange={(e) => set("terms", e.target.value)} />
          </label>
        </section>

        <section className="card p-5 lg:col-span-2">
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-mute">Subtotal</span>
              <span className="text-ink">{formatZAR(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-mute">Discount (R)</span>
              <input
                className="input w-32 py-1 text-right"
                inputMode="decimal"
                value={f.discount}
                onChange={(e) => set("discount", e.target.value)}
                placeholder="0.00"
              />
            </div>
            {vatRegistered ? (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-mute">
                  <input type="checkbox" checked={f.vatEnabled} onChange={(e) => set("vatEnabled", e.target.checked)} className="accent-brand" />
                  VAT {vatRate}%
                </label>
                <span className="text-ink">{formatZAR(totals.vatAmount)}</span>
              </div>
            ) : (
              <p className="text-xs text-sand">Not VAT registered, so no VAT is added.</p>
            )}
            <div className="!mt-4 flex items-baseline justify-between rounded-lg bg-ink px-4 py-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-sand">Total</span>
              <span className="font-serif text-2xl font-semibold text-cream">{formatZAR(totals.total)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <span className="text-mute">Deposit required</span>
              <div className="flex items-center gap-1.5">
                <input
                  className="input w-16 py-1 text-right"
                  inputMode="numeric"
                  value={f.depositPercent}
                  onChange={(e) => set("depositPercent", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                />
                <span className="text-mute">%</span>
              </div>
            </div>
            {deposit > 0 ? (
              <p className="text-right text-xs text-mute">
                {formatZAR(deposit)} now, {formatZAR(totals.total - deposit)} before installation
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
        <div className="mr-auto">
          <FormMessage state={state} />
        </div>
        <SubmitButton pendingText="Saving…">{f.id ? "Save changes" : `Save ${type}`}</SubmitButton>
      </div>
    </form>
  );
}
