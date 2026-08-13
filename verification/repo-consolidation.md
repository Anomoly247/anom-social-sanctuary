# Sanctuary Repository Consolidation Assessment

**Scope.** This read-only assessment compares the current GitHub heads of four repositories: `Anomoly247/anom-social-sanctuary`, `Anomoly247/anom-social-sanctuary-hosting`, `Anomoly247/Anom-Artsy-Sanctuary`, and `Anom-Originals/anom-social-sanctuary`. The assessment uses GitHub branch metadata and local, read-only clones to compare commit ancestry and tracked-tree paths.

> **Important result:** None of the three comparison repositories shares a Git merge base with the current `safety-layer` branch. They are divergent histories, not normal branches that can be fast-forwarded or safely deleted as duplicates. A repository can be archived only after its unique paths and operational history have been intentionally preserved.

## Repository summary

| Repository | Default branch / default-branch commits | Branches | Default-branch head | Most recent repository head | Work not present in the other repositories | Archive assessment |
|---|---:|---|---|---|---|---|
| [`Anomoly247/anom-social-sanctuary`][1] | `main` / 68 | `main`, `safety-layer` | 2026-06-22 | `safety-layer`, 2026-08-13, 75 reachable commits | The current Safety Layer, latest behavioral tests, active database/schema repairs, Phase 19 raw verification, native Pixel & Dot playback, and current owner/admin work. It also contains paths absent from the other trees, including the safety and membership procedure modules, current collaboration implementation, and current project verification artifacts. | **Do not archive. Recommend as canonical.** |
| [`Anomoly247/anom-social-sanctuary-hosting`][2] | `main` / 17 | `main` | 2026-08-03 | 2026-08-03 | Unique tracked paths include `GlowLocker.tsx`, `Navigation.tsx`, `SanctuaryAI.tsx`, `AI.tsx`, `Feed.tsx`, `ModeratorLounge.tsx`, `Shop.tsx`, and `drizzle/0000_tidy_leper_queen.sql`. Its latest commits also describe a separate nine-video Anom’s Corner mapping. | **Do not archive yet.** Preserve/review the unique UI, moderator, AI, shop, feed, migration, and video-mapping work first. |
| [`Anomoly247/Anom-Artsy-Sanctuary`][3] | `main` / 40 | `main` | 2026-08-05 | 2026-08-05 | Unique tracked paths include `useLoungeChatWebSocket.ts`, `server/achievements.ts`, Stripe and YouTube modules, 35+ page/component modules, and migrations `0002`–`0010` plus `schema_ao_universe.ts`. Its head describes WebSocket lounge chat, achievement triggers, and Stripe-readiness work. | **Do not archive yet.** It contains the largest unreviewed set of unique code and migrations. |
| [`Anom-Originals/anom-social-sanctuary`][4] | `main` / 67 | `main` | 2026-06-12 | 2026-06-12 | No tracked paths were found that exist only in this repository. Its tree matches the active repository’s baseline apart from `datadog-synthetics.yml`, which exists only in the active repository. It retains a separate, non-mergeable Git history. | **Eligible for archival only after a preservation tag/export.** Treat it as a historical source mirror, not an active development target. |

## Branch and ancestry evidence

The active repository is the only repository with multiple branches. Its `main` branch ends at `aa64300` on 2026-06-22, while `safety-layer` ends at `67aa895` on 2026-08-13 at the time of comparison. The other three repositories expose only `main`.

| Comparison with active `safety-layer` | Unique commit counts: active / comparison | Merge base | Interpretation |
|---|---:|---|---|
| `Anom-Originals/anom-social-sanctuary:main` | 75 / 67 | None | Separate commit graph, despite the trees being nearly identical. |
| `Anomoly247/anom-social-sanctuary-hosting:main` | 75 / 17 | None | Separate graph and materially distinct code tree. |
| `Anomoly247/Anom-Artsy-Sanctuary:main` | 75 / 40 | None | Separate graph and materially distinct code tree. |

Because there is no merge base, these values mean that all commits on both sides are graph-unique. They **do not** mean every line is unique; tree comparison is required to identify material work.

## Unique-work evidence

### Current active repository: `Anomoly247/anom-social-sanctuary`

The active repository contains the only current `safety-layer` branch and is the location of the ongoing hardening work. It is also the only compared tree with the current safety procedures, Phase 19 behavioral suite/evidence, complete age-assurance implementation, current collaboration tables, tier-purchase persistence, and activity-feed failed-write enforcement. Compared with the original mirror, the only extra tracked path is `.github/workflows/datadog-synthetics.yml`; compared with the two alternate implementations, it has many current pages, server procedure modules, Drizzle migrations, and verification artifacts that are absent elsewhere.

### Hosting implementation: `Anomoly247/anom-social-sanctuary-hosting`

The hosting repository contains a compact but independently developed UI slice. Its unique paths cover **Glow Locker**, navigation, Sanctuary AI, a social feed, moderator lounge, shop, AI page, collaboration page, and its own initial Drizzle migration. Its 2026-08-03 head commit records a separate curation pass mapping nine Anom Originals YouTube videos into Anom’s Corner. These assets may overlap in intent with later active-repository work, but their implementation has not been merged into the active tree.

### AO Universe implementation: `Anomoly247/Anom-Artsy-Sanctuary`

The AO Universe repository has the highest consolidation risk. It contains separate live-feature concepts and schema history: WebSocket lounge chat, achievement-trigger server code, Stripe/webhook modules, YouTube service/router code, expanded content/admin pages, and migrations through `0010_mean_spitfire.sql`. Its 2026-08-05 checkpoint explicitly describes real-time lounge chat, achievement triggers, Stripe testing guidance, and AWS-export preparation. Archiving it before a selective migration review would discard unmerged implementation options and migration history.

### Original mirror: `Anom-Originals/anom-social-sanctuary`

The original-account repository is structurally the closest to the active repository: no tracked file exists only in this tree, and the active tree adds the Datadog synthetic-test workflow. It remains useful as a provenance/history mirror because it has a disjoint commit graph, but it does not contain observed source files that must be merged into the canonical codebase.

## Recommendation

| Decision | Repository | Rationale |
|---|---|---|
| **Canonical repository** | `Anomoly247/anom-social-sanctuary` | It contains the active `safety-layer` branch, the most recent commit, the current deployed project lineage, and the verified safety/database work. Before consolidation is finalized, merge or fast-forward the reviewed `safety-layer` changes into `main` and make the intended production branch explicit. |
| **Preserve, then selectively consolidate** | `Anomoly247/anom-social-sanctuary-hosting` | It contains unique UI and video-mapping work. Create a preservation tag and review its unique paths against the canonical repository before archiving. |
| **Preserve, then selectively consolidate** | `Anomoly247/Anom-Artsy-Sanctuary` | It contains unique pages, real-time chat, achievement, payments, YouTube, and migration work. Create a preservation tag and extract only reviewed features/migrations; do not merge histories blindly. |
| **Archive candidate** | `Anom-Originals/anom-social-sanctuary` | It has no observed unique tracked source path. Create a final archival tag/release and document its original-account provenance before setting it read-only or archiving it. |

> **Safe archive order:** First tag/export the original mirror. Next, extract or explicitly reject the unique hosting and AO Universe paths. Only then archive the two divergent implementation repositories. The active `Anomoly247/anom-social-sanctuary` repository should remain the sole write target throughout the consolidation.

## References

[1]: https://github.com/Anomoly247/anom-social-sanctuary "Anomoly247/anom-social-sanctuary"
[2]: https://github.com/Anomoly247/anom-social-sanctuary-hosting "Anomoly247/anom-social-sanctuary-hosting"
[3]: https://github.com/Anomoly247/Anom-Artsy-Sanctuary "Anomoly247/Anom-Artsy-Sanctuary"
[4]: https://github.com/Anom-Originals/anom-social-sanctuary "Anom-Originals/anom-social-sanctuary"
