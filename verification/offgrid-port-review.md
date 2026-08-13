# Off Grid Terminal: Canonical Sanctuary Arcade Port Review

**Scope.** This is a read-only review of `Anoms-Hub/anom-artsy-replicate/client/src/pages/OffGrid.tsx` against the canonical Sanctuary Arcade on the `safety-layer` branch. It identifies the work required to port the game, client-side state that cannot remain authoritative, and whether its current coin calls match the canonical procedures. No source, schema, dependency, environment, or database change was made.

> **Conclusion:** The Off Grid Terminal’s presentation and interaction loop are strong port candidates, but the current implementation is a **client-authoritative prototype**. It cannot be copied into the canonical Sanctuary Arcade unchanged because its reward call does not exist in the canonical API and its threat, currency, upgrade, and property state can all be forged in the browser.

## 1. What exists today

The replicated [`OffGrid.tsx`][1] implements a terminal-style resource-and-threat simulation. A 200ms browser timer spawns randomized threat text, command input accepts `status`, `scan`, `clearance`, `levelup`, `shop`, `buy filter`, `buy shield`, and `clear`, and the UI exposes a CRT log, active-threat HUD, purchases, level-driven property tiles, and local save/restore. Clearing threats grants ten coins each; upgrades alter local threat cadence and display state.

| Existing element | Current implementation | Port disposition |
|---|---|---|
| Terminal interface and CRT presentation | Self-contained React UI, command entry, log output, HUD, property tiles, and local visual effects. | **Portable UI.** Adapt styles/components to the canonical Arcade and route structure. |
| Threat loop | Browser `setInterval` ticks every 200ms and derives spawning from client clock/state. | **Rebuild server-authoritatively.** The client may animate a server-provided state but must not decide rewardable threats. |
| Commands | Client parses all commands and mutates local state through `processCommand`. | **Rebuild as a server procedure contract.** The client should submit a named command, not calculate its outcome. |
| Shop and upgrades | Client checks local currency, increments local filter/shield counts, and persists them in `localStorage`. | **Rebuild as persisted server state** with atomic debit/unlock records. |
| Property tiles | Unlock visual content based on browser-owned `player.level`. | **Retain as a derived display.** The unlock level must come from server session state. |
| Coin rewards | Browser calls `onEarnCoins(threats * 10)` after `clearance`; page wrapper calls `trpc.games.earnCoins`. | **Does not match canonical API.** Must be replaced by server-calculated, idempotent reward issuance. |
| Mission hook | The page mounts `useMissionAutoComplete`, which reads `?completeMission=<id>` and calls a mission mutation. | **Do not include by default.** If retained, mission completion must remain server-authorized and independently idempotent. |

## 2. Client-owned state requiring server validation

Every value below is currently browser-controlled. A player can modify the live React state, change saved `localStorage`, alter timer behavior, or call a public mutation from browser tooling. The canonical port must treat this client state as **display cache only**, never as evidence for a reward.

| Current client state / input | How it currently affects gameplay | Required canonical validation |
|---|---|---|
| `activeThreats`, `tickerTimer`, `autoFilterTimer`, and interval cadence | Determines when threats appear and how many can be cleared for coins. | Server derives elapsed time from an authoritative timestamp, session seed, player upgrades, and last processed time. Do not accept threat counts from the client. |
| Random incident selection | Browser selects the incident message with `Math.random()`. | Use a server seed/sequence if incident identity affects outcome; otherwise treat incident text as cosmetic. |
| `player.currency` | Determines whether a filter or shield can be purchased. | Debit the canonical account balance in the same transaction that records the upgrade; never use a browser balance. |
| `player.level`, `filterCount`, `shieldCount`, `inventory` | Controls property unlocks, automatic filtering, and threat interval changes. | Store per-session/game-state fields on the server. Validate each command against the stored state and return the new projection. |
| Local save key `offgrid_player_state_v2` | Restores currency, levels, and upgrades directly from `localStorage`. | Use server persistence for signed-in users. Local storage may cache non-authoritative visual preferences only. |
| `clearance` command and reward amount | Sets threats to zero, multiplies count by ten, and invokes the reward callback from browser code. | Server validates the session, outstanding threats, cooldown, and event sequence; calculates the reward internally; then uses an idempotency key to issue it once. |
| `levelup` command | Increases level without a cost, objective, or cooldown. | Define an authoritative progression rule: e.g., verified clearances, XP, mission completion, or a server-defined cost. |
| `buy filter` / `buy shield` commands | Reads local balance and changes local counts. | Require an active session; check persisted balance; record an upgrade purchase and currency transaction atomically. |
| Raw command text and log HTML | The component renders assembled HTML with `dangerouslySetInnerHTML`. | Keep the command vocabulary allow-listed on the server and return structured log events or escaped text. Do not render user-entered HTML. |
| `completeMission` URL parameter | The hook immediately calls the mission completion mutation when a query parameter is present. | Do not use URL presence as game completion proof. Retain only if the mission procedure independently proves eligibility and prevents replays. |

## 3. Coin-award compatibility

The existing reward call **does not match** the canonical Sanctuary Arcade contract.

| Subject | Replicate Off Grid behavior | Canonical Sanctuary behavior | Result |
|---|---|---|---|
| Client mutation name | `trpc.games.earnCoins({ amount, source })`. | `trpc.games.saveScore({ gameId, score })`. | **Incompatible.** Copying `OffGrid.tsx` into the canonical application would fail because `games.earnCoins` is not a canonical procedure. |
| Client-controlled inputs | Positive integer `amount` (maximum 100) and arbitrary text `source`. Off Grid submits ten coins per client-cleared threat. | Positive `score` and arbitrary `gameId`; `saveScore` chooses a configured reward or a default, awards XP, then records a coin transaction. | Both routes are insufficient for a secure Off Grid port if they accept unverified client progress. |
| Replicate server helper | Creates a coin transaction and increments a separate `coins` balance, but has no game session, command sequence, or claim idempotency model. | Canonical `addCoinTransaction` updates `user_profiles.anom_coin_balance` and inserts a `coin_transactions` row. `saveScore` calls it and then grants XP. | The databases and helper contracts are different; no direct helper/mutation reuse is possible. |
| Off Grid game identity | Sends source text `Game: Off-Grid`; there is no verified game/session ID. | `GAME_COIN_REWARDS` contains trivia, memory, mood matcher, and snack vault only. An unlisted ID falls back to 50 coins. | Do **not** route Off Grid through the current fallback. Add an explicit game definition and a server-issued session. |

The canonical `saveScore` procedure is a **closer user-facing Arcade entry point**, but it is not an authoritative game-session protocol: it trusts a positive submitted score and derives an award from it. For Off Grid, using `saveScore` unchanged would merely trade one client-reported value for another. The port should introduce a dedicated Off Grid router rather than expanding the client’s ability to mint arbitrary `saveScore` rewards.

## 4. Minimum port architecture

The implementation should be divided into a presentation layer and an authoritative game service.

| Workstream | Required work |
|---|---|
| Arcade integration | Add the Off Grid card/route and adapt the presentational terminal, HUD, command form, property panel, and accessibility states to the canonical React app. Keep the client responsible only for rendering server state and sending allowed commands. |
| Schema | Add a scoped session model, such as `offgrid_sessions` (user, lifecycle, state version, server seed, level, pending threats, upgrades, last processed timestamp) plus `offgrid_events` (session, sequence, command, applied result, reward amount, idempotency key, timestamp). Persist only the data needed to resume and audit the game. |
| Procedures | Provide protected `startSession`, `getSession`, and `submitCommand` procedures. `submitCommand` should accept a session ID, expected state version, a command enum, and a client event ID; it should return the next state projection and structured log events. |
| Time and spawning | Derive threat spawning on the server from `lastProcessedAt`, the stored game seed, and upgrades. Process elapsed time at read/command boundaries instead of trusting a continuously running browser timer. |
| Economy | Calculate rewards inside the command transaction. Record the game event, update session state, call the canonical coin transaction helper (or a transaction-safe extension), and mark the event rewarded atomically. Use a unique `(session_id, client_event_id)` or server event key to block replay. |
| Progression | Define the `levelup` condition and shop prices as canonical configuration. Validate all prerequisites, caps, and upgrades server-side. Derive property-tile availability from that stored progression. |
| Safety | Use the existing protected-procedure status enforcement, apply the applicable game/feature gate, and respect age-assurance permissions. Treat log text as structured/escaped data and maintain rate limits for command submission. |
| Tests | Add direct procedure tests for unauthenticated access, expired/restricted users, session ownership, forged threat counts, repeated event IDs, duplicate reward claims, upgrade debit failures, command cooldowns, and server-derived state progression. Browser tests can validate display behavior, but must not be the proof of reward integrity. |

## 5. Recommended port sequence

1. **Extract only the visual shell**—terminal panel, HUD, property tiles, and command form—without the current client reward callback or local game authority.
2. **Design and migrate the session/event schema** with an explicit state version and one-time reward ledger.
3. **Implement the protected server procedures** and deterministic/time-derived state processing.
4. **Wire the client to server projections**, retaining local state only for UI concerns such as input text, focus, and animation.
5. **Add server-side reward tests and abuse tests** before exposing the Arcade route.
6. **Add the explicit Off Grid reward policy** to canonical configuration only after verifying reward caps, progression rate, age privileges, and the feature gate.

This order preserves the game’s distinctive terminal experience while avoiding client-side currency issuance and ensuring that the canonical Sanctuary remains the single source of truth for Anom Coin balances.

## References

[1]: https://github.com/Anoms-Hub/anom-artsy-replicate/blob/main/client/src/pages/OffGrid.tsx "Anom Artsy Replicate Off Grid Terminal"
[2]: https://github.com/Anoms-Hub/anom-artsy-replicate/blob/main/server/routers.ts "Replicate games reward router"
[3]: https://github.com/Anoms-Hub/anom-artsy-replicate/blob/main/server/db.ts "Replicate coin persistence helper"
[4]: https://github.com/Anomoly247/anom-social-sanctuary/blob/safety-layer/server/games.procedures.ts "Canonical Sanctuary games procedure"
[5]: https://github.com/Anomoly247/anom-social-sanctuary/blob/safety-layer/server/db.ts "Canonical Sanctuary coin transaction helper"
