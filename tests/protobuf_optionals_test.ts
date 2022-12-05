// deno-lint-ignore-file prefer-const require-await
import { assert } from "https://deno.land/std@0.154.0/testing/asserts.ts";
import { protobuf } from "../mod.ts"
import { Follow } from "../private/protobuf/feoblog.ts";

// Yay, optional values are supported AND properly typed. <3
Deno.test("optional values", async () => {
    let follow = new protobuf.Follow()
    assert(!hasGroup(follow.toBinary()))

    follow.followGroup = 0
    assert(hasGroup(follow.toBinary()))
})

function hasGroup(follow: Uint8Array) {
    let f = Follow.fromBinary(follow)
    return typeof(f.followGroup) == "number"
}
