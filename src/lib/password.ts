import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedValue: string) {
  const [salt, storedHash] = storedValue.split(":");

  if (!salt || !storedHash) {
    const input = Buffer.from(password);
    const stored = Buffer.from(storedValue);

    return input.length === stored.length && timingSafeEqual(input, stored);
  }

  const inputHash = scryptSync(password, salt, KEY_LENGTH);
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  return (
    inputHash.length === storedHashBuffer.length &&
    timingSafeEqual(inputHash, storedHashBuffer)
  );
}
