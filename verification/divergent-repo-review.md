# Divergent Repository Source Review

**Scope.** This is a read-only code review of the two divergent repositories identified in the consolidation assessment. It compares their requested implementations with the canonical repository’s current `safety-layer` branch. It does not migrate schemas, copy source code, change configuration, or validate that historical YouTube URLs still resolve.

> **Decision summary.** The hosting repository contains two polished but static, client-only content/UI prototypes. The AO Universe repository contains an incomplete real-time-chat implementation, an unmounted achievement-rule engine, and a large alternative schema. The canonical Safety Layer is the correct source of truth for safety, persistence, moderation, age assurance, and current content playback. Several divergent concepts are worth **selective redesign**, but none should be ported as a direct code or migration copy.

## 1. `Anomoly247/anom-social-sanctuary-hosting`

### 1.1 Glow Locker

The [`GlowLocker` component][1] is a standalone visual inventory panel. It declares a local `GlowItem` type and initializes all inventory data in React state rather than reading server data. Its eight predefined items are split into five items labelled **earned** and three labelled **purchased**.

| Aspect | Observed implementation | Completeness assessment |
|---|---|---|
| Data source | A hard-coded `useState` array: cyan frame, magenta rim, green pulse, purple aura, gold badge, diamond sticker, fire frame, and ice ambient. Each includes a CSS glow class, a display colour, a label, and descriptive earned/purchased copy. | **Prototype only.** There is no database query, ownership check, price calculation, currency debit, entitlement lookup, or server-side reward validation. |
| Integration contract | Optional props: `equippedGlowId` and `onEquipGlow(glowId)`. | **Partial.** The component can notify a parent, but it cannot persist an equip action itself. |
| User interface | An active-glow preview, an “earned” two-column inventory, a “purchased” two-column inventory, equip buttons, rarity-like labels, and a footer saying glows appear on profiles, feed posts, and lounge messages. | **Visually complete.** The display is coherent and could be reused as a design reference. |
| Actual hosting-page behavior | The hosting [`Profile` page][2] mounts the component with mock user data and stores the equipped ID only in local React state. Reloading loses the selection. | **Not production-complete.** No purchase/unlock/equip state crosses the browser boundary. |

**Port decision: do not port the component code directly.** The canonical repository already has persisted `decoration_packages`, profile `decoration_package_ids`, an `applyDecorations` procedure, and settings persistence. Its current model is structurally stronger than a component-local inventory. The **layout concept** is worth considering later: rebuild it against canonical decoration ownership, member settings, Anom Coin transactions, audit logging, and the existing safety controls. The hard-coded achievement requirements and prices must not become authoritative product logic.

### 1.2 Static nine-video Anom’s Corner mapping

The hosting [`KidsCorner` page][3] stores nine video records directly in its component, groups them into Adventure, Learning, and Social categories, and renders each with a YouTube `<iframe>`. It has no CMS query, owner-upload pipeline, availability check, playlist synchronization, content moderation state, or category-filter control; the three groups are always displayed.

| # | Category | Title in source | Duration in source | YouTube watch URL |
|---:|---|---|---|---|
| 1 | Adventure | Pixel & Dot Explore the Neighborhood | 0:09 | <https://www.youtube.com/watch?v=lp6RFvrnlCw> |
| 2 | Adventure | The Mystery of the Neon Park | 0:11 | <https://www.youtube.com/watch?v=CMh3JSWfa7c> |
| 3 | Adventure | Journey Through the Digital Grid | 1:51 | <https://www.youtube.com/watch?v=0pBrQUqU0ig> |
| 4 | Learning | Understanding Family Roles | 0:11 | <https://www.youtube.com/watch?v=C4BzjTru0t0> |
| 5 | Learning | Sharing and Caring with Friends | 0:11 | <https://www.youtube.com/watch?v=GgUW3akuc8g> |
| 6 | Learning | Problem Solving Together | 0:11 | <https://www.youtube.com/watch?v=o4TMa2ToDXg> |
| 7 | Social | Active Listening Skills | 0:09 | <https://www.youtube.com/watch?v=E_dFJh8AW2Q> |
| 8 | Social | Navigating Big Feelings | 0:11 | <https://www.youtube.com/watch?v=97vizxeWU1E> |
| 9 | Social | Teamwork Makes the Dream Work | 0:09 | <https://www.youtube.com/watch?v=FnOORLoBbYY> |

**Port decision: canonical version is stronger for official Pixel & Dot playback.** The canonical Anom’s Corner and Kids Corner use verified native GitHub-hosted Pixel & Dot MP4 assets and include broader age-aware children’s experiences. The divergent mapping is still useful as a **curation spreadsheet**: the nine titles, category grouping, descriptions, and channel references can be reviewed against official ownership and availability before adding any approved records to the canonical content system. Do not copy the iframe-only page as the content-management solution.

## 2. `Anomoly247/Anom-Artsy-Sanctuary`

### 2.1 WebSocket lounge chat

The AO Universe repository implements a transport layer plus a client hook:

| Layer | Observed behavior | Limitation |
|---|---|---|
| Server transport | The [`server/_core/index.ts` WebSocket setup][4] attaches a `WebSocketServer` to the same HTTP server. It groups sockets in a `Map<loungeId, Set<WebSocket>>`, using an unvalidated `loungeId` query parameter. It exposes `broadcastToLounge` through the global object, app locals, and tRPC context. | The connection setup performs no session authentication, membership verification, age-tier check, block check, or rate limit before subscribing a socket to a lounge. |
| Server message send | The legacy [`lounges.sendMessage` procedure][5] writes a message and invokes `broadcastToLounge` with a `message` envelope. | This is the one real integration point, but it broadcasts immediately without demonstrating the canonical Safety Layer’s per-recipient block filtering or moderation-state safeguards. |
| Client hook | [`useLoungeChatWebSocket`][6] opens `ws(s)://<current-host>?loungeId=<id>`, forwards matching `message` events to an optional callback, and reconnects after three seconds. | It exposes a non-reactive `isConnected` snapshot, has no auth token/session protocol, no exponential backoff, no heartbeat, and no handling for authorization or moderation events. |
| User-facing lounge route | The legacy [`LoungeDetail` page][7] does not import or use the hook. It continues to fetch messages through tRPC and calls `refetch()` after send. | The end-user chat path is therefore **not actually real-time**. The feature is partially wired on the server but orphaned in the visible client route. |

**Port decision: do not port the implementation directly.** The canonical lounge system is stronger for the current SFW requirements because it applies server/query-layer safety enforcement, persisted reactions/pins/read state, and blocked-account filtering. The divergent implementation identifies a valuable future capability—real-time delivery—but it must be rebuilt around authenticated and authorized WebSocket subscriptions, lounge membership checks, age assurance, mute/timeout rules, server-side block filtering per recipient, moderation-status filtering, reconnect backoff, and observability. It is an architecture reference, not a safe drop-in.

### 2.2 Achievement trigger code

The legacy [`server/achievements.ts` module][8] exports three functions: `checkAndUnlockAchievements`, `unlockAchievement`, and `getUserAchievementsWithDetails`.

| Functionality | Observed implementation | Assessment |
|---|---|---|
| Rule evaluation | `checkAndUnlockAchievements` selects the user profile and already-unlocked IDs, then evaluates hard-coded IDs against trigger metadata. Supported trigger types are game completion, coins earned, lounge joined, and profile updated. | The product idea is useful, but rules are embedded in source and tied to numerical achievement IDs. |
| Specific rules | It unlocks Trivia Champion at a trivia score of 100; Memory Expert, Mood Matcher, and Snack Collector on named game completion; Game Master at five games; two coin thresholds; two lounge-join thresholds; and profile/decorations milestones. | The rule list is narrow and depends on callers providing trustworthy `metadata` values such as `totalGamesCompleted` or `decorationsApplied`. |
| Unlock persistence | `unlockAchievement` checks for an existing row, inserts into `user_achievements`, inserts a 50-Anom-Coin transaction, and updates the profile balance. | The three writes are not transactional. A partial failure can award or record only part of the result. |
| Error semantics | Both major functions catch errors, log them, and return an empty array or `false`. | This recreates the silent-failure pattern the canonical hardening work has been removing. |
| Actual mounting | The legacy mounted achievement router calls the older DB `unlockAchievement` directly; repository search found no call site for `checkAndUnlockAchievements` outside its own module. | **Not integrated.** The trigger engine appears orphaned rather than executed by game, lounge, coin, or profile mutations. |

**Port decision: port the concept, not the module.** The canonical repository has persisted achievement tables and query/UI support, but no automatic rule engine. A future canonical enhancement could use an audited, data-driven rule registry and transactional award path. It should be invoked from authoritative server events—not user-supplied metadata—and should reject failed persistence rather than converting errors to empty results. Until that work is designed and tested, the legacy code is not safer or more complete than the canonical implementation.

### 2.3 Migration review: `0002`–`0010`

The following table lists what each legacy migration adds that has no same-named table in the canonical Drizzle schema. “Absent” refers to the exact table/model name; in several cases the canonical repository already implements a safer or differently named overlapping capability.

| Migration | Legacy schema change | Relationship to canonical schema | Port assessment |
|---|---|---|---|
| [`0002_motionless_sunfire.sql`][9] | Adds **nothing**. It drops `audit_log`, chat tables, `tier_purchases`, tips, presence/VIP tables, and removes two `platform_settings` columns. | Canonical currently contains `audit_log`, `tier_purchases`, platform feature flags, and other safety/economy structures. | **Never port.** It is destructive and would remove canonical capabilities. |
| [`0003_friendly_sinister_six.sql`][10] | `post_reactions` for like/rate entries and optional rating values. | Canonical has feed/activity like and rate behavior, including failed-write rejection work, but not this exact table. | **Do not port.** It is an underspecified alternate persistence model with no uniqueness or moderation fields. |
| [`0004_romantic_gamora.sql`][11] | `decoration_slots`, `glow_point_transactions`, `glow_points`, `identity_nodes`, `identity_passport_registry`, `profile_customization_options`. | Canonical has persisted profile decoration packages and profile settings, but not a separate glow-point economy or legacy passport tier system. | **Do not port as a migration.** Review cosmetic/identity ideas separately; the legacy passport tiers do not match the canonical five-tier age-assurance framework. |
| [`0005_silky_fenris.sql`][12] | `user_follows` and cached `user_stats`. | Canonical has no exact follow graph or cached counts. | **Future concept only.** A follow graph requires its own block, minor-safety, visibility, notification, and query-layer filtering design. |
| [`0006_deep_stepford_cuckoos.sql`][13] | `activity_feed`, `activity_feed_likes`, `user_notifications`. | Canonical already has a distinct feed/activity implementation with moderation fields on `feed_posts` and safety-layer enforcement. | **Do not port.** Treat it as a feature inventory; the schema lacks canonical moderation and safety controls. |
| [`0007_greedy_blade.sql`][14] | `user_radiance_collection`, `user_virtual_gifts_received`, `virtual_gifts`. | Canonical has decoration packages and Anom Coin concepts, but not this gift/radiance system. | **Future design candidate only.** Gifting can create safety, spending, and minor-protection requirements that need a new audited design. |
| [`0008_cool_tattoo.sql`][15] | `comment_reactions`, `comments`, `emotes`, `profile_backgrounds`, `user_profile_backgrounds`. | Canonical has lounge reactions and profile settings/decorations but no same-named public-comment or emote/background tables. | **Do not port directly.** Public comments and custom emotes must first inherit reporting, blocks, feature flags, moderation status, and age gates. |
| [`0009_charming_lyja.sql`][16] | `shop_products`, `user_about_me`, `user_purchases`, `user_reels`, `user_videos`. | Canonical has profile data, merch request/order models, Anom’s Corner, and native Pixel & Dot playback, but not these exact generic shop/reel/video tables. | **Selective content-model review only.** The canonical version is a better base for protected children’s content; avoid creating a second unmoderated media/catalogue system. |
| [`0010_mean_spitfire.sql`][17] | `achievement_points`, `anom_coin_purchases`, `color_pages`, `creator_content_gallery`, `creator_spaces`, `games`, `user_achievements_new`. | Canonical has game scores, achievement tables, Kids Corner activities, and age-assurance support, but no same-named creator/content catalogue schema. | **Selective future concept review only.** The creator-space, colouring, and game-catalogue ideas are not migration-ready and must be designed around current safety rules. |

## Final porting disposition

| Item | Recommendation |
|---|---|
| Glow Locker UI | **Rebuild later from the visual concept**, using canonical server-backed decoration ownership and Anom Coin persistence. Do not copy the static component. |
| Nine-video mapping | **Preserve as a curation reference.** Verify ownership, accuracy, and availability before importing any approved metadata into the canonical content system. |
| WebSocket transport | **Re-architect later; do not port.** The canonical safety layer is stronger today, while the legacy route is not actually subscribed. |
| Achievement trigger engine | **Design a canonical version later.** Keep the rule ideas, replace hard-coded IDs and silent failures with transactional, server-event-driven enforcement. |
| Migrations `0002`–`0010` | **Do not execute or copy.** `0002` is destructive; the remaining migrations represent alternate, unmoderated schemas rather than compatible additions. Review only individual product concepts in separately scoped work. |

## References

[1]: https://github.com/Anomoly247/anom-social-sanctuary-hosting/blob/main/client/src/components/GlowLocker.tsx "Hosting Glow Locker source"
[2]: https://github.com/Anomoly247/anom-social-sanctuary-hosting/blob/main/client/src/pages/Profile.tsx "Hosting profile source"
[3]: https://github.com/Anomoly247/anom-social-sanctuary-hosting/blob/main/client/src/pages/KidsCorner.tsx "Hosting nine-video Anom’s Corner mapping"
[4]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/server/_core/index.ts "AO Universe WebSocket server setup"
[5]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/server/routers.ts "AO Universe lounge router"
[6]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/client/src/hooks/useLoungeChatWebSocket.ts "AO Universe WebSocket client hook"
[7]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/client/src/pages/LoungeDetail.tsx "AO Universe lounge page"
[8]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/server/achievements.ts "AO Universe achievement triggers"
[9]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/drizzle/0002_motionless_sunfire.sql "Legacy migration 0002"
[10]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/drizzle/0003_friendly_sinister_six.sql "Legacy migration 0003"
[11]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/drizzle/0004_romantic_gamora.sql "Legacy migration 0004"
[12]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/drizzle/0005_silky_fenris.sql "Legacy migration 0005"
[13]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/drizzle/0006_deep_stepford_cuckoos.sql "Legacy migration 0006"
[14]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/drizzle/0007_greedy_blade.sql "Legacy migration 0007"
[15]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/drizzle/0008_cool_tattoo.sql "Legacy migration 0008"
[16]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/drizzle/0009_charming_lyja.sql "Legacy migration 0009"
[17]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/drizzle/0010_mean_spitfire.sql "Legacy migration 0010"
