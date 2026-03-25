import { Router } from "express";
import {
  createItemFromUrl,
  createItemManual,
  deleteItem,
  getItems,
  getItemsByCategory,
  updateItem,
  uploadItemImage,
} from "../controllers/item.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { uploadImage } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createItemFromUrlBodySchema,
  createItemManualBodySchema,
  getItemsByCategoryQuerySchema,
  itemIdParamsSchema,
  updateItemBodySchema,
} from "../validators/item.schemas";

const router = Router();

router.post(
  "/",
  requireAuth,
  validate({ body: createItemManualBodySchema }),
  createItemManual,
);
router.post(
  "/from-url",
  requireAuth,
  validate({ body: createItemFromUrlBodySchema }),
  createItemFromUrl,
);
router.post(
  "/:id/image",
  requireAuth,
  validate({ params: itemIdParamsSchema }),
  uploadImage.single("image"),
  uploadItemImage,
);
router.get("/", requireAuth, getItems);
router.get(
  "/by-category",
  requireAuth,
  validate({ query: getItemsByCategoryQuerySchema }),
  getItemsByCategory,
);
router.patch(
  "/:id",
  requireAuth,
  validate({ params: itemIdParamsSchema, body: updateItemBodySchema }),
  updateItem,
);
router.delete(
  "/:id",
  requireAuth,
  validate({ params: itemIdParamsSchema }),
  deleteItem,
);

export default router;
