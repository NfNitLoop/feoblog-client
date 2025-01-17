import { AttachmentHash } from "../src/mod.ts";
import { assertEquals } from "@std/assert/equals";

Deno.test(function hashing() {
    const testMessage = encoder.encode("Hello, world!")
    const hash = AttachmentHash.fromBytes(testMessage)
    assertEquals(hash.asHex, "c1527cd893c124773d811911970c8fe6e857d6df5dc9226bd8a160614c0cd963a4ddea2b94bb7d36021ef9d865d5cea294a82dd49a0bb269f51f6e7a57f79421")
})

const encoder = new TextEncoder()