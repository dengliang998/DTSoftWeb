<template>
  <div class="languages-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>{{ $t('language.title') }}</h1>
          <p>{{ $t('language.resourceSubtitle') }}</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" :loading="loading" @click="loadActiveData">
            {{ $t('common.refresh') }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">{{ $t('common.add') }}</el-button>
        </div>
      </div>

      <div class="dt-panel">
        <div class="dt-panel__header">
          <div>
            <strong>{{ $t('language.resourceTitle') }}</strong>
            <span>{{ $t('language.resourceSummary', { count: resources.length }) }}</span>
          </div>
        </div>
        <div class="language-dictionary-note">{{ $t('language.resourceNotice') }}</div>
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
      </div>
    </section>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
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
import { deleteLanguageResource, getEnabledLanguages, getLanguageResources, saveLanguageResource } from '@/api/language'
import { cacheEnabledLanguages, i18nState } from '@/i18n'

const createResourceForm = () => ({
  ItemId: null,
  ResourceKey: '',
  Module: '',
  Description: '',
  Values: {}
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
    const loading = ref(false)
    const saving = ref(false)
    const dialogVisible = ref(false)
    const formRef = ref(null)
    const form = reactive(createResourceForm())
    const resources = ref([])
    const languageOptions = ref([])

    const rules = computed(() => ({
      ResourceKey: [{ required: true, message: proxy.$t('language.resourceKeyPlaceholder'), trigger: 'blur' }]
    }))

    const dialogTitle = computed(() =>
      proxy.$t(form.ItemId ? 'language.resourceEditTitle' : 'language.resourceAddTitle')
    )

    const languageColumns = computed(() => languageOptions.value)

    const resetForm = () => {
      Object.assign(form, createResourceForm())
      formRef.value?.clearValidate?.()
    }

    const hydrateLanguageOptions = () => {
      languageOptions.value = Array.isArray(i18nState.enabledLanguages) ? i18nState.enabledLanguages : []
    }

    const loadResources = async () => {
      loading.value = true
      try {
        const [resourceResp, enabledResp] = await Promise.all([getLanguageResources(), getEnabledLanguages()])
        if (enabledResp?.data?.success && Array.isArray(enabledResp.data.data)) {
          cacheEnabledLanguages(enabledResp.data.data)
          hydrateLanguageOptions()
        }
        if (resourceResp?.data?.success) {
          resources.value = Array.isArray(resourceResp.data.data) ? resourceResp.data.data.map(normalizeResource) : []
        } else {
          proxy.$message.error(resourceResp?.data?.Msg || proxy.$t('language.resourceLoadFailed'))
        }
      } catch (error) {
        proxy.$message.error(error?.response?.data?.Msg || proxy.$t('language.resourceLoadFailed'))
      } finally {
        loading.value = false
      }
    }

    const loadActiveData = () => loadResources()

    const openAddDialog = () => {
      resetForm()
      form.Values = Object.fromEntries(languageColumns.value.map((item) => [item.LanguageCode, '']))
      dialogVisible.value = true
    }

    const openEditResourceDialog = (row) => {
      resetForm()
      Object.assign(form, normalizeResource(row))
      form.Values = {}
      const sourceValues = row.Values || {}
      languageColumns.value.forEach((lang) => {
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
        const { data: res } = await saveLanguageResource(payload)
        if (res?.success) {
          proxy.$message.success(proxy.$t('language.resourceSaveSuccess'))
          dialogVisible.value = false
          await loadResources()
        } else {
          proxy.$message.error(res?.Msg || proxy.$t('language.resourceSaveFailed'))
        }
      } catch (error) {
        proxy.$message.error(error?.response?.data?.Msg || proxy.$t('language.resourceSaveFailed'))
      } finally {
        saving.value = false
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
      await loadResources()
    })

    return {
      Delete,
      Edit,
      Plus,
      Refresh,
      dialogTitle,
      dialogVisible,
      form,
      formRef,
      languageColumns,
      loading,
      loadActiveData,
      openAddDialog,
      openEditResourceDialog,
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

.resource-value {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.language-dictionary-note {
  margin: 0 16px 12px;
  padding: 9px 12px;
  color: var(--dt-text-muted);
  background: color-mix(in srgb, var(--el-color-primary) 7%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
}
</style>
