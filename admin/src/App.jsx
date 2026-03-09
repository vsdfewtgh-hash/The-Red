import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// 模拟数据
const mockStats = {
  dau: 12580,
  totalUsers: 45670,
  revenue: 23450,
  arppu: 4.2,
  payingRate: 12.5
}

const mockDailyData = [
  { date: '03-01', dau: 8200, revenue: 12000 },
  { date: '03-02', dau: 8900, revenue: 14500 },
  { date: '03-03', dau: 9100, revenue: 15200 },
  { date: '03-04', dau: 8700, revenue: 13800 },
  { date: '03-05', dau: 9500, revenue: 16800 },
  { date: '03-06', dau: 10200, revenue: 18500 },
  { date: '03-07', dau: 11500, revenue: 21000 },
  { date: '03-08', dau: 12580, revenue: 23450 },
]

const mockDramas = [
  { id: 1, title: '龙王归来', episodes: 20, views: 125000, status: 'active' },
  { id: 2, title: '豪门千金', episodes: 30, views: 89000, status: 'active' },
  { id: 3, title: '都市狂少', episodes: 25, views: 67000, status: 'active' },
  { id: 4, title: '新剧测试', episodes: 10, views: 0, status: 'draft' },
]

const mockSources = [
  { name: '矩阵号A', users: 4500, rate: 35.8 },
  { name: '矩阵号B', users: 3200, rate: 25.4 },
  { name: '矩阵号C', users: 2800, rate: 22.3 },
  { name: '矩阵号D', users: 1500, rate: 11.9 },
  { name: '自然流量', users: 580, rate: 4.6 },
]

const mockPricePackages = [
  { id: 1, coins: 100, price: 0.99, name: '100金币' },
  { id: 2, coins: 500, price: 4.99, name: '500金币', bonus: 50 },
  { id: 3, coins: 1000, price: 9.99, name: '1000金币', bonus: 200 },
  { id: 4, coins: 2000, price: 19.99, name: '2000金币', bonus: 500 },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dramaForm, setDramaForm] = useState({ title: '', episodes: 10, cover: '', freeEpisodes: 3 })
  const [priceForm, setPriceForm] = useState({ coins: 100, price: 0.99, bonus: 0 })

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div style={styles.content}>
            {/* 核心指标 */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>DAU</div>
                <div style={styles.statValue}>{mockStats.dau.toLocaleString()}</div>
                <div style={styles.statChange}>↑ 12.5%</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>总用户</div>
                <div style={styles.statValue}>{mockStats.totalUsers.toLocaleString()}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>总收入</div>
                <div style={styles.statValue}>${mockStats.revenue.toLocaleString()}</div>
                <div style={styles.statChange}>↑ 18.2%</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>ARPPU</div>
                <div style={styles.statValue}>${mockStats.arppu}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>付费率</div>
                <div style={styles.statValue}>{mockStats.payingRate}%</div>
              </div>
            </div>

            {/* 趋势图 */}
            <div style={styles.chartSection}>
              <h3 style={styles.sectionTitle}>📈 趋势分析</h3>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockDailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="dau" stroke="#8884d8" name="DAU" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="收入" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 流量来源 */}
            <div style={styles.chartSection}>
              <h3 style={styles.sectionTitle}>📊 流量来源 (矩阵号)</h3>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockSources}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#8884d8" name="用户数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>来源</th>
                    <th>用户数</th>
                    <th>占比</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSources.map(s => (
                    <tr key={s.name}>
                      <td>{s.name}</td>
                      <td>{s.users.toLocaleString()}</td>
                      <td>{s.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'dramas':
        return (
          <div style={styles.content}>
            <h3 style={styles.sectionTitle}>📺 剧集管理</h3>
            
            {/* 添加新剧 */}
            <div style={styles.formCard}>
              <h4>添加新剧</h4>
              <div style={styles.formGrid}>
                <input 
                  type="text" 
                  placeholder="剧名" 
                  style={styles.input}
                  value={dramaForm.title}
                  onChange={e => setDramaForm({...dramaForm, title: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="集数" 
                  style={styles.input}
                  value={dramaForm.episodes}
                  onChange={e => setDramaForm({...dramaForm, episodes: parseInt(e.target.value)})}
                />
                <input 
                  type="text" 
                  placeholder="封面URL" 
                  style={styles.input}
                  value={dramaForm.cover}
                  onChange={e => setDramaForm({...dramaForm, cover: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="免费集数" 
                  style={styles.input}
                  value={dramaForm.freeEpisodes}
                  onChange={e => setDramaForm({...dramaForm, freeEpisodes: parseInt(e.target.value)})}
                />
                <button style={styles.submitBtn}>添加</button>
              </div>
            </div>

            {/* 剧集列表 */}
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>剧名</th>
                  <th>集数</th>
                  <th>播放量</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockDramas.map(d => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.title}</td>
                    <td>{d.episodes}</td>
                    <td>{d.views.toLocaleString()}</td>
                    <td>
                      <span style={d.status === 'active' ? styles.tagActive : styles.tagDraft}>
                        {d.status === 'active' ? '上线' : '草稿'}
                      </span>
                    </td>
                    <td>
                      <button style={styles.editBtn}>编辑</button>
                      <button style={styles.deleteBtn}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'pricing':
        return (
          <div style={styles.content}>
            <h3 style={styles.sectionTitle}>💰 定价策略</h3>
            
            {/* 单集解锁价格 */}
            <div style={styles.formCard}>
              <h4>单集解锁价格</h4>
              <div style={styles.formRow}>
                <span>当前价格：</span>
                <strong>100 金币/集</strong>
                <button style={styles.editBtn}>修改</button>
              </div>
            </div>

            {/* 金币套餐 */}
            <div style={styles.formCard}>
              <h4>金币套餐</h4>
              <div style={styles.priceGrid}>
                {mockPricePackages.map(p => (
                  <div key={p.id} style={styles.priceCard}>
                    <div style={styles.priceName}>{p.name}</div>
                    <div style={styles.priceValue}>${p.price}</div>
                    {p.bonus > 0 && <div style={styles.priceBonus}>送{p.bonus}金币</div>}
                    <button style={styles.editBtn}>编辑</button>
                  </div>
                ))}
              </div>
            </div>

            {/* 添加套餐 */}
            <div style={styles.formCard}>
              <h4>添加新套餐</h4>
              <div style={styles.formRow}>
                <input 
                  type="number" 
                  placeholder="金币数量" 
                  style={styles.input}
                  value={priceForm.coins}
                  onChange={e => setPriceForm({...priceForm, coins: parseInt(e.target.value)})}
                />
                <input 
                  type="number" 
                  placeholder="价格 ($)" 
                  style={styles.input}
                  value={priceForm.price}
                  onChange={e => setPriceForm({...priceForm, price: parseFloat(e.target.value)})}
                />
                <input 
                  type="number" 
                  placeholder="赠送金币" 
                  style={styles.input}
                  value={priceForm.bonus}
                  onChange={e => setPriceForm({...priceForm, bonus: parseInt(e.target.value)})}
                />
                <button style={styles.submitBtn}>添加套餐</button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={styles.container}>
      {/* 侧边栏 */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>The Red</div>
        <div style={styles.logoSub}>管理后台</div>
        
        <div style={styles.nav}>
          <div 
            style={activeTab === 'dashboard' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 数据看板
          </div>
          <div 
            style={activeTab === 'dramas' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('dramas')}
          >
            📺 剧集管理
          </div>
          <div 
            style={activeTab === 'pricing' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('pricing')}
          >
            💰 定价策略
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div style={styles.main}>
        <div style={styles.header}>
          <h2 style={styles.pageTitle}>
            {activeTab === 'dashboard' && '数据看板'}
            {activeTab === 'dramas' && '剧集管理'}
            {activeTab === 'pricing' && '定价策略'}
          </h2>
          <div style={styles.headerRight}>
            <span>👤 管理员</span>
          </div>
        </div>
        
        {renderContent()}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: '220px',
    background: '#1a1a2e',
    color: '#fff',
    padding: '20px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: '4px',
  },
  logoSub: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '30px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: {
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: '0.2s',
  },
  navItemActive: {
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    background: '#ff6b35',
  },
  main: {
    flex: 1,
    background: '#f5f5f5',
  },
  header: {
    background: '#fff',
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
  },
  pageTitle: {
    fontSize: '20px',
    margin: 0,
  },
  headerRight: {
    color: '#666',
  },
  content: {
    padding: '30px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  statChange: {
    fontSize: '12px',
    color: '#52c41a',
  },
  chartSection: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    marginBottom: '20px',
  },
  chartContainer: {
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  formCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginTop: '12px',
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '12px',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
  },
  submitBtn: {
    background: '#ff6b35',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  editBtn: {
    background: '#1890ff',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '8px',
  },
  deleteBtn: {
    background: '#ff4d4f',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tagActive: {
    background: '#52c41a',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  tagDraft: {
    background: '#faad14',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  priceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginTop: '12px',
  },
  priceCard: {
    background: '#fafafa',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  priceName: {
    fontSize: '14px',
    marginBottom: '8px',
  },
  priceValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: '4px',
  },
  priceBonus: {
    fontSize: '12px',
    color: '#52c41a',
    marginBottom: '8px',
  },
}
