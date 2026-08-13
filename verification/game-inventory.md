# Game and Interactive Project Inventory

**Scope.** This read-only inventory covers all **25 repositories** currently listed under `Anomoly247` (12), `Anom-Originals` (2), and `Anoms-Hub` (11). Each default branch was shallow-cloned and inspected for game-related paths and implementation signals, including Phaser, canvas APIs, animation/game loops, scoring, levels, sprites, resource mechanics, and named game files. The canonical `safety-layer` versions of the relevant Sanctuary sources were also compared with the canonical repository’s `main` branch.

> **Key finding:** The codebase has several playable DOM/React/HTML mini-game implementations and one comparatively substantial command-loop simulation. No first-party Phaser project, dedicated canvas-game engine, or sprite-handling engine was identified. Captured third-party/static web snapshots containing unrelated `<canvas>` markup were excluded from this conclusion.

## Inventory method and completion labels

**Playable** means the checked-in source includes user input plus state progression, scoring, levels, or a game loop that can run without an unimplemented route. **Partial** means the interaction runs, but persistence, multiplayer, server validation, or an advertised feature remains incomplete. **Scaffold only** means a catalogue, story/gallery, or landing page presents a game idea without substantive game mechanics.

“Last commit” below means the last commit that touched the listed game source file, rather than an unrelated later repository commit.

## Playable and interactive projects

| Repository | Folder / source | What it appears to be | Evidence of implementation | Completion | Last source commit |
|---|---|---|---|---|---|
| [`Anomoly247/anom-social-sanctuary`][1] | `client/src/pages/Games.tsx` | **Sanctuary Mini-Games Arcade**: Trivia Challenge, Memory Game, and Mood Matcher. | React state handles question progression, card matching, scores, restart flows, and completion callbacks. Scores are submitted through `trpc.games.saveScore`. | **Playable, partial.** The three mini-games run in modals, but session “best scores” are browser-local and the broader server leaderboard/history remains incomplete. | 2026-06-22 |
| [`Anomoly247/anom-social-sanctuary`][2] | `client/src/pages/KidsCorner.tsx` | **Kids Corner activities**: Pixel colouring activity and **Off-Grid Adventure: Kids Edition**. | SVG colour selection, three resource buttons, score increments, a three-level progression, and `kidsCorner.trackProgress` completion mutation. | **Playable, partial.** The game is a compact three-level click activity; resources do not differ mechanically and no game loop or authored scenario set exists. | 2026-06-22 |
| [`Anom-Originals/anom-social-sanctuary`][3] | `client/src/pages/Games.tsx`, `client/src/pages/KidsCorner.tsx` | A duplicate of the preceding Sanctuary arcade and Kids Corner activity source. | File comparison found both files byte-identical to the `Anomoly247` default-branch versions. | **Playable, partial** (same implementation, not an independent game project). | 2026-06-12 |
| [`Anomoly247/Anom-Artsy-Sanctuary`][4] | `client/src/pages/Games.tsx` | **AO Universe Mini-Games**: Trivia, Memory, Mood Matcher, and Snack Vault. | Local question/card/timer state, random card layout, coin-award mutation, 30-second Snack Vault timer, and game modals. | **Playable, partial.** Interactions run and attempt coin rewards, but the leaderboard is hard-coded, achievement-trigger integration is commented out, Mood Matcher has no correctness rule, and the memory initializer mutates state during render. | 2026-08-05 |
| [`Anomoly247/anom-artsy-site`][5] | `games.html` | **AO Games Hub**: AO Universe Trivia, Neon Memory, AO Mood Matcher, and Snack Vault Rush. | In-page JavaScript provides 10-question trivia progression, shuffled memory cards/moves, mood-result mapping, and an escalating snack clicker with levels/progress. | **Playable.** It is a complete static browser game hub, though it has no authentication, save data, server score validation, or rewards persistence. | 2026-08-02 |
| [`Anomoly247/anom-artsy-site`][6] | `off-grid-adult.html` | **Off-Grid Adult Edition**, a 12-month choice-driven resilience simulation. | Resource/finance HUD, scenario choices, effects, monthly advancement, action log, and end-state evaluation. | **Playable.** Standalone educational simulation; progress is session-only and has no backend integration. | 2026-08-02 |
| [`Anomoly247/anom-artsy-site`][7] | `off-grid-kids.html` | **Off-Grid Kids Edition**, a 10-day educational resource-choice game. | Resource bars, choices for solar/water/gardening/wind and other events, scoring/streaks, day progression, and end screens. | **Playable.** Standalone educational simulation; no account, save, or reward persistence. | 2026-08-02 |
| [`Anoms-Hub/anom-artsy-replicate`][8] | `client/src/pages/Games.tsx` | **AO Games Hub**: AO Trivia, Neon Memory, Mood Matcher, Snack Vault Rush, Anom Tycoon, and Off Grid. | The hub contains six renderable activities. Trivia, memory, snack clicker, and tycoon implement scores/levels/economy; coin awards invoke `trpc.games.earnCoins`; Tycoon uses `localStorage`. | **Playable, partial.** The interactions work in React, but unauthenticated rewards are session-only and authoritative server-side scoring/anti-abuse is not shown. | 2026-07-12 |
| [`Anoms-Hub/anom-artsy-replicate`][9] | `client/src/pages/OffGrid.tsx` | **Off Grid Terminal**, a threat-clearance and homestead-upgrade simulation, also mounted from the Games Hub. | A 200ms `setInterval` game loop spawns threats; terminal commands (`scan`, `clearance`, `levelup`, `shop`, `buy`) change state; upgrades alter cadence; property tiles unlock by level; local save/load and backend coin-award calls are present. | **Playable, partial.** This is the most complete interactive project found. It still trusts client-side state for some reward progression and has no evident server-authoritative game session. | 2026-07-12 |

## Game-related but not playable projects

| Repository | Folder / source | What it contains | Completion | Last source commit |
|---|---|---|---|---|
| [`Anomoly247/anom-social-sanctuary-hosting`][10] | `client/src/pages/Games.tsx` | A **Sanctuary Games** catalogue listing Off-Grid Kids/Adult, Pixel Dash, Neon Runner, Dot Puzzle, Sanctuary Quest, Rhythm Glow, and Memory Match. | **Scaffold only.** The “available” buttons have no click handler, route, game component, score logic, or persistence. The file is a static catalogue despite its labels. | 2026-08-03 |
| [`Anomoly247/Anom-Artsy-Sanctuary`][11] | `client/src/pages/GamesCompetition.tsx` | **Games & Competition** screen for Crew Wars, Family Feuds, a global leaderboard, and quick-play entries. | **Scaffold only.** All crew/family/leaderboard records are local mock arrays; join and play only update local state/toasts; no game session, server record, or durable score exists. | 2026-08-05 |
| [`Anomoly247/Anom-Artsy-Sanctuary`][12] | `client/src/pages/SnackVaultChronicles.tsx` | **Snack Vault Chronicles**, a selectable six-vault story/gallery presentation. | **Scaffold only.** Selecting a vault reveals static text and the “Enter Vault” button has no handler. It is narrative UI, not the Snack Vault game. | 2026-08-05 |
| [`Anoms-Hub/ANOMS-Off-Grid`][13] | `offgrid.html` | An **OffGrid** design/landing-page prototype. | **Scaffold only.** It describes an off-grid visual layout and contains no script, input, score, level, or interaction logic. | 2026-05-26 |
| [`Anomoly247/ao-meme-library`][14] | `assets/ao/snack-vault/.gitkeep` | An empty Snack Vault asset folder. | **No game implementation.** The path is a naming signal only. | 2026-05-12 |

## Search coverage: repositories without a qualifying first-party game implementation

The following repositories were scanned but did not contain a qualifying playable/partial/scaffold game project beyond incidental game wording, asset names, external/captured markup, or generic app dependencies.

| Account | Repositories with no qualifying game project |
|---|---|
| `Anomoly247` | `ANOMS-Hub` (empty/no default-branch content), `anom-artsy-rebuild`, `Anomoly247`, `anomoly-archive`, `ao-universe-homepage`, `ANOMS-Originals-App`, `anom-originals-landing` |
| `Anom-Originals` | `AO-Internet-Help-Hub` |
| `Anoms-Hub` | `ANOMS-Hub`, `anom-artsy`, `ao-collab-station`, `anomfolio`, `ANOMS-GitHub-Ops`, `anom-originals-app`, `ANOMS-Originals-Store`, `ANOMS-Brand-Kit`, `.github` |

`Anomoly247/anom-artsy-rebuild` contains an asset named `mood_memes_game_builds_banner.webp` and archived/static page material, but no first-party game loop, score system, level logic, or playable project was identified. It is therefore excluded from the interactive-project rows.

## Technical observations

The discovered projects are predominantly **DOM and React state machines**, not Phaser/canvas titles. The `anom-artsy-site` static hub provides the clearest standalone, playable HTML/JavaScript set; `anom-artsy-replicate` contains the most advanced React prototype, particularly the Off Grid terminal loop. The canonical Sanctuary has a functioning smaller arcade with backend score submission, but its game history and leaderboard procedures are still placeholders. No first-party source imported Phaser or instantiated a canvas/sprite game engine in the audited default branches.

## References

[1]: https://github.com/Anomoly247/anom-social-sanctuary/blob/main/client/src/pages/Games.tsx "Canonical Sanctuary Games"
[2]: https://github.com/Anomoly247/anom-social-sanctuary/blob/main/client/src/pages/KidsCorner.tsx "Canonical Sanctuary Kids Corner"
[3]: https://github.com/Anom-Originals/anom-social-sanctuary/tree/main/client/src/pages "Anom-Originals Sanctuary pages"
[4]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/client/src/pages/Games.tsx "AO Universe Games"
[5]: https://github.com/Anomoly247/anom-artsy-site/blob/main/games.html "AO Games Hub"
[6]: https://github.com/Anomoly247/anom-artsy-site/blob/main/off-grid-adult.html "Off-Grid Adult Edition"
[7]: https://github.com/Anomoly247/anom-artsy-site/blob/main/off-grid-kids.html "Off-Grid Kids Edition"
[8]: https://github.com/Anoms-Hub/anom-artsy-replicate/blob/main/client/src/pages/Games.tsx "Replicate Games Hub"
[9]: https://github.com/Anoms-Hub/anom-artsy-replicate/blob/main/client/src/pages/OffGrid.tsx "Replicate Off Grid Terminal"
[10]: https://github.com/Anomoly247/anom-social-sanctuary-hosting/blob/main/client/src/pages/Games.tsx "Hosting Games Catalogue"
[11]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/client/src/pages/GamesCompetition.tsx "AO Universe Games Competition"
[12]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary/blob/main/client/src/pages/SnackVaultChronicles.tsx "Snack Vault Chronicles"
[13]: https://github.com/Anoms-Hub/ANOMS-Off-Grid/blob/main/offgrid.html "OffGrid landing page"
[14]: https://github.com/Anomoly247/ao-meme-library/tree/main/assets/ao/snack-vault "Snack Vault asset folder"
