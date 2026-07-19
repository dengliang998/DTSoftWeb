<template>
  <div class="dictionary-page dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>字典维护</h1>
          <p>维护系统枚举分类和字典项，支持拖拽调整排序。</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="refreshAll">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openTypeDialog()">新增分类</el-button>
        </div>
      </div>

      <div class="dt-split-workspace dictionary-layout">
        <div class="dt-panel type-panel">
          <div class="dt-panel__header">
            <div>
              <strong>字典分类</strong>
              <span>{{ dictionaryTypes.length }} 个分类</span>
            </div>
            <div class="dt-panel__meta">
              <span class="dt-chip">拖拽排序</span>
            </div>
          </div>

          <div class="type-filter-bar">
            <el-input
              v-model="typeQuery.Keyword"
              clearable
              placeholder="搜索编码或名称"
              class="dt-search"
              @clear="loadTypes"
              @keyup.enter="loadTypes"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <div v-loading="typeLoading" class="type-list">
            <button
              v-for="(type, index) in dictionaryTypes"
              :key="type.ItemId"
              type="button"
              class="type-item"
              :class="{
                active: selectedType && selectedType.ItemId === type.ItemId,
                dragging: typeDraggingId === type.ItemId,
                'drag-over': typeDragOverIndex === index
              }"
              draggable="true"
              @click="handleTypeClick(type)"
              @dragstart="onTypeDragStart($event, index)"
              @dragover="onTypeDragOver($event, index)"
              @drop="onTypeDrop(index)"
              @dragend="onTypeDragEnd"
            >
              <span class="type-drag-handle" title="拖拽排序" @click.stop>
                <el-icon><Rank /></el-icon>
              </span>
              <span class="type-name">{{ type.DictName }}</span>
              <span class="type-code">{{ type.DictCode }}</span>
              <span class="type-count">{{ type.ItemCount || 0 }} 项</span>
            </button>
            <el-empty v-if="!typeLoading && dictionaryTypes.length === 0" description="暂无字典分类" />
          </div>
        </div>

        <div class="dt-panel item-panel">
          <div class="dt-panel__header">
            <div>
              <strong>{{ selectedType ? selectedType.DictName : '字典项' }}</strong>
              <span>{{ selectedType ? selectedType.DictCode : '请选择左侧分类' }}</span>
            </div>
            <div class="dt-panel__meta">
              <span class="dt-chip">字典项 {{ dictionaryItems.length }}</span>
              <span class="dt-chip dt-chip--success">启用 {{ itemStats.enabled }}</span>
              <span class="dt-chip dt-chip--warning">禁用 {{ itemStats.disabled }}</span>
            </div>
          </div>

          <div class="item-toolbar">
            <el-input
              v-model="itemQuery.Keyword"
              clearable
              class="dt-search item-search"
              placeholder="搜索标签、值或备注"
              @clear="loadItems"
              @keyup.enter="loadItems"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <div class="dt-toolbar-actions">
              <el-button class="dt-ghost-action" :disabled="!selectedType" @click="openTypeDialog(selectedType)">
                编辑分类
              </el-button>
              <el-button class="dt-ghost-action danger-ghost" :disabled="!selectedType" @click="removeType">
                删除分类
              </el-button>
              <el-button :disabled="!selectedType" type="primary" :icon="Plus" @click="openItemDialog()">
                新增字典项
              </el-button>
            </div>
          </div>

          <el-table
            ref="itemTable"
            v-loading="itemLoading"
            :data="dictionaryItems"
            :row-style="{ height: '52px' }"
            :cell-style="{ padding: '0px' }"
            row-key="ItemId"
            :row-class-name="itemRowClassName"
            class="table-wrapper dt-table"
            empty-text="暂无字典项"
          >
            <el-table-column label="" width="52" align="center">
              <template #default>
                <el-icon class="item-drag-handle" title="拖拽排序"><Rank /></el-icon>
              </template>
            </el-table-column>
            <el-table-column label="#" width="72" align="center">
              <template #default="scope">
                <span class="dt-index-chip">{{ scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="标签" prop="ItemLabel" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="dt-name-copy">
                  <strong>{{ row.ItemLabel }}</strong>
                  <small>{{ row.Remark || '未设置备注' }}</small>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="值" prop="ItemValue" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <code class="dt-code">{{ row.ItemValue }}</code>
              </template>
            </el-table-column>
            <el-table-column label="标签样式" prop="TagType" width="120">
              <template #default="{ row }">
                <span v-if="row.TagType" class="dt-badge dt-badge--neutral">{{ row.TagType }}</span>
                <span v-else class="dt-muted-pill">默认</span>
              </template>
            </el-table-column>
            <el-table-column label="排序" prop="Sort" width="90">
              <template #default="{ row }">
                <span class="dt-muted-pill">{{ row.Sort }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" prop="Enabled" width="96" align="center">
              <template #default="{ row }">
                <span :class="['dt-badge', row.Enabled ? 'dt-badge--success' : 'dt-badge--warning']">
                  {{ row.Enabled ? '启用' : '禁用' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="启用" prop="Enabled" width="90" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.Enabled" @change="toggleItem(row)"></el-switch>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="108" fixed="right" align="right">
              <template #default="{ row }">
                <div class="dt-operation-buttons dictionary-actions">
                  <el-tooltip content="编辑字典项" placement="top">
                    <el-button class="dt-icon-action dt-icon-action--edit" :icon="Edit" @click="openItemDialog(row)" />
                  </el-tooltip>
                  <el-tooltip content="删除字典项" placement="top">
                    <el-button class="dt-icon-action dt-icon-action--danger" :icon="Delete" @click="removeItem(row)" />
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </section>

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
  saveDictionaryType,
  sortDictionaryItems,
  sortDictionaryTypes
} from '@/api/dictionary'
import { Delete, Edit, Plus, Rank, Refresh, Search } from '@element-plus/icons-vue'
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
  components: {
    Rank
  },
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
      itemForm: createItemForm(),
      typeDragIndex: null,
      typeDraggingId: null,
      typeDragOverIndex: null,
      suppressTypeClick: false,
      itemDragIndex: null
    }
  },
  computed: {
    itemStats() {
      return this.dictionaryItems.reduce(
        (stats, item) => {
          if (item.Enabled) {
            stats.enabled += 1
          } else {
            stats.disabled += 1
          }
          return stats
        },
        { enabled: 0, disabled: 0 }
      )
    }
  },
  created() {
    this.itemRowDragCleanups = []
    this.loadTypes()
  },
  mounted() {
    this.$nextTick(() => this.bindItemRowDragEvents())
  },
  beforeUnmount() {
    this.cleanupItemRowDragEvents()
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
    handleTypeClick(type) {
      if (this.suppressTypeClick) return
      this.selectType(type)
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
          this.$nextTick(() => this.bindItemRowDragEvents())
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
    },
    itemRowClassName() {
      return 'dictionary-item-row'
    },
    onTypeDragStart(event, index) {
      this.typeDragIndex = index
      this.typeDraggingId = this.dictionaryTypes[index]?.ItemId || null
      this.suppressTypeClick = true
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(this.typeDraggingId || ''))
      }
    },
    onTypeDragOver(event, index) {
      event.preventDefault()
      this.typeDragOverIndex = index
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
      }
    },
    async onTypeDrop(targetIndex) {
      const sourceIndex = this.typeDragIndex
      if (sourceIndex === null || sourceIndex === targetIndex) {
        this.onTypeDragEnd()
        return
      }

      const previousTypes = [...this.dictionaryTypes]
      const selectedTypeId = this.selectedType?.ItemId
      this.dictionaryTypes = this.reorderWithSort(this.dictionaryTypes, sourceIndex, targetIndex)
      this.selectedType = selectedTypeId
        ? this.dictionaryTypes.find((type) => type.ItemId === selectedTypeId) || null
        : this.selectedType

      try {
        const { data: res } = await sortDictionaryTypes({
          Items: this.dictionaryTypes.map((type) => ({
            ItemId: type.ItemId,
            Sort: type.Sort
          }))
        })
        if (!res.success) throw new Error(res.Msg || '排序保存失败')
        this.$message.success('排序已保存')
      } catch (error) {
        this.dictionaryTypes = previousTypes
        this.selectedType = selectedTypeId
          ? this.dictionaryTypes.find((type) => type.ItemId === selectedTypeId) || null
          : this.selectedType
        this.$message.error('排序保存失败：' + (error?.message || error))
        await this.loadTypes()
      } finally {
        this.onTypeDragEnd()
      }
    },
    onTypeDragEnd() {
      this.typeDragIndex = null
      this.typeDraggingId = null
      this.typeDragOverIndex = null
      window.setTimeout(() => {
        this.suppressTypeClick = false
      }, 0)
    },
    reorderWithSort(list, sourceIndex, targetIndex) {
      const nextList = [...list]
      const [movedItem] = nextList.splice(sourceIndex, 1)
      nextList.splice(targetIndex, 0, movedItem)
      return nextList.map((item, index) => ({
        ...item,
        Sort: index + 1
      }))
    },
    cleanupItemRowDragEvents() {
      if (!this.itemRowDragCleanups) return
      this.itemRowDragCleanups.forEach((cleanup) => cleanup())
      this.itemRowDragCleanups = []
    },
    bindItemRowDragEvents() {
      this.cleanupItemRowDragEvents()
      const tableElement = this.$refs.itemTable?.$el
      if (!tableElement || !this.dictionaryItems.length) return

      const rows = tableElement.querySelectorAll('.el-table__body-wrapper tbody tr.dictionary-item-row')
      rows.forEach((row, index) => {
        const item = this.dictionaryItems[index]
        if (!item) return

        row.setAttribute('draggable', 'true')
        row.dataset.itemId = String(item.ItemId)

        const onDragStart = (event) => {
          this.itemDragIndex = this.dictionaryItems.findIndex((entry) => String(entry.ItemId) === row.dataset.itemId)
          row.classList.add('dragging')
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', row.dataset.itemId || '')
          }
        }
        const onDragOver = (event) => {
          event.preventDefault()
          row.classList.add('drag-over')
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move'
          }
        }
        const onDragLeave = () => {
          row.classList.remove('drag-over')
        }
        const onDrop = async (event) => {
          event.preventDefault()
          row.classList.remove('drag-over')
          const targetIndex = this.dictionaryItems.findIndex((entry) => String(entry.ItemId) === row.dataset.itemId)
          await this.onItemDrop(targetIndex)
        }
        const onDragEnd = () => {
          row.classList.remove('dragging')
          this.clearItemDragState()
        }

        row.addEventListener('dragstart', onDragStart)
        row.addEventListener('dragover', onDragOver)
        row.addEventListener('dragleave', onDragLeave)
        row.addEventListener('drop', onDrop)
        row.addEventListener('dragend', onDragEnd)
        this.itemRowDragCleanups.push(() => {
          row.removeEventListener('dragstart', onDragStart)
          row.removeEventListener('dragover', onDragOver)
          row.removeEventListener('dragleave', onDragLeave)
          row.removeEventListener('drop', onDrop)
          row.removeEventListener('dragend', onDragEnd)
        })
      })
    },
    async onItemDrop(targetIndex) {
      const sourceIndex = this.itemDragIndex
      if (sourceIndex === null || targetIndex < 0 || sourceIndex === targetIndex) {
        this.clearItemDragState()
        return
      }

      const previousItems = [...this.dictionaryItems]
      this.dictionaryItems = this.reorderWithSort(this.dictionaryItems, sourceIndex, targetIndex)
      this.$nextTick(() => this.bindItemRowDragEvents())

      try {
        const { data: res } = await sortDictionaryItems({
          DictCode: this.selectedType.DictCode,
          Items: this.dictionaryItems.map((item) => ({
            ItemId: item.ItemId,
            Sort: item.Sort
          }))
        })
        if (!res.success) throw new Error(res.Msg || '排序保存失败')
        this.$message.success('排序已保存')
      } catch (error) {
        this.dictionaryItems = previousItems
        this.$message.error('排序保存失败：' + (error?.message || error))
        await this.loadItems()
      } finally {
        this.clearItemDragState()
      }
    },
    clearItemDragState() {
      this.itemDragIndex = null
      const tableElement = this.$refs.itemTable?.$el
      if (!tableElement) return
      tableElement.querySelectorAll('.dictionary-item-row.drag-over, .dictionary-item-row.dragging').forEach((row) => {
        row.classList.remove('drag-over', 'dragging')
      })
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
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
}

.type-panel,
.item-panel {
  min-width: 0;
  min-height: 0;
}

.type-filter-bar,
.item-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border-bottom: 1px solid #e5edf5;
  background: #ffffff;
}

.item-toolbar {
  flex-wrap: wrap;
}

.item-search {
  max-width: 360px;
}

.type-list {
  flex: 1;
  min-height: 0;
  padding: 10px;
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
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 4px 8px;
  padding: 10px 12px;
  border: 1px solid #dbe5ef;
  border-radius: 8px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  margin-bottom: 8px;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.type-item:hover,
.type-item.active {
  border-color: var(--dt-primary-light);
  background: var(--dt-primary-soft);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--dt-primary) 8%, transparent);
}

.type-item.dragging {
  opacity: 0.55;
}

.type-item.drag-over {
  border-color: var(--dt-primary-light);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dt-primary) 45%, transparent);
}

.type-drag-handle {
  grid-column: 1;
  grid-row: 1 / span 2;
  align-self: center;
  color: #9ca3af;
  cursor: grab;
  line-height: 1;
}

.type-drag-handle:active {
  cursor: grabbing;
}

.type-name {
  grid-column: 2;
  color: #172033;
  font-weight: 740;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-code {
  grid-column: 2;
  color: #7a8798;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-count {
  grid-column: 3;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--dt-primary);
  font-size: 12px;
  font-weight: 700;
}

.item-drag-handle {
  color: #9ca3af;
  cursor: grab;
}

.item-drag-handle:active {
  cursor: grabbing;
}

.item-panel :deep(.dictionary-item-row.dragging) {
  opacity: 0.55;
}

.item-panel :deep(.dictionary-item-row.drag-over > td) {
  background-color: var(--dt-primary-soft) !important;
}

.item-panel :deep(.dictionary-item-row[draggable='true']) {
  cursor: default;
}

@media (max-width: 960px) {
  .dictionary-layout {
    grid-template-columns: 1fr;
  }

  .item-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .item-search {
    max-width: none;
  }
}
</style>
