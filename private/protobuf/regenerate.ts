#!/usr/bin/env -S deno run -A
// deno-lint-ignore-file prefer-const

// Regenerate the feoblog.ts protobuf implementation from feoblog.proto.
import { join as pathJoin } from "jsr:@std/path@1.0.7";
import { exists as fileExists } from "jsr:@std/fs@1.0.5"
import $ from "jsr:@david/dax@0.42.0"


export async function main() {
    const protoFile = "feoblog.proto"
    const outputFile = "feoblog.ts"

    // Installing the plugin into an npm directory here locally:
    const pluginDir = "plugin"
    const pluginPath = pathJoin(pluginDir, "node_modules", ".bin", "protoc-gen-es")
    const tempDir = pathJoin(pluginDir, "build")
    const tempFile = pathJoin(tempDir, outputFileFor(protoFile))

    if (!await fileExists(protoFile)) { 
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

// Work around https://github.com/denoland/deno/issues/16942
function cmd(name: string): string {
    if (Deno.build.os == "windows") { return `${name}.cmd` } 
    return name
}

if (import.meta.main) {
    await main()
}