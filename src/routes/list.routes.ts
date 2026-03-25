import { Router } from "express";
import {
  acceptInviteByToken,
  claimItemOnSharedList,
  createSharedList,
  inviteToList,
  viewSharedList,
} from "../controllers/list.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { inviteRateLimiter } from "../middleware/rate-limit.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  acceptInviteQuerySchema,
  claimBodySchema,
  createListBodySchema,
  inviteBodySchema,
  listAndItemParamsSchema,
  listIdParamsSchema,
} from "../validators/list.schemas";

const router = Router();

router.post(
  "/",
  requireAuth,
  validate({ body: createListBodySchema }),
  createSharedList,
);
router.post(
  "/:id/invite",
  requireAuth,
  inviteRateLimiter,
  validate({ params: listIdParamsSchema, body: inviteBodySchema }),
  inviteToList,
);
router.get(
  "/:id",
  requireAuth,
  validate({ params: listIdParamsSchema }),
  viewSharedList,
);
router.post(
  "/:id/items/:itemId/claim",
  requireAuth,
  validate({ params: listAndItemParamsSchema, body: claimBodySchema }),
  claimItemOnSharedList,
);
router.post(
  "/invites/accept",
  requireAuth,
  inviteRateLimiter,
  validate({ query: acceptInviteQuerySchema }),
  acceptInviteByToken,
);

export default router;
