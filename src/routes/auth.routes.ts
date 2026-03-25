import { Router } from "express";
import { me, signup, signin } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rate-limit.middleware";
import { validate } from "../middleware/validate.middleware";
import { signinBodySchema, signupBodySchema } from "../validators/auth.schemas";

const router = Router();

router.post(
  "/signup",
  authRateLimiter,
  validate({ body: signupBodySchema }),
  signup,
);
router.post(
  "/signin",
  authRateLimiter,
  validate({ body: signinBodySchema }),
  signin,
);
router.get("/me", requireAuth, me);
export default router;
