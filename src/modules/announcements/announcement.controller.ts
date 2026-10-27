import { prisma } from "../../config/prisma.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { AppError } from "../../utils/error.js";

export const getAnnouncements = asyncHandler(async (_req, res) => {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });
  sendSuccess(res, { announcements });
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const { title, message, type, isActive } = req.body;
  await prisma.announcement.create({
    data: {
      title,
      message,
      type: type || "info",
      isActive: isActive !== undefined ? isActive : true,
    },
  });
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });
  sendSuccess(res, { announcements }, "Announcement created");
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const { id } = req.params;
  const { title, message, type, isActive } = req.body;
  await prisma.announcement.update({
    where: { id },
    data: { title, message, type, isActive },
  });
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });
  sendSuccess(res, { announcements }, "Announcement updated");
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const { id } = req.params;
  await prisma.announcement.delete({ where: { id } });
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });
  sendSuccess(res, { announcements }, "Announcement deleted");
});
