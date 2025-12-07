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
    // 定义允许处理的字段，防止注入无关数据
    const allowedKeys = ['educationLevel', 'wageLevel', 'occupationCategory', 'result'];
    const data = await request.json();
    const kv = getKvClient();

    // 使用 pipeline 批量执行命令，性能更好
    const pipe = kv.pipeline();
    let hasDataToRecord = false;

    // 循环处理所有允许的维度，使代码更具扩展性
    for (const key of allowedKeys) {
      // 确保值是有效的字符串
      if (typeof data[key] === 'string' && data[key].trim() !== '') {
        pipe.hincrby(STATS_KEYS[key], data[key].trim(), 1);
        hasDataToRecord = true;
      }
    }

    // 记录是否为付费用户
    const premiumStatus = (data.premiumCoins || 0) > 0 ? 'Paid' : 'Free';
    pipe.hincrby(STATS_KEYS.premiumCoins, premiumStatus, 1);
    hasDataToRecord = true;

    await pipe.exec();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('记录数据时出错:', error);
    // 区分 JSON 解析错误和其它服务器错误
    const isJsonError = error instanceof SyntaxError;
    const errorMessage = isJsonError ? '无效的请求数据 (Invalid JSON)' : '服务器内部错误';
    const statusCode = isJsonError ? 400 : 500;
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
      headers: responseHeaders,
    });
  }
}