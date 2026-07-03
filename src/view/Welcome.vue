<template>
  <div class="welcome-container">
    <!-- 问候横幅 -->
    <div class="greeting-banner" :class="greetingClass">
      <div class="greeting-content">
        <div class="greeting-icon">{{ greetingIcon }}</div>
        <div class="greeting-text">
          <h2 class="greeting-title">{{ greetingTitle }}</h2>
          <p class="greeting-subtitle">{{ greetingSubtitle }}</p>
          <div class="current-time">{{ currentTime }}</div>
        </div>
      </div>
    </div>

    <!-- 数据统计概览 -->
    <el-row :gutter="20" class="stats-row">
      <el-col v-for="(stat, index) in statsData" :key="index" :span="6">
        <el-card class="stat-card" shadow="hover" @click="handleStatClick(stat)">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷导航区 -->
    <el-card class="quick-nav-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Grid /></el-icon>
          <span>快捷导航</span>
        </div>
      </template>
      <div class="quick-nav-grid">
        <div v-for="(nav, index) in quickNavList" :key="index" class="nav-item" @click="navigateTo(nav)">
          <div class="nav-icon" :style="{ background: nav.color }">
            <el-icon><component :is="nav.icon" /></el-icon>
          </div>
          <div class="nav-text">{{ nav.name }}</div>
        </div>
      </div>
    </el-card>
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
      // 统计数据
      statsData: [
        {
          label: '用户总数',
          value: 0,
          icon: 'User',
          color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          path: '/user/organization'
        },
        {
          label: '角色数量',
          value: 0,
          icon: 'Avatar',
          color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          path: '/role/rolesmenu'
        },
        {
          label: '应用配置',
          value: 0,
          icon: 'Setting',
          color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          path: '/DynamicApp/DynamicApiConfig'
        },
        {
          label: '操作日志',
          value: 0,
          icon: 'Document',
          color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          path: '/log/logaction'
        }
      ],
      // 快捷导航
      quickNavList: [
        { name: '用户管理', icon: 'User', color: '#667eea', path: '/user/organization' },
        { name: '角色管理', icon: 'Avatar', color: '#f5576c', path: '/role/rolesmenu' },
        { name: '菜单管理', icon: 'Operation', color: '#4facfe', path: '/common/menus' },
        { name: '应用配置', icon: 'Setting', color: '#43e97b', path: '/DynamicApp/DynamicApiConfig' },
        { name: '操作日志', icon: 'Document', color: '#fee140', path: '/log/logaction' },
        { name: '附件管理', icon: 'DocumentCopy', color: '#a8edea', path: '/attachment/attachmentlist' }
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
</style>
