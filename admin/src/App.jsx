import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''

const COLORS = ['#ff6b35', '#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1']

// 样式
const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#0f0f23' },
  sidebar: { width: '240px', background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', padding: '20px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '28px', fontWeight: 'bold', color: '#ff6b35', marginBottom: '4px', letterSpacing: '2px' },
  logoSub: { fontSize: '11px', color: '#666', marginBottom: '40px', letterSpacing: '1px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  navItem: { padding: '14px 18px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s', color: '#888', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' },
  navItemActive: { padding: '14px 18px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s', background: 'linear-gradient(135deg, #ff6b35 0%, #ff8f5a 100%)', color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(255,107,53,0.3)' },
  main: { flex: 1, padding: '30px', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  refreshBtn: { background: '#1f1f3a', border: '1px solid #333', color: '#888', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '30px' },
  statCard: { background: 'linear-gradient(135deg, #1f1f3a 0%, #2a2a4a 100%)', padding: '24px', borderRadius: '16px', border: '1px solid #333' },
  statLabel: { fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' },
  statValue: { fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' },
  statChange: { fontSize: '12px', color: '#52c41a' },
  chartSection: { background: 'linear-gradient(135deg, #1f1f3a 0%, #2a2a4a 100%)', padding: '24px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #333' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' },
  th: { padding: '16px', textAlign: 'left', background: '#252540', color: '#888', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase' },
  td: { padding: '16px', borderBottom: '1px solid #2a2a4a', color: '#ccc', fontSize: '14px' },
  tag: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  input: { background: '#1a1a2e', border: '1px solid #333', color: '#fff', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%' },
  select: { background: '#1a1a2e', border: '1px solid #333', color: '#fff', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', outline: 'none', cursor: 'pointer' },
  button: { background: 'linear-gradient(135deg, #ff6b35 0%, #ff8f5a 100%)', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' },
  btnSmall: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
  formCard: { background: 'linear-gradient(135deg, #1f1f3a 0%, #2a2a4a 100%)', padding: '24px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #333' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' },
  formRow: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#1f1f3a', padding: '30px', borderRadius: '16px', width: '500px', maxWidth: '90%', border: '1px solid #333' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '20px' },
  badge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '20px', borderRadius: '10px', background: '#ff4d4f', color: '#fff', fontSize: '11px', marginLeft: '8px' },
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  
  // 数据状态
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [sources, setSources] = useState([])
  const [settings, setSettings] = useState(null)
  const [dramas, setDramas] = useState([])
  
  // 分页/筛选
  const [userPage, setUserPage] = useState(1)
  const [orderPage, setOrderPage] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  
  // Modal 状态
  const [modal, setModal] = useState({ type: '', data: null })
  
  const loadData = async () => {
    setLoading(true)
    try {
      const base = API_BASE
      if (activeTab === 'dashboard' || activeTab === 'dashboard') {
        const res = await fetch(`${base}/api/admin/stats`)
        setStats(await res.json())
      }
      if (activeTab === 'users') {
        const res = await fetch(`${base}/api/admin/users?page=${userPage}&limit=10&search=${userSearch}`)
        const data = await res.json()
        setUsers(data)
      }
      if (activeTab === 'orders') {
        const res = await fetch(`${base}/api/admin/orders?page=${orderPage}&limit=10`)
        const data = await res.json()
        setOrders(data)
      }
      if (activeTab === 'sources') {
        const res = await fetch(`${base}/api/admin/sources`)
        setSources(await res.json())
      }
      if (activeTab === 'settings') {
        const res = await fetch(`${base}/api/admin/settings`)
        setSettings(await res.json())
      }
      if (activeTab === 'dramas') {
        const res = await fetch(`${base}/api/admin/dramas`)
        setDramas(await res.json())
      }
    } catch (e) {
      console.error('Load data error:', e)
    }
    setLoading(false)
  }
  
  useEffect(() => { loadData() }, [activeTab, userPage, orderPage, userSearch])

  const navItems = [
    { id: 'dashboard', icon: '📊', label: '数据看板' },
    { id: 'users', icon: '👥', label: '用户管理' },
    { id: 'orders', icon: '📦', label: '订单管理' },
    { id: 'dramas', icon: '📺', label: '剧集管理' },
    { id: 'sources', icon: '🔗', label: '矩阵号' },
    { id: 'settings', icon: '⚙️', label: '系统设置' },
  ]

  const renderDashboard = () => (
    <div>
      {stats && (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>DAU</div>
              <div style={styles.statValue}>{Number(stats.dau).toLocaleString()}</div>
              <div style={styles.statChange}>↑ 12.5%</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>总用户</div>
              <div style={styles.statValue}>{Number(stats.totalUsers).toLocaleString()}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>总收入</div>
              <div style={styles.statValue}>${Number(stats.revenue).toFixed(2)}</div>
              <div style={styles.statChange}>↑ 18.2%</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>ARPPU</div>
              <div style={styles.statValue}>${stats.arppu}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>付费率</div>
              <div style={styles.statValue}>{stats.payingRate}%</div>
            </div>
          </div>

          <div style={styles.chartSection}>
            <div style={styles.sectionTitle}>📈 趋势分析</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis yAxisId="left" stroke="#666" />
                <YAxis yAxisId="right" orientation="right" stroke="#666" />
                <Tooltip contentStyle={{ background: '#1f1f3a', border: '1px solid #333', borderRadius: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="dau" stroke="#ff6b35" name="DAU" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#1890ff" name="收入" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.chartSection}>
            <div style={styles.sectionTitle}>📊 流量来源分布</div>
            <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
              <ResponsiveContainer width={300} height={250}>
                <PieChart>
                  <Pie data={sources.slice(0, 5)} dataKey="users" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                    {sources.slice(0, 5).map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1f1f3a', border: '1px solid #333', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <table style={{ ...styles.table, flex: 1 }}>
                <thead><tr><th style={styles.th}>来源</th><th style={styles.th}>用户数</th><th style={styles.th}>占比</th></tr></thead>
                <tbody>
                  {sources.slice(0, 5).map(s => (
                    <tr key={s.id}><td style={styles.td}>{s.name}</td><td style={styles.td}>{s.users.toLocaleString()}</td><td style={styles.td}>{s.rate}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderUsers = () => (
    <div>
      <div style={styles.formCard}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input style={{ ...styles.input, width: '300px' }} placeholder="搜索用户ID或用户名..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          <button style={styles.button} onClick={() => setUserPage(1)}>搜索</button>
        </div>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>用户名</th>
            <th style={styles.th}>金币</th>
            <th style={styles.th}>消费</th>
            <th style={styles.th}>邀请</th>
            <th style={styles.th}>状态</th>
            <th style={styles.th}>最后活跃</th>
            <th style={styles.th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.list?.map(u => (
            <tr key={u.id}>
              <td style={styles.td}>{u.id}</td>
              <td style={styles.td}>{u.username || '-'}</td>
              <td style={styles.td}>{u.coins}</td>
              <td style={styles.td}>${u.totalSpent || 0}</td>
              <td style={styles.td}>{u.inviteCount || 0}</td>
              <td style={styles.td}>
                <span style={{ ...styles.tag, background: u.status === 'active' ? '#52c41a' : '#ff4d4f', color: '#fff' }}>{u.status === 'active' ? '正常' : '禁用'}</span>
              </td>
              <td style={styles.td}>{u.lastActive?.slice(0, 10) || '-'}</td>
              <td style={styles.td}>
                <button style={{ ...styles.btnSmall, background: '#1890ff', color: '#fff', marginRight: '8px' }} onClick={() => setModal({ type: 'user', data: u })}>详情</button>
                <button style={{ ...styles.btnSmall, background: u.status === 'active' ? '#ff4d4f' : '#52c41a', color: '#fff' }} onClick={() => toggleUserStatus(u)}>{u.status === 'active' ? '禁用' : '启用'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
        <button style={{ ...styles.btnSmall, background: '#333', color: '#fff' }} disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)}>上一页</button>
        <span style={{ color: '#666', padding: '8px' }}>第 {userPage} / {Math.ceil((users.total || 1) / 10)} 页</span>
        <button style={{ ...styles.btnSmall, background: '#333', color: '#fff' }} disabled={userPage >= Math.ceil((users.total || 1) / 10)} onClick={() => setUserPage(p => p + 1)}>下一页</button>
      </div>
    </div>
  )

  const toggleUserStatus = async (user) => {
    await fetch(`${API_BASE}/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: user.status === 'active' ? 'banned' : 'active' })
    })
    loadData()
  }

  const renderOrders = () => (
    <div>
      {orders.stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}><div style={styles.statLabel}>总收入</div><div style={styles.statValue}>${orders.stats.totalRevenue.toFixed(2)}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>充值收入</div><div style={styles.statValue}>${orders.stats.rechargeRevenue.toFixed(2)}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>解锁收入</div><div style={styles.statValue}>${orders.stats.unlockRevenue.toFixed(2)}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>订单数</div><div style={styles.statValue}>{orders.total}</div></div>
        </div>
      )}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>订单ID</th>
            <th style={styles.th}>用户</th>
            <th style={styles.th}>类型</th>
            <th style={styles.th}>金额</th>
            <th style={styles.th}>价格</th>
            <th style={styles.th}>状态</th>
            <th style={styles.th}>时间</th>
          </tr>
        </thead>
        <tbody>
          {orders.list?.map(o => (
            <tr key={o.id}>
              <td style={styles.td}>{o.id}</td>
              <td style={styles.td}>{o.userId}</td>
              <td style={styles.td}>
                <span style={{ ...styles.tag, background: o.type === 'recharge' ? '#1890ff' : '#722ed1', color: '#fff' }}>{o.type === 'recharge' ? '充值' : '解锁'}</span>
              </td>
              <td style={styles.td}>{o.amount} {o.stars ? '⭐' : '金币'}</td>
              <td style={styles.td}>${o.price}</td>
              <td style={styles.td}>
                <span style={{ ...styles.tag, background: o.status === 'completed' ? '#52c41a' : '#faad14', color: '#fff' }}>{o.status === 'completed' ? '完成' : '待付'}</span>
              </td>
              <td style={styles.td}>{o.createdAt?.slice(0, 16).replace('T', ' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
        <button style={{ ...styles.btnSmall, background: '#333', color: '#fff' }} disabled={orderPage === 1} onClick={() => setOrderPage(p => p - 1)}>上一页</button>
        <span style={{ color: '#666', padding: '8px' }}>第 {orderPage} / {Math.ceil((orders.total || 1) / 10)} 页</span>
        <button style={{ ...styles.btnSmall, background: '#333', color: '#fff' }} disabled={orderPage >= Math.ceil((orders.total || 1) / 10)} onClick={() => setOrderPage(p => p + 1)}>下一页</button>
      </div>
    </div>
  )

  const renderDramas = () => (
    <div>
      <div style={styles.formCard}>
        <div style={styles.sectionTitle}>📺 剧集列表</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>剧名</th>
              <th style={styles.th}>集数</th>
              <th style={styles.th}>播放量</th>
              <th style={styles.th}>单集价格</th>
              <th style={styles.th}>付费起点</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {dramas.map(d => (
              <tr key={d.id}>
                <td style={styles.td}>{d.id}</td>
                <td style={styles.td}>{d.title}</td>
                <td style={styles.td}>{d.episodes}</td>
                <td style={styles.td}>{d.views?.toLocaleString()}</td>
                <td style={styles.td}>{d.pricePerEpisode} 金币</td>
                <td style={styles.td}>第 {d.paywallAt} 集</td>
                <td style={styles.td}>
                  <button style={{ ...styles.btnSmall, background: '#1890ff', color: '#fff' }}>编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderSources = () => (
    <div>
      <div style={styles.formCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={styles.sectionTitle}>🔗 矩阵号管理</div>
          <button style={styles.button} onClick={() => setModal({ type: 'source', data: null })}>+ 添加矩阵号</button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>名称</th>
              <th style={styles.th}>编码</th>
              <th style={styles.th}>用户数</th>
              <th style={styles.th}>占比</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(s => (
              <tr key={s.id}>
                <td style={styles.td}>{s.id}</td>
                <td style={styles.td}>{s.name}</td>
                <td style={styles.td}><code style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>{s.code}</code></td>
                <td style={styles.td}>{s.users.toLocaleString()}</td>
                <td style={styles.td}>{s.rate}%</td>
                <td style={styles.td}>
                  <span style={{ ...styles.tag, background: s.status === 'active' ? '#52c41a' : '#666', color: '#fff' }}>{s.status === 'active' ? '启用' : '禁用'}</span>
                </td>
                <td style={styles.td}>
                  <button style={{ ...styles.btnSmall, background: '#1890ff', color: '#fff', marginRight: '8px' }} onClick={() => setModal({ type: 'source', data: s })}>编辑</button>
                  <button style={{ ...styles.btnSmall, background: '#ff4d4f', color: '#fff' }} onClick={() => deleteSource(s.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const deleteSource = async (id) => {
    if (!confirm('确定删除?')) return
    await fetch(`${API_BASE}/api/admin/sources/${id}`, { method: 'DELETE' })
    loadData()
  }

  const renderSettings = () => (
    <div>
      {settings && (
        <>
          <div style={styles.formCard}>
            <div style={styles.sectionTitle}>💰 价格设置</div>
            <div style={styles.formRow}>
              <label style={{ color: '#888' }}>单集解锁价格:</label>
              <input style={{ ...styles.input, width: '100px' }} defaultValue={settings.pricePerEpisode} id="pricePerEpisode" />
              <span style={{ color: '#666' }}>金币</span>
            </div>
            <div style={{ ...styles.formRow, marginTop: '12px' }}>
              <label style={{ color: '#888' }}>免费集数:</label>
              <input style={{ ...styles.input, width: '100px' }} defaultValue={settings.freeEpisodes} id="freeEpisodes" />
              <span style={{ color: '#666' }}>集</span>
            </div>
          </div>

          <div style={styles.formCard}>
            <div style={styles.sectionTitle}>🎨 Banner 管理</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {settings.banners?.map(b => (
                <div key={b.id} style={{ background: '#1a1a2e', padding: '12px', borderRadius: '8px' }}>
                  <img src={b.image} alt={b.title} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ marginTop: '8px', color: '#fff', fontSize: '14px' }}>{b.title}</div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ ...styles.tag, background: b.active ? '#52c41a' : '#666', color: '#fff' }}>{b.active ? '启用' : '禁用'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.formCard}>
            <div style={styles.sectionTitle}>💎 金币套餐</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {settings.pricePackages?.map(p => (
                <div key={p.id} style={{ background: '#1a1a2e', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ color: '#888', fontSize: '14px' }}>{p.coins} 金币</div>
                  <div style={{ color: '#ff6b35', fontSize: '24px', fontWeight: 'bold', margin: '8px 0' }}>${p.price}</div>
                  {p.bonus > 0 && <div style={{ color: '#52c41a', fontSize: '12px' }}>送 {p.bonus} 金币</div>}
                </div>
              ))}
            </div>
          </div>

          <button style={styles.button} onClick={saveSettings}>保存设置</button>
        </>
      )}
    </div>
  )

  const saveSettings = async () => {
    const pricePerEpisode = document.getElementById('pricePerEpisode')?.value
    const freeEpisodes = document.getElementById('freeEpisodes')?.value
    await fetch(`${API_BASE}/api/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, pricePerEpisode: parseInt(pricePerEpisode), freeEpisodes: parseInt(freeEpisodes) })
    })
    alert('设置已保存!')
  }

  const handleModalSubmit = async () => {
    if (modal.type === 'source') {
      const name = document.getElementById('sourceName')?.value
      const code = document.getElementById('sourceCode')?.value
      if (modal.data?.id) {
        await fetch(`${API_BASE}/api/admin/sources/${modal.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, code })
        })
      } else {
        await fetch(`${API_BASE}/api/admin/sources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, code })
        })
      }
    }
    setModal({ type: '', data: null })
    loadData()
  }

  const renderModal = () => {
    if (!modal.type) return null
    return (
      <div style={styles.modal} onClick={() => setModal({ type: '', data: null })}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div style={styles.modalTitle}>{modal.type === 'source' ? (modal.data ? '编辑矩阵号' : '添加矩阵号') : '用户详情'}</div>
          
          {modal.type === 'source' && (
            <>
              <input style={{ ...styles.input, marginBottom: '12px' }} placeholder="名称" defaultValue={modal.data?.name} id="sourceName" />
              <input style={{ ...styles.input, marginBottom: '12px' }} placeholder="编码" defaultValue={modal.data?.code} id="sourceCode" />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={styles.button} onClick={handleModalSubmit}>保存</button>
                <button style={{ ...styles.button, background: '#333' }} onClick={() => setModal({ type: '', data: null })}>取消</button>
              </div>
            </>
          )}
          
          {modal.type === 'user' && modal.data && (
            <div>
              <div style={{ marginBottom: '12px', color: '#ccc' }}>ID: {modal.data.id}</div>
              <div style={{ marginBottom: '12px', color: '#ccc' }}>金币: {modal.data.coins}</div>
              <div style={{ marginBottom: '12px', color: '#ccc' }}>累计消费: ${modal.data.totalSpent || 0}</div>
              <div style={{ marginBottom: '12px', color: '#ccc' }}>邀请人数: {modal.data.inviteCount || 0}</div>
              <div style={{ marginBottom: '12px', color: '#ccc' }}>注册时间: {modal.data.createdAt?.slice(0, 10)}</div>
              <div style={{ marginBottom: '12px', color: '#ccc' }}>最后活跃: {modal.data.lastActive?.slice(0, 10)}</div>
              <button style={{ ...styles.button, background: '#333' }} onClick={() => setModal({ type: '', data: null })}>关闭</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>The Red</div>
        <div style={styles.logoSub}>管理后台</div>
        <div style={styles.nav}>
          {navItems.map(item => (
            <div key={item.id} style={activeTab === item.id ? styles.navItemActive : styles.navItem} onClick={() => setActiveTab(item.id)}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.header}>
          <h2 style={styles.pageTitle}>{navItems.find(n => n.id === activeTab)?.label}</h2>
          <div style={styles.headerRight}>
            <button style={styles.refreshBtn} onClick={loadData} disabled={loading}>
              {loading ? '加载中...' : '🔄 刷新数据'}
            </button>
          </div>
        </div>
        
        {loading && <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>加载中...</div>}
        {!loading && activeTab === 'dashboard' && renderDashboard()}
        {!loading && activeTab === 'users' && renderUsers()}
        {!loading && activeTab === 'orders' && renderOrders()}
        {!loading && activeTab === 'dramas' && renderDramas()}
        {!loading && activeTab === 'sources' && renderSources()}
        {!loading && activeTab === 'settings' && renderSettings()}
      </div>
      
      {renderModal()}
    </div>
  )
}

export default App
