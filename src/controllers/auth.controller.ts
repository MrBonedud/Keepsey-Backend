import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";

type SignupBody = {
  email?: string;
  password?: string;
  name?: string;
};

const setAuthCookie = (res: Response, token: string) => {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const signup = async (
  req: Request<Record<string, never>, unknown, SignupBody>,
  res: Response,
) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    throw new AppError("Email, password, and name are required", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
    expiresIn: "7d",
  });

  setAuthCookie(res, token);

  return res.status(201).json({
    message: "User created successfully",
    user,
  });
};

type SigninBody = {
  email?: string;
  password?: string;
};
export const signin = async (
  req: Request<Record<string, never>, unknown, SigninBody>,
  res: Response,
) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
    expiresIn: "7d",
  });

  setAuthCookie(res, token);

  return res.json({
    message: "Login successful",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return res.status(200).json({ user });
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.json({ message: "Logged out successfully" });
};
