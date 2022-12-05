// @generated by protoc-gen-es v0.3.0 with parameter "target=ts"
// @generated from file feoblog.proto (syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "https://esm.sh/@bufbuild/protobuf@0.3.0";
import { Message, proto3, protoInt64 } from "https://esm.sh/@bufbuild/protobuf@0.3.0";

/**
 * This is redundant with the Item.item_type oneof. But it allows us to 
 * specify the type of an item in ItemLists.
 *
 * @generated from enum ItemType
 */
export enum ItemType {
  /**
   * Default value. Either the server didn't specify the type, or
   * it was a type that the client can't deserialize.
   *
   * @generated from enum value: UNKNOWN = 0;
   */
  UNKNOWN = 0,

  /**
   * @generated from enum value: POST = 1;
   */
  POST = 1,

  /**
   * @generated from enum value: PROFILE = 2;
   */
  PROFILE = 2,

  /**
   * @generated from enum value: COMMENT = 3;
   */
  COMMENT = 3,
}
// Retrieve enum metadata with: proto3.getEnumType(ItemType)
proto3.util.setEnumType(ItemType, "ItemType", [
  { no: 0, name: "UNKNOWN" },
  { no: 1, name: "POST" },
  { no: 2, name: "PROFILE" },
  { no: 3, name: "COMMENT" },
]);

/**
 * Each FeoBlog user's "blog" is really a collection of "Items" of different
 * types. It's important to keep in mind that different servers may cache
 * different subsets of items.
 *
 * Servers may (and probably should) impose a size limit for Item records.
 * Servers should accept items up to 32KiB (from users who have permission to
 * post to the server).
 *
 * Clients upload items to servers by PUTing to:
 * /u/{userID}/i/{itemID}/proto3
 * The body of the PUT is the binary proto3 representation of the Item.
 * The userID is a base58-encoded NaCl public key.
 * The {itemID} is a bas58-encoded detached NaCl signature of the proto3 bytes.
 * The server must then verify the signature before storing and serving the
 * proto3 bytes and must reject invalid signatures.
 *
 *
 * @generated from message Item
 */
export class Item extends Message<Item> {
  /**
   * REQUIRED
   * The timestamp is used to give order to a user's collection of Items.
   * This timestamp represents the number of milliseconds since
   * 1970-01-01 00:00:00.000Z (ignoring leap seconds).
   *
   * This is somewhat useful for displaying blog posts in order. But it's
   * especially important for ordering things like updates to a user's
   * profile.
   *
   * As a result, servers should not accept timestamps in the future (except
   * for maybe a small allowance due to clock drift.)
   *
   * Servers must validate that this value is specified.
   *
   * Due to protobuf3 default values, this means the value
   * can not be exactly 0.
   * Update: With new versionf of proto3, we can now unambiguously specify 0.
   * TODO: Implement that.
   *
   * @generated from field: int64 timestamp_ms_utc = 1;
   */
  timestampMsUtc = protoInt64.zero;

  /**
   * Optionally specify the user's timezone offset when they created this
   * Item. This is useful when displaying more meaningful dates on things
   * like Posts.
   *
   * For example, Pacific Daylight Time has an offset of "-0700", or -420
   * minutes.
   * Servers should reject offsets of more than +/- 24 hours. 
   *
   * Defaults to 0 (UTC).
   *
   * @generated from field: sint32 utc_offset_minutes = 2;
   */
  utcOffsetMinutes = 0;

  /**
   * @generated from oneof Item.item_type
   */
  itemType: {
    /**
     * @generated from field: Post post = 3;
     */
    value: Post;
    case: "post";
  } | {
    /**
     * @generated from field: Profile profile = 4;
     */
    value: Profile;
    case: "profile";
  } | {
    /**
     * @generated from field: Comment comment = 5;
     */
    value: Comment;
    case: "comment";
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<Item>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "Item";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "timestamp_ms_utc", kind: "scalar", T: 3 /* ScalarType.INT64 */ },
    { no: 2, name: "utc_offset_minutes", kind: "scalar", T: 17 /* ScalarType.SINT32 */ },
    { no: 3, name: "post", kind: "message", T: Post, oneof: "item_type" },
    { no: 4, name: "profile", kind: "message", T: Profile, oneof: "item_type" },
    { no: 5, name: "comment", kind: "message", T: Comment, oneof: "item_type" },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Item {
    return new Item().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Item {
    return new Item().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Item {
    return new Item().fromJsonString(jsonString, options);
  }

  static equals(a: Item | PlainMessage<Item> | undefined, b: Item | PlainMessage<Item> | undefined): boolean {
    return proto3.util.equals(Item, a, b);
  }
}

/**
 * Servers should render posts at at least two URLs:
 * 1. /u/{userID}/[?before={timestamp_ms_utc}]
 *    should render (some number of) the user's most recent posts before
 *    timestamp_ms_utc. These may be truncated.
 * 2. /u/{userID}/i/{itemID}/
 *    should render a single user post, in full.
 *    
 *
 * @generated from message Post
 */
export class Post extends Message<Post> {
  /**
   * An optional plaintext title for the post.
   * Titles should be <= 256 bytes. Servers may reject longer ones.
   *
   * @generated from field: string title = 1;
   */
  title = "";

  /**
   * The body of the post, formatted in CommonMark markdown.
   * Servers should suppress unsafe raw HTML blocks in the body. They may do
   * so by rejecting the Item at the time of upload, or by choosing to render
   * the Item without the offending HTML parts.
   *
   * The allowed size of the body is effectively limited by the allowed
   * size of the enclosing Item.
   *
   * @generated from field: string body = 2;
   */
  body = "";

  /**
   * File attachments that will be visible at ./files/*
   *
   * @generated from field: Attachments attachments = 5;
   */
  attachments?: Attachments;

  constructor(data?: PartialMessage<Post>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "Post";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "title", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "body", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 5, name: "attachments", kind: "message", T: Attachments },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Post {
    return new Post().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Post {
    return new Post().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Post {
    return new Post().fromJsonString(jsonString, options);
  }

  static equals(a: Post | PlainMessage<Post> | undefined, b: Post | PlainMessage<Post> | undefined): boolean {
    return proto3.util.equals(Post, a, b);
  }
}

/**
 * A user profile, where a user can provide information about themselves.
 *
 * A server should render a human-readable version of the user profile at
 * /u/{userID}/profile.
 * This should always be the newest version of the Profile available on the
 * server.
 * If a server serves a user profile, it must allow uploads of newer signed
 * Item entries to replace it.
 *
 * @generated from message Profile
 */
export class Profile extends Message<Profile> {
  /**
   * A name to display instead of your userID.
   *
   * @generated from field: string display_name = 1;
   */
  displayName = "";

  /**
   * An "about me" section, formatted in Commonmark markdown.
   * Servers should suppress unsafe raw HTML blocks in the body.
   *
   * @generated from field: string about = 2;
   */
  about = "";

  /**
   * A list of servers where the user expects their content to be hosted.
   * The first server is considered the "primary" server, but others may be listed
   * as backups.
   * This allows users to move servers by updating their preferred server list.
   *
   * @generated from field: repeated Server servers = 3;
   */
  servers: Server[] = [];

  /**
   * A list of users who this user "follows".
   * This allows the server to know what additional users it should cache data for, so that it can present this
   * (Profile) user's feed of new content.
   *
   * The order of the list is unimportant.
   *
   * @generated from field: repeated Follow follows = 4;
   */
  follows: Follow[] = [];

  /**
   * Users may group their follows into groups to make sorting/filtering/syncing them easier.
   * Clients may decide to order groups in different ways, or respect the order of the groups as listed here.
   *
   * @generated from field: repeated FollowGroup follow_groups = 5;
   */
  followGroups: FollowGroup[] = [];

  constructor(data?: PartialMessage<Profile>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "Profile";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "display_name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "about", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "servers", kind: "message", T: Server, repeated: true },
    { no: 4, name: "follows", kind: "message", T: Follow, repeated: true },
    { no: 5, name: "follow_groups", kind: "message", T: FollowGroup, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Profile {
    return new Profile().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Profile {
    return new Profile().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Profile {
    return new Profile().fromJsonString(jsonString, options);
  }

  static equals(a: Profile | PlainMessage<Profile> | undefined, b: Profile | PlainMessage<Profile> | undefined): boolean {
    return proto3.util.equals(Profile, a, b);
  }
}

/**
 * A Comment is a text-only response to some other Item.
 *
 * @generated from message Comment
 */
export class Comment extends Message<Comment> {
  /**
   * Information about the Item we're replying to.
   *
   * @generated from field: ReplyRef reply_to = 1;
   */
  replyTo?: ReplyRef;

  /**
   * CommonMark markdown text. 
   * Inline images will NOT be rendered.
   *
   * @generated from field: string text = 2;
   */
  text = "";

  constructor(data?: PartialMessage<Comment>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "Comment";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "reply_to", kind: "message", T: ReplyRef },
    { no: 2, name: "text", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Comment {
    return new Comment().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Comment {
    return new Comment().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Comment {
    return new Comment().fromJsonString(jsonString, options);
  }

  static equals(a: Comment | PlainMessage<Comment> | undefined, b: Comment | PlainMessage<Comment> | undefined): boolean {
    return proto3.util.equals(Comment, a, b);
  }
}

/**
 * Information about an Item that we're replying to.
 *
 * @generated from message ReplyRef
 */
export class ReplyRef extends Message<ReplyRef> {
  /**
   * REQUIRED: the user_id that posted the item.
   *
   * @generated from field: UserID user_id = 1;
   */
  userId?: UserID;

  /**
   * REQUIRED: the signature of the item.
   *
   * @generated from field: Signature signature = 2;
   */
  signature?: Signature;

  /**
   * Suggested: The type of the item we're replying to.
   * This is useful in case clients want to only show certain types of comments. 
   * Ex: show comments in reply to posts, but not comments replying to other comments.
   *
   * @generated from field: ItemType item_type = 3;
   */
  itemType = ItemType.UNKNOWN;

  constructor(data?: PartialMessage<ReplyRef>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "ReplyRef";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "user_id", kind: "message", T: UserID },
    { no: 2, name: "signature", kind: "message", T: Signature },
    { no: 3, name: "item_type", kind: "enum", T: proto3.getEnumType(ItemType) },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReplyRef {
    return new ReplyRef().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReplyRef {
    return new ReplyRef().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReplyRef {
    return new ReplyRef().fromJsonString(jsonString, options);
  }

  static equals(a: ReplyRef | PlainMessage<ReplyRef> | undefined, b: ReplyRef | PlainMessage<ReplyRef> | undefined): boolean {
    return proto3.util.equals(ReplyRef, a, b);
  }
}

/**
 * Information about where a user's posts may be found.
 * This lets content creators' clients know where to send posts when they're uploaded.
 * This also lets consumers' clients know where they can find the creator's content.
 *
 * @generated from message Server
 */
export class Server extends Message<Server> {
  /**
   * A URL to a FeoBlog server.
   * Ex:
   * "https://feo.example.com"
   * "https://feo.example.com/"
   * "https://feo.example.com:8080"
   * "https://feo.example.com:8080/"
   *
   * Note 1: Subpaths are currently not supported. Ex: "https://feo.example.com/some/subpath/"
   *
   * Note 2: While the signature authentication allows serving/sending signed protobuf Items
   * securely without HTTPS, since the main client is currently implemented as in-browser JavaScript,
   * it is recommended that servers use only HTTPS to avoid JavaScript injection in the client.
   * So, you should probably prefer https for the REST endpoints too.
   * Plus, HTTP/2 requires HTTPS, and you'll get better performance for fetching many small Items w/ HTTP/2.
   *
   * @generated from field: string url = 1;
   */
  url = "";

  constructor(data?: PartialMessage<Server>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "Server";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "url", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Server {
    return new Server().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Server {
    return new Server().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Server {
    return new Server().fromJsonString(jsonString, options);
  }

  static equals(a: Server | PlainMessage<Server> | undefined, b: Server | PlainMessage<Server> | undefined): boolean {
    return proto3.util.equals(Server, a, b);
  }
}

/**
 * @generated from message Follow
 */
export class Follow extends Message<Follow> {
  /**
   * REQUIRED
   *
   * @generated from field: UserID user = 1;
   */
  user?: UserID;

  /**
   * Set a display name for a user within the context of your feed.
   *
   * Users may change their display names in their profiles. But, unlike Twitter, FeoBlog does not have
   * a globally-unique human-readable ID to fall back on to identify someone, so it can be difficult to
   * know who's who if people keep changing their names. 
   * Here you can set a stable name so you always know who's who.
   *
   * @generated from field: string display_name = 2;
   */
  displayName = "";

  /**
   * The (0-indexed) group index that this follow should be grouped under.
   *
   * @generated from field: optional int32 follow_group = 3;
   */
  followGroup?: number;

  constructor(data?: PartialMessage<Follow>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "Follow";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "user", kind: "message", T: UserID },
    { no: 2, name: "display_name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "follow_group", kind: "scalar", T: 5 /* ScalarType.INT32 */, opt: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Follow {
    return new Follow().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Follow {
    return new Follow().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Follow {
    return new Follow().fromJsonString(jsonString, options);
  }

  static equals(a: Follow | PlainMessage<Follow> | undefined, b: Follow | PlainMessage<Follow> | undefined): boolean {
    return proto3.util.equals(Follow, a, b);
  }
}

/**
 * @generated from message FollowGroup
 */
export class FollowGroup extends Message<FollowGroup> {
  /**
   * A display name for this group. ex: "News", or "Friends".
   * Names should probably be unique for users' own sanity but at the moment that is not enforced by the protocol.
   *
   * @generated from field: string name = 1;
   */
  name = "";

  constructor(data?: PartialMessage<FollowGroup>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "FollowGroup";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FollowGroup {
    return new FollowGroup().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FollowGroup {
    return new FollowGroup().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FollowGroup {
    return new FollowGroup().fromJsonString(jsonString, options);
  }

  static equals(a: FollowGroup | PlainMessage<FollowGroup> | undefined, b: FollowGroup | PlainMessage<FollowGroup> | undefined): boolean {
    return proto3.util.equals(FollowGroup, a, b);
  }
}

/**
 * @generated from message UserID
 */
export class UserID extends Message<UserID> {
  /**
   * A user's public NaCL key/ID. Must be 32 bytes:
   *
   * @generated from field: bytes bytes = 1;
   */
  bytes = new Uint8Array(0);

  constructor(data?: PartialMessage<UserID>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "UserID";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "bytes", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserID {
    return new UserID().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserID {
    return new UserID().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserID {
    return new UserID().fromJsonString(jsonString, options);
  }

  static equals(a: UserID | PlainMessage<UserID> | undefined, b: UserID | PlainMessage<UserID> | undefined): boolean {
    return proto3.util.equals(UserID, a, b);
  }
}

/**
 * @generated from message Signature
 */
export class Signature extends Message<Signature> {
  /**
   * A NaCL signature. Must be 64 bytes:
   *
   * @generated from field: bytes bytes = 1;
   */
  bytes = new Uint8Array(0);

  constructor(data?: PartialMessage<Signature>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "Signature";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "bytes", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Signature {
    return new Signature().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Signature {
    return new Signature().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Signature {
    return new Signature().fromJsonString(jsonString, options);
  }

  static equals(a: Signature | PlainMessage<Signature> | undefined, b: Signature | PlainMessage<Signature> | undefined): boolean {
    return proto3.util.equals(Signature, a, b);
  }
}

/**
 * A list of items available on a server.
 * Exmaples:
 * GET /u/{userID}/items[?before=timestamp_ms_utc] to list a single user's items.
 * GET /u/{userID]/feed/items[?before=...] to list items in a user's feed.
 *
 * The list is sorted appropriately according to the request.
 * ex: ?after=... will be sorted in ascending chronological order. ?before=..., in descending.
 *
 * @generated from message ItemList
 */
export class ItemList extends Message<ItemList> {
  /**
   * @generated from field: repeated ItemListEntry items = 1;
   */
  items: ItemListEntry[] = [];

  /**
   * If true, the server explicitly states there are no items after this list.
   * (i.e.: the client can stop querying)
   *
   * @generated from field: bool no_more_items = 2;
   */
  noMoreItems = false;

  constructor(data?: PartialMessage<ItemList>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "ItemList";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "items", kind: "message", T: ItemListEntry, repeated: true },
    { no: 2, name: "no_more_items", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ItemList {
    return new ItemList().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ItemList {
    return new ItemList().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ItemList {
    return new ItemList().fromJsonString(jsonString, options);
  }

  static equals(a: ItemList | PlainMessage<ItemList> | undefined, b: ItemList | PlainMessage<ItemList> | undefined): boolean {
    return proto3.util.equals(ItemList, a, b);
  }
}

/**
 * The unique ID of an item is its (user_id,signature)
 * This type encapsulates that, plus some additional metadata which 
 *
 * @generated from message ItemListEntry
 */
export class ItemListEntry extends Message<ItemListEntry> {
  /**
   * user_id may be unspecified if it can be inferred from context.
   * (ex: in an ItemList which lists posts for a specific userID)
   *
   * @generated from field: UserID user_id = 1;
   */
  userId?: UserID;

  /**
   * REQUIRED.
   *
   * @generated from field: Signature signature = 2;
   */
  signature?: Signature;

  /**
   * REQUIRED
   * The timestamp coantained within Item.timestamp_ms_utc.
   * This is used for ordering Items, and to fetch more ItemIDs in the event
   * that this list is truncated/incomplete.   
   *
   * @generated from field: int64 timestamp_ms_utc = 3;
   */
  timestampMsUtc = protoInt64.zero;

  /**
   * Specify the type of this item.
   * This allows clients to skip fetching item types they're not interested in
   * for a particular view. (ex: profile updates and/or comments, etc.)
   *
   * @generated from field: ItemType item_type = 4;
   */
  itemType = ItemType.UNKNOWN;

  constructor(data?: PartialMessage<ItemListEntry>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "ItemListEntry";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "user_id", kind: "message", T: UserID },
    { no: 2, name: "signature", kind: "message", T: Signature },
    { no: 3, name: "timestamp_ms_utc", kind: "scalar", T: 3 /* ScalarType.INT64 */ },
    { no: 4, name: "item_type", kind: "enum", T: proto3.getEnumType(ItemType) },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ItemListEntry {
    return new ItemListEntry().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ItemListEntry {
    return new ItemListEntry().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ItemListEntry {
    return new ItemListEntry().fromJsonString(jsonString, options);
  }

  static equals(a: ItemListEntry | PlainMessage<ItemListEntry> | undefined, b: ItemListEntry | PlainMessage<ItemListEntry> | undefined): boolean {
    return proto3.util.equals(ItemListEntry, a, b);
  }
}

/**
 * File attachments.
 * Certain item types may allow file attachments.
 *
 * @generated from message Attachments
 */
export class Attachments extends Message<Attachments> {
  /**
   * @generated from field: repeated File file = 1;
   */
  file: File[] = [];

  constructor(data?: PartialMessage<Attachments>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "Attachments";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "file", kind: "message", T: File, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Attachments {
    return new Attachments().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Attachments {
    return new Attachments().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Attachments {
    return new Attachments().fromJsonString(jsonString, options);
  }

  static equals(a: Attachments | PlainMessage<Attachments> | undefined, b: Attachments | PlainMessage<Attachments> | undefined): boolean {
    return proto3.util.equals(Attachments, a, b);
  }
}

/**
 * Metadata about a file attachment.
 * All fields are REQUIRED.
 *
 * @generated from message File
 */
export class File extends Message<File> {
  /**
   * A  64-byte sha-512 hash of the contents of the file.
   *
   * @generated from field: bytes hash = 1;
   */
  hash = new Uint8Array(0);

  /**
   * The size of the file in bytes.
   * Some servers may reject files based on their size, or the user's quota.
   * Note: The size may not be 0.
   *
   * @generated from field: uint64 size = 2;
   */
  size = protoInt64.zero;

  /**
   * The name of the file.
   * The file name may not contain path separators / or \.  
   * Note: The server will use the file extension to determine the mime type with which to serve the file.
   *
   * @generated from field: string name = 3;
   */
  name = "";

  constructor(data?: PartialMessage<File>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime = proto3;
  static readonly typeName = "File";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "hash", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
    { no: 2, name: "size", kind: "scalar", T: 4 /* ScalarType.UINT64 */ },
    { no: 3, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): File {
    return new File().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): File {
    return new File().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): File {
    return new File().fromJsonString(jsonString, options);
  }

  static equals(a: File | PlainMessage<File> | undefined, b: File | PlainMessage<File> | undefined): boolean {
    return proto3.util.equals(File, a, b);
  }
}

