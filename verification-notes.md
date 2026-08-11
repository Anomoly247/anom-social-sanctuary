# Browser Verification Notes

## 2026-08-11 — Initial desktop pass

### Home page

The Home page at `/` rendered beyond the loading shell. The page title is `Anom Artsy - The Official AO Sanctuary`. Visible content includes the Anom Artsy brand, `Social Good First`, the `Identity, Amplified` hero heading, sign-in and sign-up actions, `Support Our Mission`, `Explore the Mission`, `Get Started Now`, and feature sections for Anom Coin Economy, Private Lounges, Mini-Games, Anom's Corner, Profile Customization, and Custom Merch. The dark neon visual treatment is visible with hot magenta and cyan accents.

### Anom's Corner

The dedicated route is `/anoms-corner` and rendered the page headed `Anom's Corner`, with Pixel and Dot character introductions, episode selection, series stats, and profile links. The selected episode card is `Pixel & Dot's Full Story | Anom's Corner`; the browser exposed native video controls and the extracted page text included `Your browser does not support the video tag.` This indicates the native video element is present, but video source playback still requires a dedicated source/network check. The page also shows `Like` and `Share` actions and an `Episodes` panel.

### Follow-up checks

- Capture mobile-width screenshots for `/` and `/anoms-corner`.
- Inspect console and network logs for runtime errors and failed video requests.
- Test the Anom's Corner episode selector and character-profile navigation without submitting auth or other sensitive actions.

## Media verification

The second episode selection changed the player to a YouTube embed and displayed the YouTube player overlay for `Pixel & Dot's New Adventure | Anom's Corner`, confirming the episode selector can switch to YouTube-backed content. Returning to the first episode restored a native `<video>` element whose `currentSrc` was `https://3000-ivjf1mr7kojb7v00t8dvr-34b0036e.us2.manus.computer/manus-storage/v8_pixel_dot_full_story_final_45228357.mp4`. The native player reported `readyState: 0`, `networkState: 3`, and no `MediaError`, so the source URL is assigned but the browser did not reach a playable state during this check. The page visibly showed native controls and a loading indicator.


## Navigation follow-up

The `→ Pixel's Profile` action from Anom's Corner successfully opened `/characters/pixel`, and the Pixel profile rendered with its character details, stats, traits, and related section. The `View Episodes` control on the Pixel profile did not change the URL or visibly navigate when clicked during this pass; this should be treated as a likely navigation wiring issue until the component handler is inspected.


## Mobile responsive inspection

At a 375×812 mobile viewport, Anom's Corner reflowed into a single-column layout. The heading wrapped cleanly, Pixel and Dot remained centered, the native player stayed inside its card, episode cards stacked vertically, and the Like/Share buttons remained visible side by side without obvious horizontal overflow. The character links also remained visible near the bottom of the page.

The authenticated Home view also reflowed into a single column with stacked metric cards, Quick Actions, events, community highlights, contact form, and footer content. However, the compact header visibly compressed the identity and controls; the right-side owner/sign-out controls were clipped at the viewport edge in the mobile capture. This is a responsive issue to inspect separately rather than treating the Home mobile layout as fully passing.


## Home mobile header fix — 2026-08-11

The authenticated Home header was updated to use a mobile-first stacked layout. At widths below the `sm` breakpoint, the brand occupies its own row, the welcome label spans the available width, and Background, Owner Panel, and Sign Out controls use full-width grid cells so they no longer clip at 375px. At `sm` and larger widths, the header returns to the original horizontal toolbar with compact controls.

A fresh 375×812 screenshot confirmed that `Anom Artsy`, `Welcome, Eliza Wood`, `Background`, `Owner Panel`, and `Sign Out` are all visible inside the viewport. A 1280×720 screenshot confirmed that the desktop toolbar remains horizontal and visually aligned. The existing Vitest suite passed: 1 file and 1 test. `pnpm check` still reports the pre-existing 33 TypeScript errors in unrelated admin/database/membership code; the header change introduced no new TypeScript diagnostics.


## Verification limitation

The direct sandbox browser could not authenticate the admin account `bethmarieshanley6@gmail.com`, so the post-fix authenticated header was not inspectable through that browser session. The managed authenticated preview capture at 375×812 was used instead; it visibly showed `Anom Artsy`, `Welcome, Eliza Wood`, `Background`, `Owner Panel`, and `Sign Out` fully inside the viewport. The direct browser session independently confirmed the public Home route remained available.


## Admin login investigation and fix — 2026-08-11

The copied database already contains the requested account with the correct admin role, and the configured owner identity matches that account’s stored OAuth open ID. The server-side admin guard also correctly accepts `role: "admin"`. The failure was in the client OAuth entrypoints: the Home page, sign-up connectors, dashboard sign-in, and unauthenticated redirect used the legacy `getLoginUrl()` helper, which encoded only the redirect URI and did not create the one-time `__Host-oauth_state` nonce cookie required by `/api/oauth/callback`. The callback therefore rejected the login with `invalid oauth state` before a session could be established.

The fix replaces every interactive login entrypoint with `startLogin()`, which creates the nonce cookie and encodes the matching `{ redirectUri, nonce }` state. The obsolete nonce-free helper was removed to prevent future bypasses. A browser check confirmed that clicking Home → Sign In produces an OAuth URL containing an encoded nonce, and returning to the app origin showed the `__Host-oauth_state` cookie present with a 36-character nonce. The external provider could not be completed for the account in the available browser session, so end-to-end identity-provider completion remains externally constrained.

Regression coverage now includes OAuth state round-tripping/malformed-state rejection and admin guard allow/deny behavior. The full Vitest suite passes: 3 files and 5 tests. The project’s existing TypeScript baseline remains at 33 unrelated diagnostics; none reference the changed OAuth or test files.


The owner-role regression test was added with an isolated mocked Drizzle insert path. It confirms that when `upsertUser` receives the configured owner open ID without an explicit role, both the inserted values and duplicate-update set include `role: "admin"`. The full suite now passes 4 files and 6 tests.
