// This file only existed to help migrate code from the feoblog server's 
// embedded web UI to here. 
// TODO: Once this is the canonical implementation, clean this stuff up.

// UserIDs can also be displayed as hex:
import * as hex from "@std/encoding/hex"

import bs58c from "bs58check"
import bs58 from "bs58"



export function bytesToHex(bytes: Uint8Array): string {
    return hex.encodeHex(bytes)
}

export function encodeBase58(bytes: Uint8Array): string {
    return bs58.encode(bytes)
}

export function decodeBase58(value: string): Uint8Array {
    return bs58.decode(value)
}

export function decodeBase58Check(value: string): Uint8Array {
    return bs58c.decode(value)
}

export function encodeBase58Check(value: Uint8Array): string {
    return bs58c.encode(value)
}