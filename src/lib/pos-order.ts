export function formatPosOrderRef(txCounter: number) {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `ORD ${stamp}/${String(txCounter).padStart(3, "0")}`;
}
