
// UserIDs, Signatures, and PrivateKeys are represented in base58(check):
export * as b58c from "https://deno.land/x/base58check@v0.1.4/mod.ts"

// UserIDs can also be displayed as hex:
export * as hex from "https://deno.land/std@0.100.0/encoding/hex.ts"

// Used for signing/verifying Item metadata.
export {default as nacl } from "https://esm.sh/libsodium-wrappers@0.7.10";
// TODO: Why am I using this over tweetnacl, again?