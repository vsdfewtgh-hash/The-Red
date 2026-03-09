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
  const [coins, setCoins] = useState(500)
  const [userId] = useState(() => `user_${Date.now()}`)
  const videoRef = useRef(null)

  const episode = DEMO_DRAMA.episodes[currentEpisode]
  const isLocked = currentEpisode >= DEMO_DRAMA.paywallAt

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
    if (showPaywall || showEpisodes) return
    
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
  }

  return (
    <div className="app" onWheel={handleScroll} style={styles.app}>
      {/* 顶部栏 */}
      <div style={styles.header}>
        <span style={styles.title}>{DEMO_DRAMA.title}</span>
        <div style={styles.headerRight}>
          <span style={styles.coin}>💰 {coins}</span>
          <button onClick={handleCheckIn} style={styles.checkInBtn}>签到</button>
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
  checkInBtn: {
    background: '#ff6b35',
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
