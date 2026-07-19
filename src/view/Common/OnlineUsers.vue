<template>
  <div class="online-users-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>在线用户</h1>
          <p>查看最近有操作记录的在线账号。</p>
        </div>
        <div class="dt-command-actions">
          <el-button type="primary" :icon="Refresh" :loading="loading" @click="loadOnlineUsers">刷新</el-button>
        </div>
      </div>

      <div class="dt-toolbar dt-toolbar--compact">
        <el-input
          v-model="keyword"
          class="dt-search"
          clearable
          placeholder="搜索账号或姓名"
          @keyup.enter="loadOnlineUsers"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="dt-panel">
        <div class="dt-panel__header">
          <div>
            <strong>在线列表</strong>
            <span>{{ filteredUsers.length }} / {{ total }} 人在线</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip dt-chip--success">最近 5 分钟有操作</span>
            <span class="dt-chip">最近刷新 {{ lastRefreshText }}</span>
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="filteredUsers"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          empty-text="暂无在线用户"
        >
          <el-table-column label="#" width="72" align="center">
            <template #default="scope">
              <span class="dt-index-chip">{{ scope.$index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="用户" prop="DisplayName" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="dt-name-cell">
                <span class="dt-icon-shell online-user-icon">
                  <el-icon><UserFilled /></el-icon>
                </span>
                <span class="dt-name-copy">
                  <strong>{{ row.DisplayName || row.Account }}</strong>
                  <small>{{ row.Account }}</small>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="最后操作时间" prop="LastActiveTime" min-width="190">
            <template #default="{ row }">
              <code class="dt-code">{{ row.LastActiveTime || '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120" align="center">
            <template #default>
              <span class="dt-badge dt-badge--success">在线</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<script>
import { getOnlineUsers } from '@/api/user'
import { Refresh, Search, UserFilled } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'OnlineUsers',
  components: {
    Search,
    UserFilled
  },
  data() {
    return {
      Refresh: markRaw(Refresh),
      loading: false,
      keyword: '',
      users: [],
      total: 0,
      lastRefreshTime: ''
    }
  },
  computed: {
    filteredUsers() {
      const keyword = this.keyword.trim().toLowerCase()
      if (!keyword) return this.users

      return this.users.filter((user) => {
        const account = String(user.Account || '').toLowerCase()
        const displayName = String(user.DisplayName || '').toLowerCase()
        return account.includes(keyword) || displayName.includes(keyword)
      })
    },
    lastRefreshText() {
      return this.lastRefreshTime || '-'
    }
  },
  created() {
    this.loadOnlineUsers()
  },
  methods: {
    async loadOnlineUsers() {
      this.loading = true
      try {
        const { data: res } = await getOnlineUsers()
        if (res?.success) {
          this.users = res.data || []
          this.total = res.Total || this.users.length
          this.lastRefreshTime = this.formatNow()
        } else {
          this.$message.error('在线用户获取失败：' + (res?.Msg || res?.message || '未知错误'))
        }
      } catch (error) {
        this.$message.error('在线用户获取失败：' + (error?.message || error))
      } finally {
        this.loading = false
      }
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
.online-users-container {
  height: 100%;
  min-width: 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.online-user-icon {
  color: #0f766e;
  background: #e8f7f4;
}
</style>
