<template>
  <div class="log-container">
    <!-- 卡片视图区域 -->
    <el-card class="card-wrapper">
      <!-- 搜索与添加区域 -->
      <div class="search-section">
        <el-row :gutter="20">
          <el-col :span="7">
            <el-input v-model="queryInfo.query" clearable placeholder="请输入内容" @keyup.enter="GetLogActionList">
              <template #append>
                <el-button :icon="Search" @click="GetLogActionList"></el-button>
              </template>
            </el-input>
          </el-col>
        </el-row>
      </div>

      <!-- 用户列表区域 -->
      <div class="table-container">
        <el-table
          :data="LogActionList"
          :row-style="{ height: '40px' }"
          :cell-style="{ padding: '0px' }"
          border
          stripe
          class="table-wrapper"
        >
          <!-- <el-table-column label="#" type="index"></el-table-column> -->
          <el-table-column label="#" type="index" :index="indexMethod"></el-table-column>
          <el-table-column label="日志时间" prop="LogDate" width="180" class-name="log-date-column">
            <template #default="{ row }">
              <span class="log-date-cell">{{ row.LogDate }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作用户" prop="UserAcc" width="110"></el-table-column>
          <el-table-column label="接口名称" prop="ActionName"></el-table-column>
          <el-table-column label="IP 地址" prop="ClientIP" width="150"></el-table-column>
          <el-table-column label="请求参数" prop="Param" show-overflow-tooltip></el-table-column>
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
          <el-table-column label="请求类型" prop="RequestType" width="100"></el-table-column>
        </el-table>
      </div>

      <!-- 分页区域 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="queryInfo.pagenum"
          :page-sizes="[1, 2, 5, 10]"
          :page-size="queryInfo.pagesize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script>
import { getLogActionList } from '@/api/log'
import { Search } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'LogAction',
  data() {
    return {
      Search: markRaw(Search),
      queryInfo: {
        query: '',
        // 当前的页数
        pagenum: 1,
        // 当前每页显示多少条数据
        pagesize: 10
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
      const me = this
      getLogActionList({
        pageNum: me.queryInfo.pagenum,
        pageSize: me.queryInfo.pagesize,
        actionName: me.queryInfo.query
      })
        .then(function (response) {
          if (response.data.success) {
            me.LogActionList = response.data.data
            me.total = response.data.Total
          } else {
            me.$message.error('日志列表获取失败：' + response.data.Msg)
          }
        })
        .catch(function (error) {
          me.$message.error('日志列表获取失败：' + error.message)
        })
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
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.card-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.search-section {
  flex: 0 0 auto;
  margin-bottom: 14px;
}

.table-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.pagination-container {
  flex: 0 0 auto;
  padding: 12px 0 0;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}

.card-wrapper :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.table-container :deep(.el-table) {
  height: 100%;
}

.log-date-cell {
  white-space: nowrap;
}

.table-container :deep(.log-date-column .cell) {
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
