<template>
  <el-dialog
    v-model="dialogVisible"
    class="menu-auth-dialog"
    width="720px"
    align-center
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <template #header>
      <div class="menu-auth-header">
        <div>
          <div class="menu-auth-title">菜单权限配置</div>
          <div class="menu-auth-subtitle">角色编码：{{ roleId || '-' }}</div>
        </div>
        <el-tag type="info" effect="plain">已选 {{ selectedCount }} 项</el-tag>
      </div>
    </template>
    <div class="menu-auth-panel">
      <div class="menu-auth-toolbar">
        <el-input
          v-model="filterKeyword"
          clearable
          placeholder="搜索已加载菜单"
          prefix-icon="Search"
          class="menu-auth-search"
        ></el-input>
        <div class="menu-auth-actions">
          <el-button size="small" icon="Expand" @click="expandAll">展开</el-button>
          <el-button size="small" icon="Fold" @click="collapseAll">收起</el-button>
          <el-button class="menu-auth-clear-button" size="small" plain icon="Delete" @click="clearChecked">
            清空
          </el-button>
        </div>
      </div>
      <div class="menu-auth-meta">
        <span>菜单权限树</span>
        <span v-if="halfCheckedMenuCount">半选 {{ halfCheckedMenuCount }} 项</span>
      </div>
      <el-scrollbar class="menu-tree-scrollbar">
        <div class="menu-tree-surface">
          <el-tree
            v-if="dialogVisible"
            ref="treeRef"
            class="menu-auth-tree"
            :data="treeData"
            :props="treeProps"
            :filter-node-method="filterNode"
            node-key="id"
            show-checkbox
            default-expand-all
            empty-text="暂无菜单"
            @check="syncStats"
          ></el-tree>
        </div>
      </el-scrollbar>
    </div>
    <template #footer>
      <div class="menu-auth-footer">
        <span>将保存 {{ selectedCount }} 个菜单权限节点</span>
        <div>
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" icon="Setting" @click="save">保存权限</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { getMenu, getRoleMenuMap, updateMenuAuthority } from '@/api/menu'

export default {
  name: 'MenuAuthDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    roleId: { type: [Number, String], default: '' }
  },
  emits: ['update:modelValue', 'success'],
  data() {
    return {
      treeData: [],
      TreeChecked: [],
      HalfChecked: [],
      selectedMenuCount: 0,
      halfCheckedMenuCount: 0,
      filterKeyword: '',
      treeProps: { label: 'MenuName', children: 'children' }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(v) {
        this.$emit('update:modelValue', v)
      }
    },
    selectedCount() {
      return new Set(this.TreeChecked.concat(this.HalfChecked)).size
    }
  },
  watch: {
    filterKeyword(value) {
      this.$nextTick(() => {
        if (this.$refs.treeRef) this.$refs.treeRef.filter(value)
      })
    },
    modelValue(val) {
      if (val) this.loadData()
    }
  },
  methods: {
    async loadData() {
      this.TreeChecked = []
      this.HalfChecked = []
      this.treeData = []
      this.filterKeyword = ''
      this.selectedMenuCount = 0
      this.halfCheckedMenuCount = 0
      try {
        const [menuResponse, roleMenuResponse] = await Promise.all([getMenu(), getRoleMenuMap(this.roleId)])
        const menuData = menuResponse.data.data || menuResponse.data
        const roleMenuData = Array.isArray(roleMenuResponse.data.data) ? roleMenuResponse.data.data : []
        this.treeData = this.buildTree(this.normalizeItems(menuData))
        const checkedIds = []
        roleMenuData.forEach((item) => {
          if (item.pid != 0) checkedIds.push(item.MenuID)
        })
        this.TreeChecked = this.getLeafCheckedKeys(checkedIds, this.treeData)
        this.selectedMenuCount = this.TreeChecked.length
        this.halfCheckedMenuCount = 0
        this.$nextTick(() => {
          if (this.$refs.treeRef) {
            this.$refs.treeRef.setCheckedKeys(this.TreeChecked)
            this.syncStats()
          }
        })
      } catch (error) {
        this.$message.error('数据初始化失败，请稍后重试！')
      }
    },
    normalizeItems(menuList, parentId = 0) {
      if (!Array.isArray(menuList)) return []
      return menuList.reduce((result, item) => {
        const id = item.id ?? item.MenuID ?? item.menuId
        const pid = item.pid ?? item.parentId ?? item.Pid ?? item.ParentId ?? parentId
        const children = item.children || item.Children || []
        result.push({
          id,
          pid,
          MenuName: item.MenuName || item.menuName || item.name || '',
          order: item.order ?? item.Order ?? item.orderNum ?? 0
        })
        return result.concat(this.normalizeItems(children, id))
      }, [])
    },
    buildTree(menuList) {
      const map = {}
      const tree = []
      menuList.forEach((item) => {
        if (item.id !== undefined && item.id !== null) map[item.id] = { ...item, children: [] }
      })
      menuList.forEach((item) => {
        const node = map[item.id]
        if (!node) return
        const parent = map[item.pid]
        if (parent && item.id !== item.pid) parent.children.push(node)
        else tree.push(node)
      })
      const sort = (menus) => {
        menus.sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        menus.forEach((m) => sort(m.children))
      }
      sort(tree)
      return tree
    },
    getLeafCheckedKeys(checkedKeys, menuTree) {
      const parentKeys = new Set()
      const collect = (menus) => {
        menus.forEach((m) => {
          if (m.children && m.children.length > 0) {
            parentKeys.add(String(m.id))
            collect(m.children)
          }
        })
      }
      collect(menuTree)
      return checkedKeys.filter((k) => !parentKeys.has(String(k)))
    },
    filterNode(value, data) {
      if (!value) return true
      return String(data.MenuName || '')
        .toLowerCase()
        .includes(value.toLowerCase())
    },
    syncStats() {
      this.$nextTick(() => {
        if (!this.$refs.treeRef) {
          this.selectedMenuCount = this.TreeChecked.length
          this.HalfChecked = []
          this.halfCheckedMenuCount = 0
          return
        }
        this.TreeChecked = this.$refs.treeRef.getCheckedKeys()
        this.HalfChecked = this.$refs.treeRef.getHalfCheckedKeys()
        this.selectedMenuCount = this.TreeChecked.length
        this.halfCheckedMenuCount = this.HalfChecked.length
      })
    },
    expandAll() {
      const tree = this.$refs.treeRef
      if (!tree || !tree.store || !tree.store.nodesMap) return
      Object.keys(tree.store.nodesMap).forEach((k) => {
        tree.store.nodesMap[k].expanded = true
      })
    },
    collapseAll() {
      const tree = this.$refs.treeRef
      if (!tree || !tree.store || !tree.store.nodesMap) return
      Object.keys(tree.store.nodesMap).forEach((k) => {
        tree.store.nodesMap[k].expanded = false
      })
    },
    clearChecked() {
      if (!this.$refs.treeRef) return
      this.TreeChecked = []
      this.HalfChecked = []
      this.$refs.treeRef.setCheckedKeys([])
      this.syncStats()
    },
    save() {
      const me = this
      const MenuID = me.$refs.treeRef.getCheckedKeys().concat(me.$refs.treeRef.getHalfCheckedKeys())
      updateMenuAuthority({ roleId: me.roleId, menuIds: MenuID })
        .then(function (response) {
          if (response.data.success) {
            me.$message.success(response.data.Msg)
            me.dialogVisible = false
            me.$emit('success')
          } else {
            me.$message.error(response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('操作失败，请稍后重试！')
        })
    },
    handleClose() {
      this.filterKeyword = ''
      this.treeData = []
      this.selectedMenuCount = 0
      this.halfCheckedMenuCount = 0
    }
  }
}
</script>

<style scoped>
.menu-auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-right: 28px;
}
.menu-auth-title {
  color: #1f2d3d;
  font-size: 17px;
  font-weight: 700;
  line-height: 24px;
}
.menu-auth-subtitle {
  margin-top: 4px;
  color: #7a8797;
  font-size: 12px;
  line-height: 18px;
}
.menu-auth-panel {
  padding: 12px 16px 14px;
}
.menu-auth-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.menu-auth-search {
  flex: 1;
  min-width: 220px;
}
.menu-auth-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
}
.menu-auth-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
.menu-auth-clear-button {
  color: #c03535;
  border-color: #f0b4b4;
  background: #fff5f5;
}
.menu-auth-clear-button:hover,
.menu-auth-clear-button:focus {
  color: #fff;
  border-color: #d94a4a;
  background: #d94a4a;
}
.menu-auth-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 22px;
  margin-bottom: 10px;
  color: #7a8797;
  font-size: 12px;
}
.menu-tree-scrollbar {
  height: clamp(220px, 40vh, 360px);
  border: 1px solid #dfe7f1;
  border-radius: 8px;
  background: #fff;
}
.menu-tree-surface {
  min-height: 100%;
  padding: 10px 8px;
}
.menu-auth-tree {
  min-width: 100%;
  color: #263445;
  background: transparent;
}
.menu-auth-tree :deep(.el-tree-node__content) {
  height: 34px;
  border-radius: 6px;
}
.menu-auth-tree :deep(.el-tree-node__content:hover) {
  background: #eef6ff;
}
.menu-auth-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #7a8797;
  font-size: 12px;
}
:deep(.menu-auth-dialog) {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 56px);
  max-width: calc(100vw - 48px);
  border-radius: 10px;
  overflow: hidden;
}
:deep(.menu-auth-dialog .el-dialog__header) {
  margin: 0;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #e8edf3;
}
:deep(.menu-auth-dialog .el-dialog__body) {
  flex: 1;
  min-height: 0;
  padding: 0;
  background: #f6f8fb;
  overflow: hidden;
}
:deep(.menu-auth-dialog .el-dialog__footer) {
  padding: 12px 20px;
  border-top: 1px solid #e8edf3;
  background: #fff;
}
@media (max-width: 900px) {
  :deep(.menu-auth-dialog) {
    width: calc(100vw - 32px) !important;
  }
  .menu-auth-toolbar,
  .menu-auth-footer {
    align-items: stretch;
    flex-direction: column;
  }
  .menu-auth-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .menu-tree-scrollbar {
    height: clamp(210px, 42vh, 320px);
  }
}
</style>
