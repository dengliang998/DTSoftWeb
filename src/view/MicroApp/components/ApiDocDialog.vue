<template>
  <el-dialog v-model="dialogVisible" title="接口文档" width="80%" :top="'20vh'" :close-on-click-modal="false">
    <div class="api-doc-container">
      <el-card v-for="(api, index) in apis" :key="index" class="api-card">
        <template #header>
          <div class="api-header">
            <el-tag
              :type="
                api.method === 'GET'
                  ? 'success'
                  : api.method === 'POST'
                    ? 'primary'
                    : api.method === 'PUT'
                      ? 'warning'
                      : 'danger'
              "
              size="small"
              effect="dark"
              style="margin-right: 10px"
            >
              {{ api.method }}
            </el-tag>
            <strong>{{ api.path }}</strong>
          </div>
        </template>
        <div class="api-content">
          <p>
            <strong>描述：</strong>
            {{ api.description }}
          </p>
          <p v-if="api.requestParams && api.requestParams.length">
            <strong>请求参数：</strong>
          </p>
          <el-table
            v-if="api.requestParams && api.requestParams.length"
            :data="api.requestParams"
            border
            size="small"
            style="margin-bottom: 10px"
          >
            <el-table-column label="参数名" prop="name"></el-table-column>
            <el-table-column label="类型" prop="type" width="100"></el-table-column>
            <el-table-column label="必填" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.required ? 'danger' : 'info'" size="small">
                  {{ scope.row.required ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="描述" prop="description"></el-table-column>
          </el-table>
          <div v-if="api.responseExample" class="json-preview">
            <pre>{{ api.responseExample }}</pre>
          </div>
        </div>
      </el-card>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'ApiDocDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    apis: { type: Array, default: () => [] }
  },
  emits: ['update:modelValue'],
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(v) {
        this.$emit('update:modelValue', v)
      }
    }
  }
}
</script>

<style scoped>
.api-doc-container {
  max-height: 45vh;
  overflow-y: auto;
  padding-right: 10px;
}
.api-doc-container::-webkit-scrollbar {
  width: 6px;
}
.api-doc-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
.api-doc-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
.api-card {
  margin-bottom: 15px;
}
.api-header {
  display: flex;
  align-items: center;
}
.api-content {
  padding: 10px 0;
}
.json-preview {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow: auto;
  max-height: 500px;
}
.json-preview pre {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
}
</style>
