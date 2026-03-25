import {
  acceptInviteByToken,
  inviteToList,
  viewSharedList,
} from "../src/controllers/list.controller";
import { createMockResponse } from "./helpers/http";

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    list: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    listCollaborator: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    collaboratorInvite: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "../src/lib/prisma";

describe("list critical flows", () => {
  it("invite flow creates pending invite", async () => {
    const req = {
      user: { id: "owner-1", email: "owner@example.com" },
      params: { id: "list-1" },
      body: { email: "friend@example.com", role: "EDITOR" },
    } as any;
    const res = createMockResponse();

    (prisma.list.findFirst as jest.Mock).mockResolvedValue({
      id: "list-1",
      ownerId: "owner-1",
      name: "My List",
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-2",
      email: "friend@example.com",
      name: "Friend",
    });
    (prisma.listCollaborator.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.collaboratorInvite.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.collaboratorInvite.create as jest.Mock).mockResolvedValue({
      id: "inv-1",
      listId: "list-1",
      invitedId: "user-2",
      invitedById: "owner-1",
      role: "EDITOR",
      status: "PENDING",
      token: "token-1",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000),
    });

    await inviteToList(req, res);

    expect(prisma.collaboratorInvite.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("accept flow accepts pending invite and creates collaborator", async () => {
    const req = {
      user: { id: "user-2", email: "friend@example.com" },
      query: { token: "token-1" },
    } as any;
    const res = createMockResponse();

    (prisma.collaboratorInvite.findUnique as jest.Mock).mockResolvedValue({
      id: "inv-1",
      listId: "list-1",
      invitedId: "user-2",
      role: "EDITOR",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    (prisma.listCollaborator.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.listCollaborator.create as jest.Mock).mockResolvedValue({
      id: "lc-1",
    });
    (prisma.collaboratorInvite.update as jest.Mock).mockResolvedValue({
      id: "inv-1",
      listId: "list-1",
      invitedId: "user-2",
      role: "EDITOR",
      status: "ACCEPTED",
      acceptedAt: new Date(),
    });

    await acceptInviteByToken(req, res);

    expect(prisma.listCollaborator.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("view visibility hides claims for owner but shows for collaborator", async () => {
    const ownerReq = {
      user: { id: "owner-1", email: "owner@example.com" },
      params: { id: "list-1" },
    } as any;
    const collabReq = {
      user: { id: "user-2", email: "friend@example.com" },
      params: { id: "list-1" },
    } as any;

    const ownerRes = createMockResponse();
    const collabRes = createMockResponse();

    (prisma.list.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "list-1",
        name: "My List",
        ownerId: "owner-1",
        shareCode: "abc",
        createdAt: new Date(),
        updatedAt: new Date(),
        collaborators: [],
        items: [
          {
            id: "item-1",
            title: "Item",
            description: null,
            url: null,
            imageUrl: null,
            price: null,
            categoryId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            claims: [{ id: "c1", userId: "user-2" }],
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "list-1",
        name: "My List",
        ownerId: "owner-1",
        shareCode: "abc",
        createdAt: new Date(),
        updatedAt: new Date(),
        collaborators: [{ id: "lc-1", role: "EDITOR", userId: "user-2" }],
        items: [
          {
            id: "item-1",
            title: "Item",
            description: null,
            url: null,
            imageUrl: null,
            price: null,
            categoryId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            claims: [{ id: "c1", userId: "user-2" }],
          },
        ],
      });

    await viewSharedList(ownerReq, ownerRes);
    await viewSharedList(collabReq, collabRes);

    const ownerPayload = (ownerRes.json as jest.Mock).mock.calls[0][0];
    const collabPayload = (collabRes.json as jest.Mock).mock.calls[0][0];

    expect(ownerPayload.list.items[0].claims).toBeUndefined();
    expect(collabPayload.list.items[0].claims).toBeDefined();
  });
});
