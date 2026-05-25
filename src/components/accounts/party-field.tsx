"use client";

import Link from "next/link";
import { FormField } from "@/components/forms/form-field";
import { Select } from "@/components/ui/primitives";
import type { Party, PartyType } from "@/lib/types";

type Props = {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (name: string) => void;
  parties: Party[];
  /** Only show parties of these types (default: all active) */
  types?: PartyType[];
  hint?: string;
};

export function PartyField({
  label,
  required,
  error,
  value,
  onChange,
  parties,
  types,
  hint,
}: Props) {
  const list = parties
    .filter((p) => p.active)
    .filter((p) => !types?.length || types.includes(p.type))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <FormField label={label} required={required} error={error}>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{required ? "Select party" : "No party"}</option>
        {list.map((p) => (
          <option key={p.id} value={p.name}>
            {p.name}
            {p.type === "supplier" ? " (supplier)" : p.type === "customer" ? " (customer)" : ""}
          </option>
        ))}
      </Select>
      {list.length === 0 ? (
        <p className="text-[11px] text-amber-500/90 mt-1.5">
          No accounts yet.{" "}
          <Link href="/accounts/ledger" className="underline hover:text-amber-400">
            Add one under Ledger & parties
          </Link>
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {hint ?? (
            <>
              Accounts are managed under{" "}
              <Link href="/accounts/ledger" className="text-amber-500 hover:text-amber-400">
                Ledger & parties
              </Link>
              .
            </>
          )}
        </p>
      )}
    </FormField>
  );
}
