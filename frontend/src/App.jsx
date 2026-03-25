import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = 'https://the-red-api.vsdfewtgh.workers.dev/api'

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
  const [streak, setStreak] = useState(0)
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const [history, setHistory] = useState([])
  const [favorites, setFavorites] = useState([])
  const [orders, setOrders] = useState([])
  const [settings, setSettings] = useState({ notifications: true, autoplay: true, quality: 'auto' })
  const [showSubPage, setShowSubPage] = useState(null) // history, favorites, settings, orders
  const [showRecordTab, setShowRecordTab] = useState(false) // false: 充值, true: 消费
  const [userId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('user_id') || `user_${Date.now()}`
  })

  // 加载用户数据
  const loadUserData = () => {
    fetch(`${API_BASE}/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setCoins(data.coins || 0)
          const today = new Date().toISOString().slice(0, 10)
          setCheckedIn(data.lastCheckIn === today)
          setStreak(data.streak || 0)
          setUsername(data.username || `user_${userId}`)
          setAvatar(data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`)
          setHistory(data.history || [])
          setFavorites(data.favorites || [])
          setOrders(data.orders || [])
          setSettings(data.settings || { notifications: true, autoplay: true, quality: 'auto' })
        }
      })
      .catch(() => {})
  }

  // 初始化用户并获取状态
  useEffect(() => {
    fetch(`${API_BASE}/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setCoins(data.coins || 0)
          const today = new Date().toISOString().slice(0, 10)
          setCheckedIn(data.lastCheckIn === today)
          setStreak(data.streak || 0)
          setUsername(data.username || `user_${userId}`)
          setAvatar(data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`)
          setHistory(data.history || [])
          setFavorites(data.favorites || [])
          setOrders(data.orders || [])
          setSettings(data.settings || { notifications: true, autoplay: true, quality: 'auto' })
        }
      })
      .catch(() => {
        // 用户不存在，初始化
        fetch(`${API_BASE}/user/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, username: `user_${userId}` })
        })
      })
  }, [userId])

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
    // 记录历史
    addToHistory(drama, episodeIndex)
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
      // 先初始化用户
      await fetch(`${API_BASE}/user/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username: `user_${userId}` })
      })
      
      const res = await fetch(`${API_BASE}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      const data = await res.json()
      if (data.success) {
        setCoins(data.reward + coins)
        setCheckedIn(true)
        setStreak(data.streak || 1)
        alert(`签到成功！获得 ${data.reward} 金币\n连续签到: ${data.streak} 天`)
      } else if (data.error) {
        alert(data.error)
      }
    } catch (e) {
      console.error(e)
      alert('签到失败，请稍后重试')
    }
  }

  // 获取视频URL
  const getVideoUrl = (episode) => {
    if (episode.url.startsWith('http')) {
      return episode.url
    }
    return `${API_BASE.replace('/api', '')}${episode.url}`
  }

  // 记录观看历史
  const addToHistory = async (drama, episodeIndex) => {
    try {
      await fetch(`${API_BASE}/user/${userId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dramaId: drama.id,
          episodeId: drama.episodes[episodeIndex].id,
          dramaTitle: drama.title,
          dramaCover: drama.cover
        })
      })
      loadUserData()
    } catch (e) {}
  }

  // 添加/取消收藏
  const toggleFavorite = async (dramaId) => {
    const isFav = favorites.some(f => f.dramaId === dramaId)
    if (isFav) {
      await fetch(`${API_BASE}/user/${userId}/favorite/${dramaId}`, { method: 'DELETE' })
    } else {
      await fetch(`${API_BASE}/user/${userId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dramaId })
      })
    }
    loadUserData()
  }

  // 检查是否收藏
  const isFavorite = (dramaId) => favorites.some(f => f.dramaId === dramaId)

  // 更新用户资料
  const updateProfile = async (newUsername) => {
    try {
      await fetch(`${API_BASE}/user/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      })
      setUsername(newUsername)
      alert('资料更新成功！')
    } catch (e) {
      alert('更新失败')
    }
  }

  // 更新设置
  const updateSettings = async (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    try {
      await fetch(`${API_BASE}/user/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings })
      })
    } catch (e) {}
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

  // 充值套餐
  const rechargePackages = [
    { id: 1, coins: 100, price: 0.99, bonus: 0, icon: '💵' },
    { id: 2, coins: 500, price: 4.99, bonus: 50, icon: '💰' },
    { id: 3, coins: 1000, price: 9.99, bonus: 200, icon: '💎' },
    { id: 4, coins: 2000, price: 19.99, bonus: 500, icon: '👑' },
    { id: 5, coins: 5000, price: 49.99, bonus: 1500, icon: '🏆' },
  ]

  // 处理充值
  const handleRecharge = async (pkg) => {
    // 模拟支付流程
    const confirmMsg = `确认充值 ${pkg.coins + pkg.bonus} 金币？\n\n价格: $${pkg.price}`
    if (!confirm(confirmMsg)) return

    try {
      // 模拟支付成功 (实际需要接入 Telegram Stars API)
      const res = await fetch(`${API_BASE}/coins/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, packageId: pkg.id })
      })
      const data = await res.json()
      
      if (data.success) {
        // 记录订单
        await fetch(`${API_BASE}/user/${userId}/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'recharge',
            amount: pkg.coins + pkg.bonus,
            price: pkg.price,
            status: 'completed'
          })
        })
        
        setCoins(data.coins + coins)
        loadUserData()
        alert(`🎉 充值成功！\n获得 ${pkg.coins + pkg.bonus} 金币`)
      }
    } catch (e) {
      console.error(e)
      alert('充值失败，请稍后重试')
    }
  }

  // 获取充值记录
  const rechargeRecords = orders.filter(o => o.type === 'recharge')
  const consumeRecords = orders.filter(o => o.type === 'unlock' || o.type === 'task')

  // 渲染钱包页
  const renderWallet = () => (
    <div className="wallet-page">
      {/* 余额卡片 */}
      <div className="wallet-header">
        <div className="balance-card">
          <div className="coin-balance">
            <span className="coin-icon">💰</span>
            <span className="balance">{coins}</span>
          </div>
          <p>金币余额</p>
          <div className="balance-actions">
            <button className="add-btn" onClick={() => document.getElementById('recharge-section').scrollIntoView({ behavior: 'smooth' })}>
              + 充值
            </button>
          </div>
        </div>
      </div>

      {/* 快捷签到 */}
      <div className="checkin-section">
        <button 
          className={`checkin-btn ${checkedIn ? 'checked' : ''}`}
          onClick={handleCheckIn}
          disabled={checkedIn}
        >
          {checkedIn ? '✅ 今日已签到' : '📅 签到领20金币'}
        </button>
      </div>

      {/* 充值套餐 */}
      <div className="recharge-section" id="recharge-section">
        <h4>💎 充值金币</h4>
        <div className="packages">
          {rechargePackages.map(pkg => (
            <div key={pkg.id} className="package-card" onClick={() => handleRecharge(pkg)}>
              <div className="package-icon">{pkg.icon}</div>
              <div className="package-info">
                <span className="package-coins">{pkg.coins + pkg.bonus}</span>
                <span className="package-bonus">{pkg.bonus > 0 ? `送${pkg.bonus}金币` : ''}</span>
              </div>
              <div className="package-price">${pkg.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 消费记录 */}
      <div className="records-section">
        <h4>�的消费记录</h4>
        <div className="records-tabs">
          <button 
            className={`tab-btn ${!showRecordTab ? 'active' : ''}`}
            onClick={() => setShowRecordTab(false)}
          >
            充值记录
          </button>
          <button 
            className={`tab-btn ${showRecordTab ? 'active' : ''}`}
            onClick={() => setShowRecordTab(true)}
          >
            消费记录
          </button>
        </div>
        <div className="records-list">
          {showRecordTab ? (
            consumeRecords.length === 0 ? (
              <div className="empty-record">暂无消费记录</div>
            ) : (
              consumeRecords.map((record, idx) => (
                <div key={idx} className="record-item">
                  <div className="record-icon">🔓</div>
                  <div className="record-info">
                    <span className="record-type">解锁视频</span>
                    <span className="record-time">{new Date(record.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="record-amount minus">-{record.amount}</div>
                </div>
              ))
            )
          ) : (
            rechargeRecords.length === 0 ? (
              <div className="empty-record">暂无充值记录</div>
            ) : (
              rechargeRecords.map((record, idx) => (
                <div key={idx} className="record-item">
                  <div className="record-icon">💰</div>
                  <div className="record-info">
                    <span className="record-type">充值金币</span>
                    <span className="record-time">{new Date(record.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="record-amount plus">+{record.amount}</div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* 会员卡片 (可选) */}
      <div className="vip-section">
        <div className="vip-card">
          <div className="vip-header">
            <span className="vip-icon">👑</span>
            <span className="vip-title">VIP会员</span>
          </div>
          <p className="vip-desc">开通VIP享全站免费看</p>
          <button className="vip-btn">限时优惠 仅需$9.99/月</button>
        </div>
      </div>
    </div>
  )

  // 任务配置
  const dailyTasks = [
    { id: 'daily_checkin', name: '每日签到', desc: '签到一次', reward: 20, icon: '⏰', type: 'checkin' },
    { id: 'daily_watch1', name: '观看视频', desc: '累计观看1集', reward: 10, icon: '📺', type: 'watch', target: 1 },
    { id: 'daily_watch5', name: '观看达人', desc: '累计观看5集', reward: 30, icon: '🎬', type: 'watch', target: 5 },
    { id: 'daily_share', name: '分享好剧', desc: '分享给好友', reward: 50, icon: '📤', type: 'share', target: 1 },
  ]

  const newbieTasks = [
    { id: 'newbie_first', name: '初来乍到', desc: '完成首次签到', reward: 100, icon: '👋', type: 'checkin' },
    { id: 'newbie_favorite', name: '收藏好剧', desc: '收藏第一部剧', reward: 50, icon: '❤️', type: 'favorite', target: 1 },
    { id: 'newbie_recharge', name: '首次充值', desc: '任意金额充值', reward: 100, icon: '💳', type: 'recharge', target: 1 },
    { id: 'newbie_complete', name: '看完三部', desc: '看完三部剧', reward: 200, icon: '🏆', type: 'complete', target: 3 },
  ]

  // 任务状态
  const [taskProgress, setTaskProgress] = useState({
    daily_checkin: false,
    daily_watch1: 0,
    daily_watch5: 0,
    daily_share: 0,
    newbie_first: false,
    newbie_favorite: 0,
    newbie_recharge: false,
    newbie_complete: 0,
    lastDailyReset: new Date().toISOString().slice(0, 10)
  })

  // 领取任务奖励
  const claimTaskReward = async (task) => {
    // 检查是否可领取
    const canClaim = task.type === 'checkin' ? !taskProgress[task.id] :
                     task.target ? taskProgress[task.id] >= task.target :
                     !taskProgress[task.id]
    
    if (!canClaim) return
    
    // 发放奖励
    try {
      // 更新金币
      await fetch(`${API_BASE}/coins/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, packageId: 0, reward: task.reward })
      })
      
      // 更新任务进度
      const newProgress = { ...taskProgress }
      if (task.type === 'checkin') {
        newProgress[task.id] = true
      } else if (task.type === 'watch' || task.type === 'favorite') {
        newProgress[task.id] = 0 // 重置
      }
      setTaskProgress(newProgress)
      
      // 记录订单
      await fetch(`${API_BASE}/user/${userId}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          amount: task.reward,
          price: 0,
          status: 'completed'
        })
      })
      
      loadUserData()
      alert(`🎉 任务完成！获得 ${task.reward} 金币`)
    } catch (e) {
      console.error(e)
    }
  }

  // 检查任务进度
  const checkTaskProgress = async () => {
    // 检查每日任务重置
    const today = new Date().toISOString().slice(0, 10)
    if (taskProgress.lastDailyReset !== today) {
      // 重置每日任务
      setTaskProgress({
        ...taskProgress,
        daily_checkin: false,
        daily_watch1: 0,
        daily_watch5: 0,
        daily_share: 0,
        lastDailyReset: today
      })
    }
    
    // 更新观看任务进度
    if (history.length > 0) {
      const watchCount = history.length
      setTaskProgress(prev => ({
        ...prev,
        daily_watch1: Math.min(watchCount, 1),
        daily_watch5: Math.min(watchCount, 5)
      }))
    }
    
    // 更新新手任务
    if (history.length > 0) {
      setTaskProgress(prev => ({ ...prev, newbie_first: true }))
    }
    if (favorites.length > 0) {
      setTaskProgress(prev => ({ ...prev, newbie_favorite: favorites.length }))
    }
    if (orders.length > 0) {
      const hasRecharge = orders.some(o => o.type === 'recharge')
      setTaskProgress(prev => ({ ...prev, newbie_recharge: hasRecharge }))
    }
  }

  useEffect(() => {
    if (history.length > 0) {
      checkTaskProgress()
    }
  }, [history, favorites, orders])

  // 渲染任务页
  const renderTasks = () => {
    const canClaimDaily = (task) => {
      if (task.type === 'checkin') return checkedIn && !taskProgress[task.id]
      if (task.type === 'watch') return taskProgress[task.id] >= task.target
      if (task.type === 'share') return taskProgress[task.id] >= task.target
      return false
    }

    const canClaimNewbie = (task) => {
      if (task.type === 'checkin') return taskProgress[task.id]
      if (task.type === 'favorite') return taskProgress[task.id] >= task.target
      if (task.type === 'recharge') return taskProgress[task.id]
      if (task.type === 'complete') return taskProgress[task.id] >= task.target
      return false
    }

    const getProgressText = (task) => {
      if (task.type === 'checkin') return checkedIn ? '✅ 已完成' : '未完成'
      if (task.type === 'watch') return `${taskProgress[task.id] || 0}/${task.target}`
      if (task.type === 'share') return `${taskProgress[task.id] || 0}/${task.target}`
      if (task.type === 'favorite') return `${taskProgress[task.id] || 0}/${task.target}`
      if (task.type === 'recharge') return taskProgress[task.id] ? '✅ 已完成' : '未完成'
      if (task.type === 'complete') return `${taskProgress[task.id] || 0}/${task.target}`
      return ''
    }

    return (
      <div className="tasks-page">
        <div className="tasks-header">
          <h2>任务中心</h2>
          <div className="task-stats">
            <span>💰 金币: {coins}</span>
          </div>
        </div>

        {/* 每日任务 */}
        <div className="task-section">
          <h3>📅 每日任务</h3>
          <p className="task-tip">每天0点刷新</p>
          <div className="task-list">
            {dailyTasks.map(task => (
              <div key={task.id} className={`task-item ${canClaimDaily(task) ? 'claimable' : ''}`}>
                <div className="task-icon">{task.icon}</div>
                <div className="task-info">
                  <h4>{task.name}</h4>
                  <p>{task.desc}</p>
                  <span className="task-progress">{getProgressText(task)}</span>
                </div>
                <div className="task-reward">
                  <span>+{task.reward}</span>
                  <button 
                    className="claim-btn"
                    disabled={!canClaimDaily(task)}
                    onClick={() => claimTaskReward(task)}
                  >
                    {canClaimDaily(task) ? '领取' : '未完成'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 新手任务 */}
        <div className="task-section">
          <h3>🌟 新手任务</h3>
          <p className="task-tip">完成一次永久有效</p>
          <div className="task-list">
            {newbieTasks.map(task => (
              <div key={task.id} className={`task-item ${canClaimNewbie(task) ? 'claimable' : ''}`}>
                <div className="task-icon">{task.icon}</div>
                <div className="task-info">
                  <h4>{task.name}</h4>
                  <p>{task.desc}</p>
                  <span className="task-progress">{getProgressText(task)}</span>
                </div>
                <div className="task-reward">
                  <span>+{task.reward}</span>
                  <button 
                    className="claim-btn"
                    disabled={!canClaimNewbie(task)}
                    onClick={() => claimTaskReward(task)}
                  >
                    {canClaimNewbie(task) ? '领取' : '进行中'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 邀请好友 */}
        <div className="task-section">
          <h3>🎁 邀请好友</h3>
          <div className="invite-box">
            <p>邀请好友来看剧，双方都能获得金币！</p>
            <div className="invite-code">
              <span>邀请码: </span>
              <strong>{userId}</strong>
            </div>
            <button className="share-btn" onClick={() => {
              navigator.clipboard.writeText(`快来看短剧！邀请码: ${userId}`)
              alert('邀请码已复制！')
            }}>
              📋 复制邀请码
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 渲染浏览历史页
  const renderHistoryPage = () => (
    <div className="sub-page">
      <div className="sub-header">
        <button onClick={() => setShowSubPage(null)}>← 返回</button>
        <h3>浏览历史</h3>
        <span></span>
      </div>
      <div className="history-list">
        {history.length === 0 ? (
          <div className="empty-state">暂无浏览记录</div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} className="history-item" onClick={() => {
              const drama = dramas.find(d => d.id === item.dramaId)
              if (drama) {
                const epIdx = drama.episodes.findIndex(e => e.id === item.episodeId)
                playDrama(drama, epIdx >= 0 ? epIdx : 0)
              }
            }}>
              <img src={item.dramaCover} alt={item.dramaTitle} />
              <div className="history-info">
                <h4>{item.dramaTitle}</h4>
                <p>看到第{item.episodeId}集</p>
                <span className="time">{new Date(item.watchedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  // 渲染收藏页
  const renderFavoritesPage = () => (
    <div className="sub-page">
      <div className="sub-header">
        <button onClick={() => setShowSubPage(null)}>← 返回</button>
        <h3>我的收藏</h3>
        <span></span>
      </div>
      <div className="favorites-list">
        {favorites.length === 0 ? (
          <div className="empty-state">暂无收藏</div>
        ) : (
          favorites.map((fav, idx) => {
            const drama = dramas.find(d => d.id === fav.dramaId)
            if (!drama) return null
            return (
              <div key={idx} className="favorite-item">
                <div className="drama-card" onClick={() => playDrama(drama, 0)}>
                  <div className="drama-cover">
                    <img src={drama.cover} alt={drama.title} />
                    <span className="episode-tag">全{drama.episodes.length}集</span>
                  </div>
                  <h4>{drama.title}</h4>
                </div>
                <button className="unfavorite-btn" onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(drama.id)
                }}>❤️ 已收藏</button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  // 渲染设置页
  const renderSettingsPage = () => (
    <div className="sub-page">
      <div className="sub-header">
        <button onClick={() => setShowSubPage(null)}>← 返回</button>
        <h3>设置</h3>
        <span></span>
      </div>
      <div className="settings-list">
        <div className="setting-item">
          <span>头像</span>
          <img src={avatar} alt="avatar" className="setting-avatar" />
        </div>
        <div className="setting-item">
          <span>昵称</span>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => updateProfile(username)}
            className="setting-input"
          />
        </div>
        <div className="setting-item">
          <span>金币</span>
          <span className="coin-text">💰 {coins}</span>
        </div>
        <div className="setting-item">
          <span>接收推送</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.notifications}
              onChange={(e) => updateSettings('notifications', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
        <div className="setting-item">
          <span>自动播放下一集</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.autoplay}
              onChange={(e) => updateSettings('autoplay', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
        <div className="setting-item">
          <span>视频画质</span>
          <select 
            value={settings.quality}
            onChange={(e) => updateSettings('quality', e.target.value)}
            className="setting-select"
          >
            <option value="auto">自动</option>
            <option value="high">高清</option>
            <option value="low">省流量</option>
          </select>
        </div>
        <div className="setting-item" onClick={() => {
          if (confirm('确定清除缓存吗？')) {
            alert('缓存已清除')
          }
        }}>
          <span>清除缓存</span>
          <span className="arrow">→</span>
        </div>
        <div className="setting-item">
          <span>版本</span>
          <span className="version">v1.0.0</span>
        </div>
      </div>
    </div>
  )

  // 渲染订单页
  const renderOrdersPage = () => (
    <div className="sub-page">
      <div className="sub-header">
        <button onClick={() => setShowSubPage(null)}>← 返回</button>
        <h3>充值记录</h3>
        <span></span>
      </div>
      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="empty-state">暂无充值记录</div>
        ) : (
          orders.map((order, idx) => (
            <div key={idx} className="order-item">
              <div className="order-info">
                <span className="order-type">{order.type === 'recharge' ? '💰 充值' : '🔓 解锁'}</span>
                <span className="order-amount">{order.amount}金币</span>
              </div>
              <div className="order-detail">
                <span>${order.price}</span>
                <span className="order-time">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  // 渲染我的页
  const renderProfile = () => {
    if (showSubPage === 'history') return renderHistoryPage()
    if (showSubPage === 'favorites') return renderFavoritesPage()
    if (showSubPage === 'settings') return renderSettingsPage()
    if (showSubPage === 'orders') return renderOrdersPage()
    
    return (
      <div className="profile-page">
        <div className="profile-header">
          <img src={avatar} alt="avatar" className="avatar-img" />
          <p className="username">{username}</p>
          <p className="user-id">ID: {userId}</p>
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-num">{streak}</span>
              <span className="stat-label">连续签到</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">{coins}</span>
              <span className="stat-label">金币</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">{history.length}</span>
              <span className="stat-label">历史</span>
            </div>
          </div>
        </div>
        <div className="profile-menu">
          <div className="menu-item" onClick={() => setShowSubPage('history')}>
            <span>👀 浏览历史</span>
            <span className="arrow">→</span>
          </div>
          <div className="menu-item" onClick={() => setShowSubPage('favorites')}>
            <span>❤️ 我的收藏</span>
            <span className="arrow">→</span>
          </div>
          <div className="menu-item" onClick={() => setShowSubPage('orders')}>
            <span>📦 充值记录</span>
            <span className="arrow">→</span>
          </div>
          <div className="menu-item" onClick={() => setShowSubPage('settings')}>
            <span>⚙️ 设置</span>
            <span className="arrow">→</span>
          </div>
          <div className="menu-item" onClick={() => alert('请联系客服 @thered_support')}>
            <span>📞 联系我们</span>
            <span className="arrow">→</span>
          </div>
        </div>
      </div>
    )
  }

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
          padding: 15px;
          padding-bottom: 80px;
        }
        
        .wallet-header {
          margin-bottom: 20px;
        }
        
        .balance-card {
          text-align: center;
          padding: 30px;
          background: linear-gradient(135deg, #1a1a1a, #2a1a1a);
          border-radius: 16px;
          border: 1px solid #333;
        }
        
        .coin-balance {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 42px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .coin-icon {
          font-size: 36px;
        }
        
        .balance {
          background: linear-gradient(135deg, #ffd700, #ffaa00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .balance-actions {
          margin-top: 15px;
        }
        
        .add-btn {
          background: linear-gradient(135deg, var(--primary), #ff6b6b);
          color: #fff;
          border: none;
          padding: 10px 30px;
          border-radius: 20px;
          font-size: 15px;
          cursor: pointer;
        }
        
        .checkin-section {
          margin-bottom: 25px;
        }
        
        .checkin-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #2a2a2a, #3a3a3a);
          color: #fff;
          border: 1px solid #444;
          border-radius: 12px;
          font-size: 15px;
          cursor: pointer;
        }
        
        .checkin-btn.checked {
          background: #222;
          color: #888;
        }
        
        .recharge-section, .records-section, .vip-section {
          margin-bottom: 25px;
        }
        
        .recharge-section h4, .records-section h4 {
          font-size: 16px;
          margin-bottom: 15px;
        }
        
        .packages {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .package-card {
          background: var(--bg-card);
          border: 1px solid #333;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .package-card:active {
          transform: scale(0.98);
          border-color: var(--primary);
        }
        
        .package-icon {
          font-size: 28px;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-dark);
          border-radius: 10px;
        }
        
        .package-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .package-coins {
          font-size: 18px;
          font-weight: bold;
          color: #ffd700;
        }
        
        .package-bonus {
          font-size: 11px;
          color: #ff6b6b;
        }
        
        .package-price {
          font-size: 16px;
          font-weight: bold;
          color: var(--primary);
        }
        
        /* 消费记录 */
        .records-tabs {
          display: flex;
          background: var(--bg-card);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 15px;
        }
        
        .records-tabs .tab-btn {
          flex: 1;
          background: none;
          border: none;
          color: #888;
          padding: 10px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .records-tabs .tab-btn.active {
          background: var(--primary);
          color: #fff;
        }
        
        .records-list {
          background: var(--bg-card);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .record-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          border-bottom: 1px solid #333;
        }
        
        .record-item:last-child {
          border-bottom: none;
        }
        
        .record-icon {
          font-size: 24px;
        }
        
        .record-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .record-type {
          font-size: 14px;
        }
        
        .record-time {
          font-size: 12px;
          color: #666;
        }
        
        .record-amount {
          font-size: 16px;
          font-weight: bold;
        }
        
        .record-amount.plus {
          color: #4caf50;
        }
        
        .record-amount.minus {
          color: #ff6b6b;
        }
        
        .empty-record {
          padding: 40px;
          text-align: center;
          color: #666;
        }
        
        /* VIP卡片 */
        .vip-card {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 1px solid #ffd700;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
        }
        
        .vip-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .vip-icon {
          font-size: 24px;
        }
        
        .vip-title {
          font-size: 20px;
          font-weight: bold;
          color: #ffd700;
        }
        
        .vip-desc {
          color: #888;
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        .vip-btn {
          background: linear-gradient(135deg, #ffd700, #ffaa00);
          color: #000;
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        }
        
        /* 任务页 */
        .tasks-page {
          padding: 15px;
          padding-bottom: 80px;
        }
        
        .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .tasks-header h2 {
          font-size: 22px;
        }
        
        .task-stats {
          background: var(--bg-card);
          padding: 8px 15px;
          border-radius: 20px;
          font-size: 14px;
        }
        
        .task-section {
          margin-bottom: 25px;
        }
        
        .task-section h3 {
          font-size: 16px;
          margin-bottom: 5px;
        }
        
        .task-tip {
          color: #666;
          font-size: 12px;
          margin-bottom: 12px;
        }
        
        .task-list {
          background: var(--bg-card);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .task-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #333;
          gap: 12px;
        }
        
        .task-item.claimable {
          background: linear-gradient(90deg, rgba(230, 57, 70, 0.1), transparent);
        }
        
        .task-icon {
          font-size: 28px;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-dark);
          border-radius: 12px;
        }
        
        .task-info {
          flex: 1;
        }
        
        .task-info h4 {
          font-size: 15px;
          margin-bottom: 3px;
        }
        
        .task-info p {
          color: #888;
          font-size: 12px;
        }
        
        .task-progress {
          color: var(--primary);
          font-size: 12px;
        }
        
        .task-reward {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        
        .task-reward span {
          color: #ffd700;
          font-size: 14px;
          font-weight: bold;
        }
        
        .claim-btn {
          background: var(--primary);
          color: #fff;
          border: none;
          padding: 6px 14px;
          border-radius: 15px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .claim-btn:disabled {
          background: #444;
          color: #888;
          cursor: not-allowed;
        }
        
        .invite-box {
          background: var(--bg-card);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        
        .invite-box p {
          color: #888;
          margin-bottom: 15px;
          font-size: 14px;
        }
        
        .invite-code {
          background: var(--bg-dark);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        
        .invite-code strong {
          color: var(--primary);
          font-size: 18px;
          letter-spacing: 2px;
        }
        
        .share-btn {
          background: linear-gradient(135deg, var(--primary), #ff6b6b);
          color: #fff;
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          font-size: 15px;
          cursor: pointer;
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
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .menu-item:active {
          background: #252525;
        }
        
        .menu-item .arrow {
          color: #666;
        }
        
        /* 子页面 */
        .sub-page {
          min-height: 100vh;
          background: var(--bg-dark);
        }
        
        .sub-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: var(--bg-card);
          border-bottom: 1px solid #333;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .sub-header button {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 16px;
        }
        
        .sub-header h3 {
          font-size: 18px;
        }
        
        /* 历史列表 */
        .history-list, .favorites-list, .orders-list, .settings-list {
          padding: 15px;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }
        
        .history-item {
          display: flex;
          gap: 15px;
          padding: 12px;
          background: var(--bg-card);
          border-radius: 12px;
          margin-bottom: 12px;
          cursor: pointer;
        }
        
        .history-item img {
          width: 80px;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
        }
        
        .history-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .history-info h4 {
          font-size: 15px;
          margin-bottom: 5px;
        }
        
        .history-info p {
          color: #888;
          font-size: 13px;
        }
        
        .history-info .time {
          color: #666;
          font-size: 12px;
          margin-top: 5px;
        }
        
        /* 收藏 */
        .favorite-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          background: var(--bg-card);
          border-radius: 12px;
          margin-bottom: 12px;
        }
        
        .unfavorite-btn {
          background: var(--primary);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
        }
        
        /* 设置 */
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: var(--bg-card);
          border-radius: 12px;
          margin-bottom: 10px;
          cursor: pointer;
        }
        
        .setting-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
        }
        
        .setting-input {
          background: var(--bg-dark);
          border: 1px solid #333;
          color: #fff;
          padding: 8px 12px;
          border-radius: 8px;
          width: 150px;
        }
        
        .setting-select {
          background: var(--bg-dark);
          border: 1px solid #333;
          color: #fff;
          padding: 8px 12px;
          border-radius: 8px;
        }
        
        .coin-text {
          color: #ffd700;
          font-weight: bold;
        }
        
        .version {
          color: #666;
        }
        
        .switch {
          position: relative;
          width: 50px;
          height: 28px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #333;
          transition: 0.3s;
          border-radius: 28px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: var(--primary);
        }
        
        input:checked + .slider:before {
          transform: translateX(22px);
        }
        
        /* 订单 */
        .order-item {
          background: var(--bg-card);
          border-radius: 12px;
          padding: 15px 20px;
          margin-bottom: 10px;
        }
        
        .order-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .order-type {
          font-size: 15px;
        }
        
        .order-amount {
          color: #ffd700;
          font-weight: bold;
        }
        
        .order-detail {
          display: flex;
          justify-content: space-between;
          color: #888;
          font-size: 13px;
        }
        
        /* 个人中心头部 */
        .avatar-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin-bottom: 15px;
        }
        
        .username {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .user-id {
          color: #666;
          font-size: 13px;
          margin-bottom: 20px;
        }
        
        .stats-row {
          display: flex;
          justify-content: space-around;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-num {
          font-size: 24px;
          font-weight: bold;
          color: var(--primary);
        }
        
        .stat-label {
          font-size: 12px;
          color: #888;
          margin-top: 5px;
        }
      `}</style>
    </div>
  )
}