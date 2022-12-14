v0.7.0
======

December 13, 2022

 * Switched to protobuf-es: <https://github.com/bufbuild/protobuf-es>
   * Better types (proper types for optional fields)
   * No longer relies on Google's old JS implementation.
     (I'd had to work around issues with it numerous times.)
 * Add [DNT] support. This makes the Deno client for FeoBlog the canonical
   client, easily usable in both Deno and Node codebases. It will be used in
   the default/bundled FeoBlog in-browser client as well.

[DNT]: https://github.com/denoland/dnt

⚠️ Breaking changes:

The FeoBlog client just directly returns protobuf objects. Since protobuf-es
returns different implementations of objects, this means this is a breaking
API change.

The types themselves have mostly the same data (delta some new fields), but
their naming convention and access pattern will be slightly different.  As will
(de)serialization.

v0.2.1
======

Sep 24, 2022

Port latest client over from FeoBlog.

In particular, this includes updates to let you query for items
before/after a particular timestamp.

v0.2.0
======

July 23, 2021

 * Support for uploading attachments.

⚠️ Breaking changes:

 * `putItem()` no longer returns a `Response`.

v0.1.2
======

Date: July 5, 2021

 * Add Client.getProfile()
 * Switch to proper JSDocs so docs actually show up on <https://doc.deno.land>

v0.1.1
======

Date: July 3, 2021

Fix API doc URL

v0.1.0
======

Date: July 3, 2021

Initial release.