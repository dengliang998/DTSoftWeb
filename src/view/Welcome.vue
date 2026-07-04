<template>
  <div class="welcome-container">
    <section class="overview-panel" :class="greetingClass">
      <div class="overview-copy">
        <div class="greeting-icon">{{ greetingIcon }}</div>
        <div>
          <div class="overview-eyebrow">系统工作台</div>
          <h2 class="greeting-title">{{ greetingTitle }}</h2>
          <p class="greeting-subtitle">{{ greetingSubtitle }}</p>
          <div class="current-time">{{ currentTime }}</div>
        </div>
      </div>
      <div class="overview-chart">
        <div class="chart-head">
          <span>本周运行</span>
          <strong>稳定</strong>
        </div>
        <div class="chart-bars">
          <div v-for="bar in dashboardBars" :key="bar.label" class="chart-bar">
            <span :style="{ height: bar.height + '%' }"></span>
          </div>
        </div>
        <div class="chart-foot">
          <span>实时监测</span>
          <span>接口 / 用户 / 日志</span>
        </div>
      </div>
    </section>

    <section class="metric-grid">
      <button
        v-for="stat in statsData"
        :key="stat.label"
        class="stat-card"
        type="button"
        @click="handleStatClick(stat)"
      >
        <span class="stat-icon" :style="{ background: stat.color }">
          <el-icon><component :is="stat.icon" /></el-icon>
        </span>
        <span class="stat-info">
          <strong class="stat-value">{{ stat.value }}</strong>
          <span class="stat-label">{{ stat.label }}</span>
        </span>
      </button>
    </section>

    <section class="workspace-grid">
      <div class="dashboard-panel quick-panel">
        <div class="panel-header">
          <div>
            <h3>快捷入口</h3>
            <p>高频管理功能</p>
          </div>
          <el-icon><Grid /></el-icon>
        </div>
        <div class="quick-nav-grid">
          <button v-for="nav in quickNavList" :key="nav.name" class="nav-item" type="button" @click="navigateTo(nav)">
            <span class="nav-icon" :style="{ background: nav.color }">
              <el-icon><component :is="nav.icon" /></el-icon>
            </span>
            <span class="nav-text">{{ nav.name }}</span>
          </button>
        </div>
      </div>

      <div class="dashboard-panel notice-panel">
        <div class="panel-header">
          <div>
            <h3>系统提示</h3>
            <p>当前会话状态</p>
          </div>
          <span class="sync-badge">已同步</span>
        </div>
        <div class="notice-list">
          <div v-for="tip in tips.slice(0, 4)" :key="tip.text" class="notice-item">
            <span class="notice-icon">
              <el-icon><component :is="tip.icon" /></el-icon>
            </span>
            <span>{{ tip.text }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { getDynamicAppConfigs } from '@/api/dynamicApp'
import { getLogActionList } from '@/api/log'
import { getRoleList } from '@/api/role'
import { getUserList } from '@/api/user'
import {
  ChatDotRound,
  Sunny,
  Moon,
  Coffee,
  Star,
  Cloudy,
  Lightning,
  Grid,
  User,
  Avatar,
  Operation,
  Setting,
  Document,
  DocumentCopy
} from '@element-plus/icons-vue'

export default {
  name: 'Welcome',
  components: {
    ChatDotRound,
    Sunny,
    Moon,
    Coffee,
    Star,
    Cloudy,
    Lightning,
    Grid,
    User,
    Avatar,
    Operation,
    Setting,
    Document,
    DocumentCopy
  },
  data() {
    return {
      CurrentDate: new Date(),
      greetingTitle: '',
      greetingSubtitle: '',
      greetingIcon: '',
      greetingClass: '',
      tips: [],
      currentTime: '',
      dashboardBars: [
        { label: 'Mon', height: 42 },
        { label: 'Tue', height: 58 },
        { label: 'Wed', height: 36 },
        { label: 'Thu', height: 72 },
        { label: 'Fri', height: 64 },
        { label: 'Sat', height: 48 },
        { label: 'Sun', height: 78 },
        { label: 'Now', height: 68 }
      ],
      // 统计数据
      statsData: [
        {
          label: '用户总数',
          value: 0,
          icon: 'User',
          color: 'linear-gradient(135deg, #235bff 0%, #6b8cff 100%)',
          path: '/user/organization'
        },
        {
          label: '角色数量',
          value: 0,
          icon: 'Avatar',
          color: 'linear-gradient(135deg, #00a889 0%, #35d2b4 100%)',
          path: '/role/rolesmenu'
        },
        {
          label: '应用配置',
          value: 0,
          icon: 'Setting',
          color: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
          path: '/DynamicApp/DynamicApiConfig'
        },
        {
          label: '操作日志',
          value: 0,
          icon: 'Document',
          color: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          path: '/log/logaction'
        }
      ],
      // 快捷导航
      quickNavList: [
        { name: '用户管理', icon: 'User', color: '#235bff', path: '/user/organization' },
        { name: '角色管理', icon: 'Avatar', color: '#00a889', path: '/role/rolesmenu' },
        { name: '菜单管理', icon: 'Operation', color: '#7c3aed', path: '/common/menus' },
        { name: '应用配置', icon: 'Setting', color: '#0f766e', path: '/DynamicApp/DynamicApiConfig' },
        { name: '操作日志', icon: 'Document', color: '#f59e0b', path: '/log/logaction' },
        { name: '附件管理', icon: 'DocumentCopy', color: '#475467', path: '/attachment/attachmentlist' }
      ]
    }
  },
  created() {
    this.updateGreeting()
    this.updateTime()
    this.loadStatsData()
    // 每秒更新一次时间
    setInterval(() => {
      this.updateTime()
    }, 1000)
    // 每分钟更新一次问候
    setInterval(() => {
      this.updateGreeting()
    }, 60000)
    // 每 5 分钟刷新一次统计数据
    setInterval(() => {
      this.loadStatsData()
    }, 300000)
  },
  methods: {
    // 更新当前时间
    updateTime() {
      const now = new Date()
      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const weekDay = weekDays[now.getDay()]

      this.currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${weekDay}`
    },
    // 加载统计数据
    async loadStatsData() {
      try {
        // 获取用户统计
        const userRes = await getUserList({
          pageNum: 1,
          pageSize: 1
        })
        if (userRes.data.success) {
          this.statsData[0].value = userRes.data.Total || 0
        }

        // 获取角色统计
        const roleRes = await getRoleList({
          pageNum: 1,
          pageSize: 1
        })
        if (roleRes.data.success) {
          this.statsData[1].value = roleRes.data.Total || 0
        }

        // 获取应用配置统计
        const appRes = await getDynamicAppConfigs({ PageNum: 1, PageSize: 1 })
        if (appRes.data.success) {
          this.statsData[2].value = appRes.data.total || 0
        }

        // 获取操作日志统计
        const logRes = await getLogActionList({
          pageNum: 1,
          pageSize: 1
        })
        if (logRes.data.success) {
          this.statsData[3].value = logRes.data.Total || 0
        }
      } catch (error) {
        console.error('加载统计数据失败：', error)
      }
    },
    // 快捷导航
    navigateTo(nav) {
      if (nav.path) {
        this.$router.push(nav.path)
      }
    },
    // 统计数据点击
    handleStatClick(stat) {
      if (stat.path) {
        this.$router.push(stat.path)
      }
    },
    updateGreeting() {
      const hour = new Date().getHours()

      // 根据时间段设置不同的问候语和图标
      if (hour >= 5 && hour < 8) {
        // 清晨
        this.greetingTitle = '早安，新的一天开始了！'
        this.greetingSubtitle = '清晨的阳光格外温暖，愿您今天充满活力'
        this.greetingIcon = '🌅'
        this.greetingClass = 'morning'
      } else if (hour >= 8 && hour < 11) {
        // 上午
        this.greetingTitle = '上午好，精力充沛的时光！'
        this.greetingSubtitle = '美好的一天从此刻开始，工作效率最高的时候'
        this.greetingIcon = '☀️'
        this.greetingClass = 'morning'
      } else if (hour >= 11 && hour < 13) {
        // 中午
        this.greetingTitle = '中午好，该休息了！'
        this.greetingSubtitle = '忙碌了一上午，记得好好吃午饭哦'
        this.greetingIcon = '🍽️'
        this.greetingClass = 'noon'
      } else if (hour >= 13 && hour < 17) {
        // 下午
        this.greetingTitle = '下午好，继续加油！'
        this.greetingSubtitle = '喝杯咖啡提提神，保持专注和高效'
        this.greetingIcon = '☕'
        this.greetingClass = 'afternoon'
      } else if (hour >= 17 && hour < 19) {
        // 傍晚
        this.greetingTitle = '傍晚好，快下班啦！'
        this.greetingSubtitle = '夕阳西下，收拾好心情准备回家吧'
        this.greetingIcon = '🌇'
        this.greetingClass = 'evening'
      } else if (hour >= 19 && hour < 22) {
        // 晚上
        this.greetingTitle = '晚上好，辛苦了一天！'
        this.greetingSubtitle = '放松一下，享受属于自己的美好时光'
        this.greetingIcon = '🌙'
        this.greetingClass = 'night'
      } else {
        // 深夜
        this.greetingTitle = '夜深了，注意休息！'
        this.greetingSubtitle = '早点休息，明天又是新的一天'
        this.greetingIcon = '🌟'
        this.greetingClass = 'late-night'
      }

      // 设置温馨提示
      this.updateTips(hour)
    },
    updateTips(hour) {
      const allTips = {
        morning: [
          { icon: 'Sunny', text: '记得吃早餐，开启元气满满的一天' },
          { icon: 'ChatDotRound', text: '今天也要保持微笑，好运自然来' },
          { icon: 'Cloudy', text: '清晨空气清新，适合深呼吸放松' },
          { icon: 'Star', text: '制定今日计划，让工作更有条理' }
        ],
        noon: [
          { icon: 'Coffee', text: '午餐后适当休息，下午更有精神' },
          { icon: 'ChatDotRound', text: '中午别忘了喝水，保持身体水分' },
          { icon: 'Sunny', text: '午间散步10分钟，帮助消化提神' },
          { icon: 'Star', text: '和同事聊聊天，放松一下心情' }
        ],
        afternoon: [
          { icon: 'Coffee', text: '下午容易犯困，可以适当活动一下' },
          { icon: 'ChatDotRound', text: '处理重要工作，把握黄金时间段' },
          { icon: 'Lightning', text: '保持专注，提高效率是王道' },
          { icon: 'Star', text: '记得站起来走动走动，舒展筋骨' }
        ],
        evening: [
          { icon: 'Moon', text: '工作再忙也要按时吃饭哦' },
          { icon: 'ChatDotRound', text: '下班路上注意安全，放松心情' },
          { icon: 'Cloudy', text: '今晚可以安排运动，保持身体健康' },
          { icon: 'Star', text: '回顾今天的工作，为明天做准备' }
        ],
        night: [
          { icon: 'Moon', text: '适当放松，缓解一天的疲劳' },
          { icon: 'ChatDotRound', text: '陪伴家人朋友，享受温馨时光' },
          { icon: 'Cloudy', text: '睡前远离电子屏幕，有助于睡眠' },
          { icon: 'Star', text: '泡个热水澡，让身心彻底放松' }
        ],
        'late-night': [
          { icon: 'Moon', text: '夜深了，该让眼睛和身体休息了' },
          { icon: 'ChatDotRound', text: '熬夜伤身，明天还要继续加油' },
          { icon: 'Cloudy', text: '放下手机，准备进入甜美的梦乡' },
          { icon: 'Star', text: '充足的睡眠是最好的补品' }
        ]
      }

      // 根据时间段选择提示
      if (hour >= 5 && hour < 11) {
        this.tips = allTips.morning
      } else if (hour >= 11 && hour < 13) {
        this.tips = allTips.noon
      } else if (hour >= 13 && hour < 17) {
        this.tips = allTips.afternoon
      } else if (hour >= 17 && hour < 19) {
        this.tips = allTips.evening
      } else if (hour >= 19 && hour < 22) {
        this.tips = allTips.night
      } else {
        this.tips = allTips['late-night']
      }
    }
  }
}
</script>

<style scoped>
.welcome-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  min-height: 100%;
}

/* 问候横幅 */
.greeting-banner {
  border-radius: 16px;
  padding: 30px 40px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.3s ease;
}

.greeting-banner:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.greeting-banner.morning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.greeting-banner.noon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.greeting-banner.afternoon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.greeting-banner.evening {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.greeting-banner.night {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.greeting-banner.late-night {
  background: linear-gradient(135deg, #0c3483 0%, #a2b6df 100%);
}

.greeting-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.greeting-icon {
  font-size: 64px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.greeting-text {
  flex: 1;
}

.greeting-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.greeting-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.6;
}

.current-time {
  margin-top: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

/* 数据统计卡片 */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 28px;
  flex-shrink: 0;
}

.stat-icon .el-icon {
  font-size: 28px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

/* 快捷导航 */
.quick-nav-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  padding: 10px 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.nav-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.nav-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  text-align: center;
}

/* 操作记录卡片 */
.log-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.view-all-btn {
  margin-left: auto;
  color: #409eff;
  font-size: 14px;
}

.log-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-log {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-log .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.log-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 8px;
  transition: all 0.3s ease;
  border-left: 3px solid #409eff;
}

.log-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.log-time {
  font-size: 13px;
  color: #909399;
  min-width: 80px;
  flex-shrink: 0;
}

.log-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.log-user,
.log-ip {
  font-size: 13px;
  color: #606266;
}
/* 卡片样式 */
.tips-card,
.calendar-card {
  margin-bottom: 24px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.tips-card:hover,
.calendar-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-header .el-icon {
  font-size: 20px;
  color: #409eff;
}

/* 温馨提示内容 */
.tips-content {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 8px;
  border-left: 4px solid #409eff;
  transition: all 0.3s ease;
}

.tip-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  border-left-color: #66b1ff;
}

.tip-icon {
  font-size: 24px;
  color: #409eff;
  flex-shrink: 0;
}

.tip-text {
  font-size: 15px;
  color: #606266;
  line-height: 1.6;
}

/* 日历样式优化 */
:deep(.el-calendar) {
  border: none;
}

:deep(.el-calendar__header) {
  padding: 12px 20px;
  border-bottom: 2px solid #ebeef5;
}

:deep(.el-calendar__title) {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-calendar__body) {
  padding: 12px 20px 20px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .stats-row .el-col {
    span: 12;
  }
}

@media (max-width: 768px) {
  .welcome-container {
    padding: 12px;
  }

  .greeting-banner {
    padding: 20px;
  }

  .greeting-icon {
    font-size: 48px;
  }

  .greeting-title {
    font-size: 22px;
  }

  .greeting-subtitle {
    font-size: 14px;
  }

  .current-time {
    font-size: 12px;
  }

  .stats-row .el-col {
    span: 24;
    margin-bottom: 12px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .quick-nav-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }

  .nav-item {
    padding: 16px 8px;
  }

  .nav-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
}

/* Modern dashboard refresh */
.welcome-container {
  min-height: 100%;
  padding: 0;
  background: transparent;
}

.greeting-banner {
  position: relative;
  min-height: 176px;
  padding: 30px 34px;
  margin-bottom: 18px;
  overflow: hidden;
  color: #ffffff;
  background:
    linear-gradient(120deg, rgba(15, 23, 42, 0.94) 0%, rgba(24, 36, 64, 0.94) 52%, rgba(0, 95, 87, 0.88) 100%),
    linear-gradient(135deg, #101828 0%, #235bff 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  box-shadow: 0 18px 42px rgba(16, 24, 40, 0.18);
}

.greeting-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.18;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.32) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255, 255, 255, 0.32) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(90deg, #000 0%, transparent 78%);
}

.greeting-banner::after {
  content: '';
  position: absolute;
  right: 30px;
  bottom: 24px;
  width: 170px;
  height: 170px;
  border: 1px solid rgba(125, 211, 199, 0.36);
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 22px rgba(125, 211, 199, 0.07),
    inset 0 0 0 52px rgba(35, 91, 255, 0.08);
}

.greeting-banner:hover {
  box-shadow: 0 18px 42px rgba(16, 24, 40, 0.18);
  transform: none;
}

.greeting-banner.morning,
.greeting-banner.noon,
.greeting-banner.afternoon,
.greeting-banner.evening,
.greeting-banner.night,
.greeting-banner.late-night {
  background:
    linear-gradient(120deg, rgba(15, 23, 42, 0.94) 0%, rgba(24, 36, 64, 0.94) 52%, rgba(0, 95, 87, 0.88) 100%),
    linear-gradient(135deg, #101828 0%, #235bff 100%);
}

.greeting-content {
  position: relative;
  z-index: 1;
}

.greeting-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74px;
  height: 74px;
  font-size: 38px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  animation: none;
  backdrop-filter: blur(14px);
}

.greeting-title {
  margin-bottom: 8px;
  color: #ffffff;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0;
  text-shadow: none;
}

.greeting-subtitle {
  max-width: 560px;
  color: rgba(226, 232, 240, 0.9);
  font-size: 15px;
}

.current-time {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  margin-top: 14px;
  color: #dff8f1;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  background: rgba(0, 168, 137, 0.16);
  border: 1px solid rgba(125, 211, 199, 0.28);
  border-radius: 999px;
}

.stats-row {
  margin-bottom: 18px;
}

.stat-card {
  border-radius: 8px;
}

.stat-card:hover {
  box-shadow: 0 14px 34px rgba(18, 38, 63, 0.1);
  transform: none;
}

.stat-content {
  gap: 14px;
  min-height: 76px;
  padding: 0;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  box-shadow: 0 12px 20px rgba(18, 38, 63, 0.12);
}

.stat-value {
  color: #182230;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0;
}

.stat-label {
  color: #667085;
  font-size: 13px;
  font-weight: 650;
}

.quick-nav-card {
  border-radius: 8px;
}

.quick-nav-grid {
  grid-template-columns: repeat(auto-fill, minmax(138px, 1fr));
  gap: 12px;
  padding: 0;
}

.nav-item {
  min-height: 118px;
  padding: 18px 12px;
  background: #f8fafc;
  border: 1px solid #dde5ef;
  border-radius: 8px;
}

.nav-item:hover {
  background: #ffffff;
  border-color: #9bb8ff;
  box-shadow: 0 10px 24px rgba(35, 91, 255, 0.12);
  transform: none;
}

.nav-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  box-shadow: 0 10px 18px rgba(18, 38, 63, 0.12);
}

.nav-item:hover .nav-icon {
  transform: none;
}

.nav-text {
  color: #344054;
  font-size: 14px;
  font-weight: 700;
}

.card-header {
  color: #182230;
  font-size: 15px;
  font-weight: 800;
}

.card-header .el-icon {
  color: #235bff;
}

.tip-item,
.log-item {
  background: #f8fafc;
  border-left-color: #235bff;
}

@media (max-width: 1100px) {
  .stats-row :deep(.el-col) {
    max-width: 50%;
    flex: 0 0 50%;
    margin-bottom: 12px;
  }
}

@media (max-width: 768px) {
  .greeting-banner {
    padding: 22px;
  }

  .greeting-content {
    align-items: flex-start;
    gap: 16px;
  }

  .greeting-icon {
    width: 58px;
    height: 58px;
    font-size: 30px;
  }

  .stats-row :deep(.el-col) {
    max-width: 100%;
    flex: 0 0 100%;
  }
}

/* Dashboard implementation from ui.pen */
.welcome-container {
  min-height: 100%;
  padding: 0;
  background: transparent;
}

.overview-panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 28px;
  min-height: 176px;
  padding: 28px 30px;
  overflow: hidden;
  color: #ffffff;
  background:
    linear-gradient(120deg, rgba(15, 23, 42, 0.95) 0%, rgba(24, 36, 64, 0.95) 56%, rgba(0, 95, 87, 0.9) 100%),
    linear-gradient(135deg, #101828 0%, #235bff 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  box-shadow: 0 16px 36px rgba(16, 24, 40, 0.18);
}

.overview-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.16;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.28) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255, 255, 255, 0.28) 1px, transparent 1px);
  background-size: 34px 34px;
  pointer-events: none;
}

.overview-copy,
.overview-chart {
  position: relative;
  z-index: 1;
}

.overview-copy {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

.overview-eyebrow {
  margin-bottom: 6px;
  color: #7dd3c7;
  font-size: 12px;
  font-weight: 800;
}

.greeting-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  font-size: 30px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  animation: none;
  backdrop-filter: blur(14px);
}

.greeting-title {
  margin: 0 0 8px;
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.25;
  text-shadow: none;
}

.greeting-subtitle {
  max-width: 560px;
  margin: 0;
  color: rgba(226, 232, 240, 0.88);
  font-size: 14px;
  line-height: 1.7;
}

.current-time {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  margin-top: 12px;
  color: #dff8f1;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  background: rgba(0, 168, 137, 0.16);
  border: 1px solid rgba(125, 211, 199, 0.28);
  border-radius: 999px;
}

.overview-chart {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
}

.chart-head,
.chart-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(226, 232, 240, 0.8);
  font-size: 12px;
  font-weight: 700;
}

.chart-head strong {
  color: #7dd3c7;
  font-size: 12px;
}

.chart-bars {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  align-items: end;
  gap: 8px;
  height: 74px;
  margin: 14px 0 12px;
}

.chart-bar {
  display: flex;
  align-items: end;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.chart-bar span {
  display: block;
  width: 100%;
  min-height: 18%;
  background: linear-gradient(180deg, #7dd3c7 0%, #4f8bff 100%);
  border-radius: 999px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.stat-card,
.nav-item {
  appearance: none;
  border: 0;
  font-family: inherit;
  line-height: 1;
  text-align: left;
  cursor: pointer;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 74px;
  padding: 13px 15px;
  background: #ffffff;
  border: 1px solid #dde5ef;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(18, 38, 63, 0.06);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.stat-card:hover,
.nav-item:hover {
  border-color: #9bb8ff;
  box-shadow: 0 12px 26px rgba(35, 91, 255, 0.12);
  transform: translateY(-1px);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #ffffff;
  font-size: 22px;
  border-radius: 12px;
  box-shadow: 0 10px 18px rgba(18, 38, 63, 0.12);
  flex: 0 0 auto;
}

.stat-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  color: #182230;
  font-size: 22px;
  font-weight: 850;
  line-height: 1.1;
}

.stat-label {
  margin-top: 4px;
  color: #667085;
  font-size: 12px;
  font-weight: 700;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 10px;
  margin-top: 10px;
}

.dashboard-panel {
  min-height: 238px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #dde5ef;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(18, 38, 63, 0.06);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-header h3 {
  margin: 0;
  color: #182230;
  font-size: 15px;
  font-weight: 850;
  line-height: 1.2;
}

.panel-header p {
  margin: 5px 0 0;
  color: #667085;
  font-size: 12px;
  font-weight: 650;
}

.panel-header > .el-icon {
  color: #235bff;
  font-size: 20px;
}

.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 78px;
  padding: 12px 8px;
  background: #f8fafc;
  border: 1px solid #dde5ef;
  border-radius: 8px;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin: 0 0 8px;
  color: #ffffff;
  font-size: 18px;
  border-radius: 10px;
  box-shadow: 0 8px 14px rgba(18, 38, 63, 0.12);
}

.nav-item:hover .nav-icon {
  transform: none;
}

.nav-text {
  color: #344054;
  font-size: 13px;
  font-weight: 750;
  text-align: center;
}

.sync-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  color: #00a889;
  font-size: 12px;
  font-weight: 800;
  background: #e8f8f4;
  border-radius: 999px;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notice-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 9px 10px;
  color: #344054;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.4;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 8px;
}

.notice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: #235bff;
  background: #edf4ff;
  border-radius: 8px;
  flex: 0 0 auto;
}

@media (max-width: 1180px) {
  .overview-panel,
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .overview-chart {
    min-height: 140px;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .overview-panel {
    padding: 20px;
  }

  .overview-copy {
    align-items: flex-start;
    gap: 14px;
  }

  .greeting-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .metric-grid,
  .quick-nav-grid {
    grid-template-columns: 1fr;
  }
}
</style>
