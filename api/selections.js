// api/selections.js
import { createClient } from '@vercel/postgres'

let tableEnsured = false
let _client

async function getClient() {
  if (!_client) {
    const connectionString =
      process.env.POSTGRES_URL ??
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error('No Postgres connection string configured (POSTGRES_URL / POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING / DATABASE_URL)')
    }

    _client = createClient({ connectionString })
    await _client.connect()
  }
  return _client
}

async function ensureTable() {
  if (tableEnsured) return
  const client = await getClient()
  await client.sql`
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
    const client = await getClient()
    const { rows } = await client.sql`SELECT * FROM "UserSelection" ORDER BY "createdAt" DESC`
    return res.status(200).json(rows)
  } catch (err) {
    console.error('Error fetching selections:', err)
    return res.status(500).json({
      error: 'Failed to fetch selections',
      message: err?.message || String(err),
      code: err?.code || null,
    })
  }
}
