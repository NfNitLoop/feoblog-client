
import * as pb from "./private/protobuf/feoblog.ts"
export { pb as protobuf }

import { b58c, hex, nacl } from "./private/deps.ts"

// Initialize nacl functions. else: https://github.com/denosaurs/sodium/issues/2 🤦‍♂️
await nacl.ready

/**
 * Servers must accept items up to this size.
 */
export const MINIMUM_MAX_ITEM_SIZE = 32 * 1024 // 32KiB

// Some servers may increase max item size? Eh, we'll be lenient in what we accept
// Though, we do want to protect against trying to load absolutely massive ones in the browser:
const LENIENT_MAX_ITEM_SIZE = 1024 * 1024 // 1 MiB

// Before sending files larger than this, we should check whether they exist:
const SMALL_FILE_THRESHOLD = 1024 * 128

/**
 * A basic client for talking to a FeoBlog server.
 * 
 * {@link https://github.com/nfnitloop/feoblog}
 */
export class Client {
    baseURL: string

    constructor({baseURL}: Config) {
        this.baseURL = baseURL
    }

    /**
     * Get a single Item from a FeoBlog server.
     * @param userID 
     * @param signature 
     * @param options 
     * @returns 
     */
    async getItem(userID: UserID|string, signature: Signature|string, options?: GetItemOptions): Promise<pb.Item|null> {
        let bytes = await this.getItemBytes(userID, signature, options)
        if (bytes === null) return null
        return pb.Item.deserialize(bytes)
    }

    /** 
     * Like {@link getItem}, but returns the item bytes instead of a parsed Item.
     * This is useful if you need to ensure the signature remains valid for the Item. 
     * (ex: when copying Items to other servers)
     */
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

    /**
     * Paginate through a user's items.
     * Handles making multiple server requests for you as needed.
     */
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
            const sp = new URLSearchParams()
            for (const [key, value] of Object.entries(params)) {
                if (value === undefined) continue
                sp.set(key, value.toString())
            }
            url = `${url}?${sp}`
        }

        const response = await fetch(url)
        if (!response.ok) {
            console.error(`non-OK response from ${url}`, response)
            throw `Invalid response: ${response.status}: ${response.statusText}`
        }

        const buf = await response.arrayBuffer()
        const bytes = new Uint8Array(buf)
        return pb.ItemList.deserialize(bytes)
    }

    /**
     * Write an item to the server.
     * This assumes you have provided a valid userID & signature for the given bytes.
     * (The receiving server will check it, though!)
     */
    async putItem(userID: UserID, signature: Signature, bytes: Uint8Array): Promise<void> {
        const url = `${this.baseURL}/u/${userID}/i/${signature}/proto3`
        
        const response: Response = await fetch(url, {
            method: "PUT",
            body: bytes,
        })
        if (!response.ok) {
            throw `Error uploading Item: ${response.status} ${response.statusText}`
        }
    }

    async putAttachment(userID: UserID, signature: Signature, fileName: string, fileSize: number, reader: BodyInit): Promise<void> {
        // If the file is large, try saving some bandwidth if we can:
        if (fileSize > SMALL_FILE_THRESHOLD) {
            const { exists } = await this.getAttachmentMeta(userID, signature, fileName)
            if (exists) {
                // console.log("Attachment exists")
                // The file already exists in the content-store.
                return
            }
        }

        const url = this.attachmentURL(userID, signature, fileName)
        let response
        try {
            response = await fetch(url, {
                method: "PUT", 
                headers: {
                    "Content-Length": `${fileSize}`
                },
                body: reader,
            })
        } catch (error) {
            if (error instanceof TypeError) {
                const { exists } = await this.getAttachmentMeta(userID, signature, fileName)
                if (exists) {
                    // console.log("recovered from TypeError. Attachment exists")
                    // Consider our upload a success:
                    return
                }
            }
            throw error
        }

        if (!response.ok) {
            throw `Error uploading attachment ${fileName}: ${response.status} ${response.statusText}`
        }
    }

    private attachmentURL(userID: UserID, signature: Signature, fileName: string) {
        return `${this.baseURL}/u/${userID}/i/${signature}/files/${fileName}`
    }

    async getAttachmentMeta(userID: UserID, signature: Signature, fileName: string): Promise<AttachmentMeta> {
        const url = this.attachmentURL(userID, signature, fileName)
        const response = await fetch(url, {
            method: "HEAD",
        })

        let exists = false
        if (response.status == 200) {
            exists = true
        } else if (response.status != 404) {
            throw `Unexpected response status: ${response.status}: ${response.statusText}`
        }

        const exceedsQuota = response.headers.get("X-FB-Quota-Exceeded") == "1"

        return { exists, exceedsQuota }
    }

    /** 
     * Like {@link getItem}, but just gets the latest profile that a server knows about for a given user ID.
     * The signature is returned in a header from the server. This function verifies that signature
     * before returning the Item.
     * We also verify that the Item has a Profile.
     */
    async getProfile(userID: UserID|string): Promise<ProfileResult|null> {
        
        // Perform validation of these before sending:
        if (typeof userID === "string") {
            userID = UserID.fromString(userID)
        }

        const url = `${this.baseURL}/u/${userID}/profile/proto3`
        const response = await fetch(url)

        if (response.status == 404) { return null }

        if (!response.ok) {
            throw `${url} response error: ${response.status}: ${response.statusText}`
        }
        const lengthHeader = response.headers.get("content-length")
        if (lengthHeader === null) {
            console.log("response:", response)
            throw `The server didn't return a length for ${url}`
        }
        const length = parseInt(lengthHeader)
        if (length > LENIENT_MAX_ITEM_SIZE) {
            throw `${url} returned ${length} bytes! (max supported is ${LENIENT_MAX_ITEM_SIZE})`
        }
        if (length == 0) {
            throw `Got 0 bytes`
        }

        const sigHeader = response.headers.get("signature")
        if (sigHeader === null || sigHeader === "") {
            throw `The server did not return a signature for ${url}`
        }
        const signature = Signature.fromString(sigHeader)

        const buf = await response.arrayBuffer()
        const bytes = new Uint8Array(buf)

        if (!await signature.isValid(userID, bytes)) {
            throw `Invalid signature for ${url}`
        }

        let item: pb.Item
        try {
            item = pb.Item.deserialize(bytes)
        } catch (exception) {
            throw `Error deserializing ${url}: ${exception}`
        }
        if (item.profile === null) {
            throw `Server returned an Item for ${url} that is not a Profile.`
        }
        return {item, signature, bytes}
    }
}

export type AttachmentMeta = {
    // The attachment already exists at the target location.
    exists: boolean,
    // Sending the attachment would exceed the user's quota:
    exceedsQuota: boolean,
}

export type GetItemOptions = {
    /**
     * Usually, you want to check the signatures of Items you retrieve to make sure they
     * haven't been tampered with. But sometimes that can be redundant. In those cases,
     * you can opt to skip the check.
     */
    skipSignatureCheck?: boolean
}

/**
 * When we load a profile, we don't know its signature until it's loaded.
 * Return the signature w/ the Item:
 */
export interface ProfileResult {
    item: pb.Item
    signature: Signature
    bytes: Uint8Array
}


export type Config = {
    /**
     * The base URL of a FeoBlog server. Ex:  "https://blog.example.com:443/"
     */
    baseURL: string
}

const USER_ID_BYTES = 32;
const SIGNATURE_BYTES = 64;
const SEED_BYTES = 32;

// The number of bytes if we base64-decode without checksum:
const PASSWORD_BYTES = SEED_BYTES + 4 // 4 bytes b58 checksum.

/**
 * UserIDs in FeoBlog are NaCL signing keys.
 * 
 * See: {@link https://github.com/NfNitLoop/feoblog/blob/develop/docs/crypto.md}
 */
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

/**
 * A detached NaCL signature over an Item.
 * 
 * See: {@link https://github.com/NfNitLoop/feoblog/blob/develop/docs/crypto.md}
 */
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

/**
 * Private keys are stored as base58check-encoded strings.
 * They are only necessary to sign new pieces of content.
 * You should keep a PrivateKey in memory for as short a time as possible.
 * 
 * See: {@link https://github.com/NfNitLoop/feoblog/blob/develop/docs/crypto.md}
 */
export class PrivateKey
{
    private seedBytes: Uint8Array
    private privateKeyBytes: Uint8Array

    /**
     * The public key/ID corresponding to this PrivateKey
     *
     * (The userID can be derived from the base58check-encoded "password", which
     * is the seed used to generate a NaCL pub/priv signing keypair.)
     */
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

    /**
     * construct from a base58check-encoded string.
     */
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

