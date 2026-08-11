# Project TODO - Sanctuary Anom Artsy

- [x] Initialize project from reference clone
- [x] Run existing test suite (Vitest) to verify backend procedures and authentication
- [x] Check build health (TypeScript type-checking & Vite production build)
- [x] Perform smoke test on dev server and verify UI / routes
- [x] Save checkpoint and report status
- [x] Diagnose `user_profiles` table query failure in profile router / db helper
- [x] Implement database table verification and auto-creation/fallback in `server/db.ts`
- [x] Add regression test for profile retrieval and user creation
- [x] Run full test suite, TypeScript check, build, and capture profile screenshot
- [x] Save checkpoint with verified profile fix
- [ ] Diagnose `lounges` table query failure in `server/db.ts` (`getUserLounges`)
- [ ] Implement robust table auto-creation / schema check for `lounges` and `lounge_members` in `server/db.ts`
- [ ] Add lounge regression test in `server/lounge.test.ts`
- [ ] Run full test suite, TypeScript check, build, and capture `/lounges` screenshot
- [ ] Save checkpoint with verified lounges fix
