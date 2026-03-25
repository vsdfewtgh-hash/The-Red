import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = 'https://api.drama.thered.live/api'

// 分类标签
const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: '都市', name: '都市' },
  { id: '甜宠', name: '甜宠' },
  { id: '霸总', name: '霸总' },
  { id: '穿越', name: '穿越' },
  { id: '逆袭', name: '逆袭' },
  { id: '复仇', name: '复仇' },
  { id: '萌宝', name: '萌宝' },
]

export default function App() {
  const [dramas, setDramas] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPlayer, setShowPlayer] = useState(false)
  const [currentDrama, setCurrentDrama] = useState(null)
  const [currentEpisode, setCurrentEpisode] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [coins, setCoins] = useState(0)
  const [checkedIn, setCheckedIn] = useState(false)
  const [userId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('user_id') || `user_${Date.now()}`
  })

  const videoRef = useRef(null)

  // 从 API 获取剧集数据
  useEffect(() => {
    fetch(`${API_BASE}/dramas`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setDramas(data)
        }
        setLoading(false)
      })
      .catch(err => console.error('Failed to fetch dramas:', err))
  }, [])

  // 播放视频
  const playDrama = (drama, episodeIndex = 0) => {
    setCurrentDrama(drama)
    setCurrentEpisode(episodeIndex)
    setShowPlayer(true)
    setShowEpisodes(false)
  }

  // 下一集
  const nextEpisode = () => {
    if (currentDrama && currentEpisode < currentDrama.episodes.length - 1) {
      setCurrentEpisode(currentEpisode + 1)
    }
  }

  // 上一集
  const prevEpisode = () => {
    if (currentEpisode > 0) {
      setCurrentEpisode(currentEpisode - 1)
    }
  }

  // 切换播放/暂停
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // 签到
  const handleCheckIn = async () => {
    if (checkedIn) return
    try {
      const res = await fetch(`${API_BASE}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      const data = await res.json()
      if (data.success) {
        setCoins(coins + data.reward)
        setCheckedIn(true)
        alert(`签到成功！获得 ${data.reward} 金币`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 获取视频URL
  const getVideoUrl = (episode) => {
    if (episode.url.startsWith('http')) {
      return episode.url
    }
    return `${API_BASE.replace('/api', '')}${episode.url}`
  }

  // 筛选剧集
  const filteredDramas = dramas

  // 渲染首页
  const renderHome = () => (
    <div className="home">
      {/* 顶部Banner */}
      {dramas.length > 0 && (
        <div className="banner" onClick={() => playDrama(dramas[0], 0)}>
          <img src={dramas[0].cover} alt={dramas[0].title} />
          <div className="banner-info">
            <h2>{dramas[0].title}</h2>
            <p>全{dramas[0].episodes.length}集</p>
            <button className="play-btn">▶ 播放</button>
          </div>
        </div>
      )}

      {/* 分类标签 */}
      <div className="categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 热门推荐 */}
      <div className="section">
        <h3>热门推荐</h3>
        <div className="drama-grid">
          {filteredDramas.map(drama => (
            <div key={drama.id} className="drama-card" onClick={() => playDrama(drama, 0)}>
              <div className="drama-cover">
                <img src={drama.cover} alt={drama.title} />
                <span className="episode-tag">全{drama.episodes.length}集</span>
              </div>
              <h4>{drama.title}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // 渲染播放器
  const renderPlayer = () => {
    if (!currentDrama) return null
    const episode = currentDrama.episodes[currentEpisode]

    return (
      <motion.div 
        className="player-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="player-container">
          {/* 视频区域 */}
          <div className="video-wrapper" onClick={togglePlay}>
            <video
              ref={videoRef}
              src={getVideoUrl(episode)}
              autoPlay
              onEnded={nextEpisode}
              playsInline
            />
            {!isPlaying && <div className="play-icon">▶</div>}
          </div>

          {/* 顶部控制栏 */}
          <div className="player-top">
            <button onClick={() => setShowPlayer(false)}>← 返回</button>
            <h3>{currentDrama.title}</h3>
            <span>第{currentEpisode + 1}集</span>
          </div>

          {/* 底部控制栏 */}
          <div className="player-bottom">
            <button onClick={prevEpisode}>← 上一集</button>
            <button onClick={togglePlay}>{isPlaying ? '⏸ 暂停' : '▶ 播放'}</button>
            <button onClick={() => setShowEpisodes(!showEpisodes)}>📋 选集</button>
            <button onClick={nextEpisode}>下一集 →</button>
          </div>

          {/* 选集弹窗 */}
          <AnimatePresence>
            {showEpisodes && (
              <motion.div 
                className="episodes-panel"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
              >
                <div className="episodes-header">
                  <h4>选集</h4>
                  <button onClick={() => setShowEpisodes(false)}>×</button>
                </div>
                <div className="episodes-grid">
                  {currentDrama.episodes.map((ep, idx) => (
                    <button
                      key={idx}
                      className={`episode-btn ${idx === currentEpisode ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentEpisode(idx)
                        setShowEpisodes(false)
                      }}
                    >
                      第{idx + 1}集
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  // 渲染钱包页
  const renderWallet = () => (
    <div className="wallet-page">
      <div className="wallet-header">
        <div className="coin-balance">
          <span className="coin-icon">💰</span>
          <span className="balance">{coins}</span>
        </div>
        <p>金币余额</p>
      </div>

      <div className="checkin-section">
        <button 
          className={`checkin-btn ${checkedIn ? 'checked' : ''}`}
          onClick={handleCheckIn}
          disabled={checkedIn}
        >
          {checkedIn ? '✅ 已签到' : '📅 签到领金币'}
        </button>
      </div>

      <div className="recharge-section">
        <h4>充值金币</h4>
        <div className="packages">
          <button className="package-btn">100金币 $0.99</button>
          <button className="package-btn">500金币 $4.99</button>
          <button className="package-btn">1000金币 $9.99</button>
          <button className="package-btn">2000金币 $19.99</button>
        </div>
      </div>
    </div>
  )

  // 渲染任务页
  const renderTasks = () => (
    <div className="tasks-page">
      <h3>每日任务</h3>
      <div className="task-list">
        <div className="task-item">
          <span>📺 观看视频</span>
          <span>+10 金币</span>
        </div>
        <div className="task-item">
          <span>⏰ 签到</span>
          <span>+20 金币</span>
        </div>
        <div className="task-item">
          <span>📤 分享邀请</span>
          <span>+50 金币</span>
        </div>
      </div>
    </div>
  )

  // 渲染我的页
  const renderProfile = () => (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar">👤</div>
        <p>用户: {userId}</p>
      </div>
      <div className="profile-menu">
        <div className="menu-item">👀 浏览历史</div>
        <div className="menu-item">❤️ 收藏</div>
        <div className="menu-item">⚙️ 设置</div>
        <div className="menu-item">📞 联系我们</div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="app">
      {/* 主内容区 */}
      <div className="main-content">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'wallet' && renderWallet()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* 底部Tab导航 */}
      <div className="tab-bar">
        <button 
          className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="tab-icon">🏠</span>
          <span>首页</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          <span className="tab-icon">💰</span>
          <span>钱包</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <span className="tab-icon">📋</span>
          <span>任务</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="tab-icon">👤</span>
          <span>我的</span>
        </button>
      </div>

      {/* 播放器弹窗 */}
      <AnimatePresence>
        {showPlayer && renderPlayer()}
      </AnimatePresence>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
          --primary: #e63946;
          --bg-dark: #0a0a0a;
          --bg-card: #1a1a1a;
          --text: #f1f1f1;
          --text-muted: #888;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--bg-dark);
          color: var(--text);
        }
        
        .app {
          min-height: 100vh;
          padding-bottom: 60px;
        }
        
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 15px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #333;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* 首页样式 */
        .banner {
          position: relative;
          height: 220px;
          overflow: hidden;
        }
        
        .banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .banner-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
        }
        
        .banner-info h2 {
          font-size: 20px;
          margin-bottom: 5px;
        }
        
        .banner-info p {
          color: var(--text-muted);
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .play-btn {
          background: var(--primary);
          color: #fff;
          border: none;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
        }
        
        /* 分类 */
        .categories {
          display: flex;
          gap: 10px;
          padding: 15px;
          overflow-x: auto;
          scrollbar: none;
        }
        
        .cat-btn {
          background: var(--bg-card);
          color: var(--text-muted);
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          white-space: nowrap;
          font-size: 13px;
        }
        
        .cat-btn.active {
          background: var(--primary);
          color: #fff;
        }
        
        /* 剧集网格 */
        .section {
          padding: 15px;
        }
        
        .section h3 {
          font-size: 16px;
          margin-bottom: 15px;
        }
        
        .drama-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .drama-card {
          cursor: pointer;
        }
        
        .drama-cover {
          position: relative;
          aspect-ratio: 2/3;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .drama-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .episode-tag {
          position: absolute;
          bottom: 5px;
          right: 5px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .drama-card h4 {
          font-size: 13px;
          font-weight: normal;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* Tab导航 */
        .tab-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          background: var(--bg-card);
          border-top: 1px solid #333;
          padding: 8px 0;
          z-index: 100;
        }
        
        .tab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 11px;
        }
        
        .tab-btn.active {
          color: var(--primary);
        }
        
        .tab-icon {
          font-size: 20px;
        }
        
        /* 播放器 */
        .player-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #000;
          z-index: 200;
        }
        
        .player-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .video-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .video-wrapper video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .play-icon {
          position: absolute;
          font-size: 60px;
          opacity: 0.8;
        }
        
        .player-top, .player-bottom {
          position: absolute;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
        }
        
        .player-top {
          top: 0;
        }
        
        .player-bottom {
          bottom: 0;
        }
        
        .player-top button, .player-bottom button {
          background: none;
          border: none;
          color: #fff;
          font-size: 14px;
        }
        
        /* 选集面板 */
        .episodes-panel {
          position: absolute;
          bottom: 60px;
          left: 0;
          right: 0;
          max-height: 50vh;
          background: var(--bg-card);
          border-radius: 20px 20px 0 0;
          overflow: hidden;
        }
        
        .episodes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #333;
        }
        
        .episodes-header button {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 24px;
        }
        
        .episodes-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          padding: 15px;
          max-height: 40vh;
          overflow-y: auto;
        }
        
        .episode-btn {
          background: var(--bg-dark);
          border: none;
          color: var(--text);
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
        }
        
        .episode-btn.active {
          background: var(--primary);
        }
        
        /* 钱包页 */
        .wallet-page {
          padding: 20px;
        }
        
        .wallet-header {
          text-align: center;
          padding: 30px;
          background: linear-gradient(135deg, #1a1a1a, #2a1a1a);
          border-radius: 16px;
          margin-bottom: 20px;
        }
        
        .coin-balance {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 36px;
          font-weight: bold;
        }
        
        .checkin-section {
          margin-bottom: 30px;
        }
        
        .checkin-btn {
          width: 100%;
          padding: 15px;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 16px;
        }
        
        .checkin-btn.checked {
          background: #333;
        }
        
        .packages {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .package-btn {
          padding: 15px;
          background: var(--bg-card);
          border: 1px solid #333;
          color: var(--text);
          border-radius: 12px;
          font-size: 14px;
        }
        
        /* 任务页 */
        .tasks-page {
          padding: 20px;
        }
        
        .task-list {
          background: var(--bg-card);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .task-item {
          display: flex;
          justify-content: space-between;
          padding: 15px 20px;
          border-bottom: 1px solid #333;
        }
        
        /* 我的页 */
        .profile-page {
          padding: 20px;
        }
        
        .profile-header {
          text-align: center;
          padding: 30px;
          background: var(--bg-card);
          border-radius: 16px;
          margin-bottom: 20px;
        }
        
        .avatar {
          font-size: 60px;
          margin-bottom: 10px;
        }
        
        .profile-menu {
          background: var(--bg-card);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .menu-item {
          padding: 15px 20px;
          border-bottom: 1px solid #333;
        }
      `}</style>
    </div>
  )
}