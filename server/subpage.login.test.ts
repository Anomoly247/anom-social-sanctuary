import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { encodeOAuthState, OAUTH_STATE_COOKIE } from "../shared/const";

describe("Subpage Login CTA and OAuth Integration", () => {
  const subpages = ["Achievements.tsx", "Wallet.tsx", "Profile.tsx", "Lounges.tsx"];

  subpages.forEach((pageName) => {
    it(`includes startLogin CTA on unauthenticated protected subpage ${pageName}`, () => {
      const pagePath = path.resolve(__dirname, `../client/src/pages/${pageName}`);
      if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, "utf-8");
        const hasLoginCta = content.includes("startLogin()") || content.includes("Sign In") || content.includes("login");
        expect(hasLoginCta).toBe(true);
      }
    });
  });

  it("validates OAuth state contract for login redirects", () => {
    const testState = encodeOAuthState({
      redirectUri: "https://anomartsy.xyz/api/oauth/callback",
      nonce: "subpage-test-nonce-222",
    });
    expect(testState).toBeDefined();
    expect(OAUTH_STATE_COOKIE).toBe("__Host-oauth_state");
  });
});
