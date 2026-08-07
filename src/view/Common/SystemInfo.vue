<template>
  <div class="system-info-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>{{ $t('systemInfo.title') }}</h1>
          <p>{{ $t('systemInfo.subtitle') }}</p>
        </div>
        <div class="dt-command-actions">
          <el-button type="primary" :icon="Refresh" :loading="loading" @click="loadSystemRuntimeInfo">
            {{ $t('common.refresh') }}
          </el-button>
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
            <strong>{{ $t('systemInfo.runtimeDetails') }}</strong>
            <span>{{ $t('systemInfo.lastRefresh', { time: lastRefreshTime || '-' }) }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">{{ $t('systemInfo.applicationChip') }}</span>
            <span class="dt-chip">{{ $t('systemInfo.runtimeChip') }}</span>
            <span class="dt-chip">{{ $t('systemInfo.serverChip') }}</span>
            <span class="dt-chip dt-chip--success">{{ $t('systemInfo.databaseChip') }}</span>
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
import { Clock, Coin, Cpu, FolderOpened, Histogram, Monitor, Refresh, Tickets } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'SystemInfo',
  components: {
    Clock,
    Coin,
    Cpu,
    FolderOpened,
    Histogram,
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
      return [
        {
          label: this.$t('welcome.metrics.serverCpu'),
          value: this.formatPercent(this.serverCpuPercent),
          icon: 'Cpu',
          tone: 'blue'
        },
        {
          label: this.$t('welcome.metrics.serverMemory'),
          value: this.formatPercent(this.serverMemoryPercent),
          icon: 'Histogram',
          tone: 'green'
        },
        {
          label: this.$t('welcome.metrics.processCpu'),
          value: this.formatPercent(this.processCpuPercent),
          icon: 'Monitor',
          tone: 'amber'
        },
        {
          label: this.$t('welcome.metrics.processMemory'),
          value: this.formatPercent(this.processMemoryPercent),
          icon: 'Clock',
          tone: 'slate'
        }
      ]
    },
    resource() {
      return this.info.Resource || {}
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
    infoSections() {
      const application = this.info.Application || {}
      const runtime = this.info.Runtime || {}
      const server = this.info.Server || {}
      const memory = this.info.Memory || {}
      const database = this.info.Database || {}
      const license = this.info.License || {}
      const resource = this.resource

      return [
        {
          title: this.$t('systemInfo.sections.resource'),
          icon: 'Histogram',
          rows: [
            { label: this.$t('systemInfo.labels.totalMemory'), value: this.formatBytes(resource.TotalMemoryBytes) },
            {
              label: this.$t('systemInfo.labels.availableMemory'),
              value: this.formatBytes(resource.AvailableMemoryBytes)
            },
            { label: this.$t('systemInfo.labels.workingSetMemory'), value: this.formatBytes(memory.WorkingSetBytes) },
            { label: this.$t('systemInfo.labels.privateMemory'), value: this.formatBytes(memory.PrivateMemoryBytes) },
            { label: this.$t('systemInfo.labels.gcMemory'), value: this.formatBytes(memory.GCTotalMemoryBytes) },
            { label: this.$t('systemInfo.labels.collectedAt'), value: this.formatValue(resource.CollectedAt) }
          ]
        },
        {
          title: this.$t('systemInfo.sections.application'),
          icon: 'FolderOpened',
          rows: [
            { label: this.$t('systemInfo.labels.appName'), value: this.formatValue(application.Name) },
            { label: this.$t('systemInfo.labels.appVersion'), value: this.formatValue(application.Version) },
            { label: this.$t('systemInfo.labels.environment'), value: this.formatValue(application.EnvironmentName) },
            { label: this.$t('systemInfo.labels.uptime'), value: this.formatDuration(server.UptimeSeconds) },
            { label: this.$t('systemInfo.labels.baseDirectory'), value: this.formatValue(application.BaseDirectory) },
            { label: this.$t('systemInfo.labels.rootPath'), value: this.formatValue(application.RootPath) }
          ]
        },
        {
          title: this.$t('systemInfo.sections.license'),
          icon: 'Tickets',
          rows: [
            { label: this.$t('systemInfo.labels.licenseStatus'), value: this.formatValue(license.Status) },
            { label: this.$t('systemInfo.labels.licenseType'), value: this.formatValue(license.LicenseTypeName) },
            { label: this.$t('systemInfo.labels.customer'), value: this.formatValue(license.Customer) },
            { label: this.$t('systemInfo.labels.expireAt'), value: this.formatValue(license.ExpireAtText) },
            { label: this.$t('systemInfo.labels.maxUsers'), value: this.formatValue(license.MaxConcurrentUsersText) },
            ...(license.Message
              ? [{ label: this.$t('systemInfo.labels.licenseMessage'), value: this.formatValue(license.Message) }]
              : [])
          ]
        },
        {
          title: this.$t('systemInfo.sections.runtime'),
          icon: 'Cpu',
          rows: [
            { label: this.$t('systemInfo.labels.framework'), value: this.formatValue(runtime.FrameworkDescription) },
            {
              label: this.$t('systemInfo.labels.runtimeIdentifier'),
              value: this.formatValue(runtime.RuntimeIdentifier)
            },
            { label: this.$t('systemInfo.labels.os'), value: this.formatValue(runtime.OSDescription) },
            { label: this.$t('systemInfo.labels.osArchitecture'), value: this.formatValue(runtime.OSArchitecture) },
            {
              label: this.$t('systemInfo.labels.processArchitecture'),
              value: this.formatValue(runtime.ProcessArchitecture)
            }
          ]
        },
        {
          title: this.$t('systemInfo.sections.server'),
          icon: 'Monitor',
          rows: [
            { label: this.$t('systemInfo.labels.machineName'), value: this.formatValue(server.MachineName) },
            { label: this.$t('systemInfo.labels.processorCount'), value: this.formatValue(server.ProcessorCount) },
            { label: this.$t('systemInfo.labels.timeZone'), value: this.formatValue(server.TimeZone) },
            { label: this.$t('systemInfo.labels.startedAt'), value: this.formatValue(server.StartedAt) }
          ]
        },
        {
          title: this.$t('systemInfo.sections.database'),
          icon: 'Coin',
          rows: [
            { label: this.$t('systemInfo.labels.databaseProvider'), value: this.formatValue(database.ProviderName) },
            { label: this.$t('systemInfo.labels.dataSource'), value: this.formatValue(database.DataSource) },
            { label: this.$t('systemInfo.labels.databaseName'), value: this.formatValue(database.Database) },
            { label: this.$t('systemInfo.labels.databaseVersion'), value: this.formatValue(database.Version) }
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
          this.$message.error(
            `${this.$t('systemInfo.loadFailed')}：${res?.Msg || res?.message || this.$t('welcome.unknownError')}`
          )
        }
      } catch (error) {
        this.$message.error(`${this.$t('systemInfo.loadFailed')}：${error?.message || error}`)
      } finally {
        this.loading = false
      }
    },
    formatValue(value) {
      if (value === null || value === undefined || value === '') return '-'
      return String(value)
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

      if (days > 0) return this.$t('welcome.duration.daysHours', { days, hours })
      if (hours > 0) return this.$t('welcome.duration.hoursMinutes', { hours, minutes })
      return this.$t('welcome.duration.minutes', { minutes })
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
  border: 1px solid var(--dt-border);
  border-radius: 8px;
  background: var(--dt-surface);
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
  color: var(--dt-text);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-content span {
  color: var(--dt-text-muted);
  font-size: 13px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.info-panel {
  min-width: 0;
  border: 1px solid var(--dt-border);
  border-radius: 8px;
  background: var(--dt-surface);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--dt-border);
  color: var(--dt-text-muted);
}

.panel-title {
  color: var(--dt-text);
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
  border-bottom: 1px solid var(--dt-border);
  line-height: 18px;
}

.info-list dt {
  color: var(--dt-text-muted);
  font-size: 13px;
}

.info-list dd {
  overflow: hidden;
  color: var(--dt-text);
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
