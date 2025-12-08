import pg from 'pg';

// 从环境变量中获取数据库连接字符串
// Vercel 会自动提供 POSTGRES_URL
const connectionString = process.env.POSTGRES_URL;

// 使用 pg.Pool 来管理数据库连接池，这比每次请求都创建新连接更高效
const pool = new pg.Pool({
  connectionString,
  // Vercel Postgres 需要 SSL 连接，但通常不需要拒绝未授权的证书
  // pg 库会根据连接字符串中的 'sslmode=require' 自动处理
  ssl: connectionString ? { rejectUnauthorized: false } : false,
});

// 导出一个可以执行查询的函数
export default {
  query: (text, params) => pool.query(text, params),
};

// 监听连接池的错误事件
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});