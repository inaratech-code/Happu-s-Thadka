export async function hashPassword(password: string): Promise<string> {
  const salted = `${password}:happus-tadka-salt`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salted));
    return `sha256:${Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
  }
  let h = 0;
  for (let i = 0; i < salted.length; i++) {
    h = (Math.imul(31, h) + salted.charCodeAt(i)) | 0;
  }
  return `legacy:${h}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const next = await hashPassword(password);
  return next === passwordHash;
}
