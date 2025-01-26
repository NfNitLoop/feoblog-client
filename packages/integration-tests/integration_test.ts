import { Server } from "./helper.ts";
import { PrivateKey, Signature } from "@diskuto/client"
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert"

const BIN = "bin/diskuto"

Deno.test(async function integration(t) {
    await using server = new Server({binary: BIN})
    await server.start()
    assertEquals(server.status, "running")

    await t.step("new server has empty homepage", async () => {
        const items = await server.homepage()
        assertEquals(items, [], "No content on the home page yet.")    
    })


    const user1 = PrivateKey.createNew()
    const post1 = "Here's my post!"
    await t.step("Unknown user1 can't post.", async () => {
        const caught = await assertRejects(async () => {
            await server.post(user1, post1)
        })    
        assertStringIncludes(`${caught}`, "403 Forbidden", "Deny posting from unknown users.")
    })

    await t.step(`"Server user" can post`, async () => {
        await server.addUser(user1.userID, {onHomepage: true})
        await server.post(user1, post1)
        const items = await server.homepage()
        assertEquals(items.length, 1, "User should be able to post to the homepage.")    
    })


    const user2 = PrivateKey.createNew()
    const post2 = "I am a new and interesting user."
    await t.step("Unknown user2 can't post", async () => {
        await assertRejects(async () => {
            await server.post(user2, post2)
        })
    })

    await t.step("User followed by a known user can post.", async () => {
        await server.addFollow(user1, {follow: user2.userID})
        await server.post(user2, post2)
        const items = await server.homepage()
        assertEquals(items.length, 1, "user2's posts don't appear on the homepage")

        const posts = await server.posts(user2.userID)
        assertEquals(posts.length, 1, "User post was accepted")

        const sig = Signature.fromBytes(posts[0].signature!.bytes)
        const item = await server.client.getItem(user2.userID, sig, {skipSignatureCheck: false})
        assert(item != null)

        assert(item.itemType.case == "post")
        const post = item.itemType.value 
        assertEquals(post.body, post2)
    })

    // TODO: attachments. get & put
    // TODO: get attachments meta.
    // TODO: get user feed items
    // TODO: getReplyItems.

})

