"use client";

import { useActionState, useState } from "react";
import { deleteCatalogItem, saveCatalogItem } from "@/app/actions/catalog";
import type { CatalogItem } from "@/db/schema";
import { centsToInput, formatZAR } from "@/lib/money";
import { ConfirmButton, FormMessage, SubmitButton } from "./forms";

export function CatalogEditor({ item, onDone }: { item?: CatalogItem; onDone?: () => void }) {
  const [state, action] = useActionState(async (p: Parameters<typeof saveCatalogItem>[0], fd: FormData) => {
    const r = await saveCatalogItem(p, fd);
    if (r?.ok) onDone?.();
    return r;
  }, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-6">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="sm:col-span-3">
        <span className="label">Name</span>
        <input name="name" className="input" defaultValue={item?.name} required />
      </label>
      <label className="sm:col-span-1">
        <span className="label">Category</span>
        <input name="category" list="cats" className="input" defaultValue={item?.category ?? "Extras"} />
        <datalist id="cats">
          <option value="Packages" />
          <option value="Tents" />
          <option value="Extras" />
          <option value="Services" />
        </datalist>
      </label>
      <label>
        <span className="label">Unit</span>
        <input name="unit" className="input" defaultValue={item?.unit ?? "each"} />
      </label>
      <label>
        <span className="label">Price (R, excl.)</span>
        <input name="unitPrice" inputMode="decimal" className="input text-right" defaultValue={item ? centsToInput(item.unitPrice) : ""} />
      </label>
      <label className="sm:col-span-6">
        <span className="label">Description shown on quotes</span>
        <textarea name="description" rows={2} className="input text-xs" defaultValue={item?.description} />
      </label>
      <div className="flex items-center justify-between gap-3 sm:col-span-6">
        <label className="flex items-center gap-2 text-sm text-mute">
          <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className="accent-brand" /> Show in quote builder
        </label>
        <div className="flex items-center gap-2">
          <FormMessage state={state} />
          <SubmitButton className="btn-dark">{item ? "Save" : "Add item"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}

export function CatalogRow({ item }: { item: CatalogItem }) {
  const [editing, setEditing] = useState(false);
  if (editing)
    return (
      <li className="bg-paper px-5 py-4">
        <CatalogEditor item={item} onDone={() => setEditing(false)} />
        <button className="mt-2 text-xs text-mute hover:text-ink" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </li>
    );
  return (
    <li className={`flex items-start gap-4 px-5 py-3.5 ${item.active ? "" : "opacity-50"}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{item.name}</p>
        {item.description ? <p className="mt-0.5 line-clamp-2 text-xs text-mute">{item.description}</p> : null}
      </div>
      <p className={`whitespace-nowrap text-sm ${item.unitPrice ? "text-ink" : "text-brand"}`}>
        {item.unitPrice ? formatZAR(item.unitPrice) : "Set price"}
        <span className="text-mute">{item.unit !== "each" ? ` / ${item.unit}` : ""}</span>
      </p>
      <div className="flex gap-1">
        <button className="btn-quiet py-0 text-xs" onClick={() => setEditing(true)}>
          Edit
        </button>
        <form action={deleteCatalogItem}>
          <input type="hidden" name="id" value={item.id} />
          <ConfirmButton className="btn-quiet py-0 text-xs hover:text-brand" message={`Remove ${item.name} from the catalogue?`}>
            Remove
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
