import { Request, Response } from "express";
import prisma from "../config/prisma";
import { hashPassword, comparePassword } from "../utils/bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_MAX_AGE_MS,
  verifyRefreshToken,
} from "../utils/jwt";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

// accessToken is short-lived (15m, see jwt.ts) and sent with every request.
const accessCookieOptions = {
  ...baseCookieOptions,
  path: "/",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

// refreshToken lives much longer (15d) but is scoped to only the routes
// that need it (`path: "/api/auth"`), so it isn't sent on every ordinary API
// call — it's only exposed to /auth/refresh and /auth/logout.
const refreshCookieOptions = {
  ...baseCookieOptions,
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_MAX_AGE_MS,
};

// issues a fresh access+refresh pair for a user, persists the refresh
// token's hash in the DB (so it can be revoked later), and sets both cookies.

async function issueTokens(res: Response, userId: number, email: string) {
  const accessToken = generateAccessToken(userId, email);
  const refreshToken = generateRefreshToken(userId, email);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    },
  });

  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    console.log("User registration error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // issues both an accessToken (short-lived, used on every request)
    // and a refreshToken (long-lived, used only to mint new access tokens),
    // each as its own httpOnly cookie. Neither is returned in the JSON body.
    await issueTokens(res, user.id, user.email);

    res.status(200).json({
      success: true,
      message: "User login successfully",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    console.log("User login error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// the whole point of the refresh token — exchange a still-valid refresh
// token for a brand-new access token (and a rotated refresh token) without
// forcing the user to log in again every 15 minutes.
export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized no refresh token provided",
      });
    }

    const decoded = verifyRefreshToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized invalid refresh token",
      });
    }

    const tokenHash = hashRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      res.clearCookie("accessToken", accessCookieOptions);
      res.clearCookie("refreshToken", refreshCookieOptions);
      return res.status(401).json({
        success: false,
        message: "Unauthorized refresh token revoked or expired",
      });
    }

    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    await issueTokens(res, decoded.id, decoded.email);

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
    });
  } catch (error: any) {
    console.log("Token refresh error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
