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
              {{ dashboardError ? '运行信息获取异常' : '运行信息已同步' }}
            </span>
          </div>
        </div>

        <div class="hero-actions">
          <div class="refresh-box">
            <small>最近刷新</small>
            <strong>{{ lastRefreshTime || '-' }}</strong>
          </div>
          <el-button class="refresh-button" :loading="loading" @click="loadRuntimeInfo">
            <el-icon><Refresh /></el-icon>
            <span>刷新</span>
          </el-button>
        </div>
      </section>

      <section class="metric-grid">
        <div v-for="item in metricCards" :key="item.label" class="metric-card">
          <span class="metric-icon" :class="item.tone">
            <el-icon><component :is="item.icon" /></el-icon>
          </span>
          <span class="metric-content">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
            <small>{{ item.note }}</small>
          </span>
        </div>
      </section>

      <section class="overview-panel">
        <div v-for="item in overviewRows" :key="item.label" class="overview-item">
          <span>{{ item.label }}</span>
          <strong :title="item.value">{{ item.value }}</strong>
        </div>
      </section>

      <el-alert v-if="dashboardError" class="dashboard-alert" type="warning" :closable="false" show-icon>
        <template #title>{{ dashboardError }}</template>
      </el-alert>
    </section>
  </div>
</template>

<script>
import { getSystemRuntimeInfo } from '@/api/sysconfig'
import { CircleCheck, Clock, Cpu, Histogram, Monitor, Refresh, Warning } from '@element-plus/icons-vue'

export default {
  name: 'Welcome',
  components: {
    CircleCheck,
    Clock,
    Cpu,
    Histogram,
    Monitor,
    Refresh,
    Warning
  },
  data() {
    return {
      greetingTitle: '',
      greetingSubtitle: '',
      currentTime: '',
      lastRefreshTime: '',
      loading: false,
      dashboardError: '',
      timers: [],
      runtimeInfo: {}
    }
  },
  computed: {
    resource() {
      return this.runtimeInfo.Resource || {}
    },
    server() {
      return this.runtimeInfo.Server || {}
    },
    memory() {
      return this.runtimeInfo.Memory || {}
    },
    runtime() {
      return this.runtimeInfo.Runtime || {}
    },
    application() {
      return this.runtimeInfo.Application || {}
    },
    database() {
      return this.runtimeInfo.Database || {}
    },
    serverCpuPercent() {
      return this.normalizePercent(this.resource.ServerCpuUsagePercent ?? this.resource.CpuUsagePercent)
    },
    serverMemoryPercent() {
      return this.normalizePercent(this.resource.ServerMemoryUsagePercent ?? this.resource.MemoryUsagePercent)
    },
    processCpuPercent() {
      return this.normalizePercent(this.resource.ProcessCpuUsagePercent)
    },
    processMemoryPercent() {
      return this.normalizePercent(this.resource.ProcessMemoryUsagePercent)
    },
    metricCards() {
      return [
        {
          label: '服务器 CPU',
          value: this.formatPercent(this.serverCpuPercent),
          note: `${this.formatValue(this.server.ProcessorCount)} 核心`,
          icon: 'Cpu',
          tone: 'is-blue'
        },
        {
          label: '服务器内存',
          value: this.formatPercent(this.serverMemoryPercent),
          note: `总计 ${this.formatBytes(this.resource.TotalMemoryBytes)}`,
          icon: 'Histogram',
          tone: 'is-green'
        },
        {
          label: '程序 CPU',
          value: this.formatPercent(this.processCpuPercent),
          note: '当前服务进程',
          icon: 'Monitor',
          tone: 'is-amber'
        },
        {
          label: '程序内存',
          value: this.formatPercent(this.processMemoryPercent),
          note: `工作集 ${this.formatBytes(this.memory.WorkingSetBytes)}`,
          icon: 'Clock',
          tone: 'is-slate'
        }
      ]
    },
    overviewRows() {
      return [
        { label: '应用', value: this.formatValue(this.application.Name) },
        { label: '环境', value: this.formatValue(this.application.EnvironmentName) },
        { label: '运行时长', value: this.formatDuration(this.server.UptimeSeconds) },
        { label: '启动时间', value: this.formatValue(this.server.StartedAt) },
        { label: '操作系统', value: this.formatValue(this.runtime.OSDescription) },
        { label: '数据库', value: this.formatValue(this.database.Database) }
      ]
    }
  },
  created() {
    this.updateGreeting()
    this.updateTime()
    this.loadRuntimeInfo()
    this.timers = [
      setInterval(this.updateTime, 1000),
      setInterval(this.updateGreeting, 60000),
      setInterval(this.loadRuntimeInfo, 300000)
    ]
  },
  beforeUnmount() {
    this.timers.forEach((timer) => clearInterval(timer))
  },
  methods: {
    async loadRuntimeInfo() {
      this.loading = true
      this.dashboardError = ''

      try {
        const { data: res } = await getSystemRuntimeInfo()
        if (res?.success) {
          this.runtimeInfo = res.data || {}
          this.lastRefreshTime = this.formatNow()
        } else {
          this.dashboardError = '运行信息获取失败：' + (res?.Msg || res?.message || '未知错误')
        }
      } catch (error) {
        this.dashboardError = '运行信息获取失败：' + (error?.message || error)
      } finally {
        this.loading = false
      }
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

      this.currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${weekDays[now.getDay()]}`
    },
    updateGreeting() {
      const hour = new Date().getHours()

      if (hour >= 5 && hour < 11) {
        this.greetingTitle = '上午好，今天从系统状态开始'
        this.greetingSubtitle = '首页保留关键资源指标，详细运行信息可在系统信息页查看。'
      } else if (hour >= 11 && hour < 14) {
        this.greetingTitle = '中午好，服务状态保持可见'
        this.greetingSubtitle = '快速查看 CPU、内存和运行时长，判断当前负载。'
      } else if (hour >= 14 && hour < 18) {
        this.greetingTitle = '下午好，继续保持系统稳定'
        this.greetingSubtitle = '关键指标已汇总，页面保持简洁便于扫读。'
      } else if (hour >= 18 && hour < 22) {
        this.greetingTitle = '晚上好，适合做一次状态确认'
        this.greetingSubtitle = '关注资源占用和服务运行状态，详细信息进入系统信息页。'
      } else {
        this.greetingTitle = '夜间巡检，系统运行信息已准备'
        this.greetingSubtitle = '低峰时段可重点查看服务器和程序资源占用。'
      }
    },
    normalizePercent(value) {
      const number = Number(value)
      if (!Number.isFinite(number) || number < 0) return null
      return Math.min(100, Math.max(0, number))
    },
    formatPercent(value) {
      const number = this.normalizePercent(value)
      if (number === null) return '-'
      return `${number.toFixed(1)}%`
    },
    formatValue(value) {
      if (value === null || value === undefined || value === '') return '-'
      return String(value)
    },
    formatBytes(value) {
      const bytes = Number(value)
      if (!Number.isFinite(bytes) || bytes <= 0) return '-'

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
    formatNow() {
      const now = new Date()
      const pad = (value) => String(value).padStart(2, '0')
      return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
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
  color: var(--dt-text);
  background:
    radial-gradient(circle at 0 0, color-mix(in srgb, var(--dt-primary) 10%, transparent), transparent 30%),
    linear-gradient(180deg, var(--dt-page-bg) 0%, var(--dt-primary-subtle) 100%);
}

.welcome-workbench {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 10px;
  overflow: hidden;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 16px;
  min-height: 150px;
  padding: 20px;
  overflow: hidden;
  color: #ffffff;
  background:
    linear-gradient(120deg, rgba(15, 23, 42, 0.97) 0%, rgba(24, 39, 70, 0.96) 60%, rgba(9, 105, 96, 0.94) 100%),
    linear-gradient(135deg, #101828 0%, var(--dt-primary) 100%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  box-shadow: 0 18px 42px rgba(16, 24, 40, 0.15);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.page-kicker {
  margin-bottom: 8px;
  color: #7dd3c7;
  font-size: 12px;
  font-weight: 800;
}

.hero-copy h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: 0;
}

.hero-copy p {
  max-width: 620px;
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.88);
  font-size: 14px;
  line-height: 1.7;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
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

.hero-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.refresh-box {
  padding: 12px;
  background: rgba(15, 23, 42, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
}

.refresh-box small {
  display: block;
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
}

.refresh-box strong {
  display: block;
  margin-top: 6px;
  color: #ffffff;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 22px;
  line-height: 1.1;
}

.refresh-button {
  width: 100%;
  min-height: 36px;
  color: #0f172a;
  font-weight: 750;
  background: #ffffff;
  border: 0;
  border-radius: 8px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 94px;
  padding: 14px;
  background: var(--dt-surface);
  border: 1px solid var(--dt-border);
  border-radius: 8px;
  box-shadow: var(--dt-shadow-soft);
}

.metric-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  color: #ffffff;
  border-radius: 8px;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.metric-content strong {
  overflow: hidden;
  color: var(--dt-text);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 23px;
  font-weight: 850;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-content span {
  color: var(--dt-text);
  font-size: 13px;
  font-weight: 800;
}

.metric-content small {
  overflow: hidden;
  color: var(--dt-text-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-blue {
  background: #2563eb;
}

.is-green {
  background: #0f766e;
}

.is-amber {
  background: #b45309;
}

.is-slate {
  background: #475467;
}

.overview-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-height: 0;
  padding: 14px;
  background: var(--dt-surface);
  border: 1px solid var(--dt-border);
  border-radius: 8px;
  box-shadow: var(--dt-shadow-soft);
}

.overview-item {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 38px;
  padding: 0 10px;
  background: var(--dt-surface-soft);
  border: 1px solid color-mix(in srgb, var(--dt-border) 75%, transparent);
  border-radius: 8px;
}

.overview-item span {
  color: var(--dt-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.overview-item strong {
  overflow: hidden;
  color: var(--dt-text);
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-alert {
  margin-top: 0;
}

@media (max-width: 1180px) {
  .hero-section {
    grid-template-columns: 1fr;
  }

  .metric-grid,
  .overview-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .welcome-container,
  .welcome-workbench {
    overflow: auto;
  }

  .hero-section,
  .metric-grid,
  .overview-panel {
    grid-template-columns: 1fr;
  }

  .hero-copy h2 {
    font-size: 22px;
  }
}

html[data-theme='dark'] .welcome-container {
  background:
    radial-gradient(circle at 0 0, color-mix(in srgb, var(--dt-primary) 14%, transparent), transparent 30%),
    linear-gradient(180deg, #0b1220 0%, #0f172a 100%);
}

html[data-theme='dark'] .hero-section {
  border-color: color-mix(in srgb, var(--dt-text) 14%, transparent);
  box-shadow: var(--dt-shadow);
}
</style>
