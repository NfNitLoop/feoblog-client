// deno-lint-ignore-file prefer-const no-namespace

// This file only exists to help migrate code from the feoblog server's 
// embedded web UI to here. 
// TODO: Once this is the canonical implementation, clean this stuff up.

import { b58c, hex, nacl as crypto } from "./deps.ts";

// Yech, b58c doesn't have a sync decode.
import * as bs58c from "https://esm.sh/bs58check@2.1.2"

// This file serves as a shim to make it easy to copy/paste Client
// from: https://github.com/NfNitLoop/feoblog/blob/develop/web-client/ts/client.ts
// to here to keep things in sync.

// Initialize nacl functions. else: https://github.com/denosaurs/sodium/issues/2 🤦‍♂️
await crypto.ready


export function bytesToHex(bytes: Uint8Array): string {
    return hex.encodeToString(bytes)
}

export function encodeBase58(bytes: Uint8Array): string {
    return b58c.encodePlain(bytes)
}

export function decodeBase58(value: string): Uint8Array {
    return b58c.decodePlain(value)
}

export function decodeBase58Check(value: string): Uint8Array {
    return bs58c.decode(value)
}

export namespace nacl  {
    // deno-lint-ignore require-await
    export async function sign_detached_verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
        return crypto.crypto_sign_verify_detached(signature, message, publicKey)
    }

    export function sign_detached_verify_sync(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
        return crypto.crypto_sign_verify_detached(signature, message, publicKey)
    }
}

export namespace tweetnacl {
    export namespace sign {
        export function detached(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
            return crypto.crypto_sign_detached(message, secretKey)
        }

        export namespace keyPair {
            export function fromSeed(bytes: Uint8Array): tweetnacl.SignKeyPair {
                let pair = crypto.crypto_sign_seed_keypair(bytes)
                return {
                    publicKey: pair.publicKey,
                    secretKey: pair.privateKey,
                }

            }
        }
    }

    export interface SignKeyPair {
        publicKey: Uint8Array;
        secretKey: Uint8Array;
    }
}
