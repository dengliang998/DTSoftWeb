<template>
  <div class="online-users-container">
    <el-card class="online-users-card">
      <template #header>
        <div class="card-header">
          <div class="title-group">
            <span class="page-title">在线用户</span>
            <span class="online-count">{{ filteredUsers.length }} / {{ total }} 人在线</span>
          </div>
          <div class="header-actions">
            <el-input
              v-model="keyword"
              class="search-input"
              clearable
              placeholder="搜索账号或姓名"
              @keyup.enter="loadOnlineUsers"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" :icon="Refresh" :loading="loading" @click="loadOnlineUsers">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="status-strip">
        <div class="status-item">
          <span class="status-label">在线判定</span>
          <span class="status-value">最近 5 分钟有操作</span>
        </div>
        <div class="status-item">
          <span class="status-label">最近刷新</span>
          <span class="status-value">{{ lastRefreshText }}</span>
        </div>
      </div>

      <el-table v-loading="loading" :data="filteredUsers" border stripe class="table-wrapper" empty-text="暂无在线用户">
        <el-table-column label="#" type="index" width="72"></el-table-column>
        <el-table-column label="账号" prop="Account" min-width="160" show-overflow-tooltip></el-table-column>
        <el-table-column label="姓名" prop="DisplayName" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.DisplayName || row.Account }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最后操作时间" prop="LastActiveTime" min-width="190"></el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default>
            <el-tag type="success" effect="light" round>在线</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { getOnlineUsers } from '@/api/user'
import { Refresh, Search } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'OnlineUsers',
  components: {
    Search
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
}

.online-users-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title-group {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.page-title {
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

.online-count {
  color: #059669;
  font-size: 13px;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  width: 240px;
}

.status-strip {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
}

.status-label {
  color: #6b7280;
  font-size: 12px;
}

.status-value {
  color: #111827;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .card-header {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }
}
</style>
