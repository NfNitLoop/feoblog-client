import {build, emptyDir } from "https://deno.land/x/dnt@0.32.0/mod.ts"

const OUT_DIR = "./npm"

await emptyDir(OUT_DIR)
await build({
    entryPoints: [
        "./mod.ts",
    ],
    outDir: OUT_DIR,

    shims: {
        // Only shim for test code:
        deno: "dev"
    },
    compilerOptions: {
        lib: ["es2021", "dom"]
    },
    package: {
        name: "@nfnitloop/feoblog-client",
        version: "0.5.0-rc1",
        browser: "mod.js",

        // DNT doesn't grab the types from esm.sh, so grab them:
        devDependencies: {
            "@types/bs58check": "*",
        }
    },

    // Don't try to build CommonJS modules.
    // ESM is the way. Get with it, Node people. :p
    // But also I use top-level await and am not doing work to support CJS.
    scriptModule: false,    
})