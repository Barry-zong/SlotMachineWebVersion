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

    const { rows } = await sql`
      INSERT INTO "UserSelection" ("educationLevel", "wageLevel", "occupationCategory", "premiumProcessing", "ipAddress", "userAgent")
      VALUES (${educationLevel}, ${wageLevel}, ${occupationCategory}, ${premiumProcessing}, ${ipAddress}, ${userAgent})
      RETURNING *
    `

    return res.status(201).json(rows[0])
  } catch (err) {
    console.error('Error saving selection:', err)
    return res.status(500).json({ error: 'Failed to save selection' })
  }
}
