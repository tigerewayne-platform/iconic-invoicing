"use client";

import { useActionState, useState } from "react";
import { addUser, changePassword, removeUser, saveSettings } from "@/app/actions/settings";
import type { Settings } from "@/db/schema";
import { ConfirmButton, FormMessage, SubmitButton } from "./forms";

function In({ name, label, st, type = "text", className = "", placeholder }: { name: keyof Settings; label: string; st: Settings; type?: string; className?: string; placeholder?: string }) {
  return (
    <label className={className}>
      <span className="label">{label}</span>
      <input name={name} type={type} className="input" defaultValue={String(st[name] ?? "")} placeholder={placeholder} />
    </label>
  );
}

export function BusinessSettings({ st, admin }: { st: Settings; admin: boolean }) {
  const [state, action] = useActionState(saveSettings, undefined);
  const [vat, setVat] = useState(st.vatRegistered);
  return (
    <form action={action} className="space-y-6">
      <fieldset disabled={!admin} className="space-y-6">
        <section className="card p-6">
          <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Business details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <In st={st} name="businessName" label="Trading name" />
            <In st={st} name="legalName" label="Registered name" placeholder="Iconic Stretch Tents (Pty) Ltd" />
            <In st={st} name="regNumber" label="Company reg. number" placeholder="2024/123456/07" />
            <In st={st} name="phone" label="Phone" />
            <In st={st} name="email" label="Accounts email (replies go here)" type="email" />
            <In st={st} name="website" label="Website" />
            <label className="sm:col-span-2">
              <span className="label">Address</span>
              <textarea name="address" rows={2} className="input" defaultValue={st.address} />
            </label>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-1 font-serif text-xl font-semibold text-ink">VAT</h2>
          <p className="mb-4 text-sm text-mute">
            Only switch this on once you&apos;re registered with SARS. Invoices then become &ldquo;Tax Invoices&rdquo; with your VAT number and 15% VAT added.
          </p>
          <label className="mb-4 flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="vatRegistered" checked={vat} onChange={(e) => setVat(e.target.checked)} className="accent-brand" />
            Registered for VAT
          </label>
          {vat ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <In st={st} name="vatNumber" label="VAT number" />
              <In st={st} name="vatRate" label="VAT rate %" type="number" />
            </div>
          ) : (
            <>
              <input type="hidden" name="vatNumber" value={st.vatNumber} />
              <input type="hidden" name="vatRate" value={st.vatRate} />
            </>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-1 font-serif text-xl font-semibold text-ink">Banking details</h2>
          <p className="mb-4 text-sm text-mute">Printed on every quote and invoice so clients can pay by EFT.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <In st={st} name="bankName" label="Bank" placeholder="FNB" />
            <In st={st} name="accountName" label="Account holder" />
            <In st={st} name="accountNumber" label="Account number" />
            <In st={st} name="branchCode" label="Branch code" placeholder="250655" />
            <In st={st} name="accountType" label="Account type" placeholder="Business cheque" />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Numbering & defaults</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <In st={st} name="quotePrefix" label="Quote prefix" />
            <In st={st} name="invoicePrefix" label="Invoice prefix" />
            <In st={st} name="receiptPrefix" label="Receipt prefix" />
            <In st={st} name="nextQuoteNo" label="Next quote no." type="number" />
            <In st={st} name="nextInvoiceNo" label="Next invoice no." type="number" />
            <In st={st} name="nextReceiptNo" label="Next receipt no." type="number" />
            <In st={st} name="quoteValidityDays" label="Quotes valid for (days)" type="number" />
            <In st={st} name="paymentTermsDays" label="Invoices due in (days)" type="number" />
            <In st={st} name="depositPercent" label="Default deposit %" type="number" />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Default terms</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <label>
              <span className="label">Quote terms</span>
              <textarea name="quoteTerms" rows={7} className="input text-xs" defaultValue={st.quoteTerms} />
            </label>
            <label>
              <span className="label">Invoice terms</span>
              <textarea name="invoiceTerms" rows={7} className="input text-xs" defaultValue={st.invoiceTerms} />
            </label>
          </div>
        </section>
      </fieldset>
      {admin ? (
        <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
          <div className="mr-auto">
            <FormMessage state={state} />
          </div>
          <SubmitButton>Save settings</SubmitButton>
        </div>
      ) : (
        <p className="text-sm text-mute">Only admins can change business settings.</p>
      )}
    </form>
  );
}

export function TeamSettings({ users, meId, admin }: { users: { id: number; name: string; email: string; role: string }[]; meId: number; admin: boolean }) {
  const [state, action] = useActionState(addUser, undefined);
  return (
    <section className="card p-6">
      <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Team logins</h2>
      <ul className="mb-5 divide-y divide-line/70">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 py-2.5 text-sm">
            <div className="flex-1">
              <p className="text-ink">
                {u.name} {u.id === meId ? <span className="text-mute">(you)</span> : null}
              </p>
              <p className="text-xs text-mute">{u.email}</p>
            </div>
            <span className="text-xs uppercase tracking-widest text-mute">{u.role}</span>
            {admin && u.id !== meId ? (
              <form action={removeUser}>
                <input type="hidden" name="id" value={u.id} />
                <ConfirmButton className="btn-quiet py-0 text-xs hover:text-brand" message={`Remove ${u.name}'s login?`}>
                  Remove
                </ConfirmButton>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      {admin ? (
        <form action={action} className="grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
          <input name="name" className="input" placeholder="Name" required />
          <input name="email" type="email" className="input" placeholder="Email" required />
          <input name="password" className="input" placeholder="Temporary password (8+)" minLength={8} required />
          <select name="role" className="input" defaultValue="staff">
            <option value="staff">Staff (quotes, invoices, payments)</option>
            <option value="admin">Admin (also settings & team)</option>
          </select>
          <div className="flex items-center justify-end gap-3 sm:col-span-2">
            <FormMessage state={state} />
            <SubmitButton className="btn-dark">Add login</SubmitButton>
          </div>
        </form>
      ) : null}
    </section>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  return (
    <section className="card p-6">
      <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Your password</h2>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <input name="current" type="password" className="input" placeholder="Current password" required />
        <input name="next" type="password" className="input" placeholder="New password (8+)" minLength={8} required />
        <div className="flex items-center justify-end gap-3 sm:col-span-2">
          <FormMessage state={state} />
          <SubmitButton className="btn-ghost">Change password</SubmitButton>
        </div>
      </form>
    </section>
  );
}
