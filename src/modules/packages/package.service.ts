import { prisma } from "../../config/prisma.js";

export const packageService = {
  async getAll() {
    return prisma.package.findMany({
      orderBy: { price: "asc" },
    });
  },

  async getById(id: string) {
    return prisma.package.findUnique({ where: { id } });
  },
};
