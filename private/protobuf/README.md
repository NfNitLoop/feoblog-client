Steps to regenerate the protobuf types: 

First, make sure you've got [protoc] and `npm` installed.

[protoc]: https://developers.google.com/protocol-buffers

Next, grab the latest copy of the protobuf file from
<https://github.com/NfNitLoop/feoblog/blob/develop/protobufs/feoblog.proto>

Then run:

    deno task regen


---

I'm not crazy about checking generated code into Git. However, that's how one [publishes code to Deno][1]

[1]: https://deno.land/x