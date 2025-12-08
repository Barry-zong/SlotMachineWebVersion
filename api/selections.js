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

export default async function handler(_req, res) {
  try {
    await ensureTable()
    const { rows } = await sql`SELECT * FROM "UserSelection" ORDER BY "createdAt" DESC`
    return res.status(200).json(rows)
  } catch (err) {
    console.error('Error fetching selections:', err)
    return res.status(500).json({ error: 'Failed to fetch selections' })
  }
}
