<template>
  <div class="dictionary-page">
    <div class="dictionary-layout">
      <el-card class="type-panel">
        <template #header>
          <div class="panel-header">
            <span>字典分类</span>
            <el-button type="primary" size="small" :icon="Plus" @click="openTypeDialog()">新增</el-button>
          </div>
        </template>

        <el-input
          v-model="typeQuery.Keyword"
          clearable
          placeholder="搜索编码或名称"
          class="type-search"
          @clear="loadTypes"
          @keyup.enter="loadTypes"
        >
          <template #append>
            <el-button :icon="Search" @click="loadTypes"></el-button>
          </template>
        </el-input>

        <div v-loading="typeLoading" class="type-list">
          <button
            v-for="type in dictionaryTypes"
            :key="type.ItemId"
            type="button"
            class="type-item"
            :class="{ active: selectedType && selectedType.ItemId === type.ItemId }"
            @click="selectType(type)"
          >
            <span class="type-name">{{ type.DictName }}</span>
            <span class="type-code">{{ type.DictCode }}</span>
            <span class="type-count">{{ type.ItemCount || 0 }} 项</span>
          </button>
          <el-empty v-if="!typeLoading && dictionaryTypes.length === 0" description="暂无字典分类" />
        </div>
      </el-card>

      <el-card class="item-panel">
        <template #header>
          <div class="panel-header">
            <div class="item-title">
              <span>{{ selectedType ? selectedType.DictName : '字典项' }}</span>
              <el-tag v-if="selectedType" size="small" effect="plain">{{ selectedType.DictCode }}</el-tag>
            </div>
            <div class="item-actions">
              <el-button :icon="Refresh" @click="refreshAll">刷新</el-button>
              <el-button :disabled="!selectedType" @click="openTypeDialog(selectedType)">编辑分类</el-button>
              <el-button :disabled="!selectedType" type="danger" @click="removeType">删除分类</el-button>
              <el-button :disabled="!selectedType" type="primary" :icon="Plus" @click="openItemDialog()">
                新增字典项
              </el-button>
            </div>
          </div>
        </template>

        <div class="item-filter">
          <el-input
            v-model="itemQuery.Keyword"
            clearable
            placeholder="搜索标签、值或备注"
            @clear="loadItems"
            @keyup.enter="loadItems"
          >
            <template #append>
              <el-button :icon="Search" @click="loadItems"></el-button>
            </template>
          </el-input>
        </div>

        <el-table v-loading="itemLoading" :data="dictionaryItems" border stripe class="table-wrapper">
          <el-table-column label="#" type="index" width="64"></el-table-column>
          <el-table-column label="标签" prop="ItemLabel" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column label="值" prop="ItemValue" min-width="160" show-overflow-tooltip></el-table-column>
          <el-table-column label="标签样式" prop="TagType" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.TagType" :type="row.TagType" effect="light">{{ row.TagType }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="排序" prop="Sort" width="90"></el-table-column>
          <el-table-column label="启用" prop="Enabled" width="90" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.Enabled" @change="toggleItem(row)"></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="Remark" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <div class="operation-buttons">
                <el-button type="primary" size="small" :icon="Edit" @click="openItemDialog(row)"></el-button>
                <el-button type="danger" size="small" :icon="Delete" @click="removeItem(row)"></el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="typeDialogVisible" :title="typeForm.ItemId ? '编辑字典分类' : '新增字典分类'" width="520px">
      <el-form ref="typeFormRef" :model="typeForm" label-width="96px">
        <el-form-item
          label="字典编码"
          prop="DictCode"
          :rules="[{ required: true, message: '请输入字典编码', trigger: 'blur' }]"
        >
          <el-input v-model="typeForm.DictCode" placeholder="例如：order_status"></el-input>
        </el-form-item>
        <el-form-item
          label="字典名称"
          prop="DictName"
          :rules="[{ required: true, message: '请输入字典名称', trigger: 'blur' }]"
        >
          <el-input v-model="typeForm.DictName" placeholder="请输入字典名称"></el-input>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="typeForm.Sort" :min="0" :max="9999"></el-input-number>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="typeForm.Enabled"></el-switch>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="typeForm.Description" type="textarea" :rows="3" maxlength="500" show-word-limit></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingType" @click="saveType">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="itemDialogVisible" :title="itemForm.ItemId ? '编辑字典项' : '新增字典项'" width="560px">
      <el-form ref="itemFormRef" :model="itemForm" label-width="96px">
        <el-form-item
          label="标签"
          prop="ItemLabel"
          :rules="[{ required: true, message: '请输入标签', trigger: 'blur' }]"
        >
          <el-input v-model="itemForm.ItemLabel" placeholder="页面显示文本"></el-input>
        </el-form-item>
        <el-form-item label="值" prop="ItemValue" :rules="[{ required: true, message: '请输入值', trigger: 'blur' }]">
          <el-input v-model="itemForm.ItemValue" placeholder="控件提交值"></el-input>
        </el-form-item>
        <el-form-item label="标签样式">
          <el-select v-model="itemForm.TagType" clearable placeholder="可选">
            <el-option label="success" value="success"></el-option>
            <el-option label="warning" value="warning"></el-option>
            <el-option label="danger" value="danger"></el-option>
            <el-option label="info" value="info"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.Sort" :min="0" :max="9999"></el-input-number>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="itemForm.Enabled"></el-switch>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="itemForm.Remark" type="textarea" :rows="3" maxlength="500" show-word-limit></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingItem" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  deleteDictionaryItem,
  deleteDictionaryType,
  getDictionaryItems,
  getDictionaryTypes,
  saveDictionaryItem,
  saveDictionaryType
} from '@/api/dictionary'
import { Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

const createTypeForm = () => ({
  ItemId: null,
  DictCode: '',
  DictName: '',
  Description: '',
  Enabled: true,
  Sort: 0
})

const createItemForm = () => ({
  ItemId: null,
  DictCode: '',
  ItemLabel: '',
  ItemValue: '',
  TagType: '',
  Remark: '',
  Enabled: true,
  Sort: 0
})

export default {
  name: 'Dictionaries',
  data() {
    return {
      Plus: markRaw(Plus),
      Search: markRaw(Search),
      Refresh: markRaw(Refresh),
      Edit: markRaw(Edit),
      Delete: markRaw(Delete),
      typeLoading: false,
      itemLoading: false,
      savingType: false,
      savingItem: false,
      dictionaryTypes: [],
      dictionaryItems: [],
      selectedType: null,
      typeQuery: {
        Keyword: ''
      },
      itemQuery: {
        Keyword: ''
      },
      typeDialogVisible: false,
      itemDialogVisible: false,
      typeForm: createTypeForm(),
      itemForm: createItemForm()
    }
  },
  created() {
    this.loadTypes()
  },
  methods: {
    async refreshAll() {
      await this.loadTypes()
      if (this.selectedType) {
        await this.loadItems()
      }
    },
    async loadTypes() {
      this.typeLoading = true
      try {
        const { data: res } = await getDictionaryTypes(this.typeQuery)
        if (res.success) {
          this.dictionaryTypes = res.data || []
          if (this.dictionaryTypes.length > 0) {
            const current = this.selectedType
              ? this.dictionaryTypes.find((type) => type.ItemId === this.selectedType.ItemId)
              : this.dictionaryTypes[0]
            this.selectType(current || this.dictionaryTypes[0])
          } else {
            this.selectedType = null
            this.dictionaryItems = []
          }
        } else {
          this.$message.error(res.Msg || '字典分类获取失败')
        }
      } catch (error) {
        this.$message.error('字典分类获取失败：' + (error?.message || error))
      } finally {
        this.typeLoading = false
      }
    },
    selectType(type) {
      this.selectedType = type
      this.itemQuery.Keyword = ''
      this.loadItems()
    },
    async loadItems() {
      if (!this.selectedType) {
        this.dictionaryItems = []
        return
      }

      this.itemLoading = true
      try {
        const { data: res } = await getDictionaryItems({
          DictCode: this.selectedType.DictCode,
          Keyword: this.itemQuery.Keyword
        })
        if (res.success) {
          this.dictionaryItems = res.data || []
        } else {
          this.$message.error(res.Msg || '字典项获取失败')
        }
      } catch (error) {
        this.$message.error('字典项获取失败：' + (error?.message || error))
      } finally {
        this.itemLoading = false
      }
    },
    openTypeDialog(row) {
      this.typeForm = row ? { ...row } : createTypeForm()
      this.typeDialogVisible = true
    },
    async saveType() {
      await this.$refs.typeFormRef.validate()
      this.savingType = true
      try {
        const { data: res } = await saveDictionaryType(this.typeForm)
        if (res.success) {
          this.$message.success('保存成功')
          this.typeDialogVisible = false
          await this.loadTypes()
        } else {
          this.$message.error(res.Msg || '保存失败')
        }
      } catch (error) {
        this.$message.error('保存失败：' + (error?.message || error))
      } finally {
        this.savingType = false
      }
    },
    async removeType() {
      if (!this.selectedType) return
      try {
        await this.$confirm(`确定删除字典“${this.selectedType.DictName}”及其所有字典项吗？`, '提示', {
          type: 'warning'
        })
      } catch (error) {
        return
      }

      const { data: res } = await deleteDictionaryType(this.selectedType.ItemId)
      if (res.success) {
        this.$message.success('删除成功')
        this.selectedType = null
        await this.loadTypes()
      } else {
        this.$message.error(res.Msg || '删除失败')
      }
    },
    openItemDialog(row) {
      if (!this.selectedType) return
      this.itemForm = row ? { ...row } : { ...createItemForm(), DictCode: this.selectedType.DictCode }
      this.itemDialogVisible = true
    },
    async saveItem() {
      await this.$refs.itemFormRef.validate()
      this.savingItem = true
      try {
        const { data: res } = await saveDictionaryItem({
          ...this.itemForm,
          DictCode: this.selectedType.DictCode
        })
        if (res.success) {
          this.$message.success('保存成功')
          this.itemDialogVisible = false
          await this.loadItems()
          await this.loadTypes()
        } else {
          this.$message.error(res.Msg || '保存失败')
        }
      } catch (error) {
        this.$message.error('保存失败：' + (error?.message || error))
      } finally {
        this.savingItem = false
      }
    },
    async toggleItem(row) {
      try {
        const { data: res } = await saveDictionaryItem({
          ItemId: row.ItemId,
          DictCode: row.DictCode,
          ItemLabel: row.ItemLabel,
          ItemValue: row.ItemValue,
          TagType: row.TagType,
          Remark: row.Remark,
          Enabled: row.Enabled,
          Sort: row.Sort
        })
        if (res.success) return

        row.Enabled = !row.Enabled
        this.$message.error(res.Msg || '状态更新失败')
      } catch (error) {
        row.Enabled = !row.Enabled
        this.$message.error('状态更新失败：' + (error?.message || error))
      }
    },
    async removeItem(row) {
      try {
        await this.$confirm(`确定删除字典项“${row.ItemLabel}”吗？`, '提示', {
          type: 'warning'
        })
      } catch (error) {
        return
      }

      const { data: res } = await deleteDictionaryItem(row.ItemId)
      if (res.success) {
        this.$message.success('删除成功')
        await this.loadItems()
        await this.loadTypes()
      } else {
        this.$message.error(res.Msg || '删除失败')
      }
    }
  }
}
</script>

<style lang="less" scoped>
.dictionary-page {
  height: 100%;
  min-height: 0;
}

.dictionary-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.type-panel,
.item-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: 8px;
}

.type-panel :deep(.el-card__body),
.item-panel :deep(.el-card__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.item-title,
.item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.type-search,
.item-filter {
  margin-bottom: 12px;
}

.type-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.item-panel .table-wrapper {
  flex: 1;
  min-height: 0;
}

.item-panel .table-wrapper :deep(.el-table__inner-wrapper) {
  height: 100%;
}

.type-item {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 8px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  margin-bottom: 8px;
}

.type-item:hover,
.type-item.active {
  border-color: #409eff;
  background: #f0f7ff;
}

.type-name {
  color: #111827;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-code {
  grid-column: 1;
  color: #6b7280;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-count {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: #059669;
  font-size: 12px;
}

@media (max-width: 960px) {
  .dictionary-layout {
    grid-template-columns: 1fr;
  }
}
</style>
