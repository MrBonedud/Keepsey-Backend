import { z } from "zod";

export const listIdParamsSchema = z.object({
  id: z.string().trim().min(1, "List id is required"),
});

export const listAndItemParamsSchema = z.object({
  id: z.string().trim().min(1, "List id is required"),
  itemId: z.string().trim().min(1, "Item id is required"),
});

export const createListBodySchema = z.object({
  name: z.string().trim().min(1, "List name is required"),
});

export const inviteBodySchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  role: z.enum(["VIEWER", "EDITOR"]).optional(),
});

export const claimBodySchema = z.object({
  note: z.string().trim().max(500, "Note is too long").optional(),
});

export const acceptInviteQuerySchema = z.object({
  token: z.string().trim().min(1, "Invite token is required"),
});
