import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  VIDEOS: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('*', cors());

// 数据
const dramas = [
  {
    id: 1,
    title: '九块九秒杀一切',
    cover: 'https://picsum.photos/400/700?random=1',
    episodes: Array.from({ length: 108 }, (_, i) => ({
      id: i + 1,
      url: `https://the-red-api.vsdfewtgh.workers.dev/videos/第${String(i + 1).padStart(2, '0')}集.mp4`,
      free: true
    })),
    pricePerEpisode: 100,
    paywallAt: 11
  },
  {
    id: 2,
    title: '和校花的海岛求生',
    cover: 'https://picsum.photos/400/700?random=2',
    episodes: Array.from({ length: 80 }, (_, i) => ({
      id: i + 1,
      url: `https://the-red-api.vsdfewtgh.workers.dev/videos/haidao/${String(i + 1).padStart(2, '0')}.mp4`,
      free: true
    })),
    pricePerEpisode: 100,
    paywallAt: 3
  },
  {
    id: 3,
    title: '季总您的马甲叒掉了',
    cover: 'https://picsum.photos/400/700?random=3',
    episodes: Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      url: `https://the-red-api.vsdfewtgh.workers.dev/videos/majia/${String(i + 1).padStart(2, '0')}.mp4`,
      free: true
    })),
    pricePerEpisode: 100,
    paywallAt: 3
  }
];

const users = new Map();
const invites = new Map();

// 模拟数据
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

const orders = [
  { id: 'ord_001', userId: '100001', type: 'recharge', amount: 100, price: 0.99, stars: 100, status: 'completed', createdAt: '2026-03-23T10:30:00Z' },
  { id: 'ord_002', userId: '100002', type: 'recharge', amount: 500, price: 4.99, stars: 550, status: 'completed', createdAt: '2026-03-23T11:45:00Z' },
  { id: 'ord_003', userId: '100001', type: 'unlock', dramaId: 1, episodeId: 11, amount: 100, price: 0.10, status: 'completed', createdAt: '2026-03-23T12:00:00Z' },
  { id: 'ord_004', userId: '100003', type: 'recharge', amount: 1000, price: 9.99, stars: 1200, status: 'completed', createdAt: '2026-03-23T14:20:00Z' },
  { id: 'ord_005', userId: '100005', type: 'unlock', dramaId: 1, episodeId: 15, amount: 100, price: 0.10, status: 'completed', createdAt: '2026-03-23T15:10:00Z' },
];

const sources = [
  { id: 1, name: '矩阵号A', code: 'matrix_a', users: 4500, rate: 35.8, status: 'active' },
  { id: 2, name: '矩阵号B', code: 'matrix_b', users: 3200, rate: 25.4, status: 'active' },
  { id: 3, name: '矩阵号C', code: 'matrix_c', users: 2800, rate: 22.3, status: 'active' },
];

// 视频流处理 - 从 R2 读取
app.get('/videos/:filename{.+}', async (c) => {
  const filename = c.req.param('filename');
  console.log('Video requested:', filename);
  
  try {
    const object = await c.env.VIDEOS.get(filename);
    console.log('R2 get result:', object ? 'found' : 'not found');
    
    if (!object) {
      return c.text('Video not found: ' + filename, 404);
    }
    
    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Cache-Control', 'public, max-age=31536000');
    
    return new Response(object.body, {
      headers
    });
  } catch (e) {
    return c.text('Error loading video: ' + e, 500);
  }
});

// API 路由
app.get('/api/dramas', (c) => {
  return c.json(dramas);
});

app.get('/api/drama/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const drama = dramas.find(d => d.id === id);
  if (!drama) return c.json({ error: 'Not found' }, 404);
  return c.json(drama);
});

app.post('/api/user/init', async (c) => {
  const { userId, username, referrer } = await c.req.json();
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      username: username || `user_${userId}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      coins: 0,
      totalSpent: 0,
      unlocked: [],
      history: [], // 浏览历史
      favorites: [], // 收藏
      orders: [], // 订单记录
      settings: {
        notifications: true,
        autoplay: true,
        quality: 'auto'
      },
      inviteCount: 0,
      referrer: referrer || null,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      status: 'active'
    });
    if (referrer && users.has(referrer)) {
      const referrerUser = users.get(referrer);
      referrerUser.inviteCount += 1;
    }
  }
  const user = users.get(userId);
  user.lastActive = new Date().toISOString();
  return c.json({ success: true, user });
});

app.get('/api/user/:id', (c) => {
  const userId = c.req.param('id');
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(user);
});

// 领取任务奖励
app.post('/api/task/claim', async (c) => {
  const { userId, reward, taskType } = await c.req.json();
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  user.coins += reward;
  
  // 记录订单
  if (!user.orders) user.orders = [];
  user.orders.unshift({
    id: `task_${Date.now()}`,
    type: 'task',
    amount: reward,
    price: 0,
    taskType,
    status: 'completed',
    createdAt: new Date().toISOString()
  });
  
  return c.json({ success: true, coins: user.coins });
});

// 更新用户资料
app.put('/api/user/:id/profile', async (c) => {
  const userId = c.req.param('id');
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  const { username, avatar } = await c.req.json();
  if (username) user.username = username;
  if (avatar) user.avatar = avatar;
  
  return c.json({ success: true, user });
});

// 获取浏览历史
app.get('/api/user/:id/history', (c) => {
  const userId = c.req.param('id');
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  const history = (user.history || []).map(h => {
    const drama = dramas.find(d => d.id === h.dramaId);
    if (!drama) return null;
    return {
      ...h,
      dramaTitle: drama.title,
      dramaCover: drama.cover
    };
  }).filter(Boolean).slice(0, 20);
  
  return c.json(history);
});

// 添加浏览历史
app.post('/api/user/:id/history', async (c) => {
  const userId = c.req.param('id');
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  const { dramaId, episodeId, dramaTitle, dramaCover } = await c.req.json();
  if (!user.history) user.history = [];
  
  // 移除重复项
  user.history = user.history.filter(h => !(h.dramaId === dramaId && h.episodeId === episodeId));
  
  // 添加到最前面
  user.history.unshift({
    dramaId,
    episodeId,
    dramaTitle,
    dramaCover,
    watchedAt: new Date().toISOString()
  });
  
  // 保留最近50条
  user.history = user.history.slice(0, 50);
  
  return c.json({ success: true });
});

// 获取收藏列表
app.get('/api/user/:id/favorites', (c) => {
  const userId = c.req.param('id');
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  const favorites = (user.favorites || []).map(f => {
    const drama = dramas.find(d => d.id === f.dramaId);
    if (!drama) return null;
    return {
      ...f,
      dramaTitle: drama.title,
      dramaCover: drama.cover,
      totalEpisodes: drama.episodes.length
    };
  }).filter(Boolean);
  
  return c.json(favorites);
});

// 添加收藏
app.post('/api/user/:id/favorite', async (c) => {
  const userId = c.req.param('id');
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  const { dramaId } = await c.req.json();
  const drama = dramas.find(d => d.id === dramaId);
  if (!drama) return c.json({ error: 'Drama not found' }, 404);
  
  if (!user.favorites) user.favorites = [];
  
  // 检查是否已收藏
  if (user.favorites.some(f => f.dramaId === dramaId)) {
    return c.json({ success: true, already: true });
  }
  
  user.favorites.push({
    dramaId,
    addedAt: new Date().toISOString()
  });
  
  return c.json({ success: true });
});

// 取消收藏
app.delete('/api/user/:id/favorite/:dramaId', (c) => {
  const userId = c.req.param('id');
  const dramaId = parseInt(c.req.param('dramaId'));
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  if (!user.favorites) user.favorites = [];
  user.favorites = user.favorites.filter(f => f.dramaId !== dramaId);
  
  return c.json({ success: true });
});

// 获取订单记录
app.get('/api/user/:id/orders', (c) => {
  const userId = c.req.param('id');
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  return c.json(user.orders || []);
});

// 添加订单记录
app.post('/api/user/:id/order', async (c) => {
  const userId = c.req.param('id');
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  const { type, amount, price, dramaId, episodeId, status } = await c.req.json();
  
  if (!user.orders) user.orders = [];
  user.orders.unshift({
    id: `ord_${Date.now()}`,
    type,
    amount,
    price,
    dramaId,
    episodeId,
    status: status || 'completed',
    createdAt: new Date().toISOString()
  });
  
  return c.json({ success: true });
});

app.post('/api/coins/purchase', async (c) => {
  const { userId, packageId } = await c.req.json();
  const packages = {
    1: { coins: 100, price: 0.99 },
    2: { coins: 500, price: 4.99 },
    3: { coins: 1000, price: 9.99 },
    4: { coins: 2000, price: 19.99 }
  };
  const pkg = packages[packageId];
  if (!pkg) return c.json({ error: 'Invalid package' }, 400);
  
  const user = users.get(userId);
  if (user) {
    user.coins += pkg.coins;
    user.totalSpent += pkg.price;
  }
  return c.json({ success: true, coins: pkg.coins, price: pkg.price });
});

app.post('/api/episode/unlock', async (c) => {
  const { userId, dramaId, episodeId } = await c.req.json();
  const drama = dramas.find(d => d.id === dramaId);
  if (!drama) return c.json({ error: 'Drama not found' }, 404);
  
  const episode = drama.episodes.find(e => e.id === episodeId);
  if (!episode) return c.json({ error: 'Episode not found' }, 404);
  
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  const key = `${dramaId}-${episodeId}`;
  if (user.unlocked.includes(key)) {
    return c.json({ success: true, alreadyUnlocked: true });
  }
  
  const cost = drama.pricePerEpisode;
  if (user.coins < cost) {
    return c.json({ success: false, error: 'Not enough coins' }, 400);
  }
  
  user.coins -= cost;
  user.unlocked.push(key);
  
  return c.json({ success: true, remainingCoins: user.coins });
});

app.post('/api/checkin', async (c) => {
  const { userId } = await c.req.json();
  const user = users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  const today = new Date().toISOString().slice(0, 10);
  if (user.lastCheckIn === today) {
    return c.json({ success: false, error: 'Already checked in today' });
  }
  
  const reward = 10 + Math.floor(Math.random() * 20);
  user.coins += reward;
  user.lastCheckIn = today;
  user.streak = (user.streak || 0) + 1;
  
  return c.json({ success: true, reward, streak: user.streak });
});

app.post('/api/invite/record', async (c) => {
  const { userId, inviteCode } = await c.req.json();
  if (!invites.has(inviteCode)) {
    invites.set(inviteCode, { count: 0, users: [] });
  }
  const invite = invites.get(inviteCode);
  if (!invite.users.includes(userId)) {
    invite.users.push(userId);
    invite.count += 1;
  }
  return c.json({ success: true, count: invite.count });
});

// Admin API
app.get('/api/admin/stats', (c) => {
  const userList = Array.from(users.values());
  const totalUsers = userList.length;
  const activeUsers = userList.filter(u => {
    const lastActive = new Date(u.lastActive);
    return (Date.now() - lastActive.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.price, 0);
  const totalOrders = orders.filter(o => o.status === 'completed').length;
  
  return c.json({
    totalUsers,
    activeUsers,
    totalRevenue: totalRevenue.toFixed(2),
    totalOrders,
    arppu: totalOrders > 0 ? (totalRevenue / totalUsers).toFixed(2) : '0',
    payingRate: totalUsers > 0 ? (totalOrders / totalUsers * 100).toFixed(1) : '0'
  });
});

app.get('/api/admin/daily', (c) => {
  const dailyData = [];
  for (let i = 7; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dailyData.push({
      date: date.toISOString().slice(5, 10),
      dau: Math.floor(8000 + Math.random() * 5000),
      revenue: (Math.random() * 100).toFixed(2),
      orders: Math.floor(Math.random() * 50)
    });
  }
  return c.json(dailyData);
});

app.get('/api/admin/sources', (c) => {
  return c.json(sources);
});

app.get('/api/admin/orders', (c) => {
  return c.json(orders);
});

// 根路径 - 服务前端静态文件
app.get('/', async (c) => {
  try {
    const object = await c.env.VIDEOS.get('static/index.html');
    if (object) {
      return new Response(object.body, {
        headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
      });
    }
  } catch (e) {}
  return c.html('<h1>The Red API</h1><p>API is running</p>');
});

// 静态文件服务 - assets
app.get('/assets/:file', async (c) => {
  const file = c.req.param('file');
  try {
    const object = await c.env.VIDEOS.get(`static/assets/${file}`);
    if (object) {
      const contentType = file.endsWith('.js') ? 'application/javascript' :
                         file.endsWith('.css') ? 'text/css' :
                         'application/octet-stream';
      return new Response(object.body, {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'no-cache' }
      });
    }
  } catch (e) {}
  return c.text('Not found', 404);
});

export default app;