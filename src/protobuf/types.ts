/**
 * This module exports two things:
 * 
 * 1. Types like {@link Item}, which are generated from the official 
 * protobuf definition. (<https://github.com/diskuto/diskuto-api/blob/main/protobufs/diskuto.proto>)
 * 
 * 2. Utilities for dealing with these types as protobuf, which is how they are
 * serialized to be stored.
 * 
 * JSR currently does not properly show these re-exports. ([bug]) They are:
 * 
 *  * create
 *  * fromBinary
 *  * toBinary
 *  * fromJson
 *  * toJson
 *  * fromJsonString
 *  * toJsonString
 * 
 * as documented here: <https://github.com/bufbuild/protobuf-es/blob/main/MANUAL.md#working-with-messages>
 * 
 * [bug]: https://github.com/jsr-io/jsr/issues/872
 *
 * @module
 */

// deno-lint-ignore no-unused-vars
import type { Item } from "./diskuto.ts"

// Generated types:
export * from "./diskuto.ts"

// Type utilities:
export {create, fromBinary, toBinary, fromJson, toJson, fromJsonString, toJsonString} from "@bufbuild/protobuf"