<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="title" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="100px" :rules="formRules">
      <el-row>
        <el-col :span="12">
          <el-form-item label="上级菜单" prop="parentId">
            <el-tree-select
              v-model="form.parentId"
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
            <el-radio-group v-model="form.menuType">
              <el-radio value="0">内部菜单</el-radio>
              <el-radio value="1">外部菜单</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="菜单名称" prop="menuName">
        <el-input v-model="form.menuName" placeholder="请输入菜单名称"></el-input>
      </el-form-item>
      <el-row>
        <el-col :span="12">
          <el-form-item label="显示排序" prop="orderNum">
            <el-input-number v-model="form.orderNum" controls-position="right" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否可见" prop="visible">
            <el-radio-group v-model="form.visible">
              <el-radio :value="true">显示</el-radio>
              <el-radio :value="false">隐藏</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item v-if="form.menuType !== 'F'" label="路由地址" prop="path">
        <el-input v-model="form.path" placeholder="请输入路由地址"></el-input>
      </el-form-item>
      <el-form-item v-if="form.menuType !== '1'" label="微应用路径" prop="microAppPath">
        <el-select
          v-model="form.microAppPath"
          clearable
          filterable
          placeholder="可选：选择已创建微应用"
          style="width: 100%"
          @change="handleMicroAppPathChange"
        >
          <el-option
            v-for="app in microAppOptions"
            :key="app.value"
            :label="`${app.label} (${app.value})`"
            :value="app.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-show="false" label="组件路径" prop="component">
        <el-input v-model="form.component" placeholder="请输入组件路径"></el-input>
      </el-form-item>
      <el-form-item label="菜单图标" prop="icon">
        <el-select v-model="form.icon" filterable clearable placeholder="请选择图标（可搜索）" style="width: 100%">
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
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
/* eslint-disable vue/no-mutating-props */
import { getMicroAppConfigs } from '@/api/microApp'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default {
  name: 'MenuFormDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '添加菜单' },
    form: { type: Object, default: () => ({}) },
    formRules: { type: Object, default: () => ({}) },
    menuOptions: { type: Array, default: () => [] },
    action: { type: String, default: 'add' }
  },
  emits: ['update:modelValue', 'submit'],
  data() {
    return {
      microAppOptions: [],
      iconNames: Object.keys(ElementPlusIconsVue).filter((k) => k && k !== 'default'),
      ElementPlusIconsVue
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
    }
  },
  watch: {
    modelValue(val) {
      if (val) this.loadMicroApps()
    }
  },
  methods: {
    async loadMicroApps() {
      try {
        const { data: res } = await getMicroAppConfigs({ PageNum: 1, PageSize: 1000 })
        if (!res.success || !Array.isArray(res.data)) {
          this.microAppOptions = []
          return
        }
        this.microAppOptions = res.data
          .map((item) => {
            const value = item.MicroAppPath || item.ApiPrefix || item.ModelName
            if (!value) return null
            return { label: item.ConfigName || item.ModelName || value, value }
          })
          .filter(Boolean)
      } catch {
        this.microAppOptions = []
      }
    },
    handleMicroAppPathChange(value) {
      if (!value) return
      this.form.path = `app/${value}`
    },
    handleClose() {
      if (this.$refs.formRef) this.$refs.formRef.resetFields()
    },
    submit() {
      this.$emit('submit')
    }
  }
}
</script>

<style scoped>
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
