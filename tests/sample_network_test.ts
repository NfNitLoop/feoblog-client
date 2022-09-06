// deno-lint-ignore-file no-unused-vars prefer-const
import {Client, UserID, Signature, protobuf } from "../mod.ts"

import { assert, assertEquals } from "https://deno.land/std@0.154.0/testing/asserts.ts";


const OFFICIAL_FEOBLOG = UserID.fromString("A719rvsCkuN2SC5W2vz5hypDE2SpevNTUsEXrVFe9XQ7")
const FIRST_POST = Signature.fromString("2F6NB6PYKDTPGTc9dfaQHpmPzd3LSjVgBuC6qa2hcLUJA74LbZpV8wL5HoXDmvzyfZWaX6sLyg3DoGtqh3t2rJt5")
const FIRST_SERVER = "https://blog.nfnitloop.com"

Deno.test("fetching an item", async () => {
    let client = new Client({baseURL: FIRST_SERVER})

    let item = await client.getItem(OFFICIAL_FEOBLOG, FIRST_POST)
    assert(item != null)

    assertEquals(1611105596861, item.timestamp_ms_utc)

    let post = item.post
    assert(post != null)

    assertEquals("Hello, World!", post.title)

    let body = post.body
    assert(body != null)

    assert(body.includes("first post"))
    console.log("body", body)
})