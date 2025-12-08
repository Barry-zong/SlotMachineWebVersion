// api/selections.js
import { PrismaClient } from '@prisma/client';

const dbUrl =
  process.env.PRISMA_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

const prisma =
  global.__prisma ||
  new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });
if (!global.__prisma) global.__prisma = prisma;

export default async function handler(req, res) {
  try {
    const rows = await prisma.userSelection.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error in /api/selections:', err);
    res.status(500).json({
      error: 'Failed to fetch selections',
      message: err.message,
      code: err.code ?? null,
    });
  }
}
