import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient;
}

// Prevent multiple instances of Prisma Client in development
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
