// api/selections.js

import pkg from 'pg';
const { Pool } = pkg;

// 用 Prisma 提供的 POSTGRES_URL 直接连 db.prisma.io
const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // 连接 cloud postgres 常用
});

// 确保建表
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "UserSelection" (
      id SERIAL PRIMARY KEY,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "educationLevel" TEXT,
      "wageLevel" TEXT,
      "wageRange" TEXT,
      "occupationCategory" TEXT,
      "premiumProcessing" TEXT,
      "ipAddress" TEXT
    );
  `);
  await pool.query(`ALTER TABLE "UserSelection" ADD COLUMN IF NOT EXISTS "wageRange" TEXT;`);
}

export default async function handler(req, res) {
  try {
    await ensureTable();

    const result = await pool.query(`
      SELECT "id", "createdAt", "educationLevel", "wageLevel", "wageRange",
             "occupationCategory", "premiumProcessing", "ipAddress"
      FROM "UserSelection"
      ORDER BY "createdAt" DESC;
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error in /api/selections:', err);
    res.status(500).json({
      error: 'Failed to fetch selections',
      message: err.message,
      code: err.code ?? null,
    });
  }
}
