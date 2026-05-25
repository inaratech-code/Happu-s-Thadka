"use client";

import { useMemo, useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { LedgerAccountCard } from "@/components/accounts/ledger-account-card";
import { LedgerRowsMobile, LedgerRowsTable } from "@/components/accounts/ledger-rows";
import {
  RecordEntryModal,
  emptyLedgerForm,
  type LedgerFormState,
} from "@/components/accounts/record-entry-modal";
import {
  PartyFormModal,
  emptyPartyForm,
  type PartyFormState,
} from "@/components/accounts/party-form-modal";
import { CASH_SALES_PARTY_NAME } from "@/lib/default-parties";
import { useStore } from "@/lib/store";
import { defaultCashAccountId } from "@/lib/default-accounts";
import { buildLedgerAccountSummaries, entriesForParty } from "@/lib/ledger-accounts";
import { runningLedgerBalances } from "@/lib/account-stats";
import { validateLedgerEntry } from "@/lib/validate-entry";
import type { Party } from "@/lib/types";

export default function LedgerPage() {
  const { state, addLedgerEntry, deleteLedgerEntry, addParty, updateParty, deleteParty } =
    useStore();
  const cashId = defaultCashAccountId(state.financialAccounts);

  const [selectedPartyName, setSelectedPartyName] = useState<string | null>(null);
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [partyForm, setPartyForm] = useState<PartyFormState>(emptyPartyForm);
  const [partyErrors, setPartyErrors] = useState<Record<string, string>>({});

  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState<LedgerFormState>(() => emptyLedgerForm(cashId));
  const [entryErrors, setEntryErrors] = useState<Record<string, string>>({});

  const accounts = useMemo(
    () => buildLedgerAccountSummaries(state.parties, state.ledgerEntries),
    [state.parties, state.ledgerEntries]
  );

  const selectedEntries = useMemo(() => {
    if (!selectedPartyName) return [];
    return entriesForParty(state.ledgerEntries, selectedPartyName);
  }, [selectedPartyName, state.ledgerEntries]);

  const selectedRows = useMemo(
    () => [...runningLedgerBalances(selectedEntries)].reverse(),
    [selectedEntries]
  );

  const openNewAccount = () => {
    setEditingParty(null);
    setPartyForm(emptyPartyForm());
    setPartyErrors({});
    setPartyModalOpen(true);
  };

  const openEditAccount = (id: string) => {
    const party = state.parties.find((p) => p.id === id);
    if (!party) return;
    setEditingParty(party);
    setPartyForm({
      name: party.name,
      type: party.type,
      phone: party.phone ?? "",
      note: party.note ?? "",
    });
    setPartyErrors({});
    setPartyModalOpen(true);
  };

  const submitParty = () => {
    const errors: Record<string, string> = {};
    const name = partyForm.name.trim();
    if (!name) errors.name = "Account name is required";
    const duplicate = state.parties.find(
      (p) => p.name.trim().toLowerCase() === name.toLowerCase() && p.id !== editingParty?.id
    );
    if (duplicate) errors.name = `“${duplicate.name}” already exists`;
    if (name.toLowerCase() === CASH_SALES_PARTY_NAME.toLowerCase() && !editingParty) {
      errors.name = "This name is reserved for the system cash account";
    }
    if (Object.keys(errors).length > 0) {
      setPartyErrors(errors);
      return;
    }
    if (editingParty) {
      const res = updateParty(editingParty.id, {
        name,
        type: partyForm.type,
        phone: partyForm.phone.trim() || undefined,
        note: partyForm.note.trim() || undefined,
      });
      if (!res.ok) {
        alert(res.error);
        return;
      }
      if (selectedPartyName === editingParty.name) setSelectedPartyName(name);
    } else {
      addParty({
        name,
        type: partyForm.type,
        phone: partyForm.phone.trim() || undefined,
        note: partyForm.note.trim() || undefined,
        active: true,
      });
    }
    setPartyModalOpen(false);
    setEditingParty(null);
    setPartyForm(emptyPartyForm());
  };

  const handleDeleteAccount = (id: string, name: string) => {
    const hasEntries = state.ledgerEntries.some((e) => (e.party ?? "").trim() === name);
    const msg = hasEntries
      ? `Delete “${name}”? Ledger transactions will keep the name on old entries.`
      : `Delete “${name}”?`;
    if (!confirm(msg)) return;
    const res = deleteParty(id);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    if (selectedPartyName === name) setSelectedPartyName(null);
  };

  const openRecordEntry = (prefillParty?: string) => {
    setEntryForm({
      ...emptyLedgerForm(defaultCashAccountId(state.financialAccounts)),
      party: prefillParty ?? "",
    });
    setEntryErrors({});
    setEntryModalOpen(true);
  };

  const submitEntry = () => {
    const result = validateLedgerEntry({ ...entryForm, accountId: entryForm.accountId });
    if (!result.ok) {
      setEntryErrors(result.errors);
      return;
    }
    addLedgerEntry({
      date: entryForm.date,
      description: entryForm.description.trim(),
      debit: entryForm.mode === "out" ? result.amount : 0,
      credit: entryForm.mode === "in" ? result.amount : 0,
      accountId: entryForm.accountId,
      party: entryForm.party.trim() || undefined,
      kind: entryForm.mode === "in" ? "receipt" : "payment",
    });
    setEntryForm(emptyLedgerForm(defaultCashAccountId(state.financialAccounts)));
    setEntryModalOpen(false);
  };

  const onDeleteEntry = (id: string, description: string) => {
    if (confirm(`Remove “${description}”?`)) deleteLedgerEntry(id);
  };

  return (
    <>
      <PageHeader
        title="Ledger & parties"
        subtitle="Add parties here — each card shows Dr, Cr and net balance"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => openRecordEntry(selectedPartyName ?? undefined)}
            >
              <Receipt className="h-4 w-4" />
              Record entry
            </Button>
            <Button size="sm" className="w-full sm:w-auto" onClick={openNewAccount}>
              <Plus className="h-4 w-4" />
              New account
            </Button>
          </div>
        }
      />

      <div className="surface-card px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground font-medium">Cash sales & expenses</strong> is fixed.
        Use <strong className="text-foreground font-medium">New account</strong> for suppliers and customers —
        then record payments and entries against them.
      </div>

      {accounts.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No ledger accounts yet.</p>
          <Button className="mt-4" size="sm" onClick={openNewAccount}>
            <Plus className="h-4 w-4" />
            New account
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <LedgerAccountCard
              key={account.id}
              account={account}
              selected={selectedPartyName === account.name}
              onSelect={() =>
                setSelectedPartyName((prev) => (prev === account.name ? null : account.name))
              }
              onEdit={() => openEditAccount(account.id)}
              onDelete={() => handleDeleteAccount(account.id, account.name)}
            />
          ))}
        </div>
      )}

      {selectedPartyName && (
        <section className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{selectedPartyName}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Transactions for this account</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => openRecordEntry(selectedPartyName)}>
              <Plus className="h-3.5 w-3.5" />
              Add entry
            </Button>
          </div>

          {selectedRows.length === 0 ? (
            <div className="surface-card p-6 text-center text-sm text-muted-foreground">
              No entries for this account yet.
            </div>
          ) : (
            <>
              <LedgerRowsMobile
                rows={selectedRows}
                accounts={state.financialAccounts}
                onDelete={onDeleteEntry}
                showAccount
              />
              <LedgerRowsTable
                rows={selectedRows}
                accounts={state.financialAccounts}
                onDelete={onDeleteEntry}
                showAccount
              />
            </>
          )}
        </section>
      )}

      <PartyFormModal
        open={partyModalOpen}
        onClose={() => {
          setPartyModalOpen(false);
          setEditingParty(null);
        }}
        editing={editingParty}
        form={partyForm}
        setForm={setPartyForm}
        errors={partyErrors}
        onSubmit={submitParty}
      />

      <RecordEntryModal
        open={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        form={entryForm}
        setForm={setEntryForm}
        errors={entryErrors}
        setErrors={setEntryErrors}
        accounts={state.financialAccounts}
        parties={state.parties}
        previewBalance={null}
        onSubmit={submitEntry}
      />
    </>
  );
}
