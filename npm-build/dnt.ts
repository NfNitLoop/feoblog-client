// See: https://github.com/denoland/dnt

import {build, emptyDir } from "https://deno.land/x/dnt@0.32.0/mod.ts"

// relative to project root, from where this script should be run:
const OUT_DIR = "./npm-build/package"

await emptyDir(OUT_DIR)

await build({
    entryPoints: [
        "./mod.ts",
    ],
    outDir: OUT_DIR,

    shims: {
        // Only shim for test code:
        deno: "dev",

        // shim: else we get: "No secure random number generator found" when testing.
        // dev-only: because we're building a browser package, and crypto
        // is available in the browser.
        crypto: "dev",

    },
    compilerOptions: {
        lib: ["es2021", "dom"]
    },
    package: {
        name: "@nfnitloop/feoblog-client",
        version: "0.7.0-rc1",

        // DNT doesn't grab bs58check types from esm.sh, so grab them.
        devDependencies: {
            "@types/bs58check": "*",
            "@types/libsodium-wrappers": "*",
        },
    },

    // Don't try to build CommonJS modules.
    // ESM is the way. Get with it, Node people. :p
    // But also I use top-level await and am not doing work to support CJS.
    scriptModule: false,    
})