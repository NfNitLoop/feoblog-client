Steps to regenerate the protobuf types: 

First, make sure you've got [protoc] installed.

[protoc]: https://developers.google.com/protocol-buffers

Next, grab the latest copy of the protobuf file from
<https://github.com/NfNitLoop/feoblog/blob/develop/protobufs/feoblog.proto>

Then use <https://github.com/thesayyn/protoc-gen-ts> as directed:

    npm install -g protoc-gen-ts
    protoc -I. --ts_out=. feoblog.proto

Then manually fix-up the import statment in `feoblog.ts` from

    import * as pb_1 from "google-protobuf";

to:

    import * as pb_1 from "./google_protobuf.ts";


---

I'm not crazy about checking generated code into Git. However, that's how one [publishes code to Deno][1]

[1]: https://deno.land/x