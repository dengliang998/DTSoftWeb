<template>
  <div class="languages-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>{{ $t('language.title') }}</h1>
          <p>{{ activeTab === 'languages' ? $t('language.subtitle') : $t('language.resourceSubtitle') }}</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" :loading="loading" @click="loadActiveData">
            {{ $t('common.refresh') }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">{{ $t('common.add') }}</el-button>
        </div>
      </div>

      <div class="dt-panel">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane :label="$t('language.languageTab')" name="languages">
            <div class="dt-panel__header">
              <div>
                <strong>{{ $t('language.title') }}</strong>
                <span>{{ $t('language.enabledSummary', { count: enabledCount }) }}</span>
              </div>
            </div>
            <el-table v-loading="loading" :data="languages" row-key="ItemId" class="dt-table">
              <el-table-column :label="$t('language.code')" prop="LanguageCode" min-width="140" />
              <el-table-column :label="$t('language.name')" prop="LanguageName" min-width="160" />
              <el-table-column :label="$t('language.nativeName')" prop="NativeName" min-width="160" />
              <el-table-column :label="$t('common.status')" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.IsEnabled ? 'success' : 'info'">
                    {{ row.IsEnabled ? $t('common.enabled') : $t('common.disabled') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('language.isDefault')" width="120">
                <template #default="{ row }">
                  <el-tag v-if="row.IsDefault" type="warning">{{ $t('common.default') }}</el-tag>
                  <span v-else class="muted-text">-</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('common.sort')" prop="Sort" width="96" />
              <el-table-column :label="$t('common.actions')" width="168" align="right">
                <template #default="{ row }">
                  <div class="dt-operation-buttons">
                    <el-tooltip :content="$t('common.edit')" placement="top">
                      <el-button
                        class="dt-icon-action dt-icon-action--edit"
                        :icon="Edit"
                        @click="openEditDialog(row)"
                      />
                    </el-tooltip>
                    <el-tooltip :content="$t('common.delete')" placement="top">
                      <el-button
                        class="dt-icon-action dt-icon-action--danger"
                        :icon="Delete"
                        :disabled="row.IsDefault"
                        @click="removeLanguage(row)"
                      />
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane :label="$t('language.resourceTab')" name="resources">
            <div class="dt-panel__header">
              <div>
                <strong>{{ $t('language.resourceTitle') }}</strong>
                <span>{{ $t('language.resourceSummary', { count: resources.length }) }}</span>
              </div>
            </div>
            <el-table v-loading="loading" :data="resources" row-key="ItemId" class="dt-table">
              <el-table-column :label="$t('language.resourceKey')" prop="ResourceKey" min-width="200" />
              <el-table-column :label="$t('language.module')" prop="Module" min-width="120" />
              <el-table-column :label="$t('language.description')" prop="Description" min-width="180" />
              <el-table-column
                v-for="lang in languageColumns"
                :key="lang.LanguageCode"
                :label="lang.NativeName || lang.LanguageName || lang.LanguageCode"
                min-width="160"
              >
                <template #default="{ row }">
                  <span class="resource-value">{{ row.Values?.[lang.LanguageCode] || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('common.actions')" width="168" align="right">
                <template #default="{ row }">
                  <div class="dt-operation-buttons">
                    <el-tooltip :content="$t('common.edit')" placement="top">
                      <el-button
                        class="dt-icon-action dt-icon-action--edit"
                        :icon="Edit"
                        @click="openEditResourceDialog(row)"
                      />
                    </el-tooltip>
                    <el-tooltip :content="$t('common.delete')" placement="top">
                      <el-button
                        class="dt-icon-action dt-icon-action--danger"
                        :icon="Delete"
                        @click="removeResource(row)"
                      />
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </section>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <template v-if="formMode === 'language'">
          <el-form-item :label="$t('language.code')" prop="LanguageCode">
            <el-select v-model="form.LanguageCode" :placeholder="$t('language.codePlaceholder')" class="full-width">
              <el-option
                v-for="item in languageOptions"
                :key="item.LanguageCode"
                :label="`${item.NativeName} (${item.LanguageCode})`"
                :value="item.LanguageCode"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('language.name')" prop="LanguageName">
            <el-input v-model="form.LanguageName" :placeholder="$t('language.namePlaceholder')" maxlength="100" />
          </el-form-item>
          <el-form-item :label="$t('language.nativeName')" prop="NativeName">
            <el-input v-model="form.NativeName" :placeholder="$t('language.nativeNamePlaceholder')" maxlength="100" />
          </el-form-item>
          <el-form-item :label="$t('language.isEnabled')">
            <el-switch v-model="form.IsEnabled" />
          </el-form-item>
          <el-form-item :label="$t('language.isDefault')">
            <el-switch v-model="form.IsDefault" />
          </el-form-item>
          <el-form-item :label="$t('common.sort')">
            <el-input-number v-model="form.Sort" :min="0" :step="10" />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item :label="$t('language.resourceKey')" prop="ResourceKey">
            <el-input v-model="form.ResourceKey" :placeholder="$t('language.resourceKeyPlaceholder')" maxlength="200" />
          </el-form-item>
          <el-form-item :label="$t('language.module')">
            <el-input v-model="form.Module" :placeholder="$t('language.modulePlaceholder')" maxlength="100" />
          </el-form-item>
          <el-form-item :label="$t('language.description')">
            <el-input v-model="form.Description" :placeholder="$t('language.descriptionPlaceholder')" maxlength="500" />
          </el-form-item>
          <el-form-item
            v-for="lang in languageColumns"
            :key="lang.LanguageCode"
            :label="lang.NativeName || lang.LanguageName || lang.LanguageCode"
          >
            <el-input v-model="form.Values[lang.LanguageCode]" :placeholder="`${lang.LanguageCode}`" maxlength="500" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submit">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { computed, defineComponent, getCurrentInstance, onMounted, reactive, ref } from 'vue'
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import {
  deleteLanguage,
  deleteLanguageResource,
  getEnabledLanguages,
  getLanguageResources,
  getLanguages,
  saveLanguage,
  saveLanguageResource
} from '@/api/language'
import { SUPPORTED_LANGUAGE_OPTIONS, cacheEnabledLanguages, i18nState } from '@/i18n'

const createLanguageForm = () => ({
  ItemId: null,
  LanguageCode: '',
  LanguageName: '',
  NativeName: '',
  IsEnabled: true,
  IsDefault: false,
  Sort: 0
})

const createResourceForm = () => ({
  ItemId: null,
  ResourceKey: '',
  Module: '',
  Description: '',
  Values: {}
})

const normalizeLanguage = (item = {}) => ({
  ItemId: item.ItemId ?? item.itemId,
  LanguageCode: item.LanguageCode ?? item.languageCode ?? '',
  LanguageName: item.LanguageName ?? item.languageName ?? '',
  NativeName: item.NativeName ?? item.nativeName ?? '',
  IsEnabled: Boolean(item.IsEnabled ?? item.isEnabled),
  IsDefault: Boolean(item.IsDefault ?? item.isDefault),
  Sort: Number(item.Sort ?? item.sort ?? 0)
})

const normalizeResource = (item = {}) => ({
  ItemId: item.ItemId ?? item.itemId,
  ResourceKey: item.ResourceKey ?? item.resourceKey ?? '',
  Module: item.Module ?? item.module ?? '',
  Description: item.Description ?? item.description ?? '',
  Values: item.Values ?? item.values ?? {}
})

export default defineComponent({
  name: 'Languages',
  setup() {
    const { proxy } = getCurrentInstance()
    const activeTab = ref('languages')
    const loading = ref(false)
    const saving = ref(false)
    const dialogVisible = ref(false)
    const formMode = ref('language')
    const formRef = ref(null)
    const form = reactive(createLanguageForm())
    const resources = ref([])
    const languages = ref([])
    const languageOptions = ref([...SUPPORTED_LANGUAGE_OPTIONS])

    const rules = computed(() => {
      if (formMode.value === 'resource') {
        return {
          ResourceKey: [{ required: true, message: proxy.$t('language.resourceKeyPlaceholder'), trigger: 'blur' }]
        }
      }
      return {
        LanguageCode: [{ required: true, message: proxy.$t('language.codePlaceholder'), trigger: 'change' }],
        LanguageName: [{ required: true, message: proxy.$t('language.namePlaceholder'), trigger: 'blur' }],
        NativeName: [{ required: true, message: proxy.$t('language.nativeNamePlaceholder'), trigger: 'blur' }]
      }
    })

    const dialogTitle = computed(() =>
      formMode.value === 'resource'
        ? proxy.$t(form.ItemId ? 'language.resourceEditTitle' : 'language.resourceAddTitle')
        : proxy.$t(form.ItemId ? 'language.editTitle' : 'language.addTitle')
    )

    const enabledCount = computed(() => languages.value.filter((item) => item.IsEnabled).length)
    const languageColumns = computed(() => languages.value.filter((item) => item.IsEnabled))

    const resetForm = () => {
      Object.assign(form, createLanguageForm())
      form.Values = {}
      formMode.value = 'language'
      formRef.value?.clearValidate?.()
    }

    const hydrateLanguageOptions = () => {
      const enabled =
        i18nState.enabledLanguages && i18nState.enabledLanguages.length > 0
          ? i18nState.enabledLanguages
          : SUPPORTED_LANGUAGE_OPTIONS
      languageOptions.value = enabled
    }

    const loadLanguages = async () => {
      loading.value = true
      try {
        const [languageResp, enabledResp] = await Promise.all([getLanguages(), getEnabledLanguages()])
        if (languageResp?.data?.success) {
          languages.value = Array.isArray(languageResp.data.data) ? languageResp.data.data.map(normalizeLanguage) : []
        } else {
          proxy.$message.error(languageResp?.data?.Msg || proxy.$t('language.loadFailed'))
        }
        if (enabledResp?.data?.success && Array.isArray(enabledResp.data.data)) {
          cacheEnabledLanguages(enabledResp.data.data)
          hydrateLanguageOptions()
        }
      } catch (error) {
        proxy.$message.error(error?.response?.data?.Msg || proxy.$t('language.loadFailed'))
      } finally {
        loading.value = false
      }
    }

    const loadResources = async () => {
      loading.value = true
      try {
        const { data: res } = await getLanguageResources()
        if (res?.success) {
          resources.value = Array.isArray(res.data) ? res.data.map(normalizeResource) : []
        } else {
          proxy.$message.error(res?.Msg || proxy.$t('language.resourceLoadFailed'))
        }
      } catch (error) {
        proxy.$message.error(error?.response?.data?.Msg || proxy.$t('language.resourceLoadFailed'))
      } finally {
        loading.value = false
      }
    }

    const loadActiveData = () => {
      if (activeTab.value === 'resources') return loadResources()
      return loadLanguages()
    }

    const handleTabChange = () => {
      loadActiveData()
    }

    const openAddDialog = () => {
      resetForm()
      if (activeTab.value === 'resources') {
        formMode.value = 'resource'
        form.Values = Object.fromEntries(
          (languageColumns.value.length > 0 ? languageColumns.value : languageOptions.value).map((item) => [
            item.LanguageCode,
            ''
          ])
        )
      } else {
        formMode.value = 'language'
        const defaultLanguage = languageOptions.value[0] || SUPPORTED_LANGUAGE_OPTIONS[0]
        form.LanguageCode = defaultLanguage.LanguageCode
        form.LanguageName = defaultLanguage.LanguageName
        form.NativeName = defaultLanguage.NativeName
        form.Sort = defaultLanguage.Sort
      }
      dialogVisible.value = true
    }

    const openEditDialog = (row) => {
      resetForm()
      formMode.value = 'language'
      Object.assign(form, normalizeLanguage(row))
      dialogVisible.value = true
    }

    const openEditResourceDialog = (row) => {
      resetForm()
      formMode.value = 'resource'
      Object.assign(form, normalizeResource(row))
      form.Values = {}
      const sourceValues = row.Values || {}
      ;(languageColumns.value.length > 0 ? languageColumns.value : languageOptions.value).forEach((lang) => {
        form.Values[lang.LanguageCode] = sourceValues[lang.LanguageCode] || ''
      })
      dialogVisible.value = true
    }

    const submit = async () => {
      const valid = await formRef.value?.validate?.().catch(() => false)
      if (!valid) return

      saving.value = true
      try {
        const payload = { ...form, Values: { ...form.Values } }
        const api = formMode.value === 'resource' ? saveLanguageResource : saveLanguage
        const { data: res } = await api(payload)
        if (res?.success) {
          proxy.$message.success(
            formMode.value === 'resource' ? proxy.$t('language.resourceSaveSuccess') : proxy.$t('language.saveSuccess')
          )
          dialogVisible.value = false
          await loadActiveData()
        } else {
          proxy.$message.error(
            res?.Msg ||
              (formMode.value === 'resource'
                ? proxy.$t('language.resourceSaveFailed')
                : proxy.$t('language.saveFailed'))
          )
        }
      } catch (error) {
        proxy.$message.error(
          error?.response?.data?.Msg ||
            (formMode.value === 'resource' ? proxy.$t('language.resourceSaveFailed') : proxy.$t('language.saveFailed'))
        )
      } finally {
        saving.value = false
      }
    }

    const removeLanguage = async (row) => {
      if (row.IsDefault) {
        proxy.$message.warning(proxy.$t('language.defaultCannotDelete'))
        return
      }
      try {
        await proxy.$confirm(proxy.$t('language.deleteConfirm'), proxy.$t('common.delete'), {
          confirmButtonText: proxy.$t('common.confirm'),
          cancelButtonText: proxy.$t('common.cancel'),
          type: 'warning'
        })
      } catch {
        return
      }
      try {
        const { data: res } = await deleteLanguage(row.ItemId)
        if (res?.success) {
          proxy.$message.success(proxy.$t('language.deleteSuccess'))
          await loadLanguages()
        } else {
          proxy.$message.error(res?.Msg || proxy.$t('language.deleteFailed'))
        }
      } catch (error) {
        proxy.$message.error(error?.response?.data?.Msg || proxy.$t('language.deleteFailed'))
      }
    }

    const removeResource = async (row) => {
      try {
        await proxy.$confirm(proxy.$t('language.resourceDeleteConfirm'), proxy.$t('common.delete'), {
          confirmButtonText: proxy.$t('common.confirm'),
          cancelButtonText: proxy.$t('common.cancel'),
          type: 'warning'
        })
      } catch {
        return
      }
      try {
        const { data: res } = await deleteLanguageResource(row.ItemId)
        if (res?.success) {
          proxy.$message.success(proxy.$t('language.resourceDeleteSuccess'))
          await loadResources()
        } else {
          proxy.$message.error(res?.Msg || proxy.$t('language.resourceDeleteFailed'))
        }
      } catch (error) {
        proxy.$message.error(error?.response?.data?.Msg || proxy.$t('language.resourceDeleteFailed'))
      }
    }

    onMounted(async () => {
      hydrateLanguageOptions()
      await loadLanguages()
    })

    return {
      Delete,
      Edit,
      Plus,
      Refresh,
      activeTab,
      dialogTitle,
      dialogVisible,
      enabledCount,
      form,
      formMode,
      formRef,
      handleTabChange,
      languageColumns,
      languageOptions,
      languages,
      loading,
      loadActiveData,
      openAddDialog,
      openEditDialog,
      openEditResourceDialog,
      removeLanguage,
      removeResource,
      resources,
      resetForm,
      rules,
      saving,
      submit
    }
  }
})
</script>

<style scoped>
.languages-container {
  min-height: 100%;
}

.full-width {
  width: 100%;
}

.muted-text {
  color: var(--dt-text-muted);
}

.resource-value {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
