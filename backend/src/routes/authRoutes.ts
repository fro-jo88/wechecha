import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireSuperAdmin } from "../middleware/roleMiddleware";
import { register, login, getMe, updateProfile, updatePassword } from "../controllers/authController";

const router = Router();

router.post("/login", login);

// Protected Routes
router.use(authMiddleware);

// Super Admin Only - User Registration
router.post("/register", requireSuperAdmin, register);

router.get("/me", getMe);
router.put("/update-profile", updateProfile);
router.put("/update-password", updatePassword);

export default router;
