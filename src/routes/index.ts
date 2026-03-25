import { Router } from "express";
import authRoutes from "./auth.routes";
import categoryRoutes from "./category.routes";
import itemRoutes from "./item.routes";
import listRoutes from "./list.routes";
const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/items", itemRoutes);
router.use("/lists", listRoutes);

export default router;
