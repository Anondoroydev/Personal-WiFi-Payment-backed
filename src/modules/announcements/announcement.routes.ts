import { Router } from "express";
import { Role } from "../../enums.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "./announcement.controller.js";

const router = Router();

// Public - anyone can read announcements
router.get("/", getAnnouncements);

// Admin only - protect write operations
router.post("/", authMiddleware, roleMiddleware(Role.ADMIN), createAnnouncement);
router.put("/:id", authMiddleware, roleMiddleware(Role.ADMIN), updateAnnouncement);
router.delete("/:id", authMiddleware, roleMiddleware(Role.ADMIN), deleteAnnouncement);

export default router;
