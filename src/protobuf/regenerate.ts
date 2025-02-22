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
    const pluginName = "protoc-gen-es"
    const pluginPath = pluginDir.resolve("bin", pluginName)
    const tempDir = pluginDir.resolve("build")
    const tempFile = tempDir.resolve(outputFileFor(protoFile))

    if (!await $.path(protoFile).exists) { 
        throw new Error(`Couldn't find "${protoFile}". Might be running from wrong directory`)
    }

    $.setPrintCommand(true)
    const installGen = [
        "deno", "install",
        // Note: Don't even need write access – `protoc` does the write:
        "--allow-env",
        "--force",
        // Makes --global actually be ... not so global.
        // Install into a known path so that we can reference it
        "--global", "--root", pluginDir,
        // For some reason, deno can't infer a name here. Weird:
        "--name", pluginName,
        "--quiet",
        "npm:@bufbuild/protoc-gen-es@2.2.3"
    ]
    await $`${installGen}`

    const cmd = [
        "protoc",
        "-I", ".",
        `--es_out=${tempDir}`,
        "--es_opt=target=ts",
        `--plugin=${pluginPath}`,
        protoFile,
    ]
    await $`${cmd}`

    // protoc-gen-es seems to always generate with CRLF. Eww.
    const src = await tempFile.readText()
    await tempFile.remove()
    await $.path(outputFile).writeText(src.replaceAll(/\r\n/g, "\n"))
    
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