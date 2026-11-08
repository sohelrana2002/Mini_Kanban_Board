import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

const ACCESS_TOKEN_TTL = (process.env.ACCESS_TOKES_EXPIRE_IN ||
  "15m") as SignOptions["expiresIn"];

const REFRESH_TOEKN_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRE_IN) || 15;
const REFRESH_TOKEN_TTL = `${REFRESH_TOEKN_DAYS}d` as SignOptions["expiresIn"];

export const REFRESH_TOKEN_MAX_AGE_MS =
  REFRESH_TOEKN_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

export interface AuthPayload extends JwtPayload {
  id: number;
  email: string;
}

export const generateAccessToken = (userId: number, email: string): string => {
  return jwt.sign({ id: userId, email }, ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
};

export const verifyAccessToekn = (token: string): any => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as AuthPayload;
  } catch (error) {
    return null;
  }
};

// NEW: long-lived token whose only job is to mint new access tokens via
// POST /api/auth/refresh. Includes a random `jti` so two refresh tokens issued
// for the same user at the same second still hash to different values.

export const generateRefreshToken = (userId: number, email: string): string => {
  return jwt.sign(
    { id: userId, email, jti: crypto.randomUUID() },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL },
  );
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as AuthPayload;
  } catch (error) {
    return null;
  }
};

// we never store the raw refresh token in the database — only this hash —
// // so a database leak alone can't be replayed as a valid refresh token.

export const hashRefreshToken = (refreshToekn: string): string => {
  return crypto.createHash("sha256").update(refreshToekn).digest("hex");
};
