# Anom Sanctuary Migration TODO

## Phase 1: Database Schema ✅
- [x] Restore Drizzle schema with all tables
- [x] Copy users, userProfiles, kidsProgress, lounges, loungeMembers, loungeMessages
- [x] Copy coinTransactions, achievements, userAchievements
- [x] Copy collaborationProjects, collaborationMembers, collaborationTasks, collaborationUpdates
- [x] Copy platformSettings, auditLog, vipTiers, userVipSubscriptions, vipBenefitsLog
- [x] Copy decorationPackages, merchRequests, merchOrders, gameScores, feedPosts
- [x] Copy musicLibrary, userPresence, chatNotifications, tips, tierPurchases

## Phase 2: Server Logic ✅
- [x] Copy server/routers.ts with all tRPC procedures
- [x] Copy server/db.ts with all database query helpers
- [x] Copy server/_core/storageProxy.ts with local file check fix
- [x] Copy all procedure files (music, sharing, membership, settings, games)
- [x] Copy helper files (membershipTiers, profileCustomization, settingsPersistence, stripe.products)
- [x] Fix missing shared constants (OAUTH_STATE_COOKIE, decodeOAuthState, encodeOAuthState, getLoginUrl)
- [x] Verify all tRPC procedures are properly defined

## Phase 3: Pages & Components ✅
- [x] Copy all 27 pages (KidsCorner, AnomsCorner, Home, Profile, Wallet, Achievements, etc.)
- [x] Copy all 20+ custom components
- [x] Copy hooks and contexts
- [x] Copy shared types and constants
- [x] Copy client/src/lib directory
- [x] Copy client/src/_core directory
- [x] Copy public assets and storage directory
- [x] Copy scripts and references directories

## Phase 4: Styling & Theming ✅
- [x] Copy index.css with neon-dark cyberpunk theme
- [x] Verify custom CSS classes: btn-neon-magenta, btn-neon-cyan, neon-glow-*, neon-text-*
- [x] Verify color scheme: #0b0e14 (deep black), #ff00cc (hot magenta), #00eaff (neon cyan)
- [x] All Tailwind + shadcn/ui components preserved

## Phase 5: Branding & Naming ✅
- [x] Verify "Anom's Corner" naming in KidsCorner.tsx
- [x] Verify VideoPlayer component with YouTube iframe + MP4 support
- [x] Verify storage proxy logic (local files first, then Forge API)
- [x] All branding references updated
- [x] All page titles and descriptions preserved

## Phase 6: Verification & Testing 🔄
- [x] Fix OAuth environment variable handling
- [x] Test development server startup
- [x] Verify home page loads correctly
- [ ] Resolve remaining TypeScript errors in admin pages
- [ ] Test authentication flow
- [ ] Test tRPC procedures
- [x] Test video loading (YouTube switches successfully; MP4 currently fails with HTTP 416)
- [ ] Test neon-dark theme rendering
- [x] Test responsive design at the available mobile preview width

## Phase 7: Deployment 📋
- [x] Create initial checkpoint
- [x] Test production build (OAuth/admin-login fix bundles successfully)
- [ ] Deploy to Manus WebDev
- [ ] Verify live site functionality
- [x] Verify dev server is running and document the existing 33 TypeScript errors
- [x] Inspect Home page visual rendering, cyberpunk styling, and navigation links
- [x] Inspect Anom's Corner (`/anoms-corner`) rendering, VideoPlayer component, and layout
- [x] Capture desktop and mobile screenshots for visual validation
- [x] Review `.manus-logs/` (devserver.log, browserConsole.log, networkRequests.log) for errors or warnings
- [ ] Fix the first Anom's Corner MP4 endpoint returning zero-byte content and HTTP 416 Range Not Satisfiable responses
- [ ] Inspect the Pixel profile `View Episodes` control, which did not navigate back to Anom's Corner during verification
- [ ] Resolve the existing 33 TypeScript errors reported by the copied project

- [x] Superseded duplicate: mobile Home header overflow was fixed and verified at 375px width

- [x] Fix Home page mobile header clipping so the right-side owner/sign-out controls remain visible at narrow widths (verified at 375px and 1280px)
- [x] Document that direct sandbox admin login is unavailable for bethmarieshanley6@gmail.com; use managed authenticated preview evidence for this responsive QA
- [x] Restart and verify the development server after it stopped responding
- [x] Investigate why bethmarieshanley6@gmail.com cannot obtain the copied project's admin session
- [x] Verify OAuth owner matching, user upsert, role assignment, and admin route guards without exposing credentials
- [x] Add regression coverage for owner/admin role assignment and admin access
- [x] Re-test the login/session path and document the external OAuth limitation
- [x] Add and run a regression test proving the configured owner open ID is assigned the admin role by upsertUser
- [x] Add system.getEvents, system.getAllUsers, and system.getStats procedures for the admin Home-page requests
- [x] Test the new system procedures and verify the Home page no longer reports missing-path API errors in the dedicated procedure test; broader verification remains open
- [x] Re-run the full Vitest suite after the safeRows fix and confirm all 5 test files and 8 tests pass
- [ ] Re-verify the authenticated admin/owner page state that calls system.getStats, system.getAllUsers, and system.getEvents, and confirm the browser console shows no missing-path API errors; current preview route is blocked by captcha and only exposes the anonymous access-denied state
- [x] Verify backend implementation of system.getStats and system.getAllUsers (passed unit tests); UI inspection is blocked by unauthenticated Access Denied state
- [x] Verify backend implementation of user list procedure (passed unit tests); UI inspection is blocked by unauthenticated Access Denied state
