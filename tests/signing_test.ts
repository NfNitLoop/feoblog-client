import { assert } from "@std/assert/assert";
import { PrivateKey } from "../src/mod.ts";

Deno.test(function signing() {
    const privKey = PrivateKey.createNew()
    const testMessage = encoder.encode("Hello, world!")
    const sig = privKey.sign(testMessage)
    assert(sig.isValidSync(privKey.userID, testMessage), "message should be initially valid")

    testMessage[0] += 1
    assert(!sig.isValidSync(privKey.userID, testMessage), "signature should be invalid")
})

const encoder = new TextEncoder()