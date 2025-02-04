[![JSR Version]][JSR Link]

Diskuto API Client
==================

A TypeScript/JavaScript API client for [Diskuto REST API].

Example
-------

Here's an example from [this blog post][1] of how to fetch and validate an `Item`
using this API client:

```typescript
#!/usr/bin/env -S deno run --check -EN

const baseUrl = `https://blog.nfnitloop.com`
const userID = `A719rvsCkuN2SC5W2vz5hypDE2SpevNTUsEXrVFe9XQ7`
const signature = `4sVxU7pVvUenEdG41BYJDZJfDBZBjBkLSF7dcGzpGMgtVLbZjTh6w5LzC4Rwjkk5SNyn57o3cfsvEbsZJkFELaW3`

// Given these three things, we can validate that the content on the page
// was in fact created by that user, and has not been modified.

import {Client, Signature, UserID} from "jsr:@diskuto/client@0.10.0"
const client = new Client({baseUrl})

const bytes = await client.getItemBytes(userID, signature)
if (bytes == null) {
    throw new Error(`No such item on this server.`)
}

// Some helper types for working with cryptography:
const uid = UserID.fromString(userID)
const sig = Signature.fromString(signature)

const valid = await sig.isValid(uid, bytes)
if (!valid) {
    throw new Error(`Invalid signature!`)
}

// OK, we have a valid signature for ... some bytes. But is that what's on the page?
// We'll need to inspect the contents of those bytes to verify that the server isn't 
// misrepresenting them:
import { fromBinary, ItemSchema } from "jsr:@diskuto/client/types";
const item = fromBinary(ItemSchema, bytes)
console.log(item)
```


[Diskuto REST API]: https://github.com/diskuto/diskuto-api/tree/main/docs/rest_api
[1]: https://blog.nfnitloop.com/u/A719rvsCkuN2SC5W2vz5hypDE2SpevNTUsEXrVFe9XQ7/i/33QiHdeD3sSiB5mWwSBJhpkjQEystr4nx9W8FFWWM1oWfCFMfDHpYuKMGJ6v8kmf2pHnnhL67Reg14jGRVoTyJ7Z/
[JSR Version]: https://jsr.io/badges/@diskuto/client
[JSR Link]: https://jsr.io/@diskuto/client