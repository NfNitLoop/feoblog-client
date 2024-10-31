Steps to regenerate the protobuf types: 

First, make sure you've got [protoc] and `npm` installed.

[protoc]: https://developers.google.com/protocol-buffers

Next, grab the latest copy of the protobuf file from
<https://github.com/NfNitLoop/feoblog/blob/develop/protobufs/feoblog.proto>

Then run:

    deno task regen
