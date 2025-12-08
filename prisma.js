import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// 初始化 Prisma Client 并启用 Accelerate
// Accelerate 使用 PRISMA_DATABASE_URL 环境变量
const prisma = new PrismaClient().$extends(withAccelerate());

export default prisma;