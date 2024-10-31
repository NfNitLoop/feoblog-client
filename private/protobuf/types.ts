/**
 * This module exports two things:
 * 
 * 1. Types like {@link Item}, which are generated from the official FeoBlog
 * protobuf definition. (<https://github.com/NfNitLoop/feoblog/blob/develop/protobufs/feoblog.proto>)
 * 
 * 2. Utilities for dealing with these types as protobuf, which is how they are
 * serialized to be stored.
 * 
 * @module
 */

import { Item } from "./feoblog.ts"

// Generated types:
export * from "./feoblog.ts"

// Type utilities:
export {create, fromBinary, toBinary, fromJson, toJson, fromJsonString, toJsonString} from "@bufbuild/protobuf"