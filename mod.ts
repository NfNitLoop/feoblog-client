
import * as protobuf from "./private/protobuf/feoblog_pb.js"
export { protobuf }

import { b58c, hex, nacl } from "./private/deps.ts"

// Initialize nacl functions. else: https://github.com/denosaurs/sodium/issues/2 🤦‍♂️
await nacl.ready

// A basic client for talking to a FeoBlog server.
export class Client {
    baseURL: string

    constructor({baseURL}: Config) {
        this.baseURL = baseURL
    }

    // async getItem(userID: UserID|string, signature: Signature|string, options?: GetItemOptions): Promise<Item|null> {
    //     let bytes = await this.getItemBytes(userID, signature, options)
    //     if (bytes === null) return null
    //     return Item.deserialize(bytes)
    // }
    
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
        return nacl.crypto_sign_verify_detached(bytes, this.bytes, userID.bytes)
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

    // TODO: sign()
    //     let binSignature = nacl.sign.detached(itemBytes, keypair.secretKey)
    //     signature = bs58.encode(binSignature)
    // TODO: generate()
}

