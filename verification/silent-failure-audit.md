# Silent-Failure Audit: Mounted tRPC Procedures

**Scope.** This is a read-only static audit of the procedures mounted by `server/routers.ts:17-583`, including its nested routers and the mounted `system`, `settings`, `games`, `music`, `sharing`, and `membership` routers. It traces procedures that return an explicit success-shaped response, or return a helper conventionally interpreted as success, to their database helper.

> **Audit boundary:** A source trace can prove whether a database write is attempted and whether errors/zero-row results are checked. It cannot prove that a particular production request reached the database. Procedures that do not claim a database write—such as logout, notification delivery, or CSV generation—are noted but are not classified as persistence failures.

## Procedures that can report success without persisting the claimed action

| Severity | Mounted procedure | Procedure evidence | Non-persisting path | Helper evidence | Verdict |
|---|---|---|---|---|---|
| **High** | `merch.createRequest` | `server/routers.ts:381-393` returns `{ success: true, requestId: Math.random() }`. | It creates neither a `merch_requests` row nor any other persistence record. The returned ID is fabricated. | The procedure itself contains the placeholder comment at `:391`; no database helper is called. | **Confirmed silent success.** |
| **High** | `admin.approveMerchRequest` | `server/routers.ts:507-515` returns `updateMerchRequestStatus(..., "approved")`. | The helper returns success without issuing a database write. | `server/db.ts:1098-1105` explicitly says “For now, return success” and returns `{ success: true }`. | **Confirmed silent success.** |
| **High** | `admin.rejectMerchRequest` | `server/routers.ts:517-525` returns `updateMerchRequestStatus(..., "rejected")`. | Same no-op helper path as approval. | `server/db.ts:1098-1105`. | **Confirmed silent success.** |
| **High** | `activityFeed.like` | `server/routers.ts:283-288` awaits the helper then unconditionally returns `{ success: true }`. | If the database is unavailable or either write throws, the helper catches the error and returns `undefined`; the router still returns success. A nonexistent event also yields a zero-row update without detection. | `server/db.ts:563-574`: returns early when `db` is absent, catches write errors, and never checks affected rows. | **Masked-write success.** |
| **High** | `activityFeed.rate` | `server/routers.ts:289-294` has the same unconditional success return. | Same unavailable-database, caught-error, and zero-row-update paths as `like`. | `server/db.ts:576-589`: returns early when `db` is absent, catches write errors, and never checks affected rows. | **Masked-write success.** |
| **Medium** | `games.saveScore` | `server/games.procedures.ts:20-65` always returns `success: true` once its helper calls resolve. | `addCoinTransaction`, `addXP`, and profile retrieval can return `undefined` when `getDb()` is unavailable; those values are not checked before reporting coin/XP success. | `server/db.ts:244-246` and `:291-293` return `undefined` if no database is available. | **Masked no-database success path.** |
| **Medium** | `system.deleteEvent` | `server/_core/systemRouter.ts:262-271` returns the helper’s success response unless the helper is `undefined`. | A valid database call that matches no event returns `{ success: true }`; no affected-row result is checked. | `server/db.ts:1322-1328` performs the delete then unconditionally returns `{ success: true }`. | **Zero-row success.** |
| **Low** | `lounge.pinMessage` | `server/routers.ts:249-262` returns the helper success after checking only lounge ownership. | A nonexistent or unrelated message ID can produce a zero-row update while reporting success; the helper does not verify row count. | `server/db.ts:703-713` updates by message ID and unconditionally returns `{ success: true }`. | **Zero-row success.** |

## Success-returning procedures traced to real persistence

The following success responses have a concrete write attempt and propagate a database error rather than silently return success. A zero-row outcome is noted where the design makes the operation deliberately idempotent.

| Mounted procedure | Success response path | Persistence evidence | Audit result |
|---|---|---|---|
| `safety.submitReport` | Returns helper `{ success: true }` at `server/safety.ts:48`. | Inserts `reports` at `server/safety.ts:40-47`; errors become a tRPC internal error. | Confirmed write attempt. |
| `safety.blockUser` | Returns helper `{ success: true }` at `server/safety.ts:65`. | Upserts `user_blocks` at `server/safety.ts:61-64`. | Confirmed write attempt. |
| `safety.unblockUser` | Returns helper `{ success: true }` at `server/safety.ts:83`. | Deletes matching `user_blocks` row at `server/safety.ts:77-82`. | Idempotent zero-row delete may report success; it still represents the requested unblocked state rather than a fabricated record. |
| `safety.takeModerationAction` | Router delegates at `server/routers.ts:334-358`. | The mounted helper inserts moderation/audit records and applies the selected state change; see `server/moderation.ts:27-124`. | Confirmed write path. |
| `safety.setFeatureFlag` | Router delegates at `server/routers.ts:364-371`. | Updates `platform_settings.feature_flags` and inserts `audit_log` at `server/featureFlags.ts:89-120`. | Confirmed write path. |
| `safety.disableAllUgc` | Router delegates at `server/routers.ts:373-378`. | Updates `platform_settings.feature_flags` and inserts `audit_log` at `server/featureFlags.ts:127-161`. | Confirmed write path. |
| `lounge.toggleReaction` | Router returns helper at `server/routers.ts:239-247`. | First verifies message existence; then updates `lounge_messages.reactions` at `server/db.ts:675-696`. | Confirmed write path. |
| `lounge.markRead` | Router returns helper at `server/routers.ts:264-268`. | Upserts `lounge_read_states` at `server/db.ts:716-730`. | Confirmed write path. |
| `achievement.unlock` | Router returns helper at `server/routers.ts:118-120`. | Inserts `user_achievements` at `server/db.ts:335-341`; write errors propagate. | Confirmed write path. |
| `membership.createTierUpgrade` | Returns `{ success: true, purchaseId, purchase }` at `server/membership.procedures.ts:137-165`. | A transaction inserts a completed `tier_purchases` row and updates `user_profiles.membership_tier`; see `server/db.ts:1355-1406`. | Confirmed atomic write path. |
| `system.bulkUpdateUserRole` | Returns `{ success: true, count }` at `server/_core/systemRouter.ts:85-110`. | Verifies every user, updates each row, and inserts `audit_log`. | Confirmed write path. |
| `system.bulkUpdateUserStatus` | Returns `{ success: true, count }` at `server/_core/systemRouter.ts:112-137`. | Verifies every user, updates each row, and inserts `audit_log`. | Confirmed write path. |
| `system.updateUserRole` / `system.updateUserStatus` | Return the helper success response at `server/_core/systemRouter.ts:41-83`. | Helpers update `users` at `server/db.ts:1192-1204`; caller existence is checked before the update and audit is written. | Confirmed write path. |
| `settings.updateTheme`, `updateNameColor`, `updateBio`, `updateProfileImage`, `updateDecorations`, `updateSettings` | Return persisted data only when `saveUserSettings` succeeds; see `server/settings.procedures.ts:20-103`. | Settings service calls `updateUserProfile`; it writes and reloads the profile at `server/settingsPersistence.ts:23-45` and `server/db.ts:194-207`. | Confirmed write path. |
| `games.saveScore` — normal database path | Returns a success payload at `server/games.procedures.ts:53-60`. | The normal path writes `user_profiles.anom_coin_balance`, `coin_transactions`, and `user_profiles.xp/level` at `server/db.ts:244-304`. | Persists normally, but the unavailable-database path is flagged above. |

## Success responses not intended to represent database persistence

| Mounted procedure | Source | Why it is not a silent database failure |
|---|---|---|
| `auth.logout` | `server/routers.ts:21-30` | `{ success: true }` confirms clearing the session cookie; it does not claim a database write. |
| `system.notifyOwner` | `server/_core/systemRouter.ts:17-29` | Returns the boolean delivery result of an owner-notification call; it does not claim a database write. |
| `system.exportAuditLogsCsv` | `server/_core/systemRouter.ts:174-225` | Returns generated CSV content and a count; it is a read/export operation. |

## Related placeholder reads, not success-writing procedures

These do not return a success claim after a write, but they are relevant because the UI can look empty or complete while no real source table is queried.

| Procedure | File and line | Observed behavior |
|---|---|---|
| `merch.getMyRequests` | `server/routers.ts:395-398` | Returns an empty array because the table may not exist. |
| `merch.getMyOrders` | `server/routers.ts:400-403` | Returns an empty array because the table may not exist. |
| `admin.getMerchRequests` | `server/routers.ts:497-505` → `server/db.ts:1147-1157` | Always returns an empty array. |
| `admin.getAnalytics` | `server/routers.ts:527-533` → `server/db.ts:1123-1144` | Returns an all-zero placeholder analytics object. |
| `kidsCorner.getContent` | `server/routers.ts:123-126` → `server/db.ts:787-798` | Returns an empty sample-content array. |
| `games.getGameHistory` / `games.getLeaderboard` | `server/games.procedures.ts:67-101` | Return static empty/zero result shapes because the supporting tracking data is absent. |

## Exclusions

`musicRouter` and `sharingRouter` are mounted but expose queries only; they have no success-returning mutation to audit. Internal modules that are not mounted in `appRouter`—including standalone age-assurance helpers—are excluded from this procedure-level report.

## Conclusion

Five mounted actions can positively report success when the claimed persistent state was not written: merch request creation, both merch-status actions, activity likes, activity ratings, and event deletion. Game score saving and message pinning also contain database-unavailable or zero-row success paths that should be treated as reliability defects rather than confirmed persistence. All other mounted success-writing procedures traced above issue concrete database writes and either propagate errors or use intentionally idempotent delete semantics.
