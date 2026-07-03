<template>
  <div class="menus-container">
    <!-- 卡片视图区域 -->
    <el-card class="table-card">
      <!-- 搜索与添加区域 -->
      <el-row :gutter="20">
        <el-col :span="7">
          <!-- 搜索与添加区域 -->
          <el-input v-model="queryInfo.query" clearable placeholder="请输入菜单名称" @clear="getMenuList">
            <template #append>
              <el-button :icon="Search" @click="getMenuList"></el-button>
            </template>
          </el-input>
        </el-col>

        <el-col :span="4">
          <el-button type="primary" @click="showAddDialog">添加菜单</el-button>
        </el-col>
      </el-row>

      <!-- 菜单树形列表区域 -->
      <el-table
        :data="menuList"
        :row-style="{ height: '40px' }"
        :cell-style="{ padding: '0px' }"
        border
        stripe
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        class="table-wrapper"
      >
        <el-table-column label="#" type="index" :index="indexMethod"></el-table-column>
        <el-table-column label="菜单名称" prop="menuName"></el-table-column>
        <el-table-column label="菜单路径" prop="path"></el-table-column>
        <el-table-column label="图标" prop="icon"></el-table-column>
        <el-table-column label="排序" prop="orderNum"></el-table-column>
        <el-table-column label="可见" prop="visible">
          <template #default="scope">
            <el-tag v-if="scope.row.visible" type="success">显示</el-tag>
            <el-tag v-else type="danger">隐藏</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230px">
          <template #default="scope">
            <div class="operation-buttons">
              <!-- 添加子菜单 -->
              <el-button
                type="primary"
                size="small"
                :icon="Plus"
                :disabled="isMenuLevelExceeded(scope.row.id)"
                @click="showAddChildDialog(scope.row.id)"
              >
                >
              </el-button>
              <!-- 修改按钮 -->
              <el-button type="primary" size="small" :icon="Edit" @click="showEditDialog(scope.row)"></el-button>
              <!-- 删除按钮 -->
              <el-button type="danger" size="small" :icon="Delete" @click="removeMenu(scope.row.id)"></el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加菜单对话框 -->
    <el-dialog v-model="addDialogVisible" :title="dialogTitle" width="50%" @close="addDialogClosed">
      <!-- 内容主体区域 -->
      <el-form ref="addFormRef" :model="addForm" label-width="100px" :rules="addFormRules">
        <el-row>
          <el-col :span="12">
            <el-form-item label="上级菜单" prop="parentId">
              <el-tree-select
                v-model="addForm.parentId"
                :data="menuOptions"
                node-key="id"
                :props="{ label: 'menuName', children: 'children' }"
                value-key="id"
                placeholder="请选择上级菜单"
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="addForm.menuType">
                <el-radio value="0">内部菜单</el-radio>
                <el-radio value="1">外部菜单</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="addForm.menuName" placeholder="请输入菜单名称"></el-input>
        </el-form-item>

        <el-row>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="addForm.orderNum" controls-position="right" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否可见" prop="visible">
              <el-radio-group v-model="addForm.visible">
                <el-radio :value="true">显示</el-radio>
                <el-radio :value="false">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item v-if="addForm.menuType !== 'F'" label="路由地址" prop="path">
          <el-input v-model="addForm.path" placeholder="请输入路由地址"></el-input>
        </el-form-item>

        <el-form-item v-show="false" label="组件路径" prop="component">
          <el-input v-model="addForm.component" placeholder="请输入组件路径"></el-input>
        </el-form-item>

        <!-- 权限标识字段已移除，因为已移除按钮类型 -->

        <el-form-item label="菜单图标" prop="icon">
          <el-select v-model="addForm.icon" filterable clearable placeholder="请选择图标（可搜索）" style="width: 100%">
            <el-option v-for="name in iconNames" :key="name" :label="name" :value="name">
              <div class="icon-option">
                <el-icon class="icon-option__icon">
                  <component :is="ElementPlusIconsVue[name]" />
                </el-icon>
                <span class="icon-option__name">{{ name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <!-- 底部区域 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="addMenu">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import axios from '@/api/http'

export default {
  name: 'Menus',
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
    // 菜单选项（用于上级菜单选择）
    const menuOptions = ref([])
    // 是否显示添加菜单对话框
    const addDialogVisible = ref(false)
    const dialogTitle = ref('添加菜单')
    // 添加菜单的表单数据
    const addForm = reactive({
      parentId: 0,
      menuName: '',
      menuType: '0', // 修改为字符串类型，确保默认选中内部菜单
      path: '',
      component: '',
      perms: '',
      icon: '',
      orderNum: 0,
      visible: true
    })
    // 添加表单验证规则
    const addFormRules = {
      menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
      orderNum: [{ required: true, message: '请输入显示排序', trigger: 'blur' }]
    }
    // 当前操作类型（添加/编辑）
    const currentAction = ref('add')
    // 编辑时的菜单ID
    const editMenuId = ref(0)

    const iconNames = Object.keys(ElementPlusIconsVue).filter((k) => k && k !== 'default')

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
        const { data: res } = await axios.get('/api/Menu/GetMenu')
        if (res.success) {
          // 转换数据结构以适配前端组件
          const transformedData = transformMenuData(res.data)
          menuList.value = handleTree(transformedData, 'id')
          menuOptions.value = [{ id: 0, menuName: '主类目', children: [...menuList.value] }]
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
        menuType: String(item.MenuType || item.MType || item.menuType || '0'),
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

    // 处理行号
    const indexMethod = (index) => {
      return index + 1
    }

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
      Object.assign(addForm, {
        parentId: parentId,
        menuName: '',
        menuType: '0', // 修改为字符串类型，确保默认选中内部菜单
        path: '',
        component: '',
        perms: '',
        icon: '',
        orderNum: 0,
        visible: true
      })
      addDialogVisible.value = true
    }

    // 显示添加菜单对话框
    const showAddDialog = () => {
      dialogTitle.value = '添加菜单'
      currentAction.value = 'add'
      Object.assign(addForm, {
        parentId: 0,
        menuName: '',
        menuType: '0',
        path: '',
        component: '',
        perms: '',
        icon: '',
        orderNum: 0,
        visible: true
      })
      addDialogVisible.value = true
    }

    // 显示编辑菜单对话框
    const showEditDialog = (menu) => {
      dialogTitle.value = '修改菜单'
      currentAction.value = 'edit'
      editMenuId.value = menu.id

      // 确保menuType是正确的字符串值
      let menuTypeValue = '0' // 默认值
      if (menu.hasOwnProperty('menuType')) {
        menuTypeValue = String(menu.menuType || '0')
      }

      Object.assign(addForm, {
        parentId: menu.parentId || 0, // 确保parentId有默认值
        menuName: menu.menuName,
        menuType: menuTypeValue,
        path: menu.path,
        component: menu.component || '',
        perms: menu.perms || '',
        icon: menu.icon,
        orderNum: menu.orderNum,
        visible: menu.visible
      })
      addDialogVisible.value = true
    }

    // 关闭添加对话框
    const addDialogClosed = () => {
      proxy.$refs.addFormRef.resetFields()
      Object.assign(addForm, {
        parentId: 0,
        menuName: '',
        menuType: '0', // 修改为字符串类型，确保默认选中内部菜单
        path: '',
        component: '',
        perms: '',
        icon: '',
        orderNum: 0,
        visible: true
      })
    }

    // 添加或修改菜单
    const addMenu = () => {
      proxy.$refs.addFormRef.validate(async (valid) => {
        if (!valid) return

        const loading = proxy.$loading({
          lock: true,
          text: '提交中...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })

        try {
          let res
          if (currentAction.value === 'add') {
            // 添加菜单
            const formData = new FormData()
            formData.append('MType', addForm.menuType) // 0:内部菜单 1:外部菜单
            formData.append('MenuName', addForm.menuName)
            formData.append('Pid', addForm.parentId)
            formData.append('MenuPath', addForm.path)
            formData.append('Order', addForm.orderNum)
            if (addForm.icon !== null && addForm.icon !== undefined && addForm.icon !== '') {
              formData.append('Icon', addForm.icon)
            }
            formData.append('IsHidden', !addForm.visible) // 注意：visible与IsHidden是相反的含义

            res = await axios.post('/api/Menu/AddMenu', formData)
          } else {
            // 修改菜单 - 使用新的 UpdateMenu 接口
            const formData = new FormData()
            formData.append('ItemId', editMenuId.value)
            formData.append('Pid', addForm.parentId)
            formData.append('MenuName', addForm.menuName)

            // 只有当path不为空时才添加到formData中
            if (addForm.path !== null && addForm.path !== undefined && addForm.path !== '') {
              formData.append('MenuPath', addForm.path)
            }

            formData.append('Order', addForm.orderNum)

            // 只有当icon不为空时才添加到formData中
            if (addForm.icon !== null && addForm.icon !== undefined && addForm.icon !== '') {
              formData.append('Icon', addForm.icon)
            }

            formData.append('IsHidden', !addForm.visible) // 注意：visible与IsHidden是相反的含义

            // 确保MType有正确的值
            const mTypeValue = addForm.menuType !== undefined ? addForm.menuType : '0'
            formData.append('MType', mTypeValue)

            res = await axios.post('/api/Menu/UpdateMenu', formData)
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
      })
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

        const res = await axios.post('/api/Menu/DelMenu', formData)

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

    return {
      queryInfo,
      menuList,
      menuOptions,
      addDialogVisible,
      dialogTitle,
      addForm,
      addFormRules,
      currentAction,
      editMenuId,
      iconNames,
      ElementPlusIconsVue,
      indexMethod,
      getMenuList,
      showAddDialog,
      showAddChildDialog,
      showEditDialog,
      addDialogClosed,
      addMenu,
      removeMenu,
      isMenuLevelExceeded, // 添加这一行以导出函数
      // 图标
      Search,
      Plus,
      Edit,
      Delete
    }
  }
}
</script>

<style scoped>
.menus-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.table-wrapper {
  flex: 1;
  margin-top: 15px;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 5px;
}

.icon-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-option__icon {
  font-size: 16px;
}

.icon-option__name {
  font-size: 13px;
}
</style>
