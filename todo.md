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
- [ ] Test video loading (YouTube + MP4)
- [ ] Test neon-dark theme rendering
- [ ] Test responsive design

## Phase 7: Deployment 📋
- [ ] Create initial checkpoint
- [ ] Test production build
- [ ] Deploy to Manus WebDev
- [ ] Verify live site functionality
