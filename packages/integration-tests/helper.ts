/** Tools for helping to set up and tear down a test Diskuto API server. */

import {resolve} from "jsr:@std/path@1"
import $ from "jsr:@david/dax@0.42.0"
import { Client, PrivateKey, UserID } from "@diskuto/client";
import {create, ItemSchema, ProfileSchema, FollowSchema, toBinary} from "@diskuto/client/types"
import {delay} from "jsr:@std/async@1"
import { lazy } from "jsr:@nfnitloop/better-iterators@1.5.0";

export class Server implements AsyncDisposable {
    status: Status = "new"
    #binary: string
    
    #tempDir?: string
    
    readonly port = Math.floor(Math.random() * 10_000) + 10_000
    readonly client = new Client({
        baseUrl: `http://localhost:${this.port}`,
        userAgent: "helper-client"
    })
    #proc?: Deno.ChildProcess;
    #procShutdown?: Promise<void>;
    
    constructor({binary}: Args) {
        this.#binary = resolve(import.meta.dirname!, binary)
    }
    
    async start() {
        if (this.status != "new") {
            throw new Error("can't start when status is " + this.status)
        }
        
        this.status = "initializing"
        
        try {
            this.#tempDir = await Deno.makeTempDir()
            await this.#exec("db", "init")
            
            const cmd = new Deno.Command(this.#binary, {
                cwd: this.#tempDir,
                args: [
                    "serve",
                    "--bind", `127.0.0.1:${this.port}`
                ],
                stdout: "inherit",
                stdin: "inherit",
            })
            this.#proc = cmd.spawn()
            this.status = "running"
            
            this.#procShutdown = this.#proc.status.then((status) => {
                if (status.code == 0) {
                    this.status = "shutdown"
                } else {
                    this.status = "failed"
                }
            })
            
            // Give the server a little time to start up or error out:
            await delay(1000)
            
        } catch (e) {
            this.status = "failed"
            throw e
        }
    }
    
    async #exec(...args: string[]) {
        return await $`${this.#binary} ${args}`
        .cwd(this.#tempDir!)
        .printCommand()
    }    
    
    async [Symbol.asyncDispose]() {
        await this.cleanup()
    }
    
    async cleanup() {
        await this.#stopProcess()
        await this.#cleanupDir()
    }
    
    async #stopProcess() {
        if (this.status != "running") { return }
        console.debug("shutting down server process")
        await this.#proc?.[Symbol.asyncDispose]()
    }
    
    async #cleanupDir() {
        const dir = this.#tempDir
        if (!dir) { return }
        await Deno.remove(dir, {recursive: true})
        console.log("cleaned up", dir)
    }
    
    async homepage() {
        return await all(this.client.getHomepageItems())
    }
    
    async post(privKey: PrivateKey, postText: string) {
        const item = create(ItemSchema, {
            timestampMsUtc: BigInt(Date.now()),
            itemType: {
                case: "post",
                value: {
                    body: postText
                }
            }
        })
        
        const bytes = toBinary(ItemSchema, item)
        const sig = privKey.sign(bytes)
        const response = await this.client.putItem(privKey.userID, sig, bytes)
        response.body?.cancel()
    }
    
    async addUser(userID: UserID, opts: { onHomepage: boolean; }) {
        const {onHomepage} = opts
        const args = []
        if (onHomepage) {
            args.push("--on-homepage")
        }
        
        await this.#exec("user", "add", userID.asBase58, ...args)
    }
    
    async addFollow(privKey: PrivateKey, opts: { follow: UserID; }) {
        const {follow} = opts
        
        const oldProfile = await this.client.getProfile(privKey.userID)
        const profile = create(ProfileSchema, oldProfile?.item.itemType.value ?? {})
        
        profile.follows.push(create(FollowSchema, {
            user: {
                bytes: follow.bytes,
            },
            displayName: "followed user"
        }))
        
        const item = create(ItemSchema, {
            timestampMsUtc: BigInt(Date.now()),
            itemType: {
                case: "profile",
                value: profile
            }
        })
        const bytes = toBinary(ItemSchema, item)
        const sig = privKey.sign(bytes)
        const response = await this.client.putItem(privKey.userID, sig, bytes)
        await response.body?.cancel()
    }
    
    async posts(userID: UserID) {
        return await all(this.client.getUserItems(userID))
    }
    
}

async function all<T>(gen: AsyncIterable<T>): Promise<T[]> {
    return await lazy(gen).toArray()
}

type Args = {
    binary: string
}


type Status = "new" | "initializing" | "running" | "shutdown" | "failed"