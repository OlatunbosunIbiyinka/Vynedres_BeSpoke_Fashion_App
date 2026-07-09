import { describe, expect, it } from "vitest";
import {
  generatePortalToken,
  hashPortalToken,
  portalTokenExpiresAt,
} from "./portal-access.js";

describe("portal access tokens", () => {
  it("generates opaque URL-safe tokens", () => {
    const token = generatePortalToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashes tokens deterministically", () => {
    const token = "demo-portal-amara-2026";
    expect(hashPortalToken(token)).toBe(hashPortalToken(token));
    expect(hashPortalToken(token)).not.toBe(token);
    expect(hashPortalToken(token)).toHaveLength(64);
  });

  it("sets expiry in the future", () => {
    const expires = portalTokenExpiresAt(30);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });
});
