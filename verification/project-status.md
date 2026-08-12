# AO Sanctuary Project Status Audit

**Audit scope:** Source and live-schema review only. No production source, database schema, data, or feature behavior was changed while producing this report. The route and procedure inventory reflects the application router at `client/src/App.tsx` and `server/routers.ts`; the live database inventory was queried during this audit.

> **Status definition.** **WORKS** means a route is registered and its primary current implementation is connected to substantive application behavior or static content. **PLACEHOLDER** means the route renders but a primary feature uses sample, local-only, fabricated, or intentionally empty data. **BROKEN** means the route or a primary linked action has a confirmed unresolved failure. This is an evidence-led source audit, not an account-by-account browser acceptance test.

## 1. Route and page status

The registered client routes are defined in `client/src/App.tsx:40-68`. The duplicate `/` registration at lines 40–41 is redundant; Wouter resolves the first matching home route, so it is not currently a separate broken page.

| Route | Page module | Status | Current behavior and evidence |
|---|---|---|---|
| `/` | `Home.tsx` | **WORKS** | Uses profile and DB-backed activity-feed procedures for the current user, activity listing, likes, and ratings. |
| `/profile` | `Profile.tsx` | **WORKS** | Uses profile/settings procedures for account profile and appearance settings. |
| `/profile/:userId` | `PublicProfile.tsx` | **WORKS** | Queries public profile, achievements, and decoration metadata. The public-profile procedure has two hardcoded fields noted in Section 3. |
| `/wallet` | `Wallet.tsx` | **WORKS** | Uses database-backed coin balance and transaction-history procedures. |
| `/achievements` | `Achievements.tsx` | **WORKS** | Uses achievement catalogue, current-user achievements, and profile procedures. |
| `/lounges` | `Lounges.tsx` | **WORKS** | Lists/creates lounges and requests unread counts. Lounge creation now creates the owner membership row. |
| `/lounges/:loungeId` | `LoungeDetail.tsx` | **WORKS** | Uses lounge, member, message, reaction, pin, read-state, and settings procedures. Feature flags gate relevant mutations server-side. |
| `/kids-corner` | `KidsCorner.tsx` | **WORKS** | Renders local curated video/activity content, routes its Pixel & Dot entry to the official channel, and persists activity progress. `kidsCorner.getContent` is fetched but currently returns an empty sample result (`server/db.ts:770-780`). |
| `/anoms-corner` | `AnomsCorner.tsx` | **WORKS** | Static episode selector; the unavailable MP4 was removed. The full-story entry now links to `https://www.youtube.com/@anomoriginals`. |
| `/characters/pixel` | `PixelProfile.tsx` | **WORKS** | Static character-profile page linking back to Anom’s Corner. |
| `/characters/dot` | `DotProfile.tsx` | **WORKS** | Static character-profile page linking back to Anom’s Corner. |
| `/feed` | `SocialFeed.tsx` | **PLACEHOLDER** | In-memory mock posts/reels at `SocialFeed.tsx:34-126`; likes are local state, comments announce “coming soon” at line 143, and post creation is a toast-only action. |
| `/games` | `Games.tsx` | **WORKS** | Game completion calls `games.saveScore`, which persists coin/XP rewards. History and leaderboard procedures remain placeholders but are not called by this page. |
| `/merch` | `Merch.tsx` | **PLACEHOLDER** | Storefront/cart data is local; checkout only shows a success toast. Its request/order procedures are intentional placeholders because the related tables are absent. |
| `/admin` | `Admin.tsx` | **PLACEHOLDER** | Registered admin surface, but analytics and merch request results are placeholder-backed; its Users tab explicitly says the feature is coming soon. |
| `/collaboration` | `CollaborationStation.tsx` | **WORKS** | Uses the four live collaboration tables through project/member/task/update procedures. |
| `/owner-settings` | `OwnerSettings.tsx` | **WORKS** | Uses live `platform_settings` and `audit_log` procedures; access is admin-gated server-side. |
| `/youtube-manager` | `YouTubeManager.tsx` | **PLACEHOLDER** | Entirely local sample-video/channel-stat UI with simulated upload progress and toast-only actions; see `YouTubeManager.tsx:19-119`. |
| `/payment-merch` | `PaymentMerchManagement.tsx` | **PLACEHOLDER** | Explicit sample data at `PaymentMerchManagement.tsx:16-36`; payment, VIP, and order controls are not persisted. |
| `/business-control` | `BusinessControlCenter.tsx` | **PLACEHOLDER** | Metrics, credentials, activity, and sessions are hardcoded at `BusinessControlCenter.tsx:35-135`. |
| `/mission` | `MissionRally.tsx` | **PLACEHOLDER** | Impact metrics, stories, and leaderboard are declared mock data at `MissionRally.tsx:23-70`; the pledge is local state only. |
| `/mission-hub` | `MissionHub.tsx` | **PLACEHOLDER** | Impact metrics are local literals at `MissionHub.tsx:15-20`; donation feedback is toast-only. |
| `/music-library` | `MusicLibrary.tsx` | **PLACEHOLDER** | The page renders correctly, but the `music` router reads a hardcoded in-memory `MUSIC_LIBRARY`, not the absent `music_library` table. |
| `/owner` | `OwnerControlPanel.tsx` | **WORKS** | Live owner controls for system stats, users, audit, events, and safety feature flags. The Feature Controls tab hook-order defect was previously removed. |
| `/moderation` | `ModerationQueue.tsx` | **WORKS** | Uses the server-side moderator queue and action procedure. Ambassador-or-higher access is enforced in `server/routers.ts:321-352`. |
| `/404` and unmatched routes | `NotFound.tsx` | **WORKS** | Explicit route and final fallback return the NotFound page. |

### Unrouted page modules

| Page module | Status | Finding |
|---|---|---|
| `AdminDashboard.tsx` | **UNROUTED** | Not imported or registered in `client/src/App.tsx`; the registered `/admin` route instead renders `Admin.tsx`. |
| `ComponentShowcase.tsx` | **UNROUTED / BROKEN IF MOUNTED** | Not registered. It invokes `trpc.ai.chat`, but no `ai` router is mounted in `server/routers.ts`; it also links to the nonexistent `/components` route. |

## 2. tRPC procedure inventory

All procedures below are mounted through `appRouter` unless stated otherwise. “Database-backed” means the procedure delegates to a query/mutation helper; “static” or “placeholder” is identified separately in Section 3.

### Root application routers — `server/routers.ts`

| Router | Procedure | What it does |
|---|---|---|
| `auth` | `me` | Returns the current optional request user/session identity. |
| `auth` | `logout` | Clears the local session cookie and returns success. |
| `profile` | `getMe` | Loads or creates the authenticated user’s profile. |
| `profile` | `getPublic` | Returns a restricted public projection of another user profile. |
| `profile` | `updateTheme` | Saves the authenticated user’s neon theme. |
| `profile` | `applyDecorations` | Saves selected decoration package IDs to the user profile. |
| `profile` | `updateProfile` | Saves the authenticated user’s bio; the accepted `name` input is not persisted. |
| `profile` | `updateNameColor` | Saves the authenticated user’s name-color preference. |
| `decorations` | `list` | Lists decoration package records. |
| `coin` | `getBalance` | Returns the authenticated user’s Anom Coin balance. |
| `coin` | `earn` | Creates an earned coin transaction. |
| `coin` | `spend` | Creates a spent coin transaction. |
| `coin` | `history` | Lists the authenticated user’s coin transactions. |
| `achievement` | `getAll` | Lists all achievement definitions. |
| `achievement` | `getUserAchievements` | Lists a requested user’s unlocked achievements. |
| `achievement` | `addXP` | Adds XP to the authenticated user profile. |
| `achievement` | `unlock` | Creates a user-achievement record. |
| `kidsCorner` | `getContent` | Intended to return Kids Corner content; currently returns an empty sample result. |
| `kidsCorner` | `trackProgress` | Records a completed Kids Corner activity for the authenticated user. |
| `kidsCorner` | `getMyProgress` | Lists the authenticated user’s Kids Corner progress. |
| `lounge` | `create` | Creates a lounge and inserts the creator as an `owner` in `lounge_members`. |
| `lounge` | `getMyLounges` | Lists lounges owned by the authenticated user. |
| `lounge` | `getById` | Fetches one lounge by ID. |
| `lounge` | `getMembers` | Lists members and user identity fields for a lounge. |
| `lounge` | `addMember` | Adds a user to a lounge with an optional role. |
| `lounge` | `removeMember` | Removes a user from a lounge membership. |
| `lounge` | `sendMessage` | Sends a lounge message; image uploads are feature-flag gated. |
| `lounge` | `getMessages` | Reads visible lounge messages with server-side moderation/block filtering. |
| `lounge` | `updateSettings` | Updates selected lounge fields. |
| `lounge` | `toggleReaction` | Toggles a reaction; standard/custom reactions are feature-flag gated. |
| `lounge` | `pinMessage` | Lets the lounge owner pin/unpin a message after feature-flag validation. |
| `lounge` | `markRead` | Updates the current user’s lounge read state. |
| `lounge` | `getUnreadCounts` | Returns unread counts for supplied lounge IDs. |
| `activityFeed` | `list` | Lists recent activity events. |
| `activityFeed` | `like` | Records/toggles a like on an activity event. |
| `activityFeed` | `rate` | Records a 1–5 rating for an activity event. |
| `safety` | `submitReport` | Creates a report about a user, profile, lounge, message, or post. |
| `safety` | `blockUser` | Creates a user-block record for the authenticated user. |
| `safety` | `unblockUser` | Removes the caller’s block record. |
| `safety` | `listBlocks` | Lists blocked user IDs for the caller. |
| `safety` | `getModerationQueue` | Returns the role-gated moderation queue for ambassador-or-higher users. |
| `safety` | `takeModerationAction` | Executes a role-limited moderation action with a written reason. |
| `safety` | `getFeatureFlags` | Lists current platform feature-flag values. |
| `safety` | `setFeatureFlag` | Admin-only flag update with prerequisite validation and audit logging. |
| `safety` | `disableAllUgc` | Admin-only emergency disabling of all user-generated-content features. |
| `merch` | `createRequest` | Placeholder response with a random ID; does not write a request. |
| `merch` | `getMyRequests` | Placeholder empty request history. |
| `merch` | `getMyOrders` | Placeholder empty order history. |
| `collaboration` | `createProject` | Inserts a collaboration project. |
| `collaboration` | `getProjects` | Lists collaboration projects; current helper does not apply the requested limit/offset. |
| `collaboration` | `getProject` | Loads a project by ID. |
| `collaboration` | `getMyProjects` | Currently returns all projects rather than only caller memberships. |
| `collaboration` | `joinProject` | Adds the caller as a project member. |
| `collaboration` | `createTask` | Inserts a project task. |
| `collaboration` | `getTasks` | Lists tasks for a project. |
| `collaboration` | `completeTask` | Marks a task completed. |
| `collaboration` | `getUpdates` | Lists project updates. |
| `collaboration` | `addUpdate` | Adds a project update/comment. |
| `admin` | `getMerchRequests` | Admin-only request listing; helper currently returns an empty placeholder list. |
| `admin` | `approveMerchRequest` | Admin-only placeholder status acknowledgment; no table update occurs. |
| `admin` | `rejectMerchRequest` | Admin-only placeholder status acknowledgment; no table update occurs. |
| `admin` | `getAnalytics` | Admin-only fixed zero-value analytics object. |
| `ownerSettings` | `getSettings` | Loads the platform settings record. |
| `ownerSettings` | `updateSettings` | Admin-only platform-settings update plus audit action. |
| `ownerSettings` | `getAuditLog` | Admin-only audit-log listing. |

### `system` router — `server/_core/systemRouter.ts`

| Procedure | What it does |
|---|---|
| `health` | Public static health acknowledgement, `{ ok: true }`. |
| `notifyOwner` | Admin-only owner-notification dispatch through the configured notification helper. |
| `getStats` | Admin-only aggregate system statistics from users, lounges, coin transactions, and achievements. |
| `getAllUsers` | Admin-only user listing. |
| `updateUserRole` | Admin-only role change with self-demotion protection and audit record. |
| `updateUserStatus` | Admin-only active/suspended status change with self-suspension protection and audit record. |
| `bulkUpdateUserRole` | Admin-only bulk role update with pre-validation and audit record. |
| `bulkUpdateUserStatus` | Admin-only bulk status update with pre-validation and audit record. |
| `getAuditSummaryStats` | Admin-only aggregate audit metrics/timeline. |
| `getAuditLogs` | Admin-only filtered/paginated audit-log query. |
| `exportAuditLogsCsv` | Admin-only export of filtered audit logs as escaped CSV text. |
| `getEvents` | Admin-only event listing reconstructed from event audit-log records. |
| `updateSettings` | Admin-only subset update of platform settings. |
| `createEvent` | Admin-only event creation represented in the audit log. |
| `deleteEvent` | Admin-only event deletion. |

### `settings` router — `server/settings.procedures.ts`

| Procedure | What it does |
|---|---|
| `getSettings` | Loads all persisted settings for the authenticated user. |
| `updateTheme` | Persists the caller’s neon theme. |
| `updateNameColor` | Persists the caller’s display-name color. |
| `updateBio` | Persists the caller’s bio. |
| `updateProfileImage` | Persists the caller’s profile-image URL. |
| `updateDecorations` | Persists selected decoration package IDs. |
| `updateSettings` | Batch-persists bio, theme, name color, and decoration settings. |

### `games` router — `server/games.procedures.ts`

| Procedure | What it does |
|---|---|
| `saveScore` | Awards configured coin and XP rewards, then returns updated profile balance/level. |
| `getGameHistory` | Placeholder empty history because no game-history persistence is implemented. |
| `getLeaderboard` | Placeholder empty leaderboard because detailed game tracking is not implemented. |

### `music` router — `server/music.procedures.ts`

| Procedure | What it does |
|---|---|
| `getAllTracks` | Returns the static in-memory music catalogue. |
| `search` | Filters the static music catalogue by text, genre, and mood. |
| `getByMood` | Filters static tracks by mood. |
| `getByGenre` | Filters static tracks by genre. |
| `getForUseCase` | Maps a use case to a mood and returns static tracks. |
| `getPopular` | Returns the first static tracks; no usage analytics query occurs. |
| `getLicenseInfo` | Returns static license metadata. |
| `getGenres` | Derives genres from static tracks. |
| `getMoods` | Derives moods from static tracks. |
| `getTrackById` | Finds a static track by ID. |

### `sharing` router — `server/sharing.procedures.ts`

| Procedure | What it does |
|---|---|
| `generateMusicShareUrls` | Generates card data, platform share URLs, and a quote for supplied music metadata. |
| `generateImpactShareUrls` | Generates card data, platform share URLs, and a quote for supplied impact metadata. |
| `getMusicShareQuote` | Generates a music share quote. |
| `getImpactShareQuote` | Generates an impact share quote. |

### `membership` router — `server/membership.procedures.ts`

| Procedure | What it does |
|---|---|
| `getTiers` | Returns static membership-tier definitions. |
| `getTierDetails` | Validates and returns one static tier definition. |
| `getTierComparison` | Returns a comparison derived from static tier definitions. |
| `getMyMembership` | Reads the caller profile and computes current membership status. |
| `getUpgradePrice` | Calculates an in-memory price difference between defined tiers. |
| `createTip` | Attempts to insert a tip into the absent `tips` table. |
| `getTipHistory` | Attempts to read caller tips from the absent `tips` table. |
| `getTipLeaderboard` | Placeholder empty list. |
| `getTotalTips` | Placeholder `0` total. |
| `createTierUpgrade` | Persists a pending `tier_purchases` row and returns its real database ID/row. |
| `getTierPurchaseHistory` | Lists the caller’s persisted tier-purchase rows. |

### Declared but not mounted

`server/_core/voiceTranscription.ts` contains an audio-transcription helper, but its “voice router” is documentation only (`voiceTranscription.ts:245-283`). No `voice` tRPC router is mounted in `server/routers.ts`, so there is no live `trpc.voice.*` procedure.

## 3. Procedures returning mock, placeholder, or hardcoded data

| Procedure or helper | Evidence | Current behavior |
|---|---|---|
| `profile.getPublic` | `server/routers.ts:42-54` | Uses the viewer’s `ctx.user?.name` instead of the profile owner’s name and always returns `achievements: 0`. |
| `kidsCorner.getContent` → `getKidsContent` | `server/db.ts:770-780` | Explicitly returns `[]` as “sample content for now.” |
| `merch.createRequest` | `server/routers.ts:375-387` | Returns `{ success: true, requestId: Math.random() }` without persistence. |
| `merch.getMyRequests` | `server/routers.ts:389-392` | Always returns `[]`; no request history query. |
| `merch.getMyOrders` | `server/routers.ts:394-397` | Always returns `[]`; no order history query. |
| `admin.getMerchRequests` → `getAllMerchRequests` | `server/db.ts:1130-1140` | Always returns `[]`, explicitly because the table may not exist. |
| `admin.approveMerchRequest` / `admin.rejectMerchRequest` → `updateMerchRequestStatus` | `server/db.ts:1081-1092` | Always returns success without updating any record. |
| `admin.getAnalytics` → `getAdminAnalytics` | `server/db.ts:1106-1126` | Always returns the hardcoded zero-value `emptyAdminAnalytics` object. |
| `games.getGameHistory` | `server/games.procedures.ts:67-84` | Returns zero totals and an empty game list. |
| `games.getLeaderboard` | `server/games.procedures.ts:86-101` | Returns no players and `yourRank: 0`. |
| Every `music.*` read | `server/music.ts:29-205` | Uses a hardcoded `MUSIC_LIBRARY`; `getPopularMusic` also slices the static array rather than analytics. |
| `membership.getTipLeaderboard` | `server/membership.procedures.ts:119-124` | Always returns `[]`. |
| `membership.getTotalTips` | `server/membership.procedures.ts:129-132` | Always returns `0`. |
| `system.health` | `server/_core/systemRouter.ts:7-15` | Intentionally returns a fixed health acknowledgement; it is not a database health check. |

## 4. Missing database tables and page impact

The live database contains 28 tables, including the recently added `tier_purchases` and all four collaboration tables. The Drizzle schema still declares ten tables absent from the live database: `chat_notifications`, `game_scores`, `merch_orders`, `merch_requests`, `music_library`, `tips`, `user_presence`, `user_vip_subscriptions`, `vip_benefits_log`, and `vip_tiers`.

| Absent table | Runtime reference | Page impact today |
|---|---|---|
| `merch_requests` | No real query. Admin/merch procedures deliberately return placeholders. | `/merch` and `/admin` do **not** execute a missing-table query; their request features are placeholders. |
| `merch_orders` | No real query. Merch order history deliberately returns a placeholder. | `/merch` does **not** execute a missing-table query; its order history is empty by design. |
| `game_scores` | No runtime reference; game history/leaderboard are placeholder procedures. | `/games` does **not** query it. Score rewards still write coin/XP data. |
| `music_library` | No runtime reference; music uses static service data. | `/music-library` does **not** query it. It displays hardcoded catalogue data. |
| `tips` | `server/db.ts:1313-1336` inserts/selects it for mounted membership tip procedures. | No registered page calls `trpc.membership.*`; if a caller invokes `createTip` or `getTipHistory`, the request will fail against the absent table. |
| `vip_tiers` | `server/db.ts:884-894` selects it. | No mounted tRPC procedure or registered page reaches this helper. |
| `user_vip_subscriptions` | `server/db.ts:896-920` selects/inserts it. | No mounted tRPC procedure or registered page reaches these helpers. |
| `vip_benefits_log` | `server/db.ts:922-937` inserts it. | No mounted tRPC procedure or registered page reaches this helper. |
| `chat_notifications` | Schema-only in current application source. | No page or mounted procedure queries it. |
| `user_presence` | Schema-only in current application source. | No page or mounted procedure queries it. |

> **Conclusion:** No currently registered page has a confirmed direct database query that reaches a missing table. The `/merch`, `/admin`, `/games`, and `/music-library` routes avoid database errors because their affected features are placeholder or static rather than table-backed. The mounted but currently unreferenced membership tip procedures are the confirmed callable absent-table failure path.

## 5. Known broken or non-production client URLs

| Location | URL or route | Finding |
|---|---|---|
| `client/src/components/ChatWidget.tsx:71,80,89,98` | `https://via.placeholder.com/32?...` | The placeholder-image host failed the audit HTTP probe (`000` / request failure). These chat avatar URLs are currently broken. |
| `client/src/pages/YouTubeManager.tsx:30,42,54,66` | `https://via.placeholder.com/320x180?...` | Same unreachable placeholder host; all sample thumbnails are broken. |
| `client/src/pages/YouTubeManager.tsx:31,43` | `https://youtube.com/watch?v=example1` and `...example2` | Non-production sample video identifiers, not real channel content. The probe was rate-limited by YouTube (`429`), but the literal IDs are still known dummy values. |
| `client/src/pages/SocialFeed.tsx:150` | `/feed/post/${postId}` | Generated share URL has no matching `App.tsx` route, so any such internal post link resolves to NotFound. |
| `client/src/pages/ComponentShowcase.tsx:854` | `/components` | No route is registered; the module itself is unrouted. |
| `client/src/components/Map.tsx:92` | `https://forge.butterfly-effect.dev` | Direct probe returned `403`. This is an integration endpoint rather than a user-facing link; map functionality depends on its intended authenticated/proxied request path. |

The formerly dead Pixel & Dot `/manus-storage/v8_pixel_dot_full_story_final_45228357.mp4` reference is **not present anywhere under `client/`** after commit `aa933ff`. The replacement `https://www.youtube.com/@anomoriginals` returned HTTP `200` during this audit.

## 6. Audit boundary

This audit intentionally records findings and does not repair them. The current repository has unresolved deployment infrastructure risk documented separately in `verification/deployment-runbook.md`, including the startup `process.exit()` side effect in `server/ensure_safety_tables.ts`. That issue is not restated as a route failure because it affects fresh external-server startup rather than a client page’s implementation.
