import { randomInt } from "node:crypto";

// No 0/O/1/l/I so passwords read cleanly over the phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function generatePassword(length = 10) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export const membershipNo = (n: number) => `AOJE-${String(n).padStart(4, "0")}`;
export const memberLoginId = (n: number) => `aoj${String(n).padStart(4, "0")}`;
