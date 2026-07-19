<template>
  <div class="log-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>系统日志</h1>
          <p>查询接口请求、操作用户、客户端 IP 和返回结果。</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="resetFilters">重置</el-button>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </div>
      </div>

      <div class="dt-panel log-filter-panel">
        <div class="dt-panel__header">
          <div>
            <strong>筛选条件</strong>
            <span>支持综合搜索和字段精确筛选</span>
          </div>
        </div>
        <div class="search-section">
          <el-form :model="queryInfo" label-width="76px" class="filter-form">
            <el-row :gutter="12">
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label="综合搜索">
                  <el-input
                    v-model="queryInfo.Keyword"
                    clearable
                    placeholder="用户 / IP / 接口 / 参数 / 结果"
                    @keyup.enter="handleSearch"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="16" :lg="10" :xl="8">
                <el-form-item label="日志时间">
                  <el-date-picker
                    v-model="logDateRange"
                    type="datetimerange"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    class="date-range-picker"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
                <el-form-item label="操作用户">
                  <el-input
                    v-model="queryInfo.UserAcc"
                    clearable
                    placeholder="账号或显示名"
                    @keyup.enter="handleSearch"
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
                <el-form-item label="IP 地址">
                  <el-input
                    v-model="queryInfo.ClientIP"
                    clearable
                    placeholder="请输入 IP"
                    @keyup.enter="handleSearch"
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label="接口名称">
                  <el-input
                    v-model="queryInfo.ActionName"
                    clearable
                    placeholder="请输入接口名称"
                    @keyup.enter="handleSearch"
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label="请求参数">
                  <el-input
                    v-model="queryInfo.Param"
                    clearable
                    placeholder="请输入请求参数"
                    @keyup.enter="handleSearch"
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label="返回结果">
                  <el-input
                    v-model="queryInfo.Result"
                    clearable
                    placeholder="请输入返回结果"
                    @keyup.enter="handleSearch"
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label-width="0" class="filter-actions">
                  <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
                  <el-button @click="resetFilters">重置</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>

      <div class="dt-panel log-table-panel">
        <div class="dt-panel__header">
          <div>
            <strong>日志列表</strong>
            <span>服务端总数 {{ total }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">本页 {{ LogActionList.length }}</span>
            <span class="dt-chip dt-chip--success">每页 {{ queryInfo.pagesize }}</span>
          </div>
        </div>
        <el-table
          :data="LogActionList"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          empty-text="暂无日志"
        >
          <el-table-column label="#" width="72" align="center">
            <template #default="scope">
              <span class="dt-index-chip">{{ indexMethod(scope.$index) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="日志时间" prop="LogDate" width="180" class-name="log-date-column">
            <template #default="{ row }">
              <code class="dt-code log-date-cell">{{ row.LogDate }}</code>
            </template>
          </el-table-column>
          <el-table-column label="操作用户" prop="UserAcc" width="130">
            <template #default="{ row }">
              <span class="dt-muted-pill">{{ row.UserAcc || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="接口名称" prop="ActionName" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column label="IP 地址" prop="ClientIP" width="150">
            <template #default="{ row }">
              <code class="dt-code">{{ row.ClientIP || '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column label="请求参数" prop="Param" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column label="返回结果" min-width="220">
            <template #default="{ row }">
              <el-popover
                v-if="hasResult(row.Result)"
                placement="top-start"
                trigger="hover"
                :width="520"
                popper-class="log-result-popper"
              >
                <template #reference>
                  <span class="result-preview">{{ formatResultPreview(row.Result) }}</span>
                </template>
                <pre class="result-content">{{ formatResultFull(row.Result) }}</pre>
              </el-popover>
              <span v-else class="empty-result">-</span>
            </template>
          </el-table-column>
          <el-table-column label="请求类型" prop="RequestType" width="110">
            <template #default="{ row }">
              <span class="dt-badge dt-badge--neutral">{{ row.RequestType || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="dt-pagination"
          :current-page="queryInfo.pagenum"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="queryInfo.pagesize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>
  </div>
</template>

<script>
import { getLogActionList } from '@/api/log'
import { Refresh, Search } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'LogAction',
  data() {
    return {
      Search: markRaw(Search),
      Refresh: markRaw(Refresh),
      logDateRange: [],
      queryInfo: {
        // 当前的页数
        pagenum: 1,
        // 当前每页显示多少条数据
        pagesize: 10,
        Keyword: '',
        UserAcc: '',
        ClientIP: '',
        ActionName: '',
        Param: '',
        Result: ''
      },
      // 用户列表
      LogActionList: [],
      // 总数据
      total: 0
    }
  },
  created() {
    this.GetLogActionList()
  },
  methods: {
    async GetLogActionList() {
      try {
        const response = await getLogActionList(this.getQueryParams())
        if (response.data.success) {
          this.LogActionList = response.data.data ?? []
          this.total = response.data.Total ?? 0
        } else {
          this.$message.error('日志列表获取失败：' + response.data.Msg)
        }
      } catch (error) {
        this.$message.error('日志列表获取失败：' + error.message)
      }
    },
    getQueryParams() {
      return {
        pageNum: this.queryInfo.pagenum,
        pageSize: this.queryInfo.pagesize,
        LogDateStart: this.logDateRange?.[0] ?? '',
        LogDateEnd: this.logDateRange?.[1] ?? '',
        UserAcc: this.queryInfo.UserAcc,
        ClientIP: this.queryInfo.ClientIP,
        ActionName: this.queryInfo.ActionName,
        Param: this.queryInfo.Param,
        Result: this.queryInfo.Result,
        Keyword: this.queryInfo.Keyword
      }
    },
    handleSearch() {
      this.queryInfo.pagenum = 1
      this.GetLogActionList()
    },
    resetFilters() {
      this.logDateRange = []
      this.queryInfo.pagenum = 1
      this.queryInfo.Keyword = ''
      this.queryInfo.UserAcc = ''
      this.queryInfo.ClientIP = ''
      this.queryInfo.ActionName = ''
      this.queryInfo.Param = ''
      this.queryInfo.Result = ''
      this.GetLogActionList()
    },
    // 监听 pageSize 改变的事件
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.GetLogActionList()
    },
    // 监听 页码值 页面值改变的事件
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.GetLogActionList()
    },
    //处理行号
    indexMethod(index) {
      index = index + 1 + (this.queryInfo.pagenum - 1) * this.queryInfo.pagesize
      return index
    },
    hasResult(result) {
      return result !== null && result !== undefined && result !== ''
    },
    normalizeResult(result) {
      if (typeof result !== 'string') {
        return JSON.stringify(result, null, 2)
      }

      const trimmedResult = result.trim()
      if (!trimmedResult) {
        return ''
      }

      try {
        return JSON.stringify(JSON.parse(trimmedResult), null, 2)
      } catch {
        return result
      }
    },
    formatResultFull(result) {
      return this.normalizeResult(result)
    },
    formatResultPreview(result) {
      return this.normalizeResult(result).replace(/\s+/g, ' ')
    }
  }
}
</script>

<style scoped>
.log-container {
  height: 100%;
  min-height: 0;
}

.search-section {
  flex: 0 0 auto;
  padding: 12px 12px 0;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.filter-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.filter-form :deep(.date-range-picker) {
  width: 100%;
}

.filter-actions :deep(.el-form-item__content) {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}

.log-filter-panel {
  flex: 0 0 auto;
}

.log-table-panel {
  min-height: 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.table-wrapper :deep(.el-table__inner-wrapper) {
  height: 100%;
}

.log-date-cell {
  white-space: nowrap;
}

.table-wrapper :deep(.log-date-column .cell) {
  white-space: nowrap;
}

.result-preview {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}

.empty-result {
  color: #909399;
}
</style>

<style>
.log-result-popper {
  max-width: min(520px, calc(100vw - 32px));
}

.log-result-popper .result-content {
  max-height: 360px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
}
</style>
