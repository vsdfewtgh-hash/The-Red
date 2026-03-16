require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Bot } = require('grammy');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'http://localhost:5173';

// 短剧列表 - 真实视频
const dramas = [
  {
    id: 1,
    title: "九块九秒杀一切",
    cover: "https://picsum.photos/400/700?random=1",
    episodes: Array.from({ length: 108 }, (_, i) => ({
      id: i + 1,
      url: `/videos/第${String(i + 1).padStart(2, '0')}集.mp4`,
      free: true
    })),
    pricePerEpisode: 100,
    paywallAt: 11
  }
];

// 用户数据
const users = new Map();
const invites = new Map();

// Bot
let bot;
if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
  bot = new Bot(BOT_TOKEN);
  
  const welcomes = [
    "🎬 欢迎回来！最新章节已更新，点击开始观看~",
    "✨ 好剧来了！立即体验沉浸式追剧",
    "🔥 热门短剧更新啦，快来看看吧！",
    "📺 你的私人影院，点击立即开播"
  ];

  bot.command('start', async (ctx) => {
    const from = ctx.message?.from;
    const ref = ctx.match || 'direct';
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
}

// API 路由
app.get('/api/dramas', (req, res) => res.json(dramas));

app.get('/api/drama/:id', (req, res) => {
  const drama = dramas.find(d => d.id === parseInt(req.params.id));
  drama ? res.json(drama) : res.status(404).json({ error: 'Not found' });
});

app.post('/api/unlock', (req, res) => {
  const { userId, dramaId, episodeId } = req.body;
  const user = users.get(userId) || { id: userId, coins: 0, unlocked: [] };
  if (user.coins >= 100) {
    user.coins -= 100;
    user.unlocked.push(`${dramaId}-${episodeId}`);
    users.set(userId, user);
    res.json({ success: true });
  } else {
    res.json({ success: false, message: '金币不足' });
  }
});

app.get('/api/user/:id', (req, res) => {
  const user = users.get(req.params.id) || { id: req.params.id, coins: 500, unlocked: [] };
  res.json(user);
});

app.post('/api/signin', (req, res) => {
  const { userId } = req.body;
  const user = users.get(userId) || { id: userId, coins: 0, lastSignIn: null };
  const today = new Date().toDateString();
  if (user.lastSignIn !== today) {
    user.coins += 100;
    user.lastSignIn = today;
    users.set(userId, user);
    res.json({ success: true, coins: user.coins });
  } else {
    res.json({ success: false, message: '今天已签到' });
  }
});

app.post('/api/invite/record', (req, res) => {
  const { userId, referrer } = req.body;
  if (referrer && referrer !== userId) {
    const inviter = users.get(referrer) || { id: referrer, coins: 0, inviteCount: 0 };
    inviter.coins += 50;
    inviter.inviteCount = (inviter.inviteCount || 0) + 1;
    users.set(referrer, inviter);
  }
  res.json({ success: true });
});

// 静态文件
app.use('/videos', express.static('/Users/mac1/Desktop/drama/60.我用九块九秒杀一切（108集）黎沐清＆杨力'));
app.use('/assets', express.static(path.join(__dirname, '../frontend/dist/assets')));
app.use('/favicon.ico', express.static(path.join(__dirname, '../frontend/dist/favicon.ico')));

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
