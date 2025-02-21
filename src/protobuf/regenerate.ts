#!/usr/bin/env -S deno run -A

/**
 * Regenerate the protobuf implementation from its definition.
 * 
 * @module
 */

import $ from "jsr:@david/dax@0.42.0"

export async function main(): Promise<void> {
    const protoFile = "diskuto.proto"
    const outputFile = "diskuto.ts"

    // Installing the plugin into an npm directory here locally:
    const pluginDir = $.path("plugin")
    const pluginPath = pluginDir.resolve("node_modules", ".bin", "protoc-gen-es")
    const tempDir = pluginDir.resolve("build")
    const tempFile = tempDir.resolve(outputFileFor(protoFile))

    if (!await $.path(protoFile).exists) { 
        throw new Error(`Couldn't find "${protoFile}". Might be running from wrong directory`)
    }

    // Make sure we've got the version of @bufbuild/protoc-gen-es from package.json:
    $.setPrintCommand(true)
    await $`npm install`.cwd(pluginDir)

    const cmd = [
        "protoc",
        "-I", ".",
        `--es_out=${tempDir}`,
        "--es_opt=target=ts",
        `--plugin=${pluginPath}`,
        protoFile,
    ]
    await $`${cmd}`

    await $`mv ${tempFile} ${outputFile}`
    
    console.log("Done")
}

// Figure out the file name that protoc output from our intput.
// foo.proto -> foo_pb.ts
function outputFileFor(inputProto: string): string {
    return inputProto.replace(".proto", "_pb.ts")
}

if (import.meta.main) {
    await main()
}