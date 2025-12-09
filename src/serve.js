import path from "path";
import express from "express";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import db from "./db.js"; // 引入我们的数据库模块
import prisma from "./prisma.js";

// 在代码的最顶端加载 .env.local 文件中的环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 使用 express.json() 中间件来解析传入的 JSON 请求
app.use(express.json());

// --- API Endpoints ---
// 示例：创建一个 API 端点来处理用户注册
app.post("/api/register", async (req, res) => {
  const { name, email } = req.body; // 从请求体中获取 name 和 email

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  try {
    const queryText = 'INSERT INTO players(name, email) VALUES($1, $2) RETURNING *';
    const result = await db.query(queryText, [name, email]);
    console.log("Player registered:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// API endpoint to save user selections
app.post("/api/save-selection", async (req, res) => {
  try {
    const {  educationLevel,
      wageLevel,
      wageRange,
      occupationCategory,
      premiumProcessing,
      coin,
      winChance,
      result } = req.body;
    
    // Optional: capture basic metadata if available
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const selection = await prisma.userSelection.create({
      data: {
        educationLevel,
        wageLevel,
        wageRange,
        occupationCategory,
        premiumProcessing,
        ipAddress,
        userAgent,
        coin,
        winChance,
        result
      }
    });

    console.log("Selection saved:", selection);
    res.status(201).json(selection);
  } catch (err) {
    console.error("Error saving selection:", err);
    res.status(500).json({ error: "Failed to save selection" });
  }
});

// API endpoint to list saved selections (for debugging/analytics)
app.get("/api/selections", async (_req, res) => {
  try {
    const selections = await prisma.userSelection.findMany({
      orderBy: { createdAt: "desc" },
      
    });
    res.json(selections);
  } catch (err) {
    console.error("Error fetching selections:", err);
    res.status(500).json({ error: "Failed to fetch selections" });
  }
});

// API endpoint to list all registered players
app.get("/api/players", async (_req, res) => {
  try {
    const players = await prisma.players.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(players);
  } catch (err) {
    console.error("Error fetching players:", err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

// --- Static File Serving ---
// 提供 dist 目录下的静态资源（这是 Vite build 的默认输出目录）
const staticPath = path.join(__dirname, "../dist");
app.use(express.static(staticPath));

// Fallback：对于所有其他 GET 请求，都返回 index.html，以支持前端路由
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Slot machine server is running at http://localhost:${PORT}`);
});
