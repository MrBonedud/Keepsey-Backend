import { Request, Response } from "express";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";

type CreateListBody = {
  name?: string;
};

type ListParams = {
  id?: string;
  itemId?: string;
};

type InviteBody = {
  email?: string;
  role?: "VIEWER" | "EDITOR";
};

type ClaimBody = {
  note?: string;
};

type InviteTokenQuery = {
  token?: string;
};

const mapCreateListError = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError("You already have a list with this name", 409);
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    throw new AppError("Invalid owner reference. Please sign in again.", 400);
  }

  throw error;
};

export const createSharedList = async (
  req: AuthenticatedRequest & { body: CreateListBody },
  res: Response,
) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const trimmedName = req.body.name?.trim();
  if (!trimmedName) {
    throw new AppError("List name is required", 400);
  }

  const owner = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true },
  });

  if (!owner) {
    throw new AppError(
      "Authenticated user not found. Please sign in again.",
      404,
    );
  }

  const list = await prisma.list
    .create({
      data: {
        name: trimmedName,
        ownerId: req.user.id,
      },
      select: {
        id: true,
        name: true,
        shareCode: true,
        ownerId: true,
        createdAt: true,
      },
    })
    .catch(mapCreateListError);

  return res.status(201).json({
    message: "Shared list created successfully",
    list,
  });
};

export const inviteToList = async (
  req: AuthenticatedRequest & Request<ListParams, unknown, InviteBody>,
  res: Response,
) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const listId = req.params.id?.trim();
  if (!listId) {
    throw new AppError("List id is required", 400);
  }

  const normalizedEmail = req.body.email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError("Email is required", 400);
  }

  const role = req.body.role ?? "EDITOR";
  if (role !== "VIEWER" && role !== "EDITOR") {
    throw new AppError("Invalid role", 400);
  }

  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      ownerId: req.user.id,
    },
    select: {
      id: true,
      ownerId: true,
      name: true,
    },
  });

  if (!list) {
    throw new AppError("List not found or not owned by you", 404);
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true },
  });

  if (!invitedUser) {
    throw new AppError("User not found", 404);
  }

  if (invitedUser.id === req.user.id) {
    throw new AppError("You cannot invite yourself", 400);
  }

  const existingCollaborator = await prisma.listCollaborator.findFirst({
    where: {
      listId,
      userId: invitedUser.id,
    },
    select: { id: true },
  });

  if (existingCollaborator) {
    throw new AppError("User is already a collaborator", 409);
  }

  const existingPendingInvite = await prisma.collaboratorInvite.findFirst({
    where: {
      listId,
      invitedId: invitedUser.id,
      status: "PENDING",
    },
    select: { id: true, expiresAt: true },
  });

  if (existingPendingInvite) {
    throw new AppError("Pending invite already exists", 409);
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await prisma.collaboratorInvite.create({
    data: {
      listId,
      invitedId: invitedUser.id,
      invitedById: req.user.id,
      role,
      token,
      expiresAt,
    },
    select: {
      id: true,
      listId: true,
      invitedId: true,
      invitedById: true,
      role: true,
      status: true,
      token: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return res.status(201).json({
    message: "Invite created successfully",
    invite,
  });
};

export const viewSharedList = async (
  req: AuthenticatedRequest & Request<ListParams>,
  res: Response,
) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const listId = req.params.id?.trim();
  if (!listId) {
    throw new AppError("List id is required", 400);
  }

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      shareCode: true,
      createdAt: true,
      updatedAt: true,
      collaborators: {
        where: { userId: req.user.id },
        select: {
          id: true,
          role: true,
          userId: true,
        },
      },
      items: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
          imageUrl: true,
          price: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
          claims: {
            select: {
              id: true,
              status: true,
              note: true,
              userId: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!list) {
    throw new AppError("List not found", 404);
  }

  const isOwner = list.ownerId === req.user.id;
  const isCollaborator = list.collaborators.length > 0;

  if (!isOwner && !isCollaborator) {
    throw new AppError("You do not have access to this list", 403);
  }

  if (isOwner) {
    const itemsForOwner = list.items.map(({ claims, ...item }) => item);

    return res.status(200).json({
      message: "Shared list fetched successfully",
      viewerRole: "OWNER",
      list: {
        id: list.id,
        name: list.name,
        shareCode: list.shareCode,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        items: itemsForOwner,
      },
    });
  }

  return res.status(200).json({
    message: "Shared list fetched successfully",
    viewerRole: "COLLABORATOR",
    list: {
      id: list.id,
      name: list.name,
      shareCode: list.shareCode,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      items: list.items,
    },
  });
};

export const claimItemOnSharedList = async (
  req: AuthenticatedRequest & Request<ListParams, unknown, ClaimBody>,
  res: Response,
) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const listId = req.params.id?.trim();
  const itemId = req.params.itemId?.trim();

  if (!listId) {
    throw new AppError("List id is required", 400);
  }

  if (!itemId) {
    throw new AppError("Item id is required", 400);
  }

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: {
      id: true,
      ownerId: true,
      collaborators: {
        where: { userId: req.user.id },
        select: { id: true },
      },
    },
  });

  if (!list) {
    throw new AppError("List not found", 404);
  }

  const isOwner = list.ownerId === req.user.id;
  const isCollaborator = list.collaborators.length > 0;

  if (!isOwner && !isCollaborator) {
    throw new AppError("You do not have access to this list", 403);
  }

  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      listId,
    },
    select: { id: true, title: true },
  });

  if (!item) {
    throw new AppError("Item not found in this list", 404);
  }

  const note = req.body.note?.trim();

  const claim = await prisma.claim.upsert({
    where: {
      itemId_userId: {
        itemId,
        userId: req.user.id,
      },
    },
    update: {
      status: "CLAIMED",
      note: note || null,
    },
    create: {
      itemId,
      userId: req.user.id,
      status: "CLAIMED",
      note: note || null,
    },
    select: {
      id: true,
      itemId: true,
      userId: true,
      status: true,
      note: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({
    message: "Item claimed successfully",
    claim,
  });
};

export const acceptInviteByToken = async (
  req: AuthenticatedRequest &
    Request<Record<string, never>, unknown, unknown, InviteTokenQuery>,
  res: Response,
) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const token = req.query.token?.trim();
  if (!token) {
    throw new AppError("Invite token is required", 400);
  }

  const invite = await prisma.collaboratorInvite.findUnique({
    where: { token },
    select: {
      id: true,
      listId: true,
      invitedId: true,
      role: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invite) {
    throw new AppError("Invite not found", 404);
  }

  if (invite.invitedId !== req.user.id) {
    throw new AppError("This invite does not belong to you", 403);
  }

  if (invite.status !== "PENDING") {
    throw new AppError("Invite is no longer pending", 400);
  }

  const isExpired = invite.expiresAt.getTime() < Date.now();
  if (isExpired) {
    await prisma.collaboratorInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });

    throw new AppError("Invite has expired", 400);
  }

  const existingCollaborator = await prisma.listCollaborator.findFirst({
    where: {
      listId: invite.listId,
      userId: req.user.id,
    },
    select: { id: true },
  });

  if (!existingCollaborator) {
    await prisma.listCollaborator.create({
      data: {
        listId: invite.listId,
        userId: req.user.id,
        role: invite.role,
      },
    });
  }

  const updatedInvite = await prisma.collaboratorInvite.update({
    where: { id: invite.id },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
    select: {
      id: true,
      listId: true,
      invitedId: true,
      role: true,
      status: true,
      acceptedAt: true,
    },
  });

  return res.status(200).json({
    message: "Invite accepted successfully",
    invite: updatedInvite,
  });
};
