import { getKvClient, STATS_KEYS, responseHeaders } from './_utils.js';

export default async function handler(request) {
  // 预检请求，用于处理跨域
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: '只允许 POST 请求' }), {
      status: 405,
      headers: responseHeaders,
    });
  }

  try {
    const data = await request.json();
    const kv = getKvClient();

    // 使用 pipeline 批量执行命令，性能更好
    const pipe = kv.pipeline();

    // 对每个维度的数据进行计数
    if (data.educationLevel) pipe.hincrby(STATS_KEYS.educationLevel, data.educationLevel, 1);
    if (data.wageLevel) pipe.hincrby(STATS_KEYS.wageLevel, data.wageLevel, 1);
    if (data.occupationCategory) pipe.hincrby(STATS_KEYS.occupationCategory, data.occupationCategory, 1);
    if (data.result) pipe.hincrby(STATS_KEYS.result, data.result, 1);

    // 记录是否为付费用户
    const premiumStatus = (data.premiumCoins || 0) > 0 ? 'Paid' : 'Free';
    pipe.hincrby(STATS_KEYS.premiumCoins, premiumStatus, 1);

    await pipe.exec();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('记录数据时出错:', error);
    return new Response(JSON.stringify({ message: '服务器内部错误', error: error.message }), {
      status: 500,
      headers: responseHeaders,
    });
  }
}