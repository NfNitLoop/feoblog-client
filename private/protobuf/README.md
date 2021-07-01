Steps to regenerate the protobuf types: 

First, make sure you've got [protoc] installed.

[protoc]: https://developers.google.com/protocol-buffers

Next, grab the latest copy of the protobuf file from
<https://github.com/NfNitLoop/feoblog/blob/develop/protobufs/feoblog.proto>

Then use <https://deno.land/x/deno_google_protobuf@4.0.0-rc.2> as directed:

    protoc --js_out=import_style=commonjs,binary:. feoblog.proto
    deno run --allow-read --allow-write https://deno.land/x/deno_google_protobuf/tools/build.ts . .