export * as hex from "https://deno.land/std@0.100.0/encoding/hex.ts"
export { default as nacl } from "https://deno.land/x/sodium@0.2.0/basic.ts"

// // TODO:  This works, but requires --unstable. Blech.
// // bs58check uses Buffer, so we need Node compatibility:
// import { createRequire } from "https://deno.land/std@0.100.0/node/module.ts";
// const require = createRequire(import.meta.url);
// export { default as bs58check } from "https://cdn.skypack.dev/bs58check@2.1.2"


// export * as b58c from "../../noble-base58check/mod.ts"
// TODO: Use a deno.land version once this issues is fixed:
//       https://github.com/serh11p/noble-base58check/issues/1
export * as b58c from "https://www.nfnitloop.com/deno/noble-base58check/mod.ts"


// See: https://github.com/serh11p/noble-base58check/issues/1