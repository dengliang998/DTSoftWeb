<template>
  <div class="menus-container dt-page-shell">
    <section class="menu-workbench dt-workbench">
      <div class="menu-commandbar dt-commandbar">
        <div class="menu-title dt-page-title">
          <h1>菜单维护</h1>
          <p>维护导航、微应用入口和扩展页面。拖拽同级菜单可调整排序。</p>
        </div>
        <div class="command-actions dt-command-actions">
          <el-button class="ghost-action dt-ghost-action" :icon="Refresh" :loading="sortSaving" @click="getMenuList">
            刷新
          </el-button>
          <el-button type="primary" :icon="Plus" @click="showAddDialog">新建菜单</el-button>
        </div>
      </div>

      <div class="menu-toolbar dt-toolbar">
        <el-input
          v-model="queryInfo.query"
          clearable
          class="menu-search dt-search"
          placeholder="搜索菜单名称、路径或图标"
          @clear="bindTableDrag"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="filter-tabs dt-filter-tabs">
          <button
            v-for="item in filterOptions"
            :key="item.value"
            type="button"
            :class="['filter-tab', 'dt-filter-tab', { 'is-active': activeFilter === item.value }]"
            @click="activeFilter = item.value"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="toolbar-actions dt-toolbar-actions">
          <el-button class="ghost-action dt-ghost-action" :icon="ArrowDown" @click="setAllRowsExpanded(true)">
            展开
          </el-button>
          <el-button class="ghost-action dt-ghost-action" :icon="ArrowUp" @click="setAllRowsExpanded(false)">
            收起
          </el-button>
        </div>
      </div>

      <div class="menu-table-panel dt-panel">
        <div class="table-panel__header dt-panel__header">
          <div>
            <strong>菜单结构</strong>
            <span>{{ tableSummaryText }}</span>
          </div>
          <div class="table-panel__meta dt-panel__meta">
            <span class="metric-chip dt-chip">全部 {{ menuStats.total }}</span>
            <span class="metric-chip dt-chip dt-chip--success">微应用 {{ menuStats.micro }}</span>
            <span class="metric-chip dt-chip">扩展页 {{ menuStats.custom }}</span>
            <span class="metric-chip metric-chip--warning dt-chip dt-chip--warning">隐藏 {{ menuStats.hidden }}</span>
            <span v-if="sortSaving" class="saving-pill dt-chip dt-chip--success">排序保存中</span>
          </div>
        </div>

        <el-table
          ref="menuTableRef"
          :data="filteredMenuList"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          class="table-wrapper dt-table"
          empty-text="暂无匹配菜单"
          :row-class-name="getMenuRowClassName"
          @expand-change="bindTableDrag"
        >
          <el-table-column label="#" width="112" align="center" class-name="rank-column">
            <template #default="scope">
              <span class="rank-cell">
                <el-icon class="menu-drag-handle">
                  <Rank />
                </el-icon>
                <span class="index-chip dt-index-chip">{{ indexMethod(scope.$index) }}</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="菜单" prop="menuName" min-width="320">
            <template #default="scope">
              <div class="menu-name-cell dt-name-cell">
                <span class="menu-icon-shell dt-icon-shell">
                  <el-icon v-if="scope.row.icon && ElementPlusIconsVue[scope.row.icon]">
                    <component :is="ElementPlusIconsVue[scope.row.icon]" />
                  </el-icon>
                  <el-icon v-else><Grid /></el-icon>
                </span>
                <span class="menu-name-copy dt-name-copy">
                  <strong>{{ scope.row.menuName || '未命名菜单' }}</strong>
                  <small>{{ getChildrenLabel(scope.row) }}</small>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" prop="menuType" width="116">
            <template #default="scope">
              <span :class="['type-badge', 'dt-badge', `type-badge--${scope.row.menuType}`]">
                {{ getMenuTypeMeta(scope.row.menuType).label }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="路径" prop="path" min-width="260">
            <template #default="scope">
              <code class="path-code dt-code">{{ scope.row.path || '未设置' }}</code>
            </template>
          </el-table-column>
          <el-table-column label="图标" prop="icon" min-width="120">
            <template #default="scope">
              <span class="icon-name dt-muted-pill">{{ scope.row.icon || '默认' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" prop="visible" width="96">
            <template #default="scope">
              <span
                :class="[
                  'visibility-badge',
                  'dt-badge',
                  scope.row.visible ? 'is-visible dt-badge--success' : 'is-hidden dt-badge--danger'
                ]"
              >
                {{ scope.row.visible ? '显示' : '隐藏' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="156" align="right">
            <template #default="scope">
              <div class="operation-buttons dt-operation-buttons">
                <el-tooltip content="添加子菜单" placement="top">
                  <el-button
                    class="icon-action icon-action--add dt-icon-action dt-icon-action--add"
                    :icon="Plus"
                    :disabled="isMenuLevelExceeded(scope.row.id)"
                    @click="showAddChildDialog(scope.row.id)"
                  />
                </el-tooltip>
                <el-tooltip content="编辑菜单" placement="top">
                  <el-button
                    class="icon-action icon-action--edit dt-icon-action dt-icon-action--edit"
                    :icon="Edit"
                    @click="showEditDialog(scope.row)"
                  />
                </el-tooltip>
                <el-tooltip content="删除菜单" placement="top">
                  <el-button
                    class="icon-action icon-action--danger dt-icon-action dt-icon-action--danger"
                    :icon="Delete"
                    @click="removeMenu(scope.row.id)"
                  />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <!-- 添加菜单对话框 -->
    <MenuFormDialog
      v-model="addDialogVisible"
      :title="dialogTitle"
      :form="addForm"
      :form-rules="addFormRules"
      :menu-options="menuOptions"
      :action="currentAction"
      @submit="addMenu"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import { Search, Plus, Edit, Delete, Rank, Refresh, ArrowDown, ArrowUp, Grid } from '@element-plus/icons-vue'
import MenuFormDialog from './components/MenuFormDialog.vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { addMenu as addMenuApi, deleteMenu, getMenu, updateMenu } from '@/api/menu'

const MENU_TYPES = {
  0: { label: '自定义', tagType: 'info' },
  1: { label: '微应用', tagType: 'success' },
  2: { label: '扩展页面', tagType: 'warning' }
}

export default {
  name: 'Menus',
  components: {
    MenuFormDialog
  },
  setup() {
    const { proxy } = getCurrentInstance()

    const queryInfo = reactive({
      query: '',
      // 当前的页数
      pagenum: 1,
      // 当前每页显示多少条数据
      pagesize: 10
    })

    // 菜单列表
    const menuList = ref([])
    const menuTableRef = ref(null)
    const draggingMenuId = ref(null)
    const rowDragCleanups = []
    const sortSaving = ref(false)
    const activeFilter = ref('all')
    // 菜单选项（用于上级菜单选择）
    const menuOptions = ref([])
    // 是否显示添加菜单对话框
    const addDialogVisible = ref(false)
    const dialogTitle = ref('添加菜单')
    // 添加菜单的表单数据
    const addForm = reactive({
      parentId: 0,
      menuName: '',
      menuType: '0',
      path: '',
      microAppPath: '',
      customPageRoute: '',
      component: '',
      perms: '',
      icon: '',
      orderNum: 0,
      visible: true
    })
    // 添加表单验证规则
    const addFormRules = {
      menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }]
    }
    // 当前操作类型（添加/编辑）
    const currentAction = ref('add')
    // 编辑时的菜单ID
    const editMenuId = ref(0)
    const editMenuParentId = ref(0)

    const iconNames = Object.keys(ElementPlusIconsVue).filter((k) => k && k !== 'default')

    const normalizePath = (path) => String(path || '').replace(/^\/+/, '')

    const inferMenuType = (item) => {
      const path = normalizePath(item.path || item.MenuPath)
      if (path.startsWith('app/')) return '1'
      if (path.startsWith('custom/')) return '2'

      const rawType = item.MenuType ?? item.MType ?? item.menuType
      return Object.prototype.hasOwnProperty.call(MENU_TYPES, String(rawType)) ? String(rawType) : '0'
    }

    const getMenuTypeMeta = (menuType) => MENU_TYPES[String(menuType)] || MENU_TYPES[0]

    const filterOptions = [
      { label: '全部', value: 'all' },
      { label: '微应用', value: '1' },
      { label: '扩展页面', value: '2' },
      { label: '自定义', value: '0' },
      { label: '隐藏', value: 'hidden' }
    ]

    const flattenMenuList = (menus) => {
      return menus.reduce((list, menu) => {
        list.push(menu)
        if (menu.children?.length) list.push(...flattenMenuList(menu.children))
        return list
      }, [])
    }

    const allMenus = computed(() => flattenMenuList(menuList.value))

    const menuStats = computed(() => {
      return allMenus.value.reduce(
        (stats, menu) => {
          stats.total += 1
          if (String(menu.menuType) === '1') stats.micro += 1
          if (String(menu.menuType) === '2') stats.custom += 1
          if (!menu.visible) stats.hidden += 1
          return stats
        },
        { total: 0, micro: 0, custom: 0, hidden: 0 }
      )
    })

    const matchesActiveFilter = (menu) => {
      if (activeFilter.value === 'all') return true
      if (activeFilter.value === 'hidden') return !menu.visible
      return String(menu.menuType) === activeFilter.value
    }

    const matchesKeyword = (menu, keyword) => {
      if (!keyword) return true
      const haystack = [menu.menuName, menu.path, menu.icon, getMenuTypeMeta(menu.menuType).label]
        .join(' ')
        .toLowerCase()
      return haystack.includes(keyword)
    }

    const filterMenuTree = (menus, keyword) => {
      return menus
        .map((menu) => {
          const children = filterMenuTree(menu.children || [], keyword)
          const selfMatched = matchesActiveFilter(menu) && matchesKeyword(menu, keyword)
          if (!selfMatched && !children.length) return null
          return { ...menu, children }
        })
        .filter(Boolean)
    }

    const filteredMenuList = computed(() => {
      const keyword = queryInfo.query.trim().toLowerCase()
      if (!keyword && activeFilter.value === 'all') return menuList.value
      return filterMenuTree(menuList.value, keyword)
    })

    const filteredFlatMenus = computed(() => flattenMenuList(filteredMenuList.value))

    const tableSummaryText = computed(() => {
      const count = filteredFlatMenus.value.length
      if (count === menuStats.value.total) return `共 ${count} 项`
      return `筛选出 ${count} / ${menuStats.value.total} 项`
    })

    const getChildrenLabel = (menu) => {
      const count = menu.children?.length || 0
      return count ? `${count} 个子菜单` : menu.path || '未配置路由'
    }

    const setAllRowsExpanded = async (expanded) => {
      await nextTick()
      const table = menuTableRef.value
      if (!table) return

      filteredFlatMenus.value.forEach((menu) => {
        if (menu.children?.length) table.toggleRowExpansion(menu, expanded)
      })
      bindTableDrag()
    }

    const extractMicroAppPath = (path) => {
      const normalizedPath = normalizePath(path)
      if (!normalizedPath) return ''
      const match = normalizedPath.match(/^app\/([^/?#]+)/i)
      return match ? decodeURIComponent(match[1]) : ''
    }

    const extractCustomPageRoute = (path) => {
      const normalizedPath = normalizePath(path)
      return normalizedPath.startsWith('custom/') ? normalizedPath : ''
    }

    const updateMenuOptions = () => {
      menuOptions.value = [{ id: 0, menuName: '主类目', children: [...menuList.value] }]
    }

    // 获取菜单列表
    const getMenuList = async () => {
      const loading = proxy.$loading({
        lock: true,
        text: '加载中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })

      try {
        // 使用正确的Menu/GetMenu接口获取菜单列表
        const { data: res } = await getMenu()
        if (res.success) {
          // 转换数据结构以适配前端组件
          const transformedData = transformMenuData(res.data)
          menuList.value = sortMenuTree(handleTree(transformedData, 'id'))
          updateMenuOptions()
          bindTableDrag()
        } else {
          proxy.$message.error('获取菜单列表失败')
        }
      } catch (error) {
        proxy.$message.error('获取菜单列表失败：' + error.message)
      } finally {
        loading.close()
      }
    }

    // 转换菜单数据结构以适配前端组件
    const transformMenuData = (data) => {
      if (!Array.isArray(data)) return []

      return data.map((item) => ({
        id: item.id,
        parentId: item.pid || item.parentId,
        menuName: item.MenuName || item.menuName,
        menuType: inferMenuType(item),
        path: item.path || item.MenuPath || '',
        orderNum: item.order || item.Order || 0,
        icon: item.Icon || item.icon || '',
        visible: !(item.IsHidden || item.isHidden),
        children: item.children ? transformMenuData(item.children) : []
      }))
    }

    // 处理菜单数据为树形结构
    const handleTree = (data, id, parentId, children) => {
      id = id || 'id'
      parentId = parentId || 'parentId'
      children = children || 'children'

      if (!Array.isArray(data)) {
        console.warn('Data must be an array')
        return []
      }

      const map = {}
      const result = []

      // 构建映射关系
      data.forEach((item) => {
        map[item[id]] = { ...item }
      })

      // 构建树形结构
      data.forEach((item) => {
        const parent = map[item[parentId]]
        if (parent && item[id] !== item[parentId]) {
          ;(parent[children] || (parent[children] = [])).push(map[item[id]])
        } else {
          result.push(map[item[id]])
        }
      })

      return result
    }

    const sortMenuTree = (menus) => {
      return menus
        .map((menu) => ({
          ...menu,
          children: sortMenuTree(menu.children || [])
        }))
        .sort((a, b) => Number(a.orderNum || 0) - Number(b.orderNum || 0))
    }

    // 处理行号
    const indexMethod = (index) => {
      return index + 1
    }

    const findMenuById = (menus, menuId) => {
      for (const menu of menus) {
        if (String(menu.id) === String(menuId)) return menu

        const match = findMenuById(menu.children || [], menuId)
        if (match) return match
      }

      return null
    }

    const getSiblingsByParentId = (parentId) => {
      if (String(parentId || 0) === '0') return menuList.value

      const parent = findMenuById(menuList.value, parentId)
      return parent?.children || []
    }

    const getNextOrderByParent = (parentId) => {
      const siblings = getSiblingsByParentId(parentId)
      if (!siblings.length) return 10

      const maxOrder = Math.max(...siblings.map((menu) => Number(menu.orderNum || 0)))
      return maxOrder + 10
    }

    const getMenuRowClassName = ({ row }) => `menu-drag-row menu-row-id-${row.id}`

    const clearTableDrag = () => {
      while (rowDragCleanups.length) {
        rowDragCleanups.pop()()
      }
    }

    const getRowIdFromElement = (rowElement) => {
      const className = Array.from(rowElement.classList).find((name) => name.startsWith('menu-row-id-'))
      return className ? className.replace('menu-row-id-', '') : ''
    }

    const persistSiblingOrder = async (siblings, changedIds) => {
      const updates = siblings
        .map((menu, index) => ({
          menu,
          orderNum: (index + 1) * 10
        }))
        .filter(({ menu, orderNum }) => changedIds.has(String(menu.id)) || Number(menu.orderNum || 0) !== orderNum)

      for (const { menu, orderNum } of updates) {
        const formData = new FormData()
        formData.append('ItemId', menu.id)
        formData.append('Pid', menu.parentId || 0)
        formData.append('MenuName', menu.menuName || '')
        formData.append('MenuPath', menu.path || '')
        formData.append('Order', orderNum)
        formData.append('Icon', menu.icon || '')
        formData.append('IsHidden', !menu.visible)
        formData.append('MType', menu.menuType || '0')

        await updateMenu(formData)
        menu.orderNum = orderNum
      }
    }

    const handleRowDrop = async (event, targetId) => {
      event.preventDefault()
      event.currentTarget.classList.remove('menu-row-drop-target')

      const sourceId = draggingMenuId.value
      draggingMenuId.value = null
      if (!sourceId || String(sourceId) === String(targetId) || sortSaving.value) return

      const source = findMenuById(menuList.value, sourceId)
      const target = findMenuById(menuList.value, targetId)
      if (!source || !target) return

      if (String(source.parentId || 0) !== String(target.parentId || 0)) {
        proxy.$message.warning('只能在同级菜单内拖拽排序')
        return
      }

      const siblings = getSiblingsByParentId(source.parentId)
      const sourceIndex = siblings.findIndex((menu) => String(menu.id) === String(sourceId))
      const targetIndex = siblings.findIndex((menu) => String(menu.id) === String(targetId))
      if (sourceIndex < 0 || targetIndex < 0) return

      const rowRect = event.currentTarget.getBoundingClientRect()
      const insertAfter = event.clientY > rowRect.top + rowRect.height / 2
      const movedRows = siblings.splice(sourceIndex, 1)
      const moved = movedRows[0]
      const nextTargetIndex = siblings.findIndex((menu) => String(menu.id) === String(targetId))
      siblings.splice(insertAfter ? nextTargetIndex + 1 : nextTargetIndex, 0, moved)

      const changedIds = new Set([String(sourceId), String(targetId)])
      sortSaving.value = true

      try {
        await persistSiblingOrder(siblings, changedIds)
        updateMenuOptions()
        bindTableDrag()
        proxy.$message.success('菜单排序已更新')
      } catch (error) {
        proxy.$message.error('菜单排序保存失败：' + (error.response?.data?.Msg || error.message))
        getMenuList()
      } finally {
        sortSaving.value = false
      }
    }

    const bindTableDrag = async () => {
      clearTableDrag()
      await nextTick()

      const tableElement = menuTableRef.value?.$el
      if (!tableElement) return

      const rows = tableElement.querySelectorAll('.el-table__body-wrapper tbody tr.menu-drag-row')
      rows.forEach((row) => {
        const rowId = getRowIdFromElement(row)
        if (!rowId) return

        row.setAttribute('draggable', 'true')

        const onDragStart = (event) => {
          if (!event.target.closest('.menu-drag-handle')) {
            event.preventDefault()
            return
          }

          draggingMenuId.value = rowId
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', rowId)
          row.classList.add('menu-row-dragging')
        }
        const onDragOver = (event) => {
          if (!draggingMenuId.value || draggingMenuId.value === rowId) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
          row.classList.add('menu-row-drop-target')
        }
        const onDragLeave = () => row.classList.remove('menu-row-drop-target')
        const onDrop = (event) => handleRowDrop(event, rowId)
        const onDragEnd = () => {
          draggingMenuId.value = null
          row.classList.remove('menu-row-dragging', 'menu-row-drop-target')
        }

        row.addEventListener('dragstart', onDragStart)
        row.addEventListener('dragover', onDragOver)
        row.addEventListener('dragleave', onDragLeave)
        row.addEventListener('drop', onDrop)
        row.addEventListener('dragend', onDragEnd)

        rowDragCleanups.push(() => {
          row.removeEventListener('dragstart', onDragStart)
          row.removeEventListener('dragover', onDragOver)
          row.removeEventListener('dragleave', onDragLeave)
          row.removeEventListener('drop', onDrop)
          row.removeEventListener('dragend', onDragEnd)
          row.removeAttribute('draggable')
        })
      })
    }

    watch([() => queryInfo.query, activeFilter], () => {
      bindTableDrag()
    })

    // 判断菜单层级是否超过限制（超过2级返回true）
    const isMenuLevelExceeded = (menuId) => {
      // 计算当前菜单的层级
      const calculateMenuLevel = (menus, targetId, currentLevel = 0) => {
        for (let menu of menus) {
          if (menu.id === targetId) {
            return currentLevel
          }
          if (menu.children && menu.children.length > 0) {
            const level = calculateMenuLevel(menu.children, targetId, currentLevel + 1)
            if (level !== -1) {
              return level
            }
          }
        }
        return -1
      }

      // 获取当前菜单的层级
      const currentLevel = calculateMenuLevel(menuList.value, menuId)

      // 如果当前已经是三级菜单（层级为2），则返回true表示超过限制
      return currentLevel >= 2
    }

    // 显示添加子菜单对话框
    const showAddChildDialog = (parentId) => {
      // 先检查是否超过层级限制
      if (isMenuLevelExceeded(parentId)) {
        proxy.$message.warning('菜单最多只能添加到三级')
        return
      }

      dialogTitle.value = '添加子菜单'
      currentAction.value = 'add'
      editMenuParentId.value = 0
      Object.assign(addForm, {
        parentId: parentId,
        menuName: '',
        menuType: '0',
        path: '',
        microAppPath: '',
        customPageRoute: '',
        component: '',
        perms: '',
        icon: '',
        orderNum: getNextOrderByParent(parentId),
        visible: true
      })
      addDialogVisible.value = true
    }

    // 显示添加菜单对话框
    const showAddDialog = () => {
      dialogTitle.value = '添加菜单'
      currentAction.value = 'add'
      editMenuParentId.value = 0
      Object.assign(addForm, {
        parentId: 0,
        menuName: '',
        menuType: '0',
        path: '',
        microAppPath: '',
        customPageRoute: '',
        component: '',
        perms: '',
        icon: '',
        orderNum: getNextOrderByParent(0),
        visible: true
      })
      addDialogVisible.value = true
    }

    // 显示编辑菜单对话框
    const showEditDialog = (menu) => {
      dialogTitle.value = '修改菜单'
      currentAction.value = 'edit'
      editMenuId.value = menu.id
      editMenuParentId.value = menu.parentId || 0

      Object.assign(addForm, {
        parentId: menu.parentId || 0, // 确保parentId有默认值
        menuName: menu.menuName,
        menuType: menu.menuType || '0',
        path: menu.path,
        microAppPath: extractMicroAppPath(menu.path),
        customPageRoute: extractCustomPageRoute(menu.path),
        component: menu.component || '',
        perms: menu.perms || '',
        icon: menu.icon,
        orderNum: menu.orderNum,
        visible: menu.visible
      })
      addDialogVisible.value = true
    }

    // 关闭添加对话框 (handled by MenuFormDialog component)

    // 添加或修改菜单
    const addMenu = async () => {
      const loading = proxy.$loading({
        lock: true,
        text: '提交中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })

      try {
        const resolvedPath =
          addForm.menuType === '1' && addForm.microAppPath
            ? `app/${addForm.microAppPath}`
            : addForm.menuType === '2' && addForm.customPageRoute
              ? addForm.customPageRoute
              : addForm.path

        if (!resolvedPath) {
          proxy.$message.warning('请选择或填写菜单路由')
          return
        }

        const parentChanged = String(editMenuParentId.value || 0) !== String(addForm.parentId || 0)
        const resolvedOrder =
          currentAction.value === 'add' || parentChanged ? getNextOrderByParent(addForm.parentId) : addForm.orderNum

        let res
        if (currentAction.value === 'add') {
          // 添加菜单
          const formData = new FormData()
          formData.append('MType', addForm.menuType)
          formData.append('MenuName', addForm.menuName)
          formData.append('Pid', addForm.parentId)
          formData.append('MenuPath', resolvedPath)
          formData.append('Order', resolvedOrder)
          if (addForm.icon !== null && addForm.icon !== undefined && addForm.icon !== '') {
            formData.append('Icon', addForm.icon)
          }
          formData.append('IsHidden', !addForm.visible) // 注意：visible与IsHidden是相反的含义

          res = await addMenuApi(formData)
        } else {
          // 修改菜单 - 使用新的 UpdateMenu 接口
          const formData = new FormData()
          formData.append('ItemId', editMenuId.value)
          formData.append('Pid', addForm.parentId)
          formData.append('MenuName', addForm.menuName)

          // 只有当path不为空时才添加到formData中
          if (resolvedPath !== null && resolvedPath !== undefined && resolvedPath !== '') {
            formData.append('MenuPath', resolvedPath)
          }

          formData.append('Order', resolvedOrder)

          // 只有当icon不为空时才添加到formData中
          if (addForm.icon !== null && addForm.icon !== undefined && addForm.icon !== '') {
            formData.append('Icon', addForm.icon)
          }

          formData.append('IsHidden', !addForm.visible) // 注意：visible与IsHidden是相反的含义

          // 确保MType有正确的值
          const mTypeValue = addForm.menuType !== undefined ? addForm.menuType : '0'
          formData.append('MType', mTypeValue)

          res = await updateMenu(formData)
        }

        // 检查响应数据结构并正确处理成功/失败情况
        if (res.data.StateCode === 0 && res.data.success) {
          proxy.$message.success(currentAction.value === 'add' ? '添加菜单成功' : '修改菜单成功')
          addDialogVisible.value = false
          getMenuList()
        } else {
          proxy.$message.error(res.data.msg || res.data.message || '操作失败')
        }
      } catch (error) {
        proxy.$message.error(
          (currentAction.value === 'add' ? '添加' : '修改') +
            '菜单失败：' +
            (error.response?.data?.message || error.message)
        )
      } finally {
        loading.close()
      }
    }

    // 删除菜单
    const removeMenu = async (id) => {
      try {
        await proxy.$confirm('此操作将永久删除该菜单, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        // 使用FormData格式发送menuid参数
        const formData = new FormData()
        formData.append('menuid', id)

        const res = await deleteMenu(formData)

        // 根据新的响应格式检查删除成功与否
        if (res.data.StateCode === 0 && res.data.success) {
          proxy.$message.success(res.data.Msg || '删除菜单成功')
          getMenuList()
        } else {
          proxy.$message.error(res.data.Msg || '删除菜单失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          proxy.$message.error(
            '删除菜单失败：' + (error.response?.data?.Msg || error.response?.data?.message || error.message)
          )
        }
      }
    }

    onMounted(() => {
      getMenuList()
    })

    onBeforeUnmount(() => {
      clearTableDrag()
    })

    return {
      queryInfo,
      menuList,
      menuTableRef,
      filteredMenuList,
      filterOptions,
      activeFilter,
      menuStats,
      sortSaving,
      tableSummaryText,
      menuOptions,
      addDialogVisible,
      dialogTitle,
      addForm,
      addFormRules,
      currentAction,
      editMenuId,
      editMenuParentId,
      iconNames,
      ElementPlusIconsVue,
      getMenuTypeMeta,
      getChildrenLabel,
      setAllRowsExpanded,
      getMenuRowClassName,
      indexMethod,
      getMenuList,
      showAddDialog,
      showAddChildDialog,
      showEditDialog,
      bindTableDrag,
      addMenu,
      removeMenu,
      isMenuLevelExceeded, // 添加这一行以导出函数
      // 图标
      Search,
      Plus,
      Edit,
      Delete,
      Rank,
      Refresh,
      ArrowDown,
      ArrowUp,
      Grid
    }
  }
}
</script>

<style scoped>
.menus-container {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #101828;
  background: #eef3f7;
}

.menu-workbench {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
}

.menu-commandbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 46px;
  padding: 6px 8px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.menu-title {
  min-width: 0;
}

.menu-title h1 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 780;
  line-height: 1.15;
  letter-spacing: 0;
}

.menu-title p {
  margin: 2px 0 0;
  color: #5c667a;
  font-size: 13px;
  line-height: 1.35;
}

.command-actions,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.menu-toolbar {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: minmax(260px, 360px) 1fr auto;
  gap: 6px;
  align-items: center;
  min-height: 42px;
  padding: 5px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.menu-search {
  width: 100%;
}

.menu-search :deep(.el-input__wrapper) {
  min-height: 34px;
  border-radius: 7px;
  background: #f8fafc;
  box-shadow: 0 0 0 1px #d8e2ec inset;
}

.menu-search :deep(.el-input__wrapper.is-focus) {
  background: #ffffff;
  box-shadow:
    0 0 0 1px var(--dt-primary-light) inset,
    0 0 0 3px var(--dt-primary-focus);
}

.filter-tabs {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 7px;
  background: #edf2f7;
  overflow-x: auto;
}

.filter-tab {
  appearance: none;
  border: 0;
  border-radius: 5px;
  padding: 6px 11px;
  color: #526071;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;
}

.filter-tab:hover {
  color: var(--dt-primary);
}

.filter-tab:active {
  transform: translateY(1px);
}

.filter-tab.is-active {
  color: #0f172a;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.menu-table-panel {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.08);
}

.table-panel__header {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 9px 12px 9px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e5edf5;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.table-panel__header strong {
  display: block;
  color: #0f172a;
  font-size: 14px;
  font-weight: 760;
}

.table-panel__header span {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
}

.table-panel__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.metric-chip {
  display: inline-flex !important;
  align-items: center;
  min-height: 24px;
  margin-top: 0 !important;
  padding: 0 8px;
  border: 1px solid #d9e5ee;
  border-radius: 999px;
  color: #465568 !important;
  background: #f7fafc;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.metric-chip--warning {
  color: #9a5b13 !important;
  border-color: #f0d8a8;
  background: #fff8e6;
}

.saving-pill {
  flex: 0 0 auto;
  padding: 5px 9px;
  border-radius: 999px;
  color: var(--dt-primary) !important;
  background: var(--dt-primary-soft);
  font-size: 12px;
  font-weight: 700;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  margin-top: 0;
  font-size: 13px;
}

.table-wrapper :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.table-wrapper :deep(.el-table__header-wrapper th) {
  height: 40px;
  border-bottom: 1px solid #dfe8f1;
  background: #f6f9fc !important;
  color: #596779;
  font-size: 12px;
  font-weight: 760;
}

.table-wrapper :deep(.el-table__body-wrapper) {
  background: #ffffff;
}

.table-wrapper :deep(.el-table__row td) {
  border-bottom: 1px solid #edf2f7;
}

.table-wrapper :deep(.el-table__row:hover > td) {
  background: #f7fbfb !important;
}

.table-wrapper :deep(.rank-column .cell) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  padding: 0 8px;
}

.table-wrapper :deep(.el-table__expand-icon) {
  width: 24px;
  height: 24px;
  margin-right: 0;
  border-radius: 6px;
  color: #728197;
  transition:
    color 0.18s ease,
    background 0.18s ease;
}

.table-wrapper :deep(.el-table__expand-icon:hover) {
  color: var(--dt-primary);
  background: var(--dt-primary-soft);
}

.table-wrapper :deep(.el-table__placeholder) {
  width: 12px;
}

.menu-drag-handle {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d8e2ec;
  border-radius: 7px;
  background: #ffffff;
  cursor: grab;
  color: #9aa7b8;
  font-size: 16px;
  transition:
    color 0.18s ease,
    transform 0.18s ease;
}

.menu-drag-handle:hover {
  border-color: #9fd6cd;
  color: var(--dt-primary-light);
  background: var(--dt-primary-soft);
}

.menu-drag-handle:active {
  cursor: grabbing;
  transform: scale(0.94);
}

.table-wrapper :deep(.menu-row-dragging) {
  opacity: 0.55;
}

.table-wrapper :deep(.menu-row-drop-target td) {
  background: var(--dt-primary-soft) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dt-primary) 35%, transparent);
}

.menu-name-cell {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.rank-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.menu-icon-shell {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--dt-primary);
  background: var(--dt-primary-soft);
  font-size: 17px;
}

.menu-name-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-name-copy strong {
  max-width: 220px;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  font-weight: 740;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-name-copy small {
  max-width: 260px;
  overflow: hidden;
  color: #7a8798;
  font-size: 12px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-badge,
.visibility-badge,
.index-chip,
.icon-name {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 999px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 720;
  white-space: nowrap;
}

.type-badge {
  border: 1px solid transparent;
}

.type-badge--0 {
  color: #475569;
  border-color: #d7dee8;
  background: #f5f7fa;
}

.type-badge--1 {
  color: var(--dt-primary);
  border-color: var(--dt-primary-border);
  background: var(--dt-primary-soft);
}

.type-badge--2 {
  color: #8a5a00;
  border-color: #f0dca8;
  background: #fff7df;
}

.path-code {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  padding: 5px 8px;
  border-radius: 6px;
  color: #344054;
  background: #f4f7fb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  line-height: 1.2;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

.icon-name {
  max-width: 110px;
  overflow: hidden;
  color: #667085;
  background: #f6f8fb;
  text-overflow: ellipsis;
}

.index-chip {
  min-width: 24px;
  justify-content: center;
  color: #155e75;
  background: #e6f4f7;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
}

.visibility-badge.is-visible {
  color: #166534;
  background: #e8f7ec;
}

.visibility-badge.is-hidden {
  color: #9a3412;
  background: #fff1e7;
}

.operation-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
}

.icon-action {
  width: 30px;
  height: 30px;
  min-width: 30px;
  padding: 0;
  border-color: #d7e0eb;
  border-radius: 8px;
  color: #475569;
  background: #ffffff;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    background 0.18s ease;
}

.icon-action:hover {
  border-color: var(--dt-primary-light);
  color: var(--dt-primary);
  background: var(--dt-primary-soft);
}

.icon-action:active {
  transform: translateY(1px);
}

.icon-action--add {
  border-color: var(--dt-primary-border);
  color: var(--dt-primary);
  background: var(--dt-primary-soft);
}

.icon-action--add:hover {
  border-color: var(--dt-primary);
  color: #ffffff;
  background: var(--dt-primary);
}

.icon-action--edit {
  border-color: #c8dcff;
  color: #2563eb;
  background: #eff6ff;
}

.icon-action--edit:hover {
  border-color: #2563eb;
  color: #ffffff;
  background: #2563eb;
}

.icon-action--danger {
  border-color: #ffd0c2;
  color: #c2410c;
  background: #fff3ed;
}

.icon-action--danger:hover {
  border-color: #dc2626;
  color: #ffffff;
  background: #dc2626;
}

.ghost-action {
  min-height: 36px;
  border-color: #d3dee9;
  border-radius: 8px;
  color: #344054;
  background: #ffffff;
  font-weight: 700;
}

.ghost-action:hover {
  border-color: var(--dt-primary-light);
  color: var(--dt-primary);
  background: var(--dt-primary-soft);
}

.menus-container :deep(.el-button--primary) {
  min-height: 36px;
  border: 0;
  border-radius: 8px;
  background: var(--dt-primary);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--dt-primary) 20%, transparent);
  font-weight: 740;
}

.menus-container :deep(.el-button--primary:hover) {
  background: var(--dt-primary-hover);
  box-shadow: 0 10px 22px color-mix(in srgb, var(--dt-primary) 24%, transparent);
}

.menus-container :deep(.el-button--primary:active) {
  transform: translateY(1px);
}

.menus-container :deep(.el-button.is-disabled),
.menus-container :deep(.el-button.is-disabled:hover) {
  color: #b4bdc9;
  border-color: #e2e8f0;
  background: #f7f9fc;
  box-shadow: none;
}

@media (max-width: 1180px) {
  .menu-toolbar {
    grid-template-columns: 1fr;
  }

  .toolbar-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  .menus-container {
    min-width: 0;
  }

  .menu-workbench {
    padding: 10px;
  }

  .menu-commandbar {
    flex-direction: column;
    align-items: stretch;
  }

  .command-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .table-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .filter-tabs {
    align-items: stretch;
  }
}
</style>
