<template>
  <el-dialog v-model="dialogVisible" :title="title" width="760px" append-to-body :close-on-click-modal="false">
    <el-table
      v-loading="loading"
      :data="rows"
      border
      stripe
      height="360"
      @selection-change="$emit('selection-change', $event)"
      @row-dblclick="$emit('row-dblclick', $event)"
    >
      <el-table-column v-if="mode === 'subTable'" type="selection" width="48"></el-table-column>
      <el-table-column
        v-for="column in columns"
        :key="column.field"
        :prop="column.field"
        :label="column.label"
        :width="column.width || undefined"
        show-overflow-tooltip
      ></el-table-column>
      <el-table-column v-if="mode === 'field'" :label="$t('common.actions')" width="80" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="$emit('select-row', row)">
            {{ $t('microRuntime.selectData') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="lookup-pagination">
      <el-pagination
        layout="total, prev, pager, next"
        :total="total"
        :page-size="query.pageSize"
        :current-page="query.pageNum"
        @current-change="$emit('page-change', $event)"
      ></el-pagination>
    </div>
    <template v-if="mode === 'subTable'" #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="selectedCount === 0" @click="$emit('confirm')">
          {{ $t('microRuntime.confirmSelection') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'MicroAppLookupDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    rows: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    mode: { type: String, default: 'field' },
    total: { type: Number, default: 0 },
    query: { type: Object, default: () => ({ pageNum: 1, pageSize: 10 }) },
    selectedCount: { type: Number, default: 0 }
  },
  emits: ['update:modelValue', 'selection-change', 'row-dblclick', 'select-row', 'page-change', 'confirm'],
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  }
}
</script>

<style scoped>
.lookup-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
</style>
