# Missing Drizzle Tables Audit

**Scope.** This is a read-only audit of the 15 table names supplied in the request. Although the request calls them “13 tables,” it lists **15 distinct tables**. “Reachable” means a route or rendered component currently invokes the backed procedure; a routed page using local/mock data is identified as a stub rather than a database-backed feature.

## Table-by-table findings

| Table | Server table usage (file + line) | Client surface that would hit it | Reachable in UI today? | Verdict |
|---|---|---|---|---|
| `chat_notifications` | **None.** Schema-only definition at `drizzle/schema.ts:506`; no server query or mutation references. | None. | No. | **NOT IMPLEMENTED — schema only.** |
| `collaboration_members` | `server/db.ts:980` inserts members; `server/db.ts:993` selects project members. The live join procedure calls the insert helper at `server/routers.ts:435-440`. | `client/src/pages/CollaborationStation.tsx:76-86` invokes `trpc.collaboration.joinProject`. | Yes: `/collaboration` is registered at `client/src/App.tsx:55`; join action is visible in the station. | **BUILT — missing migration.** |
| `collaboration_projects` | `server/db.ts:933`, `951`, and `963` insert/select projects. Procedures expose those helpers at `server/routers.ts:401-432`. | `client/src/pages/CollaborationStation.tsx:37-45, 63-74` calls list/detail/create procedures. | Yes: `/collaboration`. | **BUILT — missing migration.** |
| `collaboration_tasks` | `server/db.ts:1005`, `1018`, `1030-1031` insert/select/update tasks. Procedures are exposed at `server/routers.ts:442-468`. | `client/src/pages/CollaborationStation.tsx:51-57, 88-111` calls list/create/complete procedures. | Yes: `/collaboration`. | **BUILT — missing migration.** |
| `collaboration_updates` | `server/db.ts:1044` inserts and `1062` selects updates. Procedures are exposed at `server/routers.ts:470-487`. | `client/src/pages/CollaborationStation.tsx:57-63, 113-121` calls get/add-update procedures. | Yes: `/collaboration`. | **BUILT — missing migration.** |
| `game_scores` | **None.** Schema-only definition at `drizzle/schema.ts:242`; no server query or mutation references. | `client/src/pages/Games.tsx:297, 339, 366` maintains `gameScores` in local React state only. | The games page is reachable at `/games` (`client/src/App.tsx:52`), but it does not persist to this table. | **NOT IMPLEMENTED — schema only.** |
| `merch_orders` | **None.** Schema-only definition at `drizzle/schema.ts:221`; no server query or mutation references. | `client/src/pages/PaymentMerchManagement.tsx:31, 186, 278` uses a local `merchOrders` array. | `/payment-merch` is routed (`client/src/App.tsx:58`), but it is mock/local data. | **NOT IMPLEMENTED — schema only.** |
| `merch_requests` | No real table query. `server/db.ts:1070-1078` is an acknowledged placeholder; `server/db.ts:1119-1125` returns an empty array. Admin procedures call those stubs at `server/routers.ts:491-519`. | `client/src/pages/Admin.tsx:16, 26-35` and `client/src/pages/AdminDashboard.tsx:19, 38-47` call the admin procedures. | Yes: `/admin` is routed (`client/src/App.tsx:54`), but the data path is a stub and returns no persisted records. | **NOT IMPLEMENTED — schema only.** |
| `music_library` | **None.** Schema-only definition at `drizzle/schema.ts:473`; `server/music.procedures.ts:19-112` uses `server/music.ts`, whose source is an in-memory `MUSIC_LIBRARY` at `server/music.ts:29`. | `client/src/pages/MusicLibrary.tsx:14-17` calls the mock-backed music procedures. | Yes: `/music-library` (`client/src/App.tsx:63`), but it is mock-backed. | **NOT IMPLEMENTED — schema only.** |
| `tier_purchases` | **None.** Schema-only definition at `drizzle/schema.ts:545`. `server/membership.procedures.ts:137-159` returns a random placeholder purchase ID and empty history rather than querying this table. | No client call site for `createTierUpgrade` or `getTierPurchaseHistory` was found. | No. | **NOT IMPLEMENTED — schema only.** |
| `tips` | `server/db.ts:1311-1316` inserts tips; `server/db.ts:1320-1324` retrieves history. Both are exposed at `server/membership.procedures.ts:95-114`. | `client/src/components/TippingModal.tsx:19-43` invokes `trpc.membership.createTip`. No rendered import/use of `TippingModal` was found. | No current rendered trigger, despite the implemented server procedure and component. | **BUILT — missing migration.** |
| `user_presence` | **None.** Schema-only definition at `drizzle/schema.ts:492`; no server query or mutation references. | None. | No. | **NOT IMPLEMENTED — schema only.** |
| `user_vip_subscriptions` | `server/db.ts:890` selects and `903` inserts subscriptions. No tRPC procedure imports these helpers. | None. | No. | **BUILT — missing migration** at the database-helper layer; not yet connected to a route or UI. |
| `vip_benefits_log` | `server/db.ts:916-920` inserts benefit-log rows. No tRPC procedure imports this helper. | None. | No. | **BUILT — missing migration** at the database-helper layer; not yet connected to a route or UI. |
| `vip_tiers` | `server/db.ts:878` selects available VIP tiers. No tRPC procedure imports this helper. | None. | No. | **BUILT — missing migration** at the database-helper layer; not yet connected to a route or UI. |

## `users.age_bracket` read audit

`users.age_bracket` is **not read anywhere** in server or client code. The only code occurrence is a schema-altering write in `server/ensure_safety_tables.ts:41`, which adds the database column if absent. There are no reads, filters, projections, serializers, client references, or Drizzle fields for either `age_bracket` or `ageBracket`.

> The column is therefore database-only legacy state. The active age model is represented by the Drizzle `users.ageTier` field, not `age_bracket`.
