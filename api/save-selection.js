// api/save-selection.js
import { PrismaClient } from '@prisma/client';

// Use pooled (Accelerate) URL if available, fallback to other envs
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

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString() || '{}';
  try {
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = await parseBody(req);
  const ipAddress =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    null;

  try {
    const saved = await prisma.userSelection.create({
      data: {
        educationLevel: body.educationLevel ?? body.education ?? null,
        wageLevel: body.wageLevel ?? body.wage ?? null,
        wageRange: body.wageRange ?? null,
        occupationCategory: body.occupationCategory ?? body.occupation ?? null,
        premiumProcessing: body.premiumProcessing ?? body.premium ?? null,
        premiumCoins: body.premiumCoins ?? body.coins ?? null,
        winChance: body.winChance ?? null,
        resultCode: body.resultCode ?? body.result ?? null,
        resultTitle: body.resultTitle ?? null,
        resultMessage: body.resultMessage ?? null,
        ipAddress,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    return res.status(200).json({ ok: true, data: saved });
  } catch (err) {
    console.error('DB insert error:', err);
    return res.status(500).json({ error: 'DB error', detail: err.message, code: err.code ?? null });
  }
}
