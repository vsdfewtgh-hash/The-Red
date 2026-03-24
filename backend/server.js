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

// ========== 模拟生成更多用户数据 (演示用) ==========
// 生成一些模拟用户
for (let i = 1; i <= 50; i++) {
  const userId = String(100000 + i);
  users.set(userId, {
    id: userId,
    username: `user_${userId}`,
    coins: Math.floor(Math.random() * 2000),
    totalSpent: Math.floor(Math.random() * 500),
    unlocked: Array.from({ length: Math.floor(Math.random() * 20) }, (_, j) => `1-${j + 1}`),
    inviteCount: Math.floor(Math.random() * 10),
    referrer: Math.random() > 0.5 ? String(100000 + Math.floor(Math.random() * 50)) : null,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: Math.random() > 0.1 ? 'active' : 'banned'
  });
}

// 订单数据
const orders = [
  { id: 'ord_001', userId: '100001', type: 'recharge', amount: 100, price: 0.99, stars: 100, status: 'completed', createdAt: '2026-03-23T10:30:00Z' },
  { id: 'ord_002', userId: '100002', type: 'recharge', amount: 500, price: 4.99, stars: 550, status: 'completed', createdAt: '2026-03-23T11:45:00Z' },
  { id: 'ord_003', userId: '100001', type: 'unlock', dramaId: 1, episodeId: 11, amount: 100, price: 0.10, status: 'completed', createdAt: '2026-03-23T12:00:00Z' },
  { id: 'ord_004', userId: '100003', type: 'recharge', amount: 1000, price: 9.99, stars: 1200, status: 'completed', createdAt: '2026-03-23T14:20:00Z' },
  { id: 'ord_005', userId: '100005', type: 'unlock', dramaId: 1, episodeId: 15, amount: 100, price: 0.10, status: 'completed', createdAt: '2026-03-23T15:10:00Z' },
  { id: 'ord_006', userId: '100008', type: 'recharge', amount: 2000, price: 19.99, stars: 2500, status: 'completed', createdAt: '2026-03-23T16:30:00Z' },
  { id: 'ord_007', userId: '100010', type: 'recharge', amount: 100, price: 0.99, stars: 100, status: 'pending', createdAt: '2026-03-23T18:00:00Z' },
  { id: 'ord_008', userId: '100012', type: 'unlock', dramaId: 1, episodeId: 20, amount: 100, price: 0.10, status: 'completed', createdAt: '2026-03-23T19:15:00Z' },
];

// 矩阵号/渠道数据
const sources = [
  { id: 1, name: '矩阵号A', code: 'matrix_a', users: 4500, rate: 35.8, status: 'active', createdAt: '2026-03-01T00:00:00Z' },
  { id: 2, name: '矩阵号B', code: 'matrix_b', users: 3200, rate: 25.4, status: 'active', createdAt: '2026-03-01T00:00:00Z' },
  { id: 3, name: '矩阵号C', code: 'matrix_c', users: 2800, rate: 22.3, status: 'active', createdAt: '2026-03-01T00:00:00Z' },
  { id: 4, name: '矩阵号D', code: 'matrix_d', users: 1500, rate: 11.9, status: 'active', createdAt: '2026-03-01T00:00:00Z' },
  { id: 5, name: '自然流量', code: 'direct', users: 580, rate: 4.6, status: 'active', createdAt: '2026-03-01T00:00:00Z' },
];

// 系统设置
const settings = {
  banners: [
    { id: 1, title: '新用户专享', image: 'https://picsum.photos/750/300?random=10', link: '', active: true },
    { id: 2, title: '充值优惠', image: 'https://picsum.photos/750/300?random=11', link: '', active: false },
  ],
  pricePerEpisode: 100,
  freeEpisodes: 10,
  pricePackages: [
    { id: 1, coins: 100, price: 0.99, bonus: 0 },
    { id: 2, coins: 500, price: 4.99, bonus: 50 },
    { id: 3, coins: 1000, price: 9.99, bonus: 200 },
    { id: 4, coins: 2000, price: 19.99, bonus: 500 },
  ],
  telegramBotToken: BOT_TOKEN || '',
  notificationEnabled: true,
};

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

// ========== Admin API ==========

// 获取统计数据
app.get('/api/admin/stats', (req, res) => {
  const userList = Array.from(users.values());
  const totalUsers = userList.length;
  const activeUsers = userList.filter(u => {
    const lastActive = new Date(u.lastActive);
    return (Date.now() - lastActive.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.price, 0);
  const totalOrders = orders.filter(o => o.status === 'completed').length;
  const arppu = totalOrders > 0 ? totalRevenue / totalUsers : 0;
  const payingRate = (totalOrders / totalUsers * 100).toFixed(1);
  
  // 每日数据
  const dailyData = [];
  for (let i = 7; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().slice(0, 10);
    const dayOrders = orders.filter(o => o.createdAt.startsWith(dateStr) && o.status === 'completed');
    dailyData.push({
      date: date.toISOString().slice(5, 10),
      dau: Math.floor(8000 + Math.random() * 5000),
      revenue: dayOrders.reduce((s, o) => s + o.price, 0) + Math.random() * 100,
      orders: dayOrders.length
    });
  }
  
  res.json({
    dau: activeUsers,
    totalUsers,
    revenue: totalRevenue.toFixed(2),
    arppu: arppu.toFixed(2),
    payingRate,
    dailyData
  });
});

// 用户管理
app.get('/api/admin/users', (req, res) => {
  const { page = 1, limit = 20, search = '', status = '' } = req.query;
  let userList = Array.from(users.values());
  
  if (search) {
    userList = userList.filter(u => u.id.includes(search) || u.username?.includes(search));
  }
  if (status) {
    userList = userList.filter(u => u.status === status);
  }
  
  const total = userList.length;
  const start = (page - 1) * limit;
  userList = userList.slice(start, start + parseInt(limit));
  
  res.json({ list: userList, total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/admin/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // 获取用户订单
  const userOrders = orders.filter(o => o.userId === req.params.id);
  
  res.json({ ...user, orders: userOrders });
});

app.put('/api/admin/users/:id', (req, res) => {
  const { status, coins } = req.body;
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (status !== undefined) user.status = status;
  if (coins !== undefined) user.coins = coins;
  
  users.set(req.params.id, user);
  res.json({ success: true, user });
});

// 订单管理
app.get('/api/admin/orders', (req, res) => {
  const { page = 1, limit = 20, type = '', status = '' } = req.query;
  let orderList = [...orders].reverse();
  
  if (type) orderList = orderList.filter(o => o.type === type);
  if (status) orderList = orderList.filter(o => o.status === status);
  
  const total = orderList.length;
  const start = (page - 1) * limit;
  orderList = orderList.slice(start, start + parseInt(limit));
  
  // 收入统计
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.price, 0);
  const rechargeRevenue = orders.filter(o => o.status === 'completed' && o.type === 'recharge').reduce((s, o) => s + o.price, 0);
  const unlockRevenue = orders.filter(o => o.status === 'completed' && o.type === 'unlock').reduce((s, o) => s + o.price, 0);
  
  res.json({ 
    list: orderList, 
    total, 
    page: parseInt(page), 
    limit: parseInt(limit),
    stats: { totalRevenue, rechargeRevenue, unlockRevenue }
  });
});

// 矩阵号/渠道管理
app.get('/api/admin/sources', (req, res) => {
  res.json(sources);
});

app.post('/api/admin/sources', (req, res) => {
  const { name, code } = req.body;
  const newSource = {
    id: sources.length + 1,
    name,
    code,
    users: 0,
    rate: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  sources.push(newSource);
  res.json(newSource);
});

app.put('/api/admin/sources/:id', (req, res) => {
  const source = sources.find(s => s.id === parseInt(req.params.id));
  if (!source) return res.status(404).json({ error: 'Source not found' });
  
  Object.assign(source, req.body);
  res.json(source);
});

app.delete('/api/admin/sources/:id', (req, res) => {
  const idx = sources.findIndex(s => s.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Source not found' });
  
  sources.splice(idx, 1);
  res.json({ success: true });
});

// 系统设置
app.get('/api/admin/settings', (req, res) => {
  res.json(settings);
});

app.put('/api/admin/settings', (req, res) => {
  Object.assign(settings, req.body);
  res.json(settings);
});

// 剧集管理
app.get('/api/admin/dramas', (req, res) => {
  res.json(dramas.map(d => ({
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episodes.length,
    pricePerEpisode: d.pricePerEpisode,
    paywallAt: d.paywallAt,
    views: Math.floor(Math.random() * 100000)
  })));
});

// 静态文件
app.use('/videos', express.static('/Users/mac1/Desktop/drama/60.我用九块九秒杀一切（108集）黎沐清＆杨力'));
app.use('/assets', express.static(path.join(__dirname, '../frontend/dist/assets')));
app.use('/favicon.ico', express.static(path.join(__dirname, '../frontend/dist/favicon.ico')));

// Admin 后台静态文件
app.use('/admin', express.static(path.join(__dirname, '../admin/dist')));
app.use('/admin/assets', express.static(path.join(__dirname, '../admin/dist/assets')));

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Admin 首页
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/dist/index.html'));
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
