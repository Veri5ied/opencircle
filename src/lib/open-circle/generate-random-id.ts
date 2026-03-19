export function generateRandomId(length = 12): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(values)
    .map((value) => alphabet[value % alphabet.length])
    .join("");
}
