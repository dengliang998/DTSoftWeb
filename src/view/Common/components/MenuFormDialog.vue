<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" class="menu-form-dialog" :title="title" width="760px" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="86px" :rules="formRules" class="menu-form">
      <el-form-item :label="$t('menuPage.form.menuType')" prop="menuType" class="menu-type-row">
        <el-radio-group v-model="form.menuType" class="menu-type-group" @change="handleMenuTypeChange">
          <el-radio-button v-for="type in typeOptions" :key="type.value" :value="type.value">
            <el-icon><component :is="ElementPlusIconsVue[type.icon]" /></el-icon>
            <span>{{ type.label }}</span>
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <div class="field-grid">
        <el-form-item :label="$t('menuPage.form.parent')" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="menuOptions"
            node-key="id"
            :props="{ label: 'displayName', children: 'children' }"
            value-key="id"
            :placeholder="$t('menuPage.form.parentPlaceholder')"
            check-strictly
            class="field-control"
          />
        </el-form-item>

        <el-form-item :label="$t('menuPage.form.name')" prop="menuName">
          <el-input v-model="form.menuName" :placeholder="$t('menuPage.form.namePlaceholder')" class="field-control" />
        </el-form-item>

        <el-form-item :label="$t('menuPage.resourceKey')" prop="i18nKey">
          <el-input v-model="form.i18nKey" :placeholder="$t('menuPage.form.keyPlaceholder')" class="field-control" />
        </el-form-item>

        <el-form-item
          v-if="form.menuType === '0'"
          :label="$t('menuPage.form.internalRoute')"
          prop="path"
          class="is-wide"
        >
          <el-input v-model="form.path" :placeholder="$t('menuPage.form.routePlaceholder')" class="field-control">
            <template #prefix>
              <el-icon><LinkIcon /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item
          v-if="form.menuType === '2'"
          :label="$t('menuPage.form.customPage')"
          prop="customPageRoute"
          class="is-wide"
        >
          <el-select
            v-model="form.customPageRoute"
            clearable
            filterable
            :placeholder="$t('menuPage.form.customPagePlaceholder')"
            class="field-control"
            @change="handleCustomPageChange"
          >
            <el-option
              v-for="page in customPageOptions"
              :key="page.routePath"
              :label="`${page.title} (${page.routePath})`"
              :value="page.routePath"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="form.menuType === '1'"
          :label="$t('menuPage.form.microApp')"
          prop="microAppPath"
          class="is-wide"
        >
          <el-select
            v-model="form.microAppPath"
            clearable
            filterable
            :placeholder="$t('menuPage.form.microAppPlaceholder')"
            class="field-control"
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

        <el-form-item v-if="form.menuType !== '0'" :label="$t('menuPage.form.finalRoute')" prop="path" class="is-wide">
          <el-input
            v-model="form.path"
            disabled
            :placeholder="$t('menuPage.form.autoRoutePlaceholder')"
            class="field-control"
          >
            <template #prefix>
              <el-icon><LinkIcon /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="$t('menuPage.form.icon')" prop="icon">
          <el-select
            v-model="form.icon"
            filterable
            clearable
            :placeholder="$t('menuPage.form.iconPlaceholder')"
            class="field-control"
          >
            <template #prefix>
              <el-icon v-if="form.icon && ElementPlusIconsVue[form.icon]">
                <component :is="ElementPlusIconsVue[form.icon]" />
              </el-icon>
              <el-icon v-else><Document /></el-icon>
            </template>
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

        <el-form-item :label="$t('menuPage.form.visibility')" prop="visible">
          <el-radio-group v-model="form.visible" class="visibility-group">
            <el-radio-button :value="true">{{ $t('menuPage.visible') }}</el-radio-button>
            <el-radio-button :value="false">{{ $t('menuPage.hidden') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </div>

      <div class="route-summary">
        <span>{{ $t('menuPage.form.finalRoute') }}</span>
        <code>{{ routePreview }}</code>
      </div>

      <el-form-item v-show="false" :label="$t('menuPage.form.componentPath')" prop="component">
        <el-input v-model="form.component" :placeholder="$t('menuPage.form.componentPlaceholder')"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submit">
          <el-icon><Check /></el-icon>
          {{ $t('common.save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
/* eslint-disable vue/no-mutating-props */
import { getMicroAppConfigs } from '@/api/microApp'
import { getCustomPageEntries } from '@/custom-pages/registry'
import { Check, Document, Link as LinkIcon } from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default {
  name: 'MenuFormDialog',
  components: {
    Check,
    Document,
    LinkIcon
  },
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    form: { type: Object, default: () => ({}) },
    formRules: { type: Object, default: () => ({}) },
    menuOptions: { type: Array, default: () => [] },
    action: { type: String, default: 'add' }
  },
  emits: ['update:modelValue', 'submit'],
  data() {
    return {
      microAppOptions: [],
      customPageOptions: [],
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
    },
    routePreview() {
      if (this.form.menuType === '1' && this.form.microAppPath) return `app/${this.form.microAppPath}`
      if (this.form.menuType === '2' && this.form.customPageRoute) return this.form.customPageRoute
      return this.form.path || this.$t('menuPage.form.pendingRoute')
    },
    typeOptions() {
      return [
        {
          value: '1',
          label: this.$t('menuPage.microApp'),
          icon: 'Monitor'
        },
        {
          value: '2',
          label: this.$t('menuPage.extensionPage'),
          icon: 'Files'
        },
        {
          value: '0',
          label: this.$t('menuPage.custom'),
          icon: 'Setting'
        }
      ]
    }
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.loadMicroApps()
        this.loadCustomPages()
      }
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
    async loadCustomPages() {
      try {
        this.customPageOptions = await getCustomPageEntries({ force: true })
      } catch {
        this.customPageOptions = []
      }
    },
    handleCustomPageChange(value) {
      if (!value) return
      this.form.path = value
      this.form.microAppPath = ''

      const page = this.customPageOptions.find((item) => item.routePath === value)
      if (!this.form.menuName && page?.title) this.form.menuName = page.title
      if (!this.form.icon && page?.icon) this.form.icon = page.icon
    },
    handleMicroAppPathChange(value) {
      if (!value) return
      this.form.path = `app/${value}`
      this.form.customPageRoute = ''
    },
    handleMenuTypeChange(value) {
      if (value === '0') {
        this.form.microAppPath = ''
        this.form.customPageRoute = ''
        return
      }

      this.form.path = ''
      if (value === '1') {
        this.form.customPageRoute = ''
      } else if (value === '2') {
        this.form.microAppPath = ''
      }
    },
    handleClose() {
      if (this.$refs.formRef) this.$refs.formRef.resetFields()
    },
    async submit() {
      if (!this.$refs.formRef) {
        this.$emit('submit')
        return
      }

      const valid = await this.$refs.formRef.validate().catch(() => false)
      if (valid) this.$emit('submit')
    }
  }
}
</script>

<style scoped>
:deep(.menu-form-dialog) {
  max-width: calc(100vw - 32px);
  border-radius: 10px !important;
}

:deep(.menu-form-dialog .el-dialog__header) {
  position: relative !important;
  padding: 9px 16px 7px !important;
  background: var(--dt-surface) !important;
}

:deep(.menu-form-dialog .el-dialog__body) {
  padding: 9px 12px 10px !important;
  background: #ffffff !important;
}

:deep(.menu-form-dialog .el-dialog__footer) {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  height: 44px !important;
  min-height: 44px !important;
  max-height: 44px !important;
  padding: 0 16px !important;
  border-top: 1px solid #e5eaf3 !important;
  background: var(--dt-surface) !important;
}

:deep(.menu-form-dialog .el-dialog__title) {
  font-size: 18px !important;
  font-weight: 700 !important;
}

.menu-form {
  color: #172033;
}

.menu-type-row {
  margin-bottom: 18px !important;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
  row-gap: 18px;
}

.field-grid .is-wide {
  grid-column: 1 / -1;
}

.field-control {
  width: 100%;
}

:deep(.menu-form-dialog .el-form-item) {
  margin-bottom: 0;
}

:deep(.menu-form-dialog .el-form-item__label) {
  color: #525b6b;
  font-size: 14px;
  font-weight: 650;
}

:deep(.menu-form-dialog .el-input__wrapper),
:deep(.menu-form-dialog .el-select .el-input__wrapper) {
  min-height: 38px;
  border-radius: 6px;
  box-shadow: 0 0 0 1px #d7deea inset;
}

:deep(.menu-form-dialog .el-input__wrapper:hover),
:deep(.menu-form-dialog .el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #9fc7ff inset;
}

:deep(.menu-form-dialog .el-input.is-disabled .el-input__wrapper) {
  background: #f3f6fb;
}

.menu-type-group,
.visibility-group {
  width: 100%;
  display: flex;
}

.menu-type-group :deep(.el-radio-button) {
  flex: 1;
}

.menu-type-group :deep(.el-radio-button__inner) {
  width: 100%;
  height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 650;
}

.visibility-group :deep(.el-radio-button__inner) {
  min-width: 84px;
}

.route-summary {
  margin-top: 18px;
  padding: 9px 12px;
  border: 1px solid #e1e7f0;
  border-radius: 6px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  gap: 10px;
}

.route-summary span {
  flex: 0 0 auto;
  color: #677286;
  font-size: 13px;
  font-weight: 650;
}

.route-summary code {
  min-width: 0;
  color: #263244;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
  padding: 0;
  background: transparent;
}

.dialog-footer :deep(.el-button) {
  min-width: 88px;
  min-height: 36px;
  border-radius: 6px;
  font-weight: 650;
}

.dialog-footer :deep(.el-button--default) {
  color: #475569;
  border-color: #d8e1ee;
  background: #ffffff;
}

.dialog-footer :deep(.el-button--default:hover) {
  color: #157aff;
  border-color: #9fc7ff;
  background: #f2f7ff;
}

.dialog-footer :deep(.el-button--primary) {
  border-color: #157aff;
  background: #157aff;
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

@media (max-width: 760px) {
  :deep(.menu-form-dialog .el-dialog__body) {
    padding: 16px !important;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }

  .menu-type-group {
    display: grid;
    grid-template-columns: 1fr;
  }

  .dialog-footer {
    padding: 0;
  }
}

html[data-theme='dark'] :deep(.menu-form-dialog .el-dialog__body) {
  background: var(--dt-surface) !important;
}

html[data-theme='dark'] .menu-form,
html[data-theme='dark'] .route-summary {
  color: var(--dt-text);
}

html[data-theme='dark'] .route-summary {
  background: var(--dt-surface-soft);
  border-color: var(--dt-border);
}

html[data-theme='dark'] .route-summary span {
  color: var(--dt-text-muted);
}

html[data-theme='dark'] .route-summary code {
  color: var(--dt-text);
}

html[data-theme='dark'] .dialog-footer {
  background: var(--dt-surface-soft);
  border-top: 1px solid var(--dt-border);
}

html[data-theme='dark'] .dialog-footer :deep(.el-button--default) {
  color: var(--dt-text);
  border-color: var(--dt-border);
  background: var(--dt-surface);
}

html[data-theme='dark'] .dialog-footer :deep(.el-button--default:hover) {
  color: var(--dt-primary-light);
  border-color: var(--dt-primary-border);
  background: var(--dt-primary-subtle);
}
</style>
