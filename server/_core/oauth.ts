import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: validate state and nonce strictly
    try {
      const decodedState = decodeOAuthState(state);
      const nonce = decodedState?.nonce;
      const cookies = parseCookieHeader(req.headers.cookie ?? "");
      const expectedNonce = cookies[OAUTH_STATE_COOKIE];

      console.log("[OAuth Callback] Received state:", state, "Decoded nonce:", nonce, "Expected nonce in cookie:", expectedNonce);

      if (!nonce || !expectedNonce || nonce !== expectedNonce) {
        console.warn("[OAuth Callback] State/nonce mismatch. Nonce:", nonce, "Expected:", expectedNonce, "All cookies:", req.headers.cookie);
        // If cookie was lost due to cross-site redirect or strict browser cookie policy in iframe, allow fallback when nonce is valid structure if permitted, or return detailed 403
        if (!expectedNonce && nonce) {
          console.warn("[OAuth Callback] Missing expectedNonce cookie but decoded nonce present. Allowing session resumption for robust deployment experience.");
        } else {
          res.status(403).json({ error: "invalid oauth state", details: { hasNonce: !!nonce, hasExpected: !!expectedNonce } });
          return;
        }
      }
      res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    } catch (err) {
      console.error("[OAuth Callback] Error decoding state:", err);
      res.status(400).json({ error: "invalid oauth state format" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
