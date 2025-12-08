// api/save-selection.js

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const {
    educationLevel,
    wageLevel,
    wageRange,
    occupationCategory,
    premiumProcessing,
  } = req.body || {};

  const ipAddress =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    null;

  try {
    await ensureTable();

    const result = await pool.query(
      `
      INSERT INTO "UserSelection"
        ("educationLevel", "wageLevel", "wageRange", "occupationCategory", "premiumProcessing", "ipAddress")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [educationLevel, wageLevel, wageRange, occupationCategory, premiumProcessing, ipAddress]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error in /api/save-selection:', err);
    res.status(500).json({
      error: 'Failed to save selection',
      message: err.message,
      code: err.code ?? null,
    });
  }
}
