"use client";

import { useActionState } from "react";
import { saveClient } from "@/app/actions/clients";
import type { Client } from "@/db/schema";
import { FormMessage, SubmitButton } from "./forms";

export function ClientForm({ client }: { client?: Client }) {
  const [state, action] = useActionState(saveClient, undefined);
  const f = (k: keyof Client) => (client ? String(client[k] ?? "") : "");
  return (
    <form action={action} className="card max-w-2xl space-y-4 p-6">
      {client ? <input type="hidden" name="id" value={client.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Contact name *</span>
          <input name="name" className="input" defaultValue={f("name")} required />
        </label>
        <label>
          <span className="label">Company</span>
          <input name="company" className="input" defaultValue={f("company")} />
        </label>
        <label>
          <span className="label">Email</span>
          <input name="email" type="email" className="input" defaultValue={f("email")} />
        </label>
        <label>
          <span className="label">Phone / WhatsApp</span>
          <input name="phone" className="input" defaultValue={f("phone")} placeholder="082 123 4567" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Billing address</span>
          <textarea name="address" rows={3} className="input" defaultValue={f("address")} />
        </label>
        <label>
          <span className="label">Client VAT number</span>
          <input name="vatNumber" className="input" defaultValue={f("vatNumber")} />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Internal notes</span>
          <textarea name="notes" rows={2} className="input" defaultValue={f("notes")} placeholder="Not shown to the client" />
        </label>
      </div>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton>{client ? "Save client" : "Add client"}</SubmitButton>
      </div>
    </form>
  );
}
