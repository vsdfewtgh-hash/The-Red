import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = { VIDEOS: R2Bucket; };
const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors());

const dramas = [
  { id: 1, title: '九块九秒杀一切', cover: 'https://picsum.photos/400/700?random=1', category: '都市', episodes: Array.from({ length: 108 }, (_, i) => ({ id: i + 1, url: `/videos/第${String(i + 1).padStart(2, '0')}集.mp4`, free: true })), pricePerEpisode: 100, paywallAt: 11 },
  { id: 2, title: '和校花的海岛求生', cover: 'https://picsum.photos/400/700?random=2', category: '都市', episodes: Array.from({ length: 80 }, (_, i) => ({ id: i + 1, url: `/videos/haidao/${String(i + 1).padStart(2, '0')}.mp4`, free: true })), pricePerEpisode: 100, paywallAt: 3 },
  { id: 3, title: '季总您的马甲叒掉了', cover: 'https://picsum.photos/400/700?random=3', category: '霸总', episodes: Array.from({ length: 6 }, (_, i) => ({ id: i + 1, url: `/videos/majia/${String(i + 1).padStart(2, '0')}.mp4`, free: true })), pricePerEpisode: 100, paywallAt: 3 }
];

const tasks = [
  { id: 'daily_signin', type: 'checkin', title: '每日签到', desc: '签到一次', reward: 50, target: 1 },
  { id: 'daily_watch', type: 'watch', title: '观看视频', desc: '观看任意视频', reward: 30, target: 1 },
  { id: 'daily_share', type: 'share', title: '分享内容', desc: '分享任意视频', reward: 100, target: 1 },
  { id: 'daily_comment', type: 'comment', title: '发表评论', desc: '评论任意视频', reward: 50, target: 1 },
  { id: 'invite_friend', type: 'invite', title: '邀请好友', desc: '邀请1位好友注册', reward: 200, target: 1 },
  { id: 'newbie_watch5', type: 'watch', title: '新手任务-看5集', desc: '累计观看5集', reward: 100, target: 5 },
  { id: 'newbie_collect', type: 'collect', title: '新手任务-收藏', desc: '收藏一部短剧', reward: 50, target: 1 },
];

const userData = {};

app.get('/api/dramas', (c) => c.json(dramas));

// 视频播放 - 从 R2 获取
app.get('/videos/:key*', async (c) => {
  const key = c.req.param('key') || c.req.param('key*')
  if (!key) return c.text('Not found', 404)
  
  try {
    const object = await c.env.VIDEOS.get(key)
    if (!object) return c.text('Not found', 404)
    
    return new Response(object.body, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'inline',
      }
    })
  } catch (e) {
    return c.text('Error', 500)
  }
})

app.get('/api/user/:id', (c) => {
  const id = c.req.param('id');
  return c.json({
    coins: userData[id]?.coins || 0,
    streak: userData[id]?.streak || 0,
    lastCheckIn: userData[id]?.lastCheckIn || '',
    username: userData[id]?.username || `user_${id}`,
    avatar: userData[id]?.avatar || '',
    history: userData[id]?.history || [],
    favorites: userData[id]?.favorites || [],
    likes: userData[id]?.likes || [],
    orders: userData[id]?.orders || [],
    settings: userData[id]?.settings || { notifications: true, autoplay: true, quality: 'auto' },
    taskProgress: userData[id]?.taskProgress || {}
  });
});

app.post('/api/user/init', async (c) => {
  const { userId, username } = await c.req.json();
  if (!userData[userId]) {
    userData[userId] = { coins: 0, streak: 0, lastCheckIn: '', username: username || `user_${userId}`, history: [], favorites: [], likes: [], orders: [], settings: { notifications: true, autoplay: true, quality: 'auto' }, taskProgress: {} };
  }
  return c.json({ success: true });
});

app.post('/api/checkin', async (c) => {
  const { userId } = await c.req.json();
  const today = new Date().toISOString().slice(0, 10);
  if (!userData[userId]) userData[userId] = { coins: 0, streak: 0, taskProgress: {} };
  if (userData[userId].lastCheckIn === today) return c.json({ error: '今日已签到', success: false });
  userData[userId].lastCheckIn = today;
  userData[userId].coins = (userData[userId].coins || 0) + 50;
  userData[userId].streak = (userData[userId].streak || 0) + 1;
  return c.json({ success: true, reward: 50, streak: userData[userId].streak, lastCheckIn: today });
});

app.get('/api/tasks', (c) => c.json(tasks));

app.post('/api/task/progress', async (c) => {
  const { userId, taskId, progress } = await c.req.json();
  if (!userData[userId]) userData[userId] = { taskProgress: {} };
  userData[userId].taskProgress[taskId] = (userData[userId].taskProgress[taskId] || 0) + (progress || 1);
  return c.json({ success: true });
});

app.post('/api/task/claim', async (c) => {
  const { userId, taskId } = await c.req.json();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return c.json({ error: '任务不存在' });
  if (!userData[userId]) userData[userId] = { coins: 0, taskProgress: {} };
  const current = userData[userId].taskProgress[taskId] || 0;
  if (current < task.target) return c.json({ error: '任务未完成' });
  if (userData[userId].taskProgress[`${taskId}_claimed`]) return c.json({ error: '已领取' });
  userData[userId].coins = (userData[userId].coins || 0) + task.reward;
  userData[userId].taskProgress[`${taskId}_claimed`] = true;
  return c.json({ success: true, reward: task.reward, coins: userData[userId].coins });
});

app.post('/api/coins/purchase', async (c) => {
  const { userId, packageId } = await c.req.json();
  const packages = { 1: 100, 2: 550, 3: 1200, 4: 2500, 5: 6500 };
  const coins = packages[packageId] || 0;
  if (!userData[userId]) userData[userId] = { coins: 0 };
  userData[userId].coins = (userData[userId].coins || 0) + coins;
  return c.json({ success: true, coins: userData[userId].coins });
});

app.post('/api/user/:id/favorite', async (c) => {
  const { dramaId } = await c.req.json();
  const id = c.req.param('id');
  if (!userData[id]) userData[id] = { favorites: [] };
  userData[id].favorites.push(dramaId);
  return c.json({ success: true });
});

app.get('/', (c) => c.html(`<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>The Red</title></head><body><div id="root"></div><script src="https://a36c5ee9.the-red-frontend.pages.dev/assets/index-CYXCBlyS.js"></script></body></html>`));

export default app;

app.get('/assets/:file', async (c) => {
  const file = c.req.param('file')
  try {
    const resp = await fetch(`https://a36c5ee9.the-red-frontend.pages.dev/assets/${file}`)
    if (resp.ok) {
      const body = await resp.arrayBuffer()
      const type = file.endsWith('.js') ? 'application/javascript' : 'text/css'
      return new Response(body, { headers: { 'Content-Type': type } })
    }
  } catch (e) {}
  return c.text('Not found', 404)
})
