import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// 模拟数据 - 多剧支持
const DRAMAS = [
  {
    id: 1,
    title: "龙王归来",
    cover: "https://picsum.photos/400/700?random=1",
    episodes: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4#t=${i * 60}`,
      free: i < 3
    })),
    paywallAt: 3,
    pricePerEpisode: 100,
    description: "一代龙王逆袭归来，重新崛起！"
  },
  {
    id: 2,
    title: "豪门千金",
    cover: "https://picsum.photos/400/700?random=2",
    episodes: Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4#t=${i * 60}`,
      free: i < 2
    })),
    paywallAt: 2,
    pricePerEpisode: 100,
    description: "豪门千金的复仇之路"
  },
  {
    id: 3,
    title: "都市狂少",
    cover: "https://picsum.photos/400/700?random=3",
    episodes: Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4#t=${i * 60}`,
      free: i < 3
    })),
    paywallAt: 3,
    pricePerEpisode: 100,
    description: "都市狂少纵横天下"
  }
]

// 金币套餐 (Telegram Stars)
const COIN_PACKAGES = [
  { id: 1, coins: 100, price: 0.99, bonus: 0, stars: 13 },
  { id: 2, coins: 500, price: 4.99, bonus: 50, stars: 65 },
  { id: 3, coins: 1000, price: 9.99, bonus: 200, stars: 130 },
  { id: 4, coins: 2000, price: 19.99, bonus: 500, stars: 260 },
]

const API_BASE = 'http://localhost:3000/api'

export default function App() {
  const [currentDramaId, setCurrentDramaId] = useState(1)
  const [currentEpisode, setCurrentEpisode] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const [showDramaList, setShowDramaList] = useState(false)
  const [coins, setCoins] = useState(500)
  const [checkedIn, setCheckedIn] = useState(false)
  const [inviteCount, setInviteCount] = useState(0)
  const [isRecharging, setIsRecharging] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [userId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('user_id') || `user_${Date.now()}`
  })
  const [referrer] = useState(() => new URLSearchParams(window.location.search).get('ref'))
  const videoRef = useRef(null)
  const longPressTimer = useRef(null)

  const currentDrama = DRAMAS.find(d => d.id === currentDramaId) || DRAMAS[0]
  const episode = currentDrama.episodes[currentEpisode]
  const isLocked = currentEpisode >= currentDrama.paywallAt

  // 切换剧集
  const switchDrama = (dramaId) => {
    setCurrentDramaId(dramaId)
    setCurrentEpisode(0)
    setShowDramaList(false)
  }

  // 视频播放控制
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {})
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying])

  // 倍速控制
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  // 检查是否有邀请关系
  useEffect(() => {
    if (referrer) {
      fetch(`${API_BASE}/invite/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, referrer })
      }).then(() => {
        setCoins(c => c + 50)
        alert('🎁 好友邀请奖励 +50 金币！')
      })
    }
  }, [referrer, userId])

  // 视频结束自动播放下一集
  const handleVideoEnd = () => {
    if (currentEpisode < currentDrama.episodes.length - 1) {
      if (currentEpisode + 1 >= currentDrama.paywallAt && isLocked) {
        setShowPaywall(true)
      } else {
        setCurrentEpisode(currentEpisode + 1)
      }
    }
  }

  // 触摸滑动切换集数
  const handleTouchStart = (e) => {
    setLastScrollY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e) => {
    const deltaY = lastScrollY - e.changedTouches[0].clientY
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0 && currentEpisode < currentDrama.episodes.length - 1) {
        // 向上滑 -> 下一集
        if (currentEpisode + 1 >= currentDrama.paywallAt && isLocked) {
          setShowPaywall(true)
        } else {
          setCurrentEpisode(c => c + 1)
        }
      } else if (deltaY < 0 && currentEpisode > 0) {
        // 向下滑 -> 上一集
        setCurrentEpisode(c => c - 1)
      }
    }
  }

  // 长按加速
  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setPlaybackRate(2)
    }, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setPlaybackRate(1)
  }

  // 点击视频播放/暂停
  const handleVideoClick = () => {
    setIsPlaying(!isPlaying)
  }

  // 支付解锁
  const handleUnlock = () => {
    if (coins >= currentDrama.pricePerEpisode) {
      setCoins(c => c - currentDrama.pricePerEpisode)
      setShowPaywall(false)
      setCurrentEpisode(c => c + 1)
    } else {
      setShowPaywall(false)
      setShowWallet(true)
    }
  }

  // 签到领金币
  const handleCheckIn = () => {
    if (!checkedIn) {
      setCoins(c => c + 100)
      setCheckedIn(true)
      alert('✅ 签到成功！+100 金币')
    }
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
    const text = `🔥 快来看《${currentDrama.title}》！`
    window.open(`https://telegram.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`)
  }

  // Telegram Stars 充值 (模拟)
  const handleRecharge = async (pkg) => {
    setIsRecharging(true)
    
    // 模拟支付流程
    alert(`💳 即将跳转 Telegram Stars 支付...\n\n${pkg.coins + pkg.bonus} 金币 = ${pkg.stars} Stars`)
    
    // 模拟支付延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setCoins(c => c + pkg.coins + pkg.bonus)
    setIsRecharging(false)
    alert(`✅ 充值成功！+${pkg.coins + pkg.bonus} 金币`)
    setShowWallet(false)
  }

  return (
    <div style={styles.app}>
      {/* 顶部栏 */}
      <div style={styles.header}>
        <div style={styles.headerLeft} onClick={() => setShowDramaList(true)}>
          <span style={styles.dramaTitle}>{currentDrama.title}</span>
          <span style={styles.changeDrama}>切换</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.coin} onClick={() => setShowWallet(true)}>💰 {coins}</span>
          <button onClick={() => setShowTasks(true)} style={styles.taskBtn}>📜</button>
        </div>
      </div>

      {/* 视频播放器 */}
      <div 
        style={styles.videoContainer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          key={`${currentDramaId}-${episode.id}`}
          src={episode.url}
          style={styles.video}
          autoPlay
          playsInline
          muted={false}
          onEnded={handleVideoEnd}
          onClick={handleVideoClick}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
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

        {/* 倍速指示器 */}
        {playbackRate > 1 && (
          <div style={styles.speedBadge}>2x</div>
        )}

        {/* 集数指示 */}
        <div style={styles.episodeBadge}>
          {currentDrama.title} · 第 {episode.id} 集 {isLocked ? '🔒' : ''}
        </div>
      </div>

      {/* 底部控制栏 */}
      <div style={styles.controls}>
        <button style={styles.controlBtn} onClick={() => setShowEpisodes(true)}>
          📋
        </button>
        <button style={styles.controlBtn} onClick={handleVideoClick}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>

      {/* 剧集列表弹窗 */}
      <AnimatePresence>
        {showEpisodes && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            style={styles.episodeSheet}
          >
            <div style={styles.sheetHeader}>
              <span>{currentDrama.title} - 选集</span>
              <button onClick={() => setShowEpisodes(false)}>✕</button>
            </div>
            <div style={styles.episodeList}>
              {currentDrama.episodes.map((ep, i) => (
                <button
                  key={ep.id}
                  style={{
                    ...styles.episodeItem,
                    ...(i === currentEpisode ? styles.episodeActive : {}),
                    ...(i < currentDrama.paywallAt ? {} : i > currentEpisode ? styles.episodeLocked : {})
                  }}
                  onClick={() => {
                    if (i >= currentDrama.paywallAt && i > currentEpisode) {
                      setShowEpisodes(false)
                      setShowPaywall(true)
                    } else {
                      setCurrentEpisode(i)
                      setShowEpisodes(false)
                    }
                  }}
                >
                  {ep.id}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 剧库列表弹窗 */}
      <AnimatePresence>
        {showDramaList && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.overlay}
            onClick={() => setShowDramaList(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              style={styles.dramaSheet}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.sheetHeader}>
                <span>📺 剧库</span>
                <button onClick={() => setShowDramaList(false)}>✕</button>
              </div>
              <div style={styles.dramaList}>
                {DRAMAS.map(drama => (
                  <div 
                    key={drama.id}
                    style={drama.id === currentDramaId ? styles.dramaItemActive : styles.dramaItem}
                    onClick={() => switchDrama(drama.id)}
                  >
                    <img src={drama.cover} style={styles.dramaCover} alt={drama.title} />
                    <div style={styles.dramaInfo}>
                      <div style={styles.dramaName}>{drama.title}</div>
                      <div style={styles.dramaDesc}>{drama.description}</div>
                      <div style={styles.dramaMeta}>
                        {drama.episodes.length}集 · {drama.paywallAt}集免费
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
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
            style={styles.overlay}
            onClick={() => setShowTasks(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              style={styles.taskSheet}
              onClick={e => e.stopPropagation()}
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
                <button 
                  style={checkedIn ? styles.taskBtnDisabled : styles.taskBtn2} 
                  onClick={handleCheckIn}
                  disabled={checkedIn}
                >
                  {checkedIn ? '已签到' : '签到'}
                </button>
              </div>

              {/* 邀请好友 */}
              <div style={styles.taskCard}>
                <div style={styles.taskInfo}>
                  <span style={styles.taskIcon}>👥</span>
                  <div>
                    <div style={styles.taskTitle}>邀请好友</div>
                    <div style={styles.taskDesc}>邀请1人送 50金币</div>
                  </div>
                </div>
                <div style={styles.inviteCount}>{inviteCount}人</div>
              </div>

              {/* 邀请链接 */}
              <div style={styles.inviteSection}>
                <div style={styles.inviteTitle}>你的邀请链接</div>
                <div style={styles.inviteLink}>
                  {window.location.origin}?ref={userId}
                </div>
                <div style={styles.inviteBtns}>
                  <button style={styles.copyBtn} onClick={copyInviteLink}>复制</button>
                  <button style={styles.shareBtn} onClick={shareToTelegram}>TG分享</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 钱包弹窗 */}
      <AnimatePresence>
        {showWallet && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.overlay}
            onClick={() => setShowWallet(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              style={styles.walletSheet}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.sheetHeader}>
                <span>💰 金币钱包</span>
                <button onClick={() => setShowWallet(false)}>✕</button>
              </div>

              {/* 余额 */}
              <div style={styles.balanceCard}>
                <div style={styles.balanceLabel}>当前余额</div>
                <div style={styles.balanceValue}>💰 {coins}</div>
              </div>

              {/* 充值套餐 */}
              <div style={styles.rechargeTitle}>充值套餐 (Telegram Stars)</div>
              <div style={styles.packageGrid}>
                {COIN_PACKAGES.map(pkg => (
                  <div 
                    key={pkg.id} 
                    style={isRecharging ? styles.packageCardDisabled : styles.packageCard}
                    onClick={() => !isRecharging && handleRecharge(pkg)}
                  >
                    <div style={styles.packageCoins}>{pkg.coins + pkg.bonus}</div>
                    <div style={styles.packageBonus}>{pkg.bonus > 0 ? `送${pkg.bonus}` : ''}</div>
                    <div style={styles.packagePrice}>${pkg.price} ({pkg.stars} ⭐)</div>
                  </div>
                ))}
              </div>

              {/* 提示 */}
              <div style={styles.rechargeTip}>
                💡 点击套餐即通过 Telegram Stars 支付<br/>
                🔒 安全支付由 Telegram 提供保障
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
              <p>第 {currentEpisode + 1} 集需要 {currentDrama.pricePerEpisode} 金币</p>
              <p style={styles.coinBalance}>当前余额: 💰 {coins}</p>
              
              <div style={styles.paywallBtns}>
                <button 
                  style={coins >= currentDrama.pricePerEpisode ? styles.unlockBtn : styles.unlockBtnDisabled}
                  onClick={handleUnlock}
                  disabled={coins < currentDrama.pricePerEpisode}
                >
                  {coins >= currentDrama.pricePerEpisode ? '立即解锁' : '金币不足'}
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
                  📥 邀请解锁
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
    overflow: 'hidden',
    touchAction: 'pan-y'
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  dramaTitle: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  changeDrama: {
    fontSize: '12px',
    color: '#ff6b35',
    background: 'rgba(255,107,53,0.2)',
    padding: '2px 8px',
    borderRadius: '4px'
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
    fontSize: '14px',
    cursor: 'pointer'
  },
  taskBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '20px',
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
  speedBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(255,107,53,0.9)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '24px',
    fontWeight: 'bold'
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
    padding: '12px 24px',
    borderRadius: '25px',
    fontSize: '18px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)'
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    zIndex: 50
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
    overflow: 'auto',
    zIndex: 60
  },
  dramaSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#1a1a1a',
    borderRadius: '20px 20px 0 0',
    padding: '20px',
    maxHeight: '80vh',
    overflow: 'auto',
    zIndex: 60
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
    opacity: 0.4
  },
  dramaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  dramaItem: {
    display: 'flex',
    gap: '12px',
    background: '#2a2a2a',
    padding: '12px',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  dramaItemActive: {
    display: 'flex',
    gap: '12px',
    background: '#3a3a3a',
    padding: '12px',
    borderRadius: '12px',
    border: '2px solid #ff6b35',
    cursor: 'pointer'
  },
  dramaCover: {
    width: '60px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '6px'
  },
  dramaInfo: {
    flex: 1
  },
  dramaName: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  dramaDesc: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px'
  },
  dramaMeta: {
    fontSize: '11px',
    color: '#666'
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
    overflow: 'auto',
    zIndex: 60
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
  taskBtnDisabled: {
    background: '#666',
    border: 'none',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'not-allowed'
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
  walletSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#1a1a1a',
    borderRadius: '20px 20px 0 0',
    padding: '20px',
    maxHeight: '80vh',
    overflow: 'auto',
    zIndex: 60
  },
  balanceCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '24px',
    borderRadius: '16px',
    textAlign: 'center',
    marginBottom: '20px'
  },
  balanceLabel: {
    fontSize: '14px',
    opacity: 0.8,
    marginBottom: '8px'
  },
  balanceValue: {
    fontSize: '32px',
    fontWeight: 'bold'
  },
  rechargeTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px'
  },
  packageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '20px'
  },
  packageCard: {
    background: '#2a2a2a',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    border: '2px solid transparent'
  },
  packageCardDisabled: {
    background: '#2a2a2a',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'not-allowed',
    opacity: 0.5
  },
  packageCoins: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ff6b35'
  },
  packageBonus: {
    fontSize: '12px',
    color: '#52c41a',
    marginBottom: '4px'
  },
  packagePrice: {
    fontSize: '14px',
    color: '#888'
  },
  rechargeTip: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center',
    lineHeight: '1.8'
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
  unlockBtnDisabled: {
    background: '#666',
    border: 'none',
    color: '#fff',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'not-allowed'
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
