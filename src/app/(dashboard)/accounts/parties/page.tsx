import { redirect } from "next/navigation";

/** Parties are managed on the Ledger screen */
export default function PartiesPage() {
  redirect("/accounts/ledger");
}
