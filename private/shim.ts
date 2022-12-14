// This file only existed to help migrate code from the feoblog server's 
// embedded web UI to here. 
// TODO: Once this is the canonical implementation, clean this stuff up.

import { b58c, hex } from "./deps.ts";

// Yech, b58c doesn't have a sync decode.
import * as bs58c from "https://esm.sh/bs58check@2.1.2"



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