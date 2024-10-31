// deno-lint-ignore-file prefer-const require-await
import { assert } from "jsr:@std/assert@1";
import * as pb from "../src/protobuf/types.ts";

// Yay, optional values are supported AND properly typed. <3
Deno.test("optional values", async () => {
    let follow = pb.create(pb.FollowSchema)
    assert(!hasGroup(pb.toBinary(pb.FollowSchema, follow)))

    follow.followGroup = 0
    assert(hasGroup(pb.toBinary(pb.FollowSchema, follow)))
})

function hasGroup(follow: Uint8Array) {
    let f = pb.fromBinary(pb.FollowSchema, follow)
    return typeof(f.followGroup) === "number"
}
