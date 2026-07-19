<template>
  <div class="welcome-container">
    <section class="welcome-workbench">
      <section class="hero-section">
        <div class="hero-copy">
          <span class="page-kicker">系统工作台</span>
          <h2>{{ greetingTitle }}</h2>
          <p>{{ greetingSubtitle }}</p>
          <div class="hero-meta">
            <span class="time-chip">
              <el-icon><Clock /></el-icon>
              {{ currentTime }}
            </span>
            <span class="status-chip" :class="{ 'is-error': dashboardError }">
              <el-icon><component :is="dashboardError ? 'Warning' : 'CircleCheck'" /></el-icon>
              {{ dashboardError ? '数据获取异常' : '后台数据已同步' }}
            </span>
          </div>
        </div>

        <div class="runtime-summary">
          <div v-for="item in runtimeCards" :key="item.label" class="runtime-card">
            <span class="runtime-icon" :class="item.tone">
              <el-icon><component :is="item.icon" /></el-icon>
            </span>
            <span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.label }}</small>
            </span>
          </div>
        </div>
      </section>

      <section class="dashboard-grid">
        <div class="dashboard-panel log-trend-panel">
          <div class="panel-header">
            <div>
              <h3>近7日操作日志</h3>
              <p>按后端日志接口日期条件统计 Total</p>
            </div>
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="line-chart" :class="{ 'is-ready': chartReady }" aria-label="近7日操作日志折线图">
            <svg viewBox="0 0 420 150" preserveAspectRatio="none" role="img">
              <defs>
                <linearGradient id="logTrendArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#1890ff" stop-opacity="0.24" />
                  <stop offset="100%" stop-color="#1890ff" stop-opacity="0" />
                </linearGradient>
              </defs>
              <g class="chart-grid-lines">
                <line x1="0" y1="28" x2="420" y2="28" />
                <line x1="0" y1="78" x2="420" y2="78" />
                <line x1="0" y1="128" x2="420" y2="128" />
              </g>
              <polygon class="trend-area" :points="trendAreaPoints" fill="url(#logTrendArea)" />
              <polyline class="trend-line" :points="trendPolyline" />
              <circle
                v-for="point in trendDotPoints"
                :key="point.key"
                class="trend-dot"
                :cx="point.x"
                :cy="point.y"
                r="4"
              />
            </svg>
            <div class="chart-labels">
              <span v-for="item in logTrendData" :key="item.date">
                <strong>{{ item.total }}</strong>
                <small>{{ item.label }}</small>
              </span>
            </div>
          </div>
        </div>

        <div class="dashboard-panel resource-panel">
          <div class="panel-header">
            <div>
              <h3>内存资源</h3>
              <p>来自系统运行信息接口</p>
            </div>
            <el-icon><Histogram /></el-icon>
          </div>
          <div class="bar-chart" :class="{ 'is-ready': chartReady }" aria-label="内存资源柱状图">
            <div
              v-for="item in memoryBars"
              :key="item.label"
              class="bar-column"
              :style="{ '--bar-height': (chartReady ? item.percent : 0) + '%' }"
            >
              <span class="bar-value">{{ item.value }}</span>
              <span class="bar-track">
                <span class="bar-fill"></span>
              </span>
              <small>{{ item.label }}</small>
            </div>
          </div>
        </div>

        <div class="dashboard-panel info-panel">
          <div class="panel-header">
            <div>
              <h3>系统信息</h3>
              <p>当前服务端运行环境</p>
            </div>
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="info-list">
            <div v-for="item in systemInfoRows" :key="item.label" class="info-item">
              <span>{{ item.label }}</span>
              <strong :title="item.value">{{ item.value }}</strong>
            </div>
          </div>
        </div>

        <div class="dashboard-panel recent-panel">
          <div class="panel-header">
            <div>
              <h3>最近操作</h3>
              <p>来自操作日志最新分页</p>
            </div>
            <el-icon><Document /></el-icon>
          </div>
          <div v-if="recentLogs.length" class="recent-list">
            <div
              v-for="log in recentLogs"
              :key="`${log.LogDate}-${log.ActionName}-${log.ClientIP}`"
              class="recent-item"
            >
              <div>
                <strong :title="log.ActionName">{{ log.ActionName || '-' }}</strong>
                <small>{{ log.UserAcc || '-' }} / {{ log.ClientIP || '-' }}</small>
              </div>
              <span>{{ formatLogTime(log.LogDate) }}</span>
            </div>
          </div>
          <el-empty v-else :image-size="72" description="暂无操作日志" />
        </div>
      </section>

      <el-alert v-if="dashboardError" class="dashboard-alert" type="warning" :closable="false" show-icon>
        <template #title>{{ dashboardError }}</template>
      </el-alert>
    </section>
  </div>
</template>

<script>
import { getLogActionList } from '@/api/log'
import { getSystemRuntimeInfo } from '@/api/sysconfig'
import {
  CircleCheck,
  Clock,
  Cpu,
  DataLine,
  Document,
  Histogram,
  Monitor,
  Tickets,
  Warning
} from '@element-plus/icons-vue'

export default {
  name: 'Welcome',
  components: {
    CircleCheck,
    Clock,
    Cpu,
    DataLine,
    Document,
    Histogram,
    Monitor,
    Tickets,
    Warning
  },
  data() {
    return {
      greetingTitle: '',
      greetingSubtitle: '',
      currentTime: '',
      loading: false,
      chartReady: false,
      dashboardError: '',
      timers: [],
      chartTimer: null,
      runtimeInfo: {},
      recentLogs: [],
      logTrendData: this.buildInitialTrendData()
    }
  },
  computed: {
    runtimeCards() {
      const server = this.runtimeInfo.Server || {}
      const memory = this.runtimeInfo.Memory || {}
      const runtime = this.runtimeInfo.Runtime || {}

      return [
        {
          label: '运行时长',
          value: this.formatDuration(server.UptimeSeconds),
          icon: 'Clock',
          tone: 'is-blue'
        },
        {
          label: '工作集内存',
          value: this.formatBytes(memory.WorkingSetBytes),
          icon: 'Cpu',
          tone: 'is-green'
        },
        {
          label: '处理器',
          value: this.formatValue(server.ProcessorCount),
          icon: 'Monitor',
          tone: 'is-amber'
        },
        {
          label: '运行架构',
          value: this.formatValue(runtime.ProcessArchitecture),
          icon: 'Tickets',
          tone: 'is-slate'
        }
      ]
    },
    memoryBars() {
      const memory = this.runtimeInfo.Memory || {}
      const rows = [
        { label: '工作集', bytes: Number(memory.WorkingSetBytes) },
        { label: '私有内存', bytes: Number(memory.PrivateMemoryBytes) },
        { label: 'GC 托管', bytes: Number(memory.GCTotalMemoryBytes) }
      ]
      const max = Math.max(...rows.map((item) => (Number.isFinite(item.bytes) ? item.bytes : 0)), 1)

      return rows.map((item) => {
        const bytes = Number.isFinite(item.bytes) ? item.bytes : 0
        return {
          label: item.label,
          value: this.formatBytes(bytes),
          percent: Math.max(8, Math.round((bytes / max) * 100))
        }
      })
    },
    systemInfoRows() {
      const application = this.runtimeInfo.Application || {}
      const runtime = this.runtimeInfo.Runtime || {}
      const server = this.runtimeInfo.Server || {}
      const database = this.runtimeInfo.Database || {}

      return [
        { label: '应用名称', value: this.formatValue(application.Name) },
        { label: '应用版本', value: this.formatValue(application.Version) },
        { label: '运行环境', value: this.formatValue(application.EnvironmentName) },
        { label: '主机名', value: this.formatValue(server.MachineName) },
        { label: '当前时间', value: this.formatValue(server.CurrentTime) },
        { label: '启动时间', value: this.formatValue(server.StartedAt) },
        { label: '框架', value: this.formatValue(runtime.FrameworkDescription) },
        { label: '操作系统', value: this.formatValue(runtime.OSDescription) },
        { label: '数据库驱动', value: this.formatValue(database.ProviderName) },
        { label: '数据库', value: this.formatValue(database.Database) }
      ]
    },
    trendDotPoints() {
      const values = this.logTrendData.map((item) => Number(item.total) || 0)
      return this.toSvgPoints(values).map((point, index) => ({
        key: `${this.logTrendData[index].date}-${index}`,
        x: point.x,
        y: point.y
      }))
    },
    trendPolyline() {
      return this.trendDotPoints.map((point) => `${point.x},${point.y}`).join(' ')
    },
    trendAreaPoints() {
      return `0,150 ${this.trendPolyline} 420,150`
    }
  },
  created() {
    this.updateGreeting()
    this.updateTime()
    this.loadDashboardData()
    this.timers = [
      setInterval(this.updateTime, 1000),
      setInterval(this.updateGreeting, 60000),
      setInterval(this.loadDashboardData, 300000)
    ]
  },
  beforeUnmount() {
    this.timers.forEach((timer) => clearInterval(timer))
    if (this.chartTimer) {
      clearTimeout(this.chartTimer)
    }
  },
  methods: {
    async loadDashboardData() {
      this.loading = true
      this.chartReady = false
      this.dashboardError = ''
      if (this.chartTimer) {
        clearTimeout(this.chartTimer)
      }

      try {
        const [runtimeRes, logRes, trendData] = await Promise.all([
          getSystemRuntimeInfo(),
          getLogActionList({ PageNum: 1, PageSize: 6 }),
          this.loadLogTrendData()
        ])

        if (runtimeRes.data?.success) {
          this.runtimeInfo = runtimeRes.data.data || {}
        }

        this.recentLogs = Array.isArray(logRes.data?.data) ? logRes.data.data : []
        this.logTrendData = trendData
        this.chartTimer = setTimeout(() => {
          this.chartReady = true
          this.chartTimer = null
        }, 180)
      } catch (error) {
        this.dashboardError = '首页数据获取失败：' + (error?.message || error)
        this.chartReady = true
      } finally {
        this.loading = false
      }
    },
    async loadLogTrendData() {
      const days = this.getRecentDays(7)
      const responses = await Promise.all(
        days.map((day) =>
          getLogActionList({
            PageNum: 1,
            PageSize: 1,
            LogDateStart: day.date,
            LogDateEnd: day.date
          })
        )
      )

      return days.map((day, index) => ({
        ...day,
        total: Number(responses[index].data?.Total) || 0
      }))
    },
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
    updateGreeting() {
      const hour = new Date().getHours()

      if (hour >= 5 && hour < 11) {
        this.greetingTitle = '上午好，查看后台实时数据'
        this.greetingSubtitle = '首页数据来自系统运行、用户、角色、微应用和操作日志接口。'
      } else if (hour >= 11 && hour < 14) {
        this.greetingTitle = '中午好，关注接口与日志'
        this.greetingSubtitle = '近7日日志趋势和最近操作记录会按后端数据刷新。'
      } else if (hour >= 14 && hour < 18) {
        this.greetingTitle = '下午好，业务数据已汇总'
        this.greetingSubtitle = '统计卡片、系统信息和图表都基于后台接口返回结果。'
      } else if (hour >= 18 && hour < 22) {
        this.greetingTitle = '晚上好，检查系统收尾状态'
        this.greetingSubtitle = '建议关注最近操作、内存资源和系统启动时间。'
      } else {
        this.greetingTitle = '夜间巡检，查看系统运行信息'
        this.greetingSubtitle = '低峰时段可重点观察日志趋势、在线用户和运行时长。'
      }
    },
    buildInitialTrendData() {
      return this.getRecentDays(7).map((day) => ({
        ...day,
        total: 0
      }))
    },
    getRecentDays(count) {
      const days = []
      const now = new Date()
      for (let index = count - 1; index >= 0; index -= 1) {
        const day = new Date(now)
        day.setDate(now.getDate() - index)
        days.push({
          date: this.formatDate(day),
          label: `${day.getMonth() + 1}/${day.getDate()}`
        })
      }
      return days
    },
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    formatValue(value) {
      if (value === null || value === undefined || value === '') return '-'
      return String(value)
    },
    formatBytes(value) {
      const bytes = Number(value)
      if (!Number.isFinite(bytes) || bytes < 0) return '-'

      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let current = bytes
      let unitIndex = 0
      while (current >= 1024 && unitIndex < units.length - 1) {
        current = current / 1024
        unitIndex += 1
      }

      const precision = unitIndex === 0 ? 0 : 2
      return `${current.toFixed(precision)} ${units[unitIndex]}`
    },
    formatDuration(value) {
      const totalSeconds = Number(value)
      if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '-'

      const days = Math.floor(totalSeconds / 86400)
      const hours = Math.floor((totalSeconds % 86400) / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)

      if (days > 0) return `${days} 天 ${hours} 小时`
      if (hours > 0) return `${hours} 小时 ${minutes} 分钟`
      return `${minutes} 分钟`
    },
    formatLogTime(value) {
      if (!value) return '-'
      const text = String(value)
      return text.length > 16 ? text.slice(5, 16) : text
    },
    toSvgPoints(values) {
      const width = 420
      const minY = 18
      const maxY = 128
      const max = Math.max(...values)
      const min = Math.min(...values)
      const range = max - min || 1

      return values.map((value, index) => {
        const x = values.length === 1 ? width : (index / (values.length - 1)) * width
        const y = maxY - ((value - min) / range) * (maxY - minY)

        return {
          x: Number(x.toFixed(2)),
          y: Number(y.toFixed(2))
        }
      })
    }
  }
}
</script>

<style scoped>
.welcome-container {
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  color: #182230;
  background:
    radial-gradient(circle at 0 0, rgba(24, 144, 255, 0.1), transparent 28%),
    linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%);
}

.welcome-workbench {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-height: 0;
  padding: 6px;
  overflow: auto;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 430px;
  gap: 12px;
  min-height: 214px;
  padding: 20px;
  overflow: hidden;
  color: #ffffff;
  background:
    linear-gradient(120deg, rgba(15, 23, 42, 0.96) 0%, rgba(24, 39, 70, 0.96) 58%, rgba(0, 96, 90, 0.92) 100%),
    linear-gradient(135deg, #101828 0%, #1890ff 100%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  box-shadow: 0 18px 42px rgba(16, 24, 40, 0.16);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.page-kicker {
  margin-bottom: 10px;
  color: #7dd3c7;
  font-size: 12px;
  font-weight: 800;
}

.hero-copy h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: 0;
}

.hero-copy p {
  max-width: 660px;
  margin: 12px 0 0;
  color: rgba(226, 232, 240, 0.88);
  font-size: 14px;
  line-height: 1.8;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.time-chip,
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 750;
}

.time-chip {
  color: #dff8f1;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  background: rgba(0, 168, 137, 0.16);
  border: 1px solid rgba(125, 211, 199, 0.28);
}

.status-chip {
  color: #effdf8;
  background: rgba(34, 197, 94, 0.16);
  border: 1px solid rgba(134, 239, 172, 0.28);
}

.status-chip.is-error {
  color: #fff7ed;
  background: rgba(217, 119, 6, 0.2);
  border-color: rgba(251, 191, 36, 0.36);
}

.runtime-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.runtime-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 84px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
}

.runtime-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #ffffff;
  border-radius: 8px;
  flex: 0 0 auto;
}

.runtime-card strong {
  display: block;
  color: #ffffff;
  font-size: 18px;
  line-height: 1.1;
}

.runtime-card small {
  display: block;
  margin-top: 6px;
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
}

.is-blue {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
}

.is-green {
  background: linear-gradient(135deg, #0f766e, #2dd4bf);
}

.is-amber {
  background: linear-gradient(135deg, #d97706, #fbbf24);
}

.is-slate {
  background: linear-gradient(135deg, #475467, #98a2b3);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(310px, 0.9fr);
  gap: 6px;
  min-height: 0;
}

.dashboard-panel {
  min-width: 0;
  padding: 14px;
  background: #ffffff;
  border: 1px solid #dbe5ef;
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(18, 38, 63, 0.06);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-header h3 {
  margin: 0;
  color: #182230;
  font-size: 15px;
  font-weight: 850;
  line-height: 1.2;
}

.panel-header p {
  margin: 6px 0 0;
  color: #667085;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.4;
}

.panel-header > .el-icon {
  color: #1890ff;
  font-size: 21px;
}

.log-trend-panel,
.resource-panel {
  min-height: 286px;
}

.line-chart svg {
  display: block;
  width: 100%;
  height: 156px;
  overflow: visible;
}

.chart-grid-lines line {
  stroke: #e5edf6;
  stroke-width: 1;
}

.trend-area {
  opacity: 0;
  transition: opacity 0.4s ease 0.18s;
}

.trend-line {
  fill: none;
  stroke: #1890ff;
  stroke-dasharray: 760;
  stroke-dashoffset: 760;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
  filter: drop-shadow(0 6px 10px rgba(24, 144, 255, 0.18));
  transition: stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.trend-dot {
  opacity: 0;
  fill: #ffffff;
  stroke: #1890ff;
  stroke-width: 3;
  transform-box: fill-box;
  transform-origin: center;
  transform: scale(0.72);
  transition:
    opacity 0.28s ease 0.72s,
    transform 0.28s ease 0.72s;
}

.line-chart.is-ready .trend-area {
  opacity: 1;
}

.line-chart.is-ready .trend-line {
  stroke-dashoffset: 0;
}

.line-chart.is-ready .trend-dot {
  opacity: 1;
  transform: scale(1);
}

.chart-labels {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.chart-labels span {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.chart-labels strong {
  color: #182230;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
}

.chart-labels small,
.bar-column small {
  color: #7a8699;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.bar-chart {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: 14px;
  min-height: 202px;
  padding-top: 4px;
}

.bar-column {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 9px;
  height: 202px;
  min-width: 0;
}

.bar-value {
  color: #344054;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  white-space: nowrap;
}

.bar-track {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 0;
  background: #edf2f7;
  border-radius: 8px;
  overflow: hidden;
}

.bar-fill {
  display: block;
  width: 100%;
  height: var(--bar-height);
  background: linear-gradient(180deg, #40a9ff 0%, #1890ff 100%);
  border-radius: 8px 8px 3px 3px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32);
  transition: height 0.78s cubic-bezier(0.16, 1, 0.3, 1);
}

.bar-chart.is-ready .bar-fill {
  min-height: 8%;
}

.info-panel,
.recent-panel {
  min-height: 252px;
}

.info-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 224px;
  padding-right: 2px;
  overflow-y: auto;
}

.info-item {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 10px;
  min-height: 34px;
  padding: 0 9px;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 8px;
}

.info-item span {
  color: #667085;
  font-size: 12px;
  font-weight: 700;
}

.info-item strong {
  overflow: hidden;
  color: #344054;
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  min-height: 42px;
  padding: 7px 9px;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 8px;
}

.recent-item strong {
  display: block;
  overflow: hidden;
  color: #344054;
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-item small {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: #7a8699;
  font-size: 11px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-item > span {
  color: #667085;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.dashboard-alert {
  margin-top: 0;
}

@media (prefers-reduced-motion: reduce) {
  .trend-area,
  .trend-line,
  .trend-dot,
  .bar-fill {
    animation: none;
    transition: none;
  }
}

@media (max-width: 1180px) {
  .hero-section,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .welcome-workbench {
    padding: 10px;
  }

  .hero-section {
    padding: 16px;
  }

  .hero-copy h2 {
    font-size: 22px;
  }

  .runtime-summary,
  .info-list,
  .bar-chart {
    grid-template-columns: 1fr;
  }

  .bar-column {
    height: 148px;
  }
}
</style>
