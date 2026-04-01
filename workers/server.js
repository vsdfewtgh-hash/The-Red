const http = require('http');

const dramas = [
  { id: 1, title: '九块九秒杀一切', cover: 'https://picsum.photos/400/700?random=1', episodes: Array.from({ length: 108 }, (_, i) => ({ id: i + 1, url: `http://127.0.0.1:8787/videos/第${String(i + 1).padStart(2, '0')}集.mp4`, free: true })), pricePerEpisode: 100, paywallAt: 11 },
  { id: 2, title: '和校花的海岛求生', cover: 'https://picsum.photos/400/700?random=2', episodes: Array.from({ length: 80 }, (_, i) => ({ id: i + 1, url: `http://127.0.0.1:8787/videos/haidao/${String(i + 1).padStart(2, '0')}.mp4`, free: true })), pricePerEpisode: 100, paywallAt: 3 },
  { id: 3, title: '季总您的马甲叒掉了', cover: 'https://picsum.photos/400/700?random=3', episodes: Array.from({ length: 6 }, (_, i) => ({ id: i + 1, url: `http://127.0.0.1:8787/videos/majia/${String(i + 1).padStart(2, '0')}.mp4`, free: true })), pricePerEpisode: 100, paywallAt: 3 }
];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  if (req.url === '/api/dramas') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(dramas));
  } else if (req.url === '/api/user/init') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else if (req.url.startsWith('/api/user/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ coins: 0, streak: 0, lastCheckIn: '', username: 'user', avatar: '' }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8787, () => console.log('API server running on http://127.0.0.1:8787'));
