import { getKvClient, STATS_KEYS, responseHeaders } from './_utils.js';

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders });
  }

  try {
    const kv = getKvClient();

    // 并行获取所有统计数据
    const [education, wage, occupation, premium, result] = await Promise.all([
      kv.hgetall(STATS_KEYS.educationLevel),
      kv.hgetall(STATS_KEYS.wageLevel),
      kv.hgetall(STATS_KEYS.occupationCategory),
      kv.hgetall(STATS_KEYS.premiumCoins),
      kv.hgetall(STATS_KEYS.result),
    ]);

    return new Response(JSON.stringify({ education, wage, occupation, premium, result }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('获取统计数据时出错:', error);
    return new Response(JSON.stringify({ message: '服务器内部错误', error: error.message }), {
      status: 500,
      headers: responseHeaders,
    });
  }
}