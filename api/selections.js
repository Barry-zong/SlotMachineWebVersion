import { sql } from '@vercel/postgres'

export default async function handler(_req, res) {
  try {
    const { rows } = await sql`SELECT * FROM "UserSelection" ORDER BY "createdAt" DESC`
    return res.status(200).json(rows)
  } catch (err) {
    console.error('Error fetching selections:', err)
    return res.status(500).json({ error: 'Failed to fetch selections' })
  }
}
