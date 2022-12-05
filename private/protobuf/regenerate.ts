// deno-lint-ignore-file prefer-const

// Regenerate the feoblog.ts protobuf implementation from feoblog.proto.
import { join as pathJoin } from "https://deno.land/std@0.167.0/path/mod.ts";


export async function main() {
    const protoFile = "feoblog.proto"
    const outputFile = "feoblog.ts"

    // Installing the plugin into an npm directory here locally:
    const pluginDir = "plugin"
    const pluginPath = pathJoin(pluginDir, "node_modules", "bin", "protoc-gen-es")
    const tempDir = pathJoin(pluginDir, "build")
    const tempFile = pathJoin(tempDir, outputFileFor(protoFile))

    if (!await fileExists(protoFile)) { 
        throw new Error(`Couldn't find "${protoFile}". Might be running from wrong directory`)
    }

    // Make sure we've got the version of @bufbuild/protoc-gen-es from package.json:
    await run({
        cwd: pluginDir,
        cmd: [ cmd("npm"), "install"]
    })

    await run({
        cmd: [
            "protoc",
            "-I", ".",
            `--es_out=${tempDir}`,
            "--es_opt=target=ts",
            `--plugin=${pluginPath}`,
            protoFile,
        ]
    })

    // replace "@bufbuild/protobuf" with: "https://esm.sh/@bufbuild/protobuf@0.3.0"

    let bytes = await Deno.readFile(tempFile, )
    let decoder = new TextDecoder("utf-8")
    let code = decoder.decode(bytes)

    // Note: if I were making an application, I could just replace these paths
    // w/ an import map.
    // See: https://deno.land/manual@v1.12.2/npm_nodejs/import_maps
    // However, since this is a library, and import maps are not read for
    // libraries, best to just point to real ESM imports.
    // Applications still retain the ability to override our choice.
    let fixedCode = code.replaceAll(
        `"@bufbuild/protobuf"`,
        `"https://esm.sh/@bufbuild/protobuf@0.3.0"`
    )

    let encoder = new TextEncoder()
    await Deno.writeFile(outputFile, encoder.encode(fixedCode))

    console.log("Done")
}


// boo, "https://deno.land/std@0.167.0/fs/mod.ts" marks "exists" as deprecated.
// It's useful for error reporting! I know about race conditions, thankyou. :p
async function fileExists(path: string) {
    try {
        let info = await Deno.stat(path)
        return info.isFile
    } catch (error: unknown) {
        if (error instanceof Deno.errors.NotFound) { return false }
        else throw error
    }
}


// Run command, wait for it to exit, else show errors:
async function run(args: Deno.RunOptions) {
    try {
        let p = Deno.run(args)
        let status = await p.status()
        if (!status.success) {
            console.log("Error running:", args)
            Deno.exit(1)
        }
    
    } catch (e: unknown) {
        console.log("Error running:", args)
        throw e
    }
}


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