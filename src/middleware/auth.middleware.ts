import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware";

type AuthTokenPayload = {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
};

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export const requireAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Missing or invalid authorization header", 401));
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new AppError("JWT_SECRET is not configured", 500));
  }

  return jwt.verify(token, secret, (error, decoded) => {
    if (error) {
      return next(new AppError("Invalid or expired token", 401));
    }

    const payload = decoded as AuthTokenPayload;

    req.user = {
      id: payload.userId,
      email: payload.email,
    };

    return next();
  });
};
