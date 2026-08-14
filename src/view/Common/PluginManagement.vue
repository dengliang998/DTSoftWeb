<template>
  <div class="plugin-management-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>{{ $t('pluginManagement.title') }}</h1>
          <p>{{ $t('pluginManagement.subtitle') }}</p>
        </div>
        <div class="dt-command-actions">
          <el-upload
            action=""
            :auto-upload="false"
            :show-file-list="false"
            accept=".dll,.zip"
            :on-change="handleFileChange"
          >
            <el-button type="primary" :icon="Upload" :loading="uploading">
              {{ $t('pluginManagement.upload') }}
            </el-button>
          </el-upload>
          <el-button class="dt-ghost-action" :icon="Refresh" :loading="loading" @click="loadPlugins">
            {{ $t('common.refresh') }}
          </el-button>
        </div>
      </div>

      <div class="dt-toolbar dt-toolbar--compact">
        <el-input v-model="keyword" class="dt-search" clearable :placeholder="$t('pluginManagement.searchPlaceholder')">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <span class="restart-hint">{{ $t('pluginManagement.restartHint') }}</span>
      </div>

      <div class="dt-panel">
        <div class="dt-panel__header">
          <div>
            <strong>{{ $t('pluginManagement.listTitle') }}</strong>
            <span>{{ $t('pluginManagement.summary', { count: filteredPlugins.length }) }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip dt-chip--success">{{ $t('pluginManagement.zipSupported') }}</span>
            <span class="dt-chip">{{ $t('pluginManagement.dllSupported') }}</span>
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="filteredPlugins"
          :row-style="{ height: '56px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          :empty-text="$t('pluginManagement.empty')"
        >
          <el-table-column :label="$t('pluginManagement.plugin')" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="dt-name-cell">
                <span class="dt-icon-shell plugin-icon">
                  <el-icon><Connection /></el-icon>
                </span>
                <span class="dt-name-copy">
                  <strong>{{ row.PluginName || row.pluginName || row.AssemblyName || row.assemblyName }}</strong>
                  <small>{{ row.AssemblyName || row.assemblyName }}</small>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('pluginManagement.version')" width="150">
            <template #default="{ row }">
              <code class="dt-code">{{ row.Version || row.version || '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.status')" width="150" align="center">
            <template #default="{ row }">
              <span class="dt-badge" :class="isEnabled(row) ? 'dt-badge--success' : 'dt-badge--muted'">
                {{ isEnabled(row) ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('pluginManagement.effectiveStatus')" width="170" align="center">
            <template #default="{ row }">
              <el-tooltip :disabled="!getLastLoadError(row)" :content="getLastLoadError(row)" placement="top">
                <span class="dt-chip" :class="getStatusClass(row)">
                  {{ getStatusText(row) }}
                </span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column :label="$t('pluginManagement.uploadedAt')" min-width="190">
            <template #default="{ row }">
              <code class="dt-code">{{ formatDate(row.UploadedAt || row.uploadedAt) }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('pluginManagement.path')" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">
              <code class="dt-code">{{ row.MainAssembly || row.mainAssembly || '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="116" fixed="right" align="center">
            <template #default="{ row }">
              <div class="dt-operation-buttons plugin-actions">
                <el-tooltip :content="isEnabled(row) ? $t('common.disabled') : $t('common.enabled')" placement="top">
                  <el-button
                    class="dt-icon-action"
                    :class="isEnabled(row) ? 'plugin-action--disable' : 'plugin-action--enable'"
                    :icon="isEnabled(row) ? VideoPause : CircleCheck"
                    @click="togglePlugin(row)"
                  />
                </el-tooltip>
                <el-tooltip :content="$t('common.delete')" placement="top">
                  <el-button class="dt-icon-action dt-icon-action--danger" :icon="Delete" @click="confirmRemove(row)" />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<script>
import { disablePlugin, enablePlugin, getPlugins, removePlugin, uploadPlugin } from '@/api/plugin'
import { CircleCheck, Connection, Delete, Refresh, Search, Upload, VideoPause } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { markRaw } from 'vue'

export default {
  name: 'PluginManagement',
  components: {
    Connection,
    Search
  },
  data() {
    return {
      Refresh: markRaw(Refresh),
      Upload: markRaw(Upload),
      CircleCheck: markRaw(CircleCheck),
      Delete: markRaw(Delete),
      VideoPause: markRaw(VideoPause),
      loading: false,
      uploading: false,
      keyword: '',
      plugins: []
    }
  },
  computed: {
    filteredPlugins() {
      const keyword = this.keyword.trim().toLowerCase()
      if (!keyword) return this.plugins

      return this.plugins.filter((plugin) => {
        const values = [
          plugin.PluginName || plugin.pluginName,
          plugin.AssemblyName || plugin.assemblyName,
          plugin.Version || plugin.version,
          plugin.MainAssembly || plugin.mainAssembly
        ]
        return values.some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(keyword)
        )
      })
    }
  },
  created() {
    this.loadPlugins()
  },
  methods: {
    async loadPlugins() {
      this.loading = true
      try {
        const { data: res } = await getPlugins()
        if (res?.success) {
          this.plugins = res.data || []
        } else {
          this.$message.error(res?.Msg || res?.message || this.$t('pluginManagement.loadFailed'))
        }
      } catch (error) {
        this.$message.error(`${this.$t('pluginManagement.loadFailed')}：${error?.message || error}`)
      } finally {
        this.loading = false
      }
    },
    async handleFileChange(uploadFile) {
      const file = uploadFile.raw
      if (!file) return

      const lowerName = file.name.toLowerCase()
      if (!lowerName.endsWith('.dll') && !lowerName.endsWith('.zip')) {
        this.$message.error(this.$t('pluginManagement.typeUnsupported'))
        return
      }

      this.uploading = true
      try {
        const { data: res } = await uploadPlugin(file)
        if (res?.success) {
          this.$message.success(res.Msg || this.$t('pluginManagement.uploadSuccess'))
          await this.loadPlugins()
        } else {
          this.$message.error(res?.Msg || res?.message || this.$t('pluginManagement.uploadFailed'))
        }
      } catch (error) {
        this.$message.error(`${this.$t('pluginManagement.uploadFailed')}：${error?.message || error}`)
      } finally {
        this.uploading = false
      }
    },
    async togglePlugin(row) {
      const id = row.Id || row.id
      const request = this.isEnabled(row) ? disablePlugin : enablePlugin
      try {
        const { data: res } = await request(id)
        if (res?.success) {
          this.$message.success(res.Msg || this.$t('pluginManagement.statusUpdated'))
          await this.loadPlugins()
        } else {
          this.$message.error(res?.Msg || res?.message || this.$t('pluginManagement.statusUpdateFailed'))
        }
      } catch (error) {
        this.$message.error(`${this.$t('pluginManagement.statusUpdateFailed')}：${error?.message || error}`)
      }
    },
    confirmRemove(row) {
      ElMessageBox.confirm(this.$t('pluginManagement.deleteConfirm'), this.$t('common.delete'), {
        type: 'warning'
      })
        .then(() => this.remove(row))
        .catch(() => {})
    },
    async remove(row) {
      try {
        const { data: res } = await removePlugin(row.Id || row.id)
        if (res?.success) {
          this.$message.success(res.Msg || this.$t('pluginManagement.deleteSuccess'))
          await this.loadPlugins()
        } else {
          this.$message.error(res?.Msg || res?.message || this.$t('pluginManagement.deleteFailed'))
        }
      } catch (error) {
        this.$message.error(`${this.$t('pluginManagement.deleteFailed')}：${error?.message || error}`)
      }
    },
    isEnabled(row) {
      return Boolean(row.Enabled ?? row.enabled)
    },
    getStatus(row) {
      return String(row.Status || row.status || '').trim()
    },
    getStatusText(row) {
      const status = this.getStatus(row)
      return status ? this.$t(`pluginManagement.status.${status}`) : '-'
    },
    getStatusClass(row) {
      const status = this.getStatus(row)
      return {
        'dt-chip--success': status === 'Loaded',
        'plugin-status--warning': status === 'PendingRestart',
        'plugin-status--danger': status === 'LoadFailed',
        'plugin-status--muted': status === 'Disabled'
      }
    },
    getLastLoadError(row) {
      return row.LastLoadError || row.lastLoadError || ''
    },
    formatDate(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleString()
    }
  }
}
</script>

<style lang="less" scoped>
.plugin-management-container {
  height: 100%;
  min-width: 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.plugin-icon {
  color: var(--dt-primary);
  background: var(--dt-primary-soft);
}

.restart-hint {
  color: var(--dt-text-secondary);
  font-size: 13px;
  line-height: 32px;
  white-space: nowrap;
}

.plugin-actions {
  justify-content: center;
}

.plugin-action--enable {
  border-color: #bbf7d0 !important;
  color: #15803d !important;
  background: #f0fdf4 !important;
}

.plugin-action--enable:hover {
  border-color: #16a34a !important;
  color: #ffffff !important;
  background: #16a34a !important;
}

.plugin-action--disable {
  border-color: #fed7aa !important;
  color: #c2410c !important;
  background: #fff7ed !important;
}

.plugin-action--disable:hover {
  border-color: #ea580c !important;
  color: #ffffff !important;
  background: #ea580c !important;
}

.plugin-status--warning {
  color: #92400e;
  background: #fffbeb;
  border-color: #fde68a;
}

.plugin-status--danger {
  color: #b42318;
  background: #fff1f0;
  border-color: #fecaca;
}

.plugin-status--muted {
  color: #667085;
  background: #f8fafc;
  border-color: #e2e8f0;
}
</style>
