import type { Party } from "./types";

export const GENERAL_LEDGER_PARTY_ID = "party-cash-sales";

export const CASH_SALES_PARTY_NAME = "Cash sales & expenses";

/** System ledger account — always present, not deletable */
export const FIXED_LEDGER_PARTY: Party = {
  id: GENERAL_LEDGER_PARTY_ID,
  name: CASH_SALES_PARTY_NAME,
  type: "other",
  active: true,
};

export const DEFAULT_PARTIES: Party[] = [FIXED_LEDGER_PARTY];

export function isFixedLedgerParty(partyId: string): boolean {
  return partyId === GENERAL_LEDGER_PARTY_ID;
}

/** Remove seeded demo supplier names from persisted state */
export function stripDemoParties(parties: Party[]): Party[] {
  return parties.filter((p) => p.id !== GENERAL_LEDGER_PARTY_ID && !p.id.startsWith("party-seed-"));
}

export function ensureDefaultParties(parties: Party[]): Party[] {
  const userParties = stripDemoParties(parties);
  return [FIXED_LEDGER_PARTY, ...userParties];
}

export function activePartyNames(parties: Party[]) {
  return parties.filter((p) => p.active).map((p) => p.name);
}
