import { signup, signin } from "../src/controllers/auth.controller";
import { createMockResponse } from "./helpers/http";

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
  },
}));

import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("auth controller", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  it("signup creates a new user", async () => {
    const req = {
      body: {
        email: "new@example.com",
        password: "Password123!",
        name: "New User",
      },
    } as any;
    const res = createMockResponse();

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "new@example.com",
      name: "New User",
      createdAt: new Date(),
    });

    await signup(req, res);

    expect(prisma.user.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User created successfully" }),
    );
  });

  it("signin returns jwt token for valid credentials", async () => {
    const req = {
      body: {
        email: "user@example.com",
        password: "Password123!",
      },
    } as any;
    const res = createMockResponse();

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      password: "hashed-password",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("jwt-token");

    await signin(req, res);

    expect(jwt.sign).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "jwt-token" }),
    );
  });
});
