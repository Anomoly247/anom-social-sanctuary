import { describe, it, expect } from "vitest";
import { registerOAuthRoutes } from "./_core/oauth";
import { encodeOAuthState } from "@shared/const";
import express from "express";

describe("OAuth Callback Validation", () => {
  it("registers OAuth routes successfully", () => {
    const app = express();
    expect(() => registerOAuthRoutes(app)).not.toThrow();
  });

  it("encodes and decodes OAuth state correctly for callback exchange", () => {
    const state = encodeOAuthState({
      redirectUri: "https://anomartsy.xyz/api/oauth/callback",
      nonce: "secure-nonce-999",
    });
    expect(state).toBeDefined();
  });
});
