"use client";

import { useActionState } from "react";
import { recordPayment } from "@/app/actions/documents";
import { FormMessage, SubmitButton } from "./forms";

export function PaymentForm({ invoiceId, suggested, today }: { invoiceId: number; suggested: { label: string; amount: string }[]; today: string }) {
  const [state, action] = useActionState(recordPayment, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <label className="block">
        <span className="label">Amount received (R)</span>
        <input name="amount" id={`amt-${invoiceId}`} className="input text-right text-base" inputMode="decimal" defaultValue={suggested[0]?.amount} required />
      </label>
      {suggested.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggested.map((s) => (
            <button
              key={s.label}
              type="button"
              className="rounded-full bg-paper px-2.5 py-1 text-[11px] text-mute ring-1 ring-line hover:text-ink"
              onClick={() => {
                const el = document.getElementById(`amt-${invoiceId}`) as HTMLInputElement;
                el.value = s.amount;
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Date</span>
          <input type="date" name="paidAt" className="input" defaultValue={today} required />
        </label>
        <label className="block">
          <span className="label">Method</span>
          <select name="method" className="input" defaultValue="eft">
            <option value="eft">EFT</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="snapscan">SnapScan / QR</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label">Bank reference</span>
        <input name="reference" className="input" />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Recording…">
        Record payment & issue receipt
      </SubmitButton>
    </form>
  );
}
