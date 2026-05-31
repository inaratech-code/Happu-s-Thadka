export function convertUnitQty(qty: number, fromUnit: string, toUnit: string): number | null {
  const from = fromUnit.trim().toLowerCase();
  const to = toUnit.trim().toLowerCase();
  if (from === to) return qty;

  const factors: Record<string, Record<string, number>> = {
    g: { kg: 0.001 },
    kg: { g: 1000 },
    ml: { l: 0.001 },
    l: { ml: 1000 },
  };

  const factor = factors[from]?.[to];
  return factor !== undefined ? qty * factor : null;
}

export function qtyInInventoryUnit(
  qty: number,
  formUnit: string,
  inventoryUnit: string
): { ok: true; qty: number } | { ok: false; error: string } {
  const converted = convertUnitQty(qty, formUnit, inventoryUnit);
  if (converted === null) {
    return {
      ok: false,
      error: `Unit “${formUnit}” cannot be converted to stock unit “${inventoryUnit}”`,
    };
  }
  return { ok: true, qty: converted };
}
