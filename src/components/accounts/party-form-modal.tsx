"use client";

import { Modal, ModalActions } from "@/components/modal";
import { FormField } from "@/components/forms/form-field";
import { Input, Select } from "@/components/ui/primitives";
import type { Party, PartyType } from "@/lib/types";

const TYPE_LABELS: Record<PartyType, string> = {
  supplier: "Supplier (you pay them)",
  customer: "Customer (pays you)",
  other: "Other",
};

export type PartyFormState = {
  name: string;
  type: PartyType;
  phone: string;
  note: string;
};

export const emptyPartyForm = (): PartyFormState => ({
  name: "",
  type: "supplier",
  phone: "",
  note: "",
});

type Props = {
  open: boolean;
  onClose: () => void;
  editing: Party | null;
  form: PartyFormState;
  setForm: React.Dispatch<React.SetStateAction<PartyFormState>>;
  errors: Record<string, string>;
  onSubmit: () => void;
};

export function PartyFormModal({
  open,
  onClose,
  editing,
  form,
  setForm,
  errors,
  onSubmit,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit account" : "New ledger account"}
      footer={
        <ModalActions
          formId="party-form"
          onCancel={onClose}
          onSubmit={onSubmit}
          submitLabel={editing ? "Save" : "Add account"}
        />
      }
    >
      <form
        id="party-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <FormField label="Account name" required error={errors.name}>
          <Input
            autoFocus
            placeholder="e.g. Cash sales & expenses"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
            }}
          />
        </FormField>

        <FormField label="Type">
          <Select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PartyType }))}
          >
            {(Object.keys(TYPE_LABELS) as PartyType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Phone (optional)">
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </FormField>

        <FormField label="Note (optional)">
          <Input
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </FormField>
      </form>
    </Modal>
  );
}
