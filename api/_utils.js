import { createClient } from '@vercel/kv';

/**
 * 初始化并返回一个 KV 客户端实例。
 * 它会自动使用 Vercel 项目中配置的环境变量。
 */
export function getKvClient() {
  return createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

/**
 * 定义我们将要统计的维度。
 */
export const STATS_KEYS = {
  educationLevel: 'stats:education',
  wageLevel: 'stats:wage',
  occupationCategory: 'stats:occupation',
  premiumCoins: 'stats:premium',
  result: 'stats:result',
};

/**
 * 统一的 API 响应头。
 */
export const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*', // 允许所有来源的跨域请求
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};