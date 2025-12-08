// api/selections.js
import { sql } from '@vercel/postgres'

let tableEnsured = false

async function ensureTable() {
  if (tableEnsured) return
  await sql`
    CREATE TABLE IF NOT EXISTS "UserSelection" (
      "id" SERIAL PRIMARY KEY,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "educationLevel" TEXT,
      "wageLevel" TEXT,
      "occupationCategory" TEXT,
      "premiumProcessing" TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT
    );
  `
  tableEnsured = true
}

export default async function handler(req, res) {
  try {
    await ensureTable()
    const { rows } =
      await sql`SELECT * FROM "UserSelection" ORDER BY "createdAt" DESC`
    return res.status(200).json(rows)
  } catch (err) {
    console.error('Error fetching selections:', err)

    // ⚠️ 仅用于调试：把错误信息也返回给前端，方便查看
    return res.status(500).json({
      error: 'Failed to fetch selections',
      message: err?.message || String(err),
      code: err?.code || null,
    })
  }
}
