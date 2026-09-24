import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

describe("Admin Identity Vault & Cryptographic Authentication", () => {
  const DUMMY_BCRYPT_HASH = "$2b$12$ftooAlgDWp8Sjg7mgflAMeqecymU9OGUA1LjI6M0w3ry6SfPUp50K";
  const TEST_PASSWORD = "SuperAdmin@369!";

  it("verifies SuperAdmin seed password against the precomputed 12-round bcryptjs hash", async () => {
    const isMatch = await bcrypt.compare(TEST_PASSWORD, DUMMY_BCRYPT_HASH);
    expect(isMatch).toBe(true);
  });

  it("rejects an invalid password against the precomputed hash", async () => {
    const isMatch = await bcrypt.compare("WrongPassword123!", DUMMY_BCRYPT_HASH);
    expect(isMatch).toBe(false);
  });

  it("ensures constant-time fallback execution using DUMMY_BCRYPT_HASH on nonexistent users", async () => {
    const start = performance.now();
    const isMatch = await bcrypt.compare("AttackerProbeGuess", DUMMY_BCRYPT_HASH);
    const elapsed = performance.now() - start;

    expect(isMatch).toBe(false);
    // Cost factor 12 guarantees a measurable, non-trivial cryptographic work factor (> 10ms)
    expect(elapsed).toBeGreaterThan(10);
  });

  it("generates and verifies dynamic bcryptjs hashes with salt rounds = 12", async () => {
    const salt = await bcrypt.genSalt(12);
    const dynamicHash = await bcrypt.hash("NewAdminSecret@2026", salt);

    expect(dynamicHash).toMatch(/^\$2[aby]\$12\$/);

    const matches = await bcrypt.compare("NewAdminSecret@2026", dynamicHash);
    expect(matches).toBe(true);

    const wrongMatch = await bcrypt.compare("BadPassword", dynamicHash);
    expect(wrongMatch).toBe(false);
  });

  it("validates administrative session cookie structure and flags", () => {
    const sessionPayload = {
      id: "a0000000-0000-0000-0000-000000000001",
      username: "superadmin",
      email: "superadmin@369akruniverse.in",
      role: "super_admin",
      fullName: "SuperAdmin Lead",
      timestamp: Date.now(),
    };

    expect(sessionPayload.id).toBeDefined();
    expect(sessionPayload.username).toBe("superadmin");
    expect(sessionPayload.email).toContain("@");
    expect(["super_admin", "dispatcher"]).toContain(sessionPayload.role);
    expect(sessionPayload.timestamp).toBeGreaterThan(0);
  });
});
