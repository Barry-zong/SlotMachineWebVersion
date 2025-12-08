// api/selections.js
import prisma from '../../prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // 使用 Prisma Client 获取所有记录。
    // 默认情况下，findMany 会返回所有字段，这正是我们需要的。
    // 按创建时间降序排序，以首先显示最新的结果。
    const selections = await prisma.userSelection.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(selections);
  } catch (err) {
    console.error('Error fetching selections:', err);
    // 如果表尚不存在，则返回一个空数组而不是错误
    if (err.code === 'P2021' || (err.message && err.message.includes("does not exist"))) {
       return res.status(200).json([]);
    }
    res.status(500).json({ error: 'Failed to fetch selections', message: err.message });
  }
}