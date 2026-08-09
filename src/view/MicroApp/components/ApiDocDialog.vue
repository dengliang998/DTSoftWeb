<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('apiDoc.title')"
    width="88%"
    top="6vh"
    :close-on-click-modal="false"
    class="api-doc-dialog"
  >
    <div class="api-doc-shell">
      <aside class="api-index">
        <button
          v-for="(api, index) in apis"
          :key="`${api.method}-${api.path}-${index}`"
          type="button"
          :class="['api-index-item', { 'is-active': activeIndex === index }]"
          @click="selectApi(index)"
        >
          <span :class="['method-pill', methodClass(api.method)]">{{ api.method }}</span>
          <span class="api-index-item__text">
            <strong>{{ api.path }}</strong>
            <small>{{ api.description }}</small>
          </span>
        </button>
      </aside>

      <main v-if="activeApi" class="api-detail">
        <header class="api-detail__head">
          <div>
            <div class="api-detail__eyebrow">
              <span :class="['method-pill', methodClass(activeApi.method)]">{{ activeApi.method }}</span>
              <span>{{ $t('apiDoc.endpoint') }}</span>
            </div>
            <code>{{ activeApi.path }}</code>
          </div>
          <el-button class="api-copy-button" @click="copyText(activeApi.path)">
            {{ $t('apiDoc.copyPath') }}
          </el-button>
        </header>

        <section class="api-section">
          <div class="api-section__title">{{ $t('apiDoc.description') }}</div>
          <p class="api-description">{{ activeApi.description }}</p>
        </section>

        <section class="api-section">
          <div class="api-section__title">{{ $t('apiDoc.requestParams') }}</div>
          <el-table
            v-if="activeApi.requestParams && activeApi.requestParams.length"
            :data="activeApi.requestParams"
            border
            size="small"
            class="api-param-table"
          >
            <el-table-column :label="$t('apiDoc.paramName')" prop="name" min-width="160">
              <template #default="{ row }">
                <code class="param-name">{{ row.name }}</code>
              </template>
            </el-table-column>
            <el-table-column :label="$t('apiDoc.type')" prop="type" width="120"></el-table-column>
            <el-table-column :label="$t('apiDoc.required')" width="90">
              <template #default="{ row }">
                <el-tag :type="row.required ? 'danger' : 'info'" size="small" effect="plain">
                  {{ row.required ? $t('common.yes') : $t('common.no') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('apiDoc.descriptionColumn')"
              prop="description"
              min-width="220"
            ></el-table-column>
          </el-table>
          <div v-else class="api-empty">{{ $t('apiDoc.noParams') }}</div>
        </section>

        <section class="api-section api-section--response">
          <div class="api-section__bar">
            <div class="api-section__title">{{ $t('apiDoc.responseExample') }}</div>
            <el-button class="api-copy-button" @click="copyText(activeApi.responseExample)">
              {{ $t('apiDoc.copyResponse') }}
            </el-button>
          </div>
          <pre class="json-preview">{{ activeApi.responseExample }}</pre>
        </section>
      </main>

      <div v-else class="api-empty api-empty--screen">{{ $t('apiDoc.noApis') }}</div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'ApiDocDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    apis: { type: Array, default: () => [] }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      activeIndex: 0
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
    activeApi() {
      return this.apis[this.activeIndex] || this.apis[0] || null
    }
  },
  watch: {
    modelValue(visible) {
      if (visible) this.activeIndex = 0
    },
    apis() {
      if (this.activeIndex > this.apis.length - 1) this.activeIndex = 0
    }
  },
  methods: {
    methodClass(method) {
      return `is-${String(method || '').toLowerCase()}`
    },
    selectApi(index) {
      this.activeIndex = index
    },
    async copyText(text) {
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        this.$message.success(this.$t('apiDoc.copySuccess'))
      } catch {
        this.$message.warning(this.$t('apiDoc.copyFailed'))
      }
    }
  }
}
</script>

<style scoped>
:deep(.api-doc-dialog .el-dialog__body) {
  padding: 0;
}

.api-doc-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  height: min(72vh, 720px);
  min-height: 460px;
  background: var(--dt-surface);
  overflow: hidden;
}

.api-index {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 14px;
  border-right: 1px solid var(--dt-border);
  background: var(--dt-surface-soft);
  overflow-y: auto;
}

.method-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 6px;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-weight: 700;
}

.method-pill {
  min-width: 66px;
  height: 28px;
  padding: 0 10px;
  color: #ffffff;
  font-size: 12px;
}

.method-pill.is-get {
  background: #168a5a;
}

.method-pill.is-post {
  background: #2563eb;
}

.method-pill.is-put {
  background: #b7791f;
}

.method-pill.is-delete {
  background: #d92d20;
}

.api-index-item {
  appearance: none;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 10px;
  margin: 0 0 10px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--dt-text);
  cursor: pointer;
  text-align: left;
}

.api-index-item:hover,
.api-index-item:focus-visible,
.api-index-item.is-active {
  border-color: var(--dt-primary-border);
  background: var(--dt-surface);
  box-shadow: inset 3px 0 0 var(--dt-primary);
  outline: none;
}

.api-index-item__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.api-index-item__text strong,
.api-detail__head code,
.param-name {
  overflow: hidden;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-index-item__text strong {
  color: var(--dt-text);
  font-size: 13px;
  line-height: 18px;
}

.api-index-item__text small {
  overflow: hidden;
  color: var(--dt-text-muted);
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-detail {
  min-width: 0;
  padding: 18px;
  overflow-y: auto;
}

.api-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--dt-border);
}

.api-detail__eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--dt-text-muted);
  font-size: 12px;
}

.api-detail__head code {
  display: block;
  max-width: min(720px, 68vw);
  color: var(--dt-text);
  font-size: 22px;
  font-weight: 700;
  line-height: 30px;
}

.api-section {
  margin-bottom: 16px;
  padding: 14px;
  border: 1px solid var(--dt-border);
  border-radius: 8px;
  background: var(--dt-surface);
}

.api-section__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.api-section__title {
  margin-bottom: 10px;
  color: var(--dt-text);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.api-section__bar .api-section__title {
  margin-bottom: 0;
}

.api-description {
  margin: 0;
  color: var(--dt-text-muted);
  font-size: 14px;
  line-height: 22px;
}

.api-param-table {
  width: 100%;
}

.param-name {
  display: inline-block;
  max-width: 100%;
  color: var(--dt-primary);
  font-size: 12px;
}

.api-copy-button {
  flex-shrink: 0;
}

.json-preview {
  max-height: 360px;
  margin: 0;
  padding: 14px;
  border: 1px solid var(--dt-border);
  border-radius: 8px;
  background: var(--dt-surface-soft);
  color: var(--dt-text);
  overflow: auto;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.55;
}

.api-empty {
  padding: 18px;
  border: 1px dashed var(--dt-border);
  border-radius: 8px;
  background: var(--dt-surface-soft);
  color: var(--dt-text-muted);
  font-size: 13px;
  line-height: 20px;
}

.api-empty--screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  grid-column: 1 / -1;
}

@media (max-width: 920px) {
  .api-doc-shell {
    grid-template-columns: 1fr;
    height: 76vh;
    min-height: 0;
  }

  .api-index {
    max-height: 320px;
    border-right: 0;
    border-bottom: 1px solid var(--dt-border);
  }

  .api-detail__head {
    flex-direction: column;
  }

  .api-detail__head code {
    max-width: 100%;
    font-size: 18px;
    line-height: 26px;
  }
}
</style>
