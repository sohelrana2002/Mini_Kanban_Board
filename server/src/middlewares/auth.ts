import { Request, Response, NextFunction } from "express";
import { verifyAccessToekn } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized no token provided",
    });
  }

  const decoded = verifyAccessToekn(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized invalid token",
    });
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
  };

  next();
};
