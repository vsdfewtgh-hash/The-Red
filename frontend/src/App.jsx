import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// 模拟数据
const DEMO_DRAMA = {
  id: 1,
  title: "龙王归来",
  cover: "https://picsum.photos/400/700?random=1",
  episodes: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4#t=${i * 60}`,
    free: i < 2
  })),
  paywallAt: 3,
  pricePerEpisode: 100
}

const API_BASE = 'http://localhost:3000/api'

export default function App() {
  const [currentEpisode, setCurrentEpisode] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [coins, setCoins] = useState(500)
  const [inviteCount, setInviteCount] = useState(0)
  const [userId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('user_id') || `user_${Date.now()}`
  })
  const [referrer] = useState(() => new URLSearchParams(window.location.search).get('ref'))
  const videoRef = useRef(null)

  const episode = DEMO_DRAMA.episodes[currentEpisode]
  const isLocked = currentEpisode >= DEMO_DRAMA.paywallAt

  // 检查是否有邀请关系
  useEffect(() => {
    if (referrer) {
      // 有邀请人，记录并奖励
      fetch(`${API_BASE}/invite/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, referrer })
      }).then(() => {
        // 奖励被邀请人
        setCoins(c => c + 50)
        alert('🎁 好友邀请奖励 +50 金币！')
      })
    }
  }, [referrer, userId])

  // 视频结束自动播放下一集
  const handleVideoEnd = () => {
    if (currentEpisode < DEMO_DRAMA.episodes.length - 1) {
      if (currentEpisode + 1 >= DEMO_DRAMA.paywallAt && isLocked) {
        setShowPaywall(true)
      } else {
        setCurrentEpisode(currentEpisode + 1)
      }
    }
  }

  // 上下滑动切换
  const handleScroll = (e) => {
    if (showPaywall || showEpisodes || showTasks) return
    
    if (e.deltaY > 0 && currentEpisode < DEMO_DRAMA.episodes.length - 1) {
      if (currentEpisode + 1 >= DEMO_DRAMA.paywallAt && currentEpisode + 1 >= DEMO_DRAMA.paywallAt) {
        setShowPaywall(true)
      } else {
        setCurrentEpisode(c => c + 1)
      }
    } else if (e.deltaY < 0 && currentEpisode > 0) {
      setCurrentEpisode(c => c - 1)
    }
  }

  // 支付解锁
  const handleUnlock = () => {
    setCoins(c => c - DEMO_DRAMA.pricePerEpisode)
    setShowPaywall(false)
    setCurrentEpisode(c => c + 1)
  }

  // 签到领金币
  const handleCheckIn = () => {
    setCoins(c => c + 100)
    alert('✅ 签到成功！+100 金币')
  }

  // 复制邀请链接
  const copyInviteLink = () => {
    const link = `${window.location.origin}?ref=${userId}`
    navigator.clipboard.writeText(link)
    alert('📎 邀请链接已复制！分享给好友吧~')
  }

  // 分享到 Telegram
  const shareToTelegram = () => {
    const link = `${window.location.origin}?ref=${userId}`
    const text = `🔥 快来看《龙王归来》！我在这个神器看短剧，邀请你一起~`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`)
  }

  return (
    <div className="app" onWheel={handleScroll} style={styles.app}>
      {/* 顶部栏 */}
      <div style={styles.header}>
        <span style={styles.title}>{DEMO_DRAMA.title}</span>
        <div style={styles.headerRight}>
          <span style={styles.coin}>💰 {coins}</span>
          <button onClick={() => setShowTasks(true)} style={styles.taskBtn}>📜 任务</button>
        </div>
      </div>

      {/* 视频播放器 */}
      <div style={styles.videoContainer}>
        <video
          ref={videoRef}
          key={episode.id}
          src={episode.url}
          style={styles.video}
          autoPlay
          playsInline
          muted={false}
          onEnded={handleVideoEnd}
          onClick={() => setIsPlaying(!isPlaying)}
        />
        
        {/* 播放/暂停指示器 */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={styles.playIcon}
            >
              ▶
            </motion.div>
          )}
        </AnimatePresence>

        {/* 集数指示 */}
        <div style={styles.episodeBadge}>
          第 {episode.id} 集 {isLocked ? '🔒' : ''}
        </div>
      </div>

      {/* 底部控制栏 */}
      <div style={styles.controls}>
        <button style={styles.controlBtn} onClick={() => setShowEpisodes(true)}>
          📋 选集
        </button>
        <button 
          style={styles.controlBtn} 
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
        </button>
      </div>

      {/* 选集弹窗 */}
      <AnimatePresence>
        {showEpisodes && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            style={styles.episodeSheet}
          >
            <div style={styles.sheetHeader}>
              <span>选集</span>
              <button onClick={() => setShowEpisodes(false)}>✕</button>
            </div>
            <div style={styles.episodeList}>
              {DEMO_DRAMA.episodes.map((ep, i) => (
                <button
                  key={ep.id}
                  style={{
                    ...styles.episodeItem,
                    ...(i === currentEpisode ? styles.episodeActive : {}),
                    ...(i < DEMO_DRAMA.paywallAt ? {} : styles.episodeLocked)
                  }}
                  onClick={() => {
                    if (i >= DEMO_DRAMA.paywallAt && i > currentEpisode) {
                      setShowEpisodes(false)
                      setShowPaywall(true)
                    } else {
                      setCurrentEpisode(i)
                      setShowEpisodes(false)
                    }
                  }}
                >
                  {ep.id}
                  {i < DEMO_DRAMA.paywallAt ? '✅' : i <= currentEpisode ? '' : '🔒'}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 任务中心弹窗 */}
      <AnimatePresence>
        {showTasks && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.taskOverlay}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              style={styles.taskSheet}
            >
              <div style={styles.sheetHeader}>
                <span>📜 任务中心</span>
                <button onClick={() => setShowTasks(false)}>✕</button>
              </div>

              {/* 每日签到 */}
              <div style={styles.taskCard}>
                <div style={styles.taskInfo}>
                  <span style={styles.taskIcon}>📅</span>
                  <div>
                    <div style={styles.taskTitle}>每日签到</div>
                    <div style={styles.taskDesc}>签到即送 100 金币</div>
                  </div>
                </div>
                <button style={styles.taskBtn2} onClick={handleCheckIn}>
                  签到
                </button>
              </div>

              {/* 邀请好友 */}
              <div style={styles.taskCard}>
                <div style={styles.taskInfo}>
                  <span style={styles.taskIcon}>👥</span>
                  <div>
                    <div style={styles.taskTitle}>邀请好友</div>
                    <div style={styles.taskDesc}>邀请1人送 1集 + 50金币</div>
                  </div>
                </div>
                <div style={styles.inviteCount}>已邀请: {inviteCount}人</div>
              </div>

              {/* 邀请链接 */}
              <div style={styles.inviteSection}>
                <div style={styles.inviteTitle}>你的邀请链接</div>
                <div style={styles.inviteLink}>
                  {window.location.origin}?ref={userId}
                </div>
                <div style={styles.inviteBtns}>
                  <button style={styles.copyBtn} onClick={copyInviteLink}>
                    📋 复制
                  </button>
                  <button style={styles.shareBtn} onClick={shareToTelegram}>
                    📱 TG分享
                  </button>
                </div>
              </div>

              {/* 奖励说明 */}
              <div style={styles.rewardInfo}>
                <h4>🎁 邀请奖励规则</h4>
                <ul>
                  <li>每邀请1位好友，双方各得 50 金币</li>
                  <li>好友通过你的链接注册，双方各得 1集 免费观看</li>
                  <li>邀请越多，奖励越多，无上限！</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 付费弹窗 */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.paywall}
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              style={styles.paywallContent}
            >
              <h2>🔒 付费解锁</h2>
              <p>第 {currentEpisode + 1} 集需要 {DEMO_DRAMA.pricePerEpisode} 金币</p>
              <p style={styles.coinBalance}>当前余额: 💰 {coins}</p>
              
              <div style={styles.paywallBtns}>
                <button 
                  style={styles.unlockBtn}
                  onClick={handleUnlock}
                  disabled={coins < DEMO_DRAMA.pricePerEpisode}
                >
                  {coins >= DEMO_DRAMA.pricePerEpisode ? '立即解锁' : '金币不足'}
                </button>
                <button 
                  style={styles.closeBtn}
                  onClick={() => setShowPaywall(false)}
                >
                  再想想
                </button>
                <button
                  style={styles.inviteUnlockBtn}
                  onClick={() => {
                    setShowPaywall(false)
                    setShowTasks(true)
                  }}
                >
                  📥 邀请好友免费解锁
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const styles = {
  app: {
    height: '100dvh',
    background: '#000',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '16px',
    paddingTop: '48px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
    zIndex: 10
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  coin: {
    background: 'rgba(255,255,255,0.2)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '14px'
  },
  taskBtn: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: '#000'
  },
  playIcon: {
    position: 'absolute',
    fontSize: '60px',
    color: '#fff',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
  },
  episodeBadge: {
    position: 'absolute',
    bottom: '100px',
    left: '16px',
    background: 'rgba(0,0,0,0.6)',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '14px'
  },
  controls: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '16px'
  },
  controlBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '25px',
    fontSize: '14px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)'
  },
  episodeSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#1a1a1a',
    borderRadius: '20px 20px 0 0',
    padding: '20px',
    maxHeight: '60vh',
    overflow: 'auto'
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  episodeList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px'
  },
  episodeItem: {
    aspectRatio: '1',
    background: '#333',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer'
  },
  episodeActive: {
    background: '#ff6b35'
  },
  episodeLocked: {
    opacity: 0.5
  },
  taskOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    zIndex: 50
  },
  taskSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#1a1a1a',
    borderRadius: '20px 20px 0 0',
    padding: '20px',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  taskCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#2a2a2a',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '12px'
  },
  taskInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  taskIcon: {
    fontSize: '24px'
  },
  taskTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  taskDesc: {
    fontSize: '12px',
    color: '#888'
  },
  taskBtn2: {
    background: '#ff6b35',
    border: 'none',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  inviteCount: {
    fontSize: '14px',
    color: '#667eea'
  },
  inviteSection: {
    background: '#2a2a2a',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '12px'
  },
  inviteTitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '8px'
  },
  inviteLink: {
    background: '#333',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '12px',
    wordBreak: 'break-all',
    marginBottom: '12px'
  },
  inviteBtns: {
    display: 'flex',
    gap: '8px'
  },
  copyBtn: {
    flex: 1,
    background: '#333',
    border: 'none',
    color: '#fff',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  shareBtn: {
    flex: 1,
    background: '#0088cc',
    border: 'none',
    color: '#fff',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  rewardInfo: {
    background: '#2a2a2a',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#888'
  },
  paywall: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  paywallContent: {
    background: '#1a1a1a',
    padding: '32px',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '300px'
  },
  coinBalance: {
    color: '#ff6b35',
    margin: '16px 0'
  },
  paywallBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  unlockBtn: {
    background: '#ff6b35',
    border: 'none',
    color: '#fff',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  inviteUnlockBtn: {
    background: '#667eea',
    border: 'none',
    color: '#fff',
    padding: '12px',
    borderRadius: '12px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid #666',
    color: '#999',
    padding: '12px',
    borderRadius: '12px',
    fontSize: '14px',
    cursor: 'pointer'
  }
}
