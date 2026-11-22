// Pure unit tests - no HTTP, no DatabaseSync.
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  verifyAccessToekn,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "../src/utils/jwt";

const DAY_SECONDS = 24 * 60 * 60;

// Tests for refresh token hashing, ensuring tokens are securely hashed
// using SHA-256 instead of storing or returning raw tokens.
describe("hashRefreshToken", () => {
  it("is deterministic", () => {
    expect(hashRefreshToken("abc")).toBe(hashRefreshToken("abc"));
  });

  it("returns a 64-char hex SHA-256 digest, never the raw token", () => {
    const hash = hashRefreshToken("my-secret-token");

    // Validates that the hash is exactly 64 hexadecimal characters.
    // ^         → Matches the beginning of the string.
    // [0-9a-f]  → Allows digits (0-9) and lowercase letters (a-f).
    // {64}      → Requires exactly 64 characters.
    // $         → Matches the end of the string.
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("my-secret-token");
  });

  it("gives different hashes for different tokens", () => {
    expect(hashRefreshToken("a")).not.toBe(hashRefreshToken("b"));
  });
});

// Tests for access token generation and verification, ensuring correct
// payload, expiration time, and rejection of invalid, expired, or tampered tokens.
describe("access token", () => {
  it("round-trips the user id and email", () => {
    const decoded = verifyAccessToekn(generateAccessToken(7, "a@b.com"));

    expect(decoded.id).toBe(7);
    expect(decoded.email).toBe("a@b.com");
  });

  it("lives for 15 minutes", () => {
    const decoded = verifyAccessToekn(generateAccessToken(1, "a@b.com"));

    expect(decoded.exp - decoded.iat).toBe(15 * 60); //exp = Expiration Time, iat = Issued At
  });

  it("returns null for garbase", () => {
    expect(verifyAccessToekn("not-a-jwt")).toBeNull();
  });

  it("returns null for an expired token", () => {
    const expired = jwt.sign(
      { id: 1, email: "a@b.com" },
      process.env.JWT_ACCESS_SECRET!, //! - TypeScript Non-null Assertion Operator
      { expiresIn: -10 },
    );

    expect(verifyAccessToekn(expired)).toBeNull();
  });

  it("returns null when the payload was tampered with", () => {
    // Generate a valid access token and split it into its three parts:
    // header, payload, and signature.
    const [header, payload, signature] = generateAccessToken(
      1,
      "a@b.com",
    ).split(".");

    // Decode the Base64URL-encoded payload and convert it into a JavaScript object.
    const body = JSON.parse(Buffer.from(payload, "base64url").toString());

    // Tamper with the payload by changing the user ID from 1 to 999.
    // Keep the original signature unchanged to simulate token manipulation.
    body.id = 999; //pretend to be another user, keep the old signature

    // Re-encode the modified payload and combine it with the original header
    // and signature to create a forged(নকল) JWT.
    const forged = [
      header,
      Buffer.from(JSON.stringify(body)).toString("base64url"),
      signature,
    ].join(".");

    // Verify that the modified token is rejected because its signature
    // no longer matches the modified payload.
    expect(verifyAccessToekn(forged)).toBeNull();
  });

  it("rejects a token signed with the refresh secret", () => {
    expect(verifyAccessToekn(generateRefreshToken(1, "a@b.com"))).toBeNull();
  });
});

// Tests for refresh token generation and verification, ensuring correct
// payload, expiration time, signature validation, and rejection of invalid or expired tokens.
describe("refresh token", () => {
  it("round-trips the user id and email", () => {
    const decoded = verifyRefreshToken(generateRefreshToken(7, "a@b.com"));

    expect(decoded.id).toBe(7);
    expect(decoded.email).toBe("a@b.com");
  });

  it("lives for 15 days", () => {
    const decoded = verifyRefreshToken(generateRefreshToken(1, "a@b.com"));

    expect(decoded.exp - decoded.iat).toBe(15 * DAY_SECONDS);
    expect(REFRESH_TOKEN_MAX_AGE_MS).toBe(15 * DAY_SECONDS * 1000);
  });

  it("is unique every time, even for the same user in the same second", () => {
    // Needed because only the hash is stored (and it is a unique column).
    expect(generateRefreshToken(1, "a@b.com")).not.toBe(
      generateRefreshToken(1, "a@b.com"),
    );
  });

  it("returns null for garbage", () => {
    expect(verifyRefreshToken("not-a-jwt")).toBeNull();
  });

  it("rejects a token signed with the access secret", () => {
    expect(verifyRefreshToken(generateAccessToken(1, "a@b.com"))).toBeNull();
  });
});
