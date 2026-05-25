import { GENERAL_LEDGER_PARTY_ID } from "./default-parties";
import type { LedgerEntry, Party, PartyType } from "./types";

export type LedgerAccountSummary = {
  id: string;
  name: string;
  type: PartyType;
  debit: number;
  credit: number;
  /** debit − credit; positive = Dr balance */
  net: number;
  entryCount: number;
  active: boolean;
};

export function formatLedgerRs(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatNetLabel(net: number): { text: string; settled: boolean; side: "dr" | "cr" | null } {
  if (net === 0) return { text: "settled", settled: true, side: null };
  if (net > 0) return { text: `${formatLedgerRs(net)} Dr`, settled: false, side: "dr" };
  return { text: `${formatLedgerRs(Math.abs(net))} Cr`, settled: false, side: "cr" };
}

export function partyTypeLabel(type: PartyType): string {
  if (type === "supplier") return "Supplier";
  if (type === "customer") return "Customer";
  return "Other";
}

function aggregateForPartyName(entries: LedgerEntry[], partyName: string) {
  let debit = 0;
  let credit = 0;
  let entryCount = 0;
  for (const e of entries) {
    if ((e.party ?? "").trim() !== partyName) continue;
    debit += e.debit;
    credit += e.credit;
    entryCount += 1;
  }
  return { debit, credit, net: debit - credit, entryCount };
}

/** One card per saved party + totals from matching ledger lines */
export function buildLedgerAccountSummaries(
  parties: Party[],
  entries: LedgerEntry[]
): LedgerAccountSummary[] {
  const summaries = parties.map((party) => {
    const { debit, credit, net, entryCount } = aggregateForPartyName(entries, party.name);
    return {
      id: party.id,
      name: party.name,
      type: party.type,
      debit,
      credit,
      net,
      entryCount,
      active: party.active,
    };
  });

  return summaries.sort((a, b) => {
    if (a.id === GENERAL_LEDGER_PARTY_ID) return -1;
    if (b.id === GENERAL_LEDGER_PARTY_ID) return 1;
    if (a.entryCount > 0 && b.entryCount === 0) return -1;
    if (b.entryCount > 0 && a.entryCount === 0) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function entriesForParty(entries: LedgerEntry[], partyName: string) {
  return entries.filter((e) => (e.party ?? "").trim() === partyName);
}
