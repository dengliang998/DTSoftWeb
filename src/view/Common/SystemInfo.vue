<template>
  <div class="system-info-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>系统信息</h1>
          <p>查看当前服务运行状态、资源占用和数据库连接信息。</p>
        </div>
        <div class="dt-command-actions">
          <el-button type="primary" :icon="Refresh" :loading="loading" @click="loadSystemRuntimeInfo">刷新</el-button>
        </div>
      </div>

      <section class="summary-grid">
        <div v-for="item in summaryCards" :key="item.label" class="summary-card">
          <span class="summary-icon" :class="item.tone">
            <el-icon><component :is="item.icon" /></el-icon>
          </span>
          <span class="summary-content">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </span>
        </div>
      </section>

      <div class="dt-panel info-work-panel">
        <div class="dt-panel__header">
          <div>
            <strong>运行明细</strong>
            <span>最近刷新：{{ lastRefreshTime || '-' }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">应用</span>
            <span class="dt-chip">运行时</span>
            <span class="dt-chip">服务器</span>
            <span class="dt-chip dt-chip--success">数据库</span>
          </div>
        </div>

        <div class="info-scroll">
          <el-skeleton v-if="loading && !hasInfo" :rows="8" animated />

          <section v-else class="info-grid">
            <div v-for="section in infoSections" :key="section.title" class="info-panel">
              <div class="panel-header">
                <span class="panel-title">{{ section.title }}</span>
                <el-icon><component :is="section.icon" /></el-icon>
              </div>
              <dl class="info-list">
                <template v-for="row in section.rows" :key="row.label">
                  <dt>{{ row.label }}</dt>
                  <dd :title="row.value">{{ row.value }}</dd>
                </template>
              </dl>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { getSystemRuntimeInfo } from '@/api/sysconfig'
import { Clock, Coin, Cpu, FolderOpened, Monitor, Refresh, Tickets } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'SystemInfo',
  components: {
    Clock,
    Coin,
    Cpu,
    FolderOpened,
    Monitor,
    Tickets
  },
  data() {
    return {
      Refresh: markRaw(Refresh),
      loading: false,
      info: {},
      lastRefreshTime: ''
    }
  },
  computed: {
    hasInfo() {
      return Object.keys(this.info || {}).length > 0
    },
    summaryCards() {
      const server = this.info.Server || {}
      const memory = this.info.Memory || {}
      const runtime = this.info.Runtime || {}

      return [
        {
          label: '运行时长',
          value: this.formatDuration(server.UptimeSeconds),
          icon: 'Clock',
          tone: 'blue'
        },
        {
          label: '工作集内存',
          value: this.formatBytes(memory.WorkingSetBytes),
          icon: 'Cpu',
          tone: 'green'
        },
        {
          label: '处理器',
          value: this.formatValue(server.ProcessorCount),
          icon: 'Monitor',
          tone: 'amber'
        },
        {
          label: '运行架构',
          value: this.formatValue(runtime.ProcessArchitecture),
          icon: 'Tickets',
          tone: 'slate'
        }
      ]
    },
    infoSections() {
      const application = this.info.Application || {}
      const runtime = this.info.Runtime || {}
      const server = this.info.Server || {}
      const memory = this.info.Memory || {}
      const database = this.info.Database || {}

      return [
        {
          title: '应用',
          icon: 'FolderOpened',
          rows: [
            { label: '应用名称', value: this.formatValue(application.Name) },
            { label: '应用版本', value: this.formatValue(application.Version) },
            { label: '运行环境', value: this.formatValue(application.EnvironmentName) },
            { label: '应用目录', value: this.formatValue(application.BaseDirectory) },
            { label: '资源目录', value: this.formatValue(application.RootPath) }
          ]
        },
        {
          title: '运行时',
          icon: 'Cpu',
          rows: [
            { label: '框架', value: this.formatValue(runtime.FrameworkDescription) },
            { label: '运行标识', value: this.formatValue(runtime.RuntimeIdentifier) },
            { label: '操作系统', value: this.formatValue(runtime.OSDescription) },
            { label: '系统架构', value: this.formatValue(runtime.OSArchitecture) },
            { label: '进程架构', value: this.formatValue(runtime.ProcessArchitecture) }
          ]
        },
        {
          title: '服务器',
          icon: 'Monitor',
          rows: [
            { label: '主机名', value: this.formatValue(server.MachineName) },
            { label: '处理器数量', value: this.formatValue(server.ProcessorCount) },
            { label: '时区', value: this.formatValue(server.TimeZone) },
            { label: '启动时间', value: this.formatValue(server.StartedAt) },
            { label: '当前时间', value: this.formatValue(server.CurrentTime) },
            { label: '最近刷新', value: this.formatValue(this.lastRefreshTime) }
          ]
        },
        {
          title: '资源与数据库',
          icon: 'Coin',
          rows: [
            { label: '工作集内存', value: this.formatBytes(memory.WorkingSetBytes) },
            { label: '私有内存', value: this.formatBytes(memory.PrivateMemoryBytes) },
            { label: 'GC 托管内存', value: this.formatBytes(memory.GCTotalMemoryBytes) },
            { label: '数据库驱动', value: this.formatValue(database.ProviderName) },
            { label: '数据源', value: this.formatValue(database.DataSource) },
            { label: '数据库', value: this.formatValue(database.Database) }
          ]
        }
      ]
    }
  },
  created() {
    this.loadSystemRuntimeInfo()
  },
  methods: {
    async loadSystemRuntimeInfo() {
      this.loading = true
      try {
        const { data: res } = await getSystemRuntimeInfo()
        if (res?.success) {
          this.info = res.data || {}
          this.lastRefreshTime = this.formatNow()
        } else {
          this.$message.error('系统信息获取失败：' + (res?.Msg || res?.message || '未知错误'))
        }
      } catch (error) {
        this.$message.error('系统信息获取失败：' + (error?.message || error))
      } finally {
        this.loading = false
      }
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
    formatNow() {
      const now = new Date()
      const pad = (value) => String(value).padStart(2, '0')
      return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    }
  }
}
</script>

<style lang="less" scoped>
.system-info-container {
  height: 100%;
  min-height: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  flex: 0 0 auto;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 82px;
  padding: 14px;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #ffffff;
}

.info-work-panel {
  min-width: 0;
}

.info-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
}

.summary-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 20px;
}

.summary-icon.blue {
  background: #2563eb;
}

.summary-icon.green {
  background: var(--dt-primary);
}

.summary-icon.amber {
  background: #b45309;
}

.summary-icon.slate {
  background: #475467;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.summary-content strong {
  overflow: hidden;
  color: #182230;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-content span {
  color: #667085;
  font-size: 13px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.info-panel {
  min-width: 0;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #ffffff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #eef2f6;
  color: #344054;
}

.panel-title {
  color: #182230;
  font-size: 15px;
  font-weight: 700;
}

.info-list {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  margin: 0;
  padding: 8px 16px 14px;
}

.info-list dt,
.info-list dd {
  min-height: 34px;
  margin: 0;
  padding: 8px 0;
  border-bottom: 1px solid #f2f4f7;
  line-height: 18px;
}

.info-list dt {
  color: #667085;
  font-size: 13px;
}

.info-list dd {
  overflow: hidden;
  color: #182230;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .info-list {
    grid-template-columns: 96px minmax(0, 1fr);
  }
}
</style>
