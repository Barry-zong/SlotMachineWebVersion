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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    await ensureTable()
    const buffers = []
    for await (const chunk of req) {
      buffers.push(chunk)
    }
    const bodyString = Buffer.concat(buffers).toString() || '{}'
    const { educationLevel, wageLevel, occupationCategory, premiumProcessing } = JSON.parse(bodyString)
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null
    const userAgent = req.headers['user-agent'] || null

    const client = await getClient()
    const { rows } = await client.sql`
      INSERT INTO "UserSelection" ("educationLevel", "wageLevel", "occupationCategory", "premiumProcessing", "ipAddress", "userAgent")
      VALUES (${educationLevel}, ${wageLevel}, ${occupationCategory}, ${premiumProcessing}, ${ipAddress}, ${userAgent})
      RETURNING *
    `

    return res.status(201).json(rows[0])
  } catch (err) {
    console.error('Error saving selection:', err)
    return res.status(500).json({
      error: 'Failed to save selection',
      message: err?.message || String(err),
      code: err?.code || null,
    })
  }
}
