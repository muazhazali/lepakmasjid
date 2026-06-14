import { customAlphabet } from "nanoid";

/** PocketBase-compatible 15-char IDs */
export const newId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  15
);