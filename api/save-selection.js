// api/save-selection.js
import prisma from '../../prisma'; // 导入 Prisma Client 实例

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const {
    educationLevel,
    wageLevel,
    wageRange,
    occupationCategory,
    premiumProcessing,
    coin,
    winChance,
    result,
  } = req.body || {};

  // 调试: 在服务器日志中打印接收到的数据
  console.log('Received payload at /api/save-selection:', req.body);

  const ipAddress =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    null;

  try {
    // 使用 Prisma Client 创建新记录
    const savedSelection = await prisma.userSelection.create({
      data: {
        educationLevel,
        wageLevel,
        wageRange,
        occupationCategory,
        premiumProcessing,
        ipAddress,
        coin,
        winChance,
        result,
      },
    });

    res.status(200).json({ success: true, data: savedSelection });
  } catch (err) {
    console.error('Error in /api/save-selection (Prisma):', err);
    res.status(500).json({
      error: 'Failed to save selection',
      message: err.message,
      code: err.code ?? null,
    });
  }
}
