require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Bot } = require('grammy');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend/dist'));

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'http://localhost:5173';

// 模拟数据 - 短剧列表
const dramas = [
  {
    id: 1,
    title: "龙王归来",
    cover: "https://picsum.photos/400/700?random=1",
    episodes: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4#t=${i * 10}`,
      free: i < 3 // 前3集免费
    })),
    pricePerEpisode: 100, // 金币
    paywallAt: 3 // 第3集后付费
  }
];

// 用户数据 (内存存储，生产环境用数据库)
const users = new Map();
const invites = new Map(); // 邀请记录

// Bot
let bot;
if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
  bot = new Bot(BOT_TOKEN);
  
  // 欢迎语料库 (防红标)
  const welcomes = [
    "🎬 欢迎回来！最新章节已更新，点击开始观看~",
    "✨ 好剧来了！立即体验沉浸式追剧",
    "🔥 热门短剧更新啦，快来看看吧！",
    "📺 你的私人影院，点击立即开播"
  ];

  bot.command('start', async (ctx) => {
    const from = ctx.message?.from;
    const ref = ctx.match || 'direct';
    
    // 记录来源
    console.log(`User ${from?.id} started from ref: ${ref}`);
    
    const welcome = welcomes[Math.floor(Math.random() * welcomes.length)];
    
    await ctx.reply(welcome, {
      reply_markup: {
        inline_keyboard: [[
          { text: "🎬 开始看剧", web_app: { url: `${MINI_APP_URL}?ref=${ref}` } }
        ]]
      }
    });
  });

  bot.on('message', async (ctx) => {
    // 随机回复防spam
    const responses = [
      "点击上方按钮开始看剧哦~ 🎬",
      "有问题？直接点击开始按钮体验！",
      "欢迎欢迎！先看看有什么好剧吧 👆"
    ];
    if (!ctx.message?.text?.startsWith('/')) {
      await ctx.reply(responses[Math.floor(Math.random() * responses.length)]);
    }
  });

  bot.start();
  console.log('🤖 Bot started');
}

// API: 获取剧集信息
app.get('/api/drama/:id', (req, res) => {
  const drama = dramas.find(d => d.id === parseInt(req.params.id));
  if (!drama) return res.status(404).json({ error: 'Drama not found' });
  res.json(drama);
});

// API: 解锁剧集 (模拟支付)
app.post('/api/unlock', (req, res) => {
  const { userId, dramaId, episodeId } = req.body;
  
  // 模拟：给用户送金币
  if (!users.has(userId)) {
    users.set(userId, { coins: 500, unlocked: [] });
  }
  const user = users.get(userId);
  user.coins += 100; // 签到送金币
  
  res.json({ success: true, coins: user.coins });
});

// API: 用户信息
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  if (!users.has(userId)) {
    users.set(userId, { coins: 500, unlocked: [] });
  }
  res.json(users.get(userId));
});

// API: 记录邀请关系
app.post('/api/invite/record', (req, res) => {
  const { userId, referrer } = req.body;
  
  if (!userId || !referrer) {
    return res.status(400).json({ error: 'Missing userId or referrer' });
  }
  
  // 记录被邀请人
  if (!users.has(userId)) {
    users.set(userId, { coins: 500, unlocked: [] });
  }
  const user = users.get(userId);
  user.referrer = referrer;
  
  // 记录邀请人
  if (!invites.has(referrer)) {
    invites.set(referrer, { count: 0, invitees: [] });
  }
  const inviter = invites.get(referrer);
  if (!inviter.invitees.includes(userId)) {
    inviter.count++;
    inviter.invitees.push(userId);
    // 给邀请人加金币
    const inviterUser = users.get(referrer) || { coins: 500, unlocked: [] };
    inviterUser.coins = (inviterUser.coins || 500) + 50;
    users.set(referrer, inviterUser);
  }
  
  res.json({ success: true, inviteCount: inviter.count });
});

// API: 获取邀请统计
app.get('/api/invite/:userId', (req, res) => {
  const userId = req.params.userId;
  const inviteData = invites.get(userId) || { count: 0, invitees: [] };
  res.json(inviteData);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
