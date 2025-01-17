// deno-lint-ignore-file prefer-const


import { Item, ItemList, type ItemListEntry, fromBinary, ItemSchema, ItemListSchema} from "./protobuf/types.ts";
import { bytesToHex, decodeBase58, decodeBase58Check, encodeBase58, encodeBase58Check } from "./shim.ts";
import * as ed from "@noble/ed25519"
import {sha512} from "@noble/hashes/sha512"

// enable sync operations in ed.*:
// See: https://github.com/paulmillr/noble-ed25519
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m))

/**
 * A client to GET/PUT FeoBlog Items.
 * 
 * {@link https://github.com/nfnitloop/feoblog}
 * {@link https://github.com/NfNitLoop/feoblog/blob/develop/docs/data_format.md}
 * 
 * 
 * A client takes a base_url parameter and knows how to construct REST URLs based off of that.
 * To communicate among 2+ servers, instantiate a client for each server.
 */
 export class Client {

    private base_url: string;

    constructor(config: Config) {
        this.base_url = config.base_url
    }

    /** The URL of the API server that this client will fetch from. */
    get url(): string {
        return this.base_url
    }

    /**
     * Load an Item from the server, if it exists.
     * 
     * By default, validates the signature of the Item before returning it.
     */
    async getItem(userID: UserID|string, signature: Signature|string, options?: GetItemOptions): Promise<Item|null> {
        let bytes = await this.getItemBytes(userID, signature, options)
        if (bytes === null) return null
        return fromBinary(ItemSchema, bytes)
    }

    /** Like {@link getItem}, but returns the item bytes so that the signature remains valid over the (serialized) bytes. */
    async getItemBytes(userID: UserID|string, signature: Signature|string, options?: GetItemOptions): Promise<Uint8Array|null> {
        
        // Perform validation of these before sending:
        if (typeof userID === "string") {
            userID = UserID.fromString(userID)
        }
        if (typeof signature === "string") {
            signature = Signature.fromString(signature)
        }

        let url = `${this.base_url}/u/${userID}/i/${signature}/proto3`
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
            if (!await signature.isValid(userID, bytes)) {
                throw `Invalid signature for ${url}`
            }
        }

        return bytes
    }

    /**
     * Write an item to the server.
     * This assumes you have provided a valid userID & signature for the given bytes.
     * (The receiving server will check it, though!)
     */
    async putItem(userID: UserID, signature: Signature, bytes: Uint8Array): Promise<Response> {
    
        let url = `${this.base_url}/u/${userID}/i/${signature}/proto3`
        
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

    /**
     * After you putItem() an item that has {@link Attachments}, the server may allow you to upload the attachments
     * (if they do not violate your quota)
     */
    async putAttachment(userID: UserID, signature: Signature, fileName: string, blob: Blob): Promise<void> {
        // If the file is already in the content store, we can save some bandwidth/time:
        if (blob.size > SMALL_FILE_THRESHOLD) {
            const {exists} = await this.getAttachmentMeta(userID, signature, fileName)
            if (exists) return
        }

        let url = this.attachmentURL(userID, signature, fileName)
        let response: Response
        try {
            response = await fetch(url, {
                method: "PUT",
                body: blob,
            })
            if (!response.ok) {
                throw `Error uploading attachment "${fileName}": ${response.status} ${response.statusText}`
            }

        } catch (e) {
            const {exists} = await this.getAttachmentMeta(userID, signature, fileName)
            if (exists) return // Someone beat us to the upload, everything's OK.
            // else:
            throw e
        }
    }

    private attachmentURL(userID: UserID, signature: Signature, fileName: string) {
        return `${this.base_url}/u/${userID}/i/${signature}/files/${fileName}`
    }

    /**
     * Get metadata a server has about an attachment.
     */
    async getAttachmentMeta(userID: UserID, signature: Signature, fileName: string): Promise<AttachmentMeta> {
        let url = this.attachmentURL(userID, signature, fileName)
        let response = await fetch(url, {
            method: "HEAD",
        })

        let exists = false
        if (response.status == 200) {
            exists = true
        } else if (response.status != 404) {
            throw `Unexpected response status: ${response.status}: ${response.statusText}`
        }

        let exceedsQuota = response.headers.get("X-FB-Quota-Exceeded") == "1"

        return { exists, exceedsQuota }
    }

    /**
     * Download an attachment from a server, if it exists.
     * 
     * Warning: stores the attachment in memory. 
     */
    // TODO: Have attachment-meta get the file size?  max file size here? streaming option?
    async getAttachment(userID: UserID, signature: Signature, fileName: string): Promise<ArrayBuffer|null> {
        let url = this.attachmentURL(userID, signature, fileName)
        let response = await fetch(url)
        if (response.status == 404) {
            return null
        }
        if (!response.ok) {
            throw `Error: ${response.status}: ${response.statusText}`
        }
        return await response.arrayBuffer()
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

        let url = `${this.base_url}/u/${userID}/profile/proto3`
        let response = await fetch(url)

        if (response.status == 404) { return null }

        if (!response.ok) {
            throw `${url} response error: ${response.status}: ${response.statusText}`
        }
        let lengthHeader = response.headers.get("content-length")
        if (lengthHeader === null) {
            console.log("response:", response)
            throw `The server didn't return a length for ${url}`
        }
        let length = parseInt(lengthHeader)
        if (length > LENIENT_MAX_ITEM_SIZE) {
            throw `${url} returned ${length} bytes! (max supported is ${LENIENT_MAX_ITEM_SIZE})`
        }
        if (length == 0) {
            throw `Got 0 bytes`
        }

        let sigHeader = response.headers.get("signature")
        if (sigHeader === null || sigHeader === "") {
            throw `The server did not return a signature for ${url}`
        }
        let signature = Signature.fromString(sigHeader)

        let buf = await response.arrayBuffer()
        let bytes = new Uint8Array(buf)

        if (!await signature.isValid(userID, bytes)) {
            throw `Invalid signature for ${url}`
        }

        let item: Item
        try {
            item = fromBinary(ItemSchema, bytes)
        } catch (exception) {
            throw `Error deserializing ${url}: ${exception}`
        }
        if (item.itemType.case != "profile") {
            throw `Server returned an Item for ${url} that is not a Profile.`
        }
        return {item, signature, bytes}
    }

    /**
     * An async stream over items on the site's home page.
     */
    async * getHomepageItems(params?: ItemOffsetParams): AsyncGenerator<ItemListEntry> {
        yield* this.streamItemList("/homepage/proto3", params)
    }

    /**
     * An async stream over a user's feed. (i.e.: content of those they follow, and themself)
     */
    async * getUserFeedItems(userID: UserID, params?: ItemOffsetParams): AsyncGenerator<ItemListEntry> {
        yield* this.streamItemList(`/u/${userID}/feed/proto3`, params)
    }

    /**
     * An async stream over a users's Items.
     */
    async * getUserItems(userID: UserID, params?: ItemOffsetParams): AsyncGenerator<ItemListEntry> {
        yield* this.streamItemList(`/u/${userID}/proto3`, params)
    }

    /**
     * An async stream of all known replies to an item.
     */
    async * getReplyItems(userID: UserID, signature: Signature): AsyncGenerator<ItemListEntry> {
        yield* this.streamItemList(`/u/${userID}/i/${signature}/replies/proto3`)
    }

    private async * streamItemList(url: string, params?: ItemOffsetParams): AsyncGenerator<ItemListEntry> {
        let offset = {...params}
        let isBefore = typeof(offset.after) != "number"

        while (true) {

            let list: ItemList = await this.getItemList(url, offset)
            if (!isBefore) {
                /// We want to iterate in chronological order for this case, but ItemList is defined to be
                /// in reverse chronological order. Reverse it:
                list.items.reverse()
            }

            if (list.items.length == 0) {
                // There are no more items.
                return
            }
    
            for (let entry of list.items) yield entry
            
            if (list.noMoreItems) {
                return
            }
    
            let lastTimestamp = list.items[list.items.length - 1].timestampMsUtc
            // TODO: Also include last signature.

            if (isBefore) {
                offset.before = Number(lastTimestamp)
            } else {
                offset.after = Number(lastTimestamp)
            }
        }
    }

    // itemsPath: relative path to the thing that yields an ItemsList, ex: /homepage/proto3
    // params: Any HTTP GET params we might send to that path for pagination.
    private async getItemList(itemsPath: string, params?: ItemOffsetParams): Promise<ItemList> {

        let url = this.base_url + itemsPath
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
        return fromBinary(ItemListSchema, bytes)
    }
}

/**
 * Specifies an offset from which to start streaming items.
 * 
 * Note: Currently, you should only specify `before` XOR `after`.
 */
// TODO: Remove the above restriction.
export interface ItemOffsetParams {
    /** timestamp in ms utc before which we want to query for items */
    before?: number

    /** 
     * timestamp in ms utc after which we want to query for items 
     * 
     * Note: server still returns items in batches that are reverse-chronologically ordered
     */
    after?: number

    // TODO: add signature for a full ordering.
}

export type AttachmentMeta = {
    /** The attachment already exists at the target location. */
    exists: boolean,
    /** Sending the attachment would exceed the user's quota */
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
 * Return the signature w/ the Item
 */
export interface ProfileResult {
    item: Item
    signature: Signature
    bytes: Uint8Array
}

export interface Config {
    /**
     * The base URL of a feoblog server.
     * 
     * Ex: base_url = "https://fb.example.com:8080". or "" for this server.
     */
    base_url: string
}

/**
 * UserIDs in FeoBlog are NaCL signing keys.
 * 
 * See: {@link https://github.com/NfNitLoop/feoblog/blob/develop/docs/crypto.md}
 */
export class UserID {
    toString(): string {
        return this.asBase58
    }

    // A hex representation of the bytes:
    toHex(): string {
        return bytesToHex(this.bytes)
    }

    static fromString(userID: string): UserID {
        let valType = typeof(userID)
        if (valType !== "string") {
            throw new Error(`invalid userID string of type ${valType}`)
        }
        if (userID.length == 0) {
            throw new Error("UserID must not be empty.")
        }
    
        let buf: Uint8Array;
        try {
            buf = decodeBase58(userID)
        } catch (cause) {
            throw new Error("UserID not valid base58", {cause})
        }
    
        UserID.validateBytes(buf)
        return new UserID(buf, userID)
    }


    static tryFromString(userID: string): UserID|null {
        try {
            return UserID.fromString(userID)
        } catch (_error) {
            return null
        }
    }

    private static validateBytes(bytes: Uint8Array) {
        if (bytes.length < USER_ID_BYTES) {
            throw "UserID too short"
        }
    
        if (bytes.length == PASSWORD_BYTES) {
            throw "UserID too long. (This may be a password!?)"
        }
    
        if (bytes.length > USER_ID_BYTES) {
            throw "UserID too long."
        }
    }

    static fromBytes(bytes: Uint8Array): UserID {
        UserID.validateBytes(bytes)
        return new UserID(bytes, encodeBase58(bytes))
    }

    private constructor(readonly bytes: Uint8Array, readonly asBase58: string) { }
}

/**
 * A detached NaCL signature over an Item.
 * 
 * See: {@link https://github.com/NfNitLoop/feoblog/blob/develop/docs/crypto.md}
 */
export class Signature {
    readonly bytes: Uint8Array

    toString(): string {
        return this.asBase58
    }

    // Check that a signature is valid.
    // deno-lint-ignore require-await
    async isValid(userID: UserID, bytes: Uint8Array): Promise<boolean> {
        return this.isValidSync(userID, bytes)
    }

    isValidSync(userID: UserID, bytes: Uint8Array): boolean {
        return ed.verify(this.bytes, bytes, userID.bytes)
    }

    static fromString(signature: string): Signature {
        if (signature.length == 0) {
            throw "Signature must not be empty."
        }
    
        let buf: Uint8Array;
        try {
            buf = decodeBase58(signature)
        } catch (_error) {
            throw "Signature not valid base58"
        }
    
        return Signature.fromBytes(buf)
    }

    static tryFromString(userID: string): Signature|null {
        try {
            return Signature.fromString(userID)
        } catch {
            return null
        }
    }

    static fromBytes(bytes: Uint8Array): Signature {
        if (bytes.length < SIGNATURE_BYTES) {
            throw new Error("Signature too short")
        }
    
        if (bytes.length > SIGNATURE_BYTES) {
            throw new Error("Signature too long.")
        }
    
        return new Signature(bytes, encodeBase58(bytes))
    }

    private constructor(bytes: Uint8Array, readonly asBase58: string) {
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
export class PrivateKey {

    static fromBase58(privateKey: string): PrivateKey {

        // Error to display about the private key:
        let buf: Uint8Array;
        try {
            buf = decodeBase58(privateKey)
        } catch (_error) {
            throw "Not valid base58"
        }

        // Secret is 32 bytes, + 4 for checked base58.
        if (buf.length < 36) {
            throw "Key is too short."
        }
        if (buf.length > 36) {
            throw "Key is too long."
        }

        try {
            buf = decodeBase58Check(privateKey)
        } catch (_error) {
            throw "Invalid Key"
        }

        return PrivateKey.fromBytes(buf)
    }

    /**
     * Create a new, random Private Key. (and its associated public key, aka UserID.)
     */
    static createNew(): PrivateKey {
        return PrivateKey.fromBytes(ed.utils.randomPrivateKey())
    }

    private static fromBytes(bytes: Uint8Array): PrivateKey {
        return new PrivateKey(bytes)
    }

    readonly userID: UserID;
    readonly asBase58: string
    #private: Uint8Array

    private constructor(bytes: Uint8Array) {
        this.#private = bytes
        this.userID = UserID.fromBytes(ed.getPublicKey(bytes))
        this.asBase58 = encodeBase58Check(bytes)
    }

    /**
     * @deprecated use sign() instead.
     */
    signDetached(message: Uint8Array): Uint8Array {
        return ed.sign(message, this.#private)
    }

    /** Create a detached signature over a given message */
    sign(message: Uint8Array): Signature {
        return Signature.fromBytes(ed.sign(message, this.#private))
    }
           
}

const USER_ID_BYTES = 32;
const SIGNATURE_BYTES = 64;
const PASSWORD_BYTES = USER_ID_BYTES + 4 // 4 bytes b58 checksum.

// const MAX_ITEM_SIZE = 32 * 1024 // 32KiB
// Some servers may increase max item size? Eh, we'll be lenient in what we accept
// Though, we do want to protect against trying to load absolutely massive ones in the browser:
const LENIENT_MAX_ITEM_SIZE = 1024 * 1024 // 1 MiB

// Before sending files larger than this, we should check whether they exist:
const SMALL_FILE_THRESHOLD = 1024 * 128

