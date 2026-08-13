# Membership Tier Usage Audit

**Scope.** This is a read-only source audit of `server/`, `client/`, `drizzle/`, and server test files. It inventories direct access to `user_profiles.membership_tier`, every active hardcoded `basic`, `vip`, and `super_vip` tier value, and human-readable VIP terminology that would be affected by a tier-name revision. Generated dependencies and prior verification reports are excluded.

> **Key finding:** There is **no active server mutation that updates `user_profiles.membership_tier`**. The current upgrade procedure reads the current profile tier and inserts a `tier_purchases` record, but it does not update the profile’s `membership_tier` column. The only active write-capable path is the generic `updateUserProfile` helper, which has no current caller supplying `membershipTier`.

## Direct `user_profiles.membership_tier` definition, read, and write paths

| Access | File and line | Evidence | Operational effect |
|---|---|---|---|
| Schema definition/default | `drizzle/schema.ts:42` | `membershipTier` maps to `membership_tier` enum `basic`, `vip`, `super_vip` with default `basic`. | Primary application-schema contract. |
| Initial SQL definition | `drizzle/0001_purple_red_ghost.sql:304` | Creates `user_profiles.membership_tier` with the same three enum values and `basic` default. | Fresh-database migration contract. |
| Historical schema snapshots | `drizzle/meta/0001_snapshot.json:1966-1968`, `0002_snapshot.json:1962-1964`, `0003_snapshot.json:1962-1964` | Persist the historic column name and enum values. | Drizzle metadata; not runtime code. |
| Runtime fallback DDL | `server/db.ts:133-150`, especially `:144` | `getOrCreateUserProfile` runs `CREATE TABLE IF NOT EXISTS` containing the legacy enum/default. | Runtime bootstrap can recreate the legacy definition on a missing table. |
| Runtime table helper DDL | `server/ensure_tables.ts:24` | Creates the same legacy `membership_tier` enum/default. | Separate runtime table bootstrap path. |
| Profile-row read and implicit profile creation | `server/db.ts:155-172` | `getOrCreateUserProfile` selects the full `userProfiles` row; an inserted profile omits `membershipTier`, relying on its database default. | The selected object includes `membershipTier`; new users start at `basic`. |
| Generic write-capable helper | `server/db.ts:194-207`, especially `:205` | `updateUserProfile` performs `db.update(userProfiles).set(updates)`. | Can write `membershipTier` if a caller supplies it, but no active caller does. |
| Current member-tier read | `server/membership.procedures.ts:45-71`, especially `:53` | `membership.getMyMembership` reads `profile.membershipTier` and defaults to `basic`. | Returns the tier and derived display/expiry data to an authenticated caller. |
| Upgrade-path current-tier read | `server/membership.procedures.ts:137-165`, especially `:149-155` | `membership.createTierUpgrade` reads `profile?.membershipTier` and defaults to `basic` before pricing and creating a purchase. | Uses legacy values for price calculation and purchase typing; **does not update profile membership**. |
| Profile endpoint full-row return | `server/routers.ts:33-35` | `profile.getMe` returns the full result of `getOrCreateUserProfile`. | Authenticated client receives `membershipTier` as part of the profile object. |
| Public-profile internal full-row read | `server/routers.ts:39-41` | `profile.getPublic` loads the full profile row alongside owner and achievement data. | It does not expose `membershipTier` in its returned public fields. |
| Game procedure implicit full-row read | `server/games.procedures.ts:50-52` | Retrieves the full profile after a game action. | Reads a row containing `membershipTier`; the procedure does not use that field. |
| Settings persistence implicit full-row reads | `server/settingsPersistence.ts:25-26`, `:61-80` | Ensures/loads the full profile row. | Does not return or write `membershipTier`; it reads other settings only. |

## Tier purchases and adjacent VIP tables

These references do **not** read or write `user_profiles.membership_tier`, but they persist or define the same legacy tier values and therefore require coordinated revision with the profile enum.

| File and line | Legacy dependency | Read/write behavior |
|---|---|---|
| `drizzle/schema.ts:548` | `tier_purchases.tier` enum uses `basic`, `vip`, `super_vip`. | Schema definition for purchase history. |
| `drizzle/0001_purple_red_ghost.sql:245` and `drizzle/0007_tier_purchases.sql:4` | SQL enum for purchase tiers uses the same legacy values. | Migration definitions. |
| `server/db.ts:1355-1393` | `createTierPurchase` accepts the three-value union and inserts its `tier` into `tier_purchases`. | Active persistence write, distinct from profile membership. |
| `server/membership.procedures.ts:151-158` | Casts requested upgrade to `basic \| vip \| super_vip`. | Active call into the tier-purchase write helper. |
| `server/membership.procedures.ts:170-173` | Retrieves a user’s tier-purchase history. | Active purchase-tier read. |
| `server/membership.procedures.test.ts:28`, `:35`, `:44` | Uses hardcoded `vip` purchase fixtures/assertions. | Regression-test terminology. |
| `drizzle/schema.ts:421-456` | Defines `vip_tiers`, `user_vip_subscriptions`, and `vip_benefits_log`. | Adjacent VIP-named schema; these tables are not the profile column. |
| `server/db.ts:901-951` | `getVipTiers`, `getUserVipSubscription`, `createVipSubscription`, and `logVipBenefit`. | Reads/writes adjacent VIP tables, not `membership_tier`. |

## Membership module hardcoded tier names

| File and line | Hardcoded values or labels | Role |
|---|---|---|
| `server/membershipTiers.ts:6` | Union type: `basic \| vip \| super_vip`. | Canonical server-side type. |
| `server/membershipTiers.ts:47-150` | Tier keys and definitions; labels include `Basic`, `Basic Member`, `VIP`, `VIP Member`, `Super VIP`, and `Super VIP Member`. Benefits include VIP and Super VIP wording at `:90`, `:94`, `:120`, `:122`, and `:124`. | Canonical public tier copy, pricing, benefits, colors, and feature policy. |
| `server/membershipTiers.ts:155-157` | Falls back to `TIER_DEFINITIONS.basic`. | Tier lookup fallback. |
| `server/membershipTiers.ts:222` | Labels the default/permanent tier as `basic`. | Documentation comment. |
| `server/membershipTiers.ts:273` | Validates exactly `basic`, `vip`, or `super_vip`. | Input validation boundary. |
| `server/membership.procedures.ts:53`, `:151`, `:155` | Defaults/casts `basic`, `vip`, and `super_vip`. | Current membership and upgrade flows. |
| `server/stripe.products.ts:8-28`, `:86-87` | `MEMBERSHIP_VIP`, `MEMBERSHIP_SUPER_VIP`, `Anom Artsy VIP`, `Anom Artsy Super VIP`, and tier-product mapping. | Stripe product catalogue terminology; Stripe integration is not active in this project. |
| `server/featureFlags.ts:8` | `vip_custom_emoji`, its VIP label, and VIP-member description. | Feature flag terminology; does not read profile tier. |

## Client-side consumers and hardcoded tier labels

| File and line | Finding | Relationship to `membership_tier` |
|---|---|---|
| `client/src/components/MembershipCard.tsx:12`, `:36-39`, `:47-50`, `:127` | Component hardcodes the three-value tier union plus VIP/Super VIP icon, color, and text-color branches. | Presentation component for tier data. No import or render call was found elsewhere in `client/src`; it is currently unconnected. |
| `client/src/components/TippingModal.tsx:19` | Calls `membership.createTip`; it does not call tier reads or writes. | Membership-router consumer unrelated to tier names. |
| `client/src/components/ChatWidget.tsx:72` | Static chat text: `Just launched the new VIP system`. | Demo/placeholder wording; no profile-tier access. |
| `client/src/pages/AdminDashboard.tsx:247-249` | Static `<option>` labels: `Basic`, `VIP`, and `Super VIP`. | Legacy selector copy; not wired to `membership_tier`. |
| `client/src/pages/BusinessControlCenter.tsx:76`, `:80`, `:219`, `:454` | Static activity/metric labels: `VIP Subscription Created`, `VIP tier subscription`, `VIP Subscribers`, and `VIP Members`. | Dashboard copy; this page is placeholder-backed. |
| `client/src/pages/Home.tsx:254` | Static achievement label: `VIP Pioneer`. | Achievement copy; no profile-tier access. |
| `client/src/pages/OwnerControlPanel.tsx:128` | UI descriptor for `vip_custom_emoji` and VIP-only reactions. | Feature-flag terminology; not a profile-tier read. |
| `client/src/pages/PaymentMerchManagement.tsx:25-28`, `:101`, `:131`, `:152`, `:169`, `:238` | Mock transaction data and dashboard labels use `VIP`, `VIP Max`, and `Free VIP`. | Placeholder page terminology; no database query. |
| `client/src/pages/Profile.tsx:26-27` | Cosmetic option labels: `Gold (VIP)` and `Silver (VIP Max)`. | Profile customization copy; unrelated to `membership_tier`. |
| `client/src/pages/YouTubeManager.tsx:35-36` | Static content title/description mention VIP membership and VIP tiers. | Placeholder content copy; no tier read. |

## Client data-flow conclusion

No `client/src` file calls `trpc.membership.getMyMembership`, `trpc.membership.createTierUpgrade`, `trpc.membership.getTierPurchaseHistory`, `trpc.membership.getTiers`, `trpc.membership.getTierDetails`, or `trpc.membership.getTierComparison`. The only current client call into the membership router is `TippingModal.tsx:19` for `createTip`. Consequently, the active membership-tier column is surfaced through `profile.getMe`, rather than through a mounted membership-management UI.

## Revision impact summary

| Revision target | Must be revised together |
|---|---|
| Profile column enum | `drizzle/schema.ts`, `drizzle/0001_purple_red_ghost.sql`, runtime table DDL in `server/db.ts` and `server/ensure_tables.ts`, plus Drizzle metadata when generating a new migration. |
| Membership domain model | `server/membershipTiers.ts`, membership procedure defaults/casts, `createTierPurchase` type, `tier_purchases` schema/migration, and tier-purchase regression tests. |
| Product/catalogue labels | `server/stripe.products.ts`, `MembershipCard.tsx`, admin/dashboard placeholder copy, feature-flag wording, profile cosmetic labels, and video content metadata. |
| Existing database records | Existing `user_profiles.membership_tier` and `tier_purchases.tier` values require an explicit data migration before narrowing or renaming either enum. |
