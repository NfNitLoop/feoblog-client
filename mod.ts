
import * as pb from "./private/protobuf/feoblog.ts"
export { pb as protobuf }

import { b58c, hex, nacl } from "./private/deps.ts"

// Initialize nacl functions. else: https://github.com/denosaurs/sodium/issues/2 🤦‍♂️
await nacl.ready

// Servers must accept items up to this size:
const MAX_ITEM_SIZE = 32 * 1024 // 32KiB
// Some servers may increase max item size? Eh, we'll be lenient in what we accept
// Though, we do want to protect against trying to load absolutely massive ones in the browser:
const LENIENT_MAX_ITEM_SIZE = 1024 * 1024 // 1 MiB

// A basic client for talking to a FeoBlog server.
export class Client {
    baseURL: string

    constructor({baseURL}: Config) {
        this.baseURL = baseURL
    }

    async getItem(userID: UserID|string, signature: Signature|string, options?: GetItemOptions): Promise<pb.Item|null> {
        let bytes = await this.getItemBytes(userID, signature, options)
        if (bytes === null) return null
        return pb.Item.deserialize(bytes)
    }

    // Like getItem(), but returns the item bytes instead of a parsed Item.
    // This is useful if you need to ensure the signature remains valid for the Item. 
    // (ex: when copying Items to other servers)
    async getItemBytes(userID: UserID|string, signature: Signature|string, options?: GetItemOptions): Promise<Uint8Array|null> {
        
        // Perform validation of these before sending:
        if (typeof userID === "string") {
            userID = UserID.fromString(userID)
        }
        if (typeof signature === "string") {
            signature = Signature.fromString(signature)
        }

        let url = `${this.baseURL}/u/${userID}/i/${signature}/proto3`
        let response = await fetch(url)

        if (response.status == 404) { return null }

        if (!response.ok) {
            throw `${url} response error: ${response.status}: ${response.statusText}`
        }
        let lengthHeader = response.headers.get("content-length")
        if (lengthHeader === null) {
            throw `The server didn't return a length for ${url}`
        }
        let length = parseInt(lengthHeader)
        if (length > LENIENT_MAX_ITEM_SIZE) {
            throw `${url} returned ${length} bytes! (max supported is ${LENIENT_MAX_ITEM_SIZE})`
        }
        if (length == 0) {
            throw `Got 0 bytes`
        }

        let buf = await response.arrayBuffer()
        let bytes = new Uint8Array(buf)

        // Note: This is a bit expensive when we're bulk-loading items.
        // But, if we don't check them when we load them from the server, what's the
        // point of having the signatures?
        if (!options?.skipSignatureCheck) {
            if (!signature.isValid(userID,bytes)) {
                throw `Invalid signature for ${url}`
            }
        }

        return bytes
    }

    // paginating through an ItemList endpoint.
    async * getUserItems(userID: UserID): AsyncGenerator<pb.ItemListEntry> {
        let before: number|undefined = undefined
        while (true) {

            let list: pb.ItemList = await this.getItemList(`/u/${userID}/proto3`, {before})

            if (list.items.length == 0) {
                // There are no more items.
                return
            }
    
            for (let entry of list.items) yield entry
            
            if (list.no_more_items) {
                return
            }
    
            before = list.items[list.items.length - 1].timestamp_ms_utc
        }
    }

     // itemsPath: relative path to the thing that yields an ItemsList, ex: /homepage/proto3
    // params: Any HTTP GET params we might send to that path for pagination.
    private async getItemList(itemsPath: string, params?: Record<string,string|number|undefined>): Promise<pb.ItemList> {

        let url = this.baseURL + itemsPath
        if (params) {
            let sp = new URLSearchParams()
            for (let [key, value] of Object.entries(params)) {
                if (value === undefined) continue
                sp.set(key, value.toString())
            }
            url = `${url}?${sp}`
        }

        let response = await fetch(url)
        if (!response.ok) {
            console.error(`non-OK response from ${url}`, response)
            throw `Invalid response: ${response.status}: ${response.statusText}`
        }

        let buf = await response.arrayBuffer()
        let bytes = new Uint8Array(buf)
        return pb.ItemList.deserialize(bytes)
    }

    // Write an item to the server.
    // This assumes you have provided a valid userID & signature for the given bytes.
    // (The receiving server will check it, though!)
    async putItem(userID: UserID, signature: Signature, bytes: Uint8Array): Promise<Response> {
    
        let url = `${this.baseURL}/u/${userID}/i/${signature}/proto3`
        
        let response: Response
        try {
            response = await fetch(url, {
                method: "PUT",
                body: bytes,
            })
            if (!response.ok) {
                throw `Error uploading Item: ${response.status} ${response.statusText}`
            }

        } catch (e) {
            console.error("PUT exception:", e)
            throw e
        }

        return response
    }
}

export type GetItemOptions = {
    // When syncing items from one server to another, the receiving server MUST 
    // perform the verificiation, so verifying in the client is redundant and slow.
    // Set this flag to skip it.
    skipSignatureCheck?: boolean
}


export type Config = {
    // The base URL of the server. Ex:  "https://blog.example.com:443/"
    baseURL: string
}

const USER_ID_BYTES = 32;
const SIGNATURE_BYTES = 64;
const SEED_BYTES = 32;

// The number of bytes if we base64-decode without checksum:
const PASSWORD_BYTES = SEED_BYTES + 4 // 4 bytes b58 checksum.


export class UserID {
    readonly bytes: Uint8Array
    // These almost always get turned into strings
    // Just save one to save from repeated allocations:
    private asString: string

    toString(): string {
        return b58c.encodePlain(this.bytes)
    }

    // A hex representation of the bytes:
    toHex(): string {
        return hex.encodeToString(this.bytes)
    }

    static fromString(userID: string): UserID {
        if (userID.length == 0) {
            throw "UserID must not be empty."
        }
    
        let buf: Uint8Array;
        try {
            buf = b58c.decodePlain(userID)
        } catch (_error) {
            throw "UserID not valid base58"
        }
    
        UserID.validateBytes(buf)
        return new UserID(buf, userID)
    }

    private static validateBytes(bytes: Uint8Array) {
        if (bytes.length < USER_ID_BYTES) {
            throw "UserID too short"
        }
    
        if (bytes.length == PASSWORD_BYTES) {
            throw "UserID too long. (This may be a paswword!?)"
        }
    
        if (bytes.length > USER_ID_BYTES) {
            throw "UserID too long."
        }
    }

    static fromBytes(bytes: Uint8Array): UserID {
        UserID.validateBytes(bytes)
        return new UserID(bytes, b58c.encodePlain(bytes))
    }

    private constructor(bytes: Uint8Array, asString: string) {
        this.bytes = bytes
        this.asString = asString
    }
}

export class Signature {
    readonly bytes: Uint8Array

    toString(): string {
        return b58c.encodePlain(this.bytes)
    }

    isValid(userID: UserID, bytes: Uint8Array): boolean {
        return nacl.crypto_sign_verify_detached(this.bytes, bytes, userID.bytes)
    }

    static fromString(userID: string): Signature {
        if (userID.length == 0) {
            throw "Signature must not be empty."
        }
    
        let buf: Uint8Array;
        try {
            buf = b58c.decodePlain(userID)
        } catch (error) {
            throw "Signature not valid base58"
        }
    
        return Signature.fromBytes(buf)
    }

    static fromBytes(bytes: Uint8Array): Signature {
        if (bytes.length < SIGNATURE_BYTES) {
            throw "Signature too short"
        }
    
        if (bytes.length > SIGNATURE_BYTES) {
            throw "Signature too long."
        }
    
        return new Signature(bytes)
    }

    private constructor(bytes: Uint8Array) {
        this.bytes = bytes
    }
}

// Private keys are stored as base58check-encoded strings.
// You should keep a PrivateKey in memory for as short a time as possible.
export class PrivateKey
{
    private seedBytes: Uint8Array
    private privateKeyBytes: Uint8Array

    // The public key/ID corresponding to this PrivateKey
    readonly userID: UserID

    private constructor(seedBytes: Uint8Array) {
        if (seedBytes.length != SEED_BYTES) {
            throw `PrivateKey expected ${SEED_BYTES} but got ${seedBytes.length}`
        }

        this.seedBytes = seedBytes

        let keypair = nacl.crypto_sign_seed_keypair(seedBytes)
        this.userID = UserID.fromBytes(keypair.publicKey)
        this.privateKeyBytes = keypair.privateKey 
    }

    static fromBytes(seedBytes: Uint8Array): PrivateKey {
        return new PrivateKey(seedBytes)
    }

    // construct from a base58check-encoded string.
    static async fromString(checkedString: string): Promise<PrivateKey> { 
        try {
            return PrivateKey.fromBytes(await b58c.decode(checkedString))
        } catch (error) {
            throw `Invalid private key: ${error}`
        }
    }

    sign(messageBytes: Uint8Array): Signature {
        let sigBytes = nacl.crypto_sign_detached(messageBytes, this.privateKeyBytes)
        return Signature.fromBytes(sigBytes)
    }

    // TODO: generate()
}

