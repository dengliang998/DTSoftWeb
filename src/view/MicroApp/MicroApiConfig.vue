<template>
  <div class="crud-config-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>{{ $t('microConfig.title') }}</h1>
          <p>{{ $t('microConfig.subtitle') }}</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="getMicroApps">
            {{ $t('common.refresh') }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="addMicroApp">{{ $t('microConfig.create') }}</el-button>
        </div>
      </div>

      <div class="dt-toolbar dt-toolbar--compact">
        <el-input
          v-model="queryInfo.query"
          class="dt-search"
          clearable
          :placeholder="$t('microConfig.searchPlaceholder')"
          @clear="getMicroApps"
          @keyup.enter="getMicroApps"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="dt-panel">
        <div class="dt-panel__header">
          <div>
            <strong>{{ $t('microConfig.configList') }}</strong>
            <span>{{ $t('microRuntime.serverTotal', { count: total }) }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">{{ $t('microRuntime.currentPage', { count: MicroAppList.length }) }}</span>
            <span class="dt-chip dt-chip--success">
              {{ $t('organization.enabledCount', { count: microAppStats.enabled }) }}
            </span>
            <span class="dt-chip dt-chip--warning">
              {{ $t('organization.disabledCount', { count: microAppStats.disabled }) }}
            </span>
          </div>
        </div>

        <el-table
          :data="MicroAppList"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          :empty-text="$t('microConfig.empty')"
        >
          <el-table-column label="#" width="72" align="center">
            <template #default="scope">
              <span class="dt-index-chip">{{ scope.$index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('microConfig.config')" prop="ConfigName" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="dt-name-copy">
                <strong>{{ row.ConfigName }}</strong>
                <small>{{ row.configDesc || row.ConfigDesc || $t('microConfig.noDescription') }}</small>
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('microConfig.modelName')" prop="ModelName" min-width="180">
            <template #default="{ row }">
              <code class="dt-code">{{ row.ModelName || '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('microConfig.microAppPath')" prop="MicroAppPath" min-width="180">
            <template #default="{ row }">
              <code class="dt-code">{{ row.MicroAppPath || '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.status')" width="96" align="center">
            <template #default="{ row }">
              <span :class="['dt-badge', row.Status === 1 ? 'dt-badge--success' : 'dt-badge--warning']">
                {{ row.Status === 1 ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('apiKey.createTime')" width="180">
            <template #default="{ row }">
              <code class="dt-code">{{ $filters.dateFormat(row.CreateTime) }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('esb.updateTime')" width="180">
            <template #default="{ row }">
              <code class="dt-code">{{ $filters.dateFormat(row.UpdateTime) }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="156" fixed="right" align="right">
            <template #default="{ row }">
              <div class="dt-operation-buttons micro-actions">
                <el-tooltip :content="$t('microConfig.editConfig')" placement="top">
                  <el-button class="dt-icon-action dt-icon-action--edit" :icon="Edit" @click="editMicroApp(row)" />
                </el-tooltip>
                <el-tooltip :content="$t('microConfig.visualConfig')" placement="top">
                  <el-button class="dt-icon-action" :icon="Setting" @click="visualConfig(row)" />
                </el-tooltip>
                <el-tooltip :content="$t('microConfig.apiDoc')" placement="top">
                  <el-button class="dt-icon-action dt-icon-action--add" :icon="Document" @click="generateApiDoc(row)" />
                </el-tooltip>
                <el-tooltip :content="$t('microConfig.deleteConfig')" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--danger"
                    :icon="Delete"
                    @click="deleteMicroApp(row.ItemId)"
                  />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="dt-pagination"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="queryInfo.pagesize"
          :current-page="queryInfo.pagenum"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <!-- 配置基本信息对话框 -->
    <MicroAppConfigDialog
      ref="MicroAppFormRef"
      v-model="dialogVisible"
      :title="dialogTitle"
      :form="MicroAppForm"
      :rules="rules"
      @submit="submitForm"
    />

    <!-- 可视化配置对话框 -->
    <el-dialog
      v-model="visualConfigVisible"
      :title="$t('microConfig.visualConfig')"
      width="90%"
      :close-on-click-modal="false"
      fullscreen
      class="visual-config-dialog"
    >
      <div class="visual-config-container">
        <aside class="field-sidebar">
          <div class="sidebar-head">
            <div>
              <div class="section-kicker">{{ $t('microConfig.fieldModel') }}</div>
              <div class="section-title">{{ $t('microConfig.mainFieldConfig') }}</div>
            </div>
            <el-button type="primary" size="small" icon="Plus" @click="addField">{{ $t('common.add') }}</el-button>
          </div>

          <div class="field-metrics">
            <div class="metric-item">
              <span class="metric-value">{{ MicroAppForm.Fields.length }}</span>
              <span class="metric-label">{{ $t('microConfig.field') }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ queryConfigCount }}</span>
              <span class="metric-label">{{ $t('microConfig.query') }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ listConfigCount }}</span>
              <span class="metric-label">{{ $t('microConfig.list') }}</span>
            </div>
          </div>

          <el-tree
            ref="mainFieldTree"
            class="field-tree"
            :data="MicroAppForm.Fields"
            :props="{ label: 'label', children: 'children' }"
            node-key="__uiKey"
            :expand-on-click-node="false"
            :current-node-key="selectedFieldKey"
            :default-expanded-keys="expandedKeys"
            draggable
            :allow-drop="allowFieldDrop"
            @node-drop="handleFieldDrop"
            @node-click="selectField"
          >
            <template #default="{ data }">
              <div class="field-tree-node">
                <span class="field-tree-node__main">
                  <el-icon class="field-tree-node__drag"><Rank /></el-icon>
                  <span class="field-tree-node__text">
                    <span class="field-tree-node__label">{{ data.label || $t('microConfig.unnamedField') }}</span>
                    <span class="field-tree-node__meta">{{ data.fieldName || 'field_name' }}</span>
                  </span>
                </span>
                <span class="field-tree-node__side">
                  <el-tag size="small" effect="plain" :type="getFieldTypeTagType(data.fieldType)">
                    {{ getFieldTypeLabel(data.fieldType) }}
                  </el-tag>
                  <button class="field-tree-node__delete" type="button" @click.stop="deleteField(data.__uiKey)">
                    <el-icon><Delete /></el-icon>
                    <span>{{ $t('common.delete') }}</span>
                  </button>
                </span>
              </div>
            </template>
          </el-tree>

          <div class="subtable-sidebar">
            <div class="sidebar-head sidebar-head--subtable">
              <div>
                <div class="section-kicker">{{ $t('microConfig.detailModel') }}</div>
                <div class="section-title">{{ $t('microConfig.subTableConfig') }}</div>
              </div>
              <el-button type="primary" size="small" icon="Plus" @click="addSubTable">{{ $t('common.add') }}</el-button>
            </div>
            <div v-if="MicroAppForm.SubTables.length === 0" class="empty-inline">
              {{ $t('microConfig.noSubTable') }}
            </div>
            <div
              v-for="(subTable, subTableIndex) in MicroAppForm.SubTables"
              :key="subTable.tableName || subTableIndex"
              class="subtable-config-card"
            >
              <div class="subtable-config-card__head">
                <span>{{ subTable.label || $t('microConfig.unnamedSubTable') }}</span>
                <button
                  class="subtable-icon-button"
                  type="button"
                  :title="$t('microConfig.deleteSubTable')"
                  @click="deleteSubTable(subTableIndex)"
                >
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
              <div class="subtable-config-grid">
                <el-input
                  v-model="subTable.label"
                  size="small"
                  :placeholder="$t('microConfig.subTableName')"
                ></el-input>
                <el-input v-model="subTable.tableName" size="small" placeholder="sub_table"></el-input>
                <el-input-number
                  v-model="subTable.minRows"
                  size="small"
                  :min="0"
                  :max="1000"
                  :placeholder="$t('microConfig.minRows')"
                ></el-input-number>
                <el-input-number
                  v-model="subTable.maxRows"
                  size="small"
                  :min="0"
                  :max="5000"
                  :placeholder="$t('microConfig.maxRows')"
                ></el-input-number>
              </div>
              <div class="subtable-lookup-config">
                <label class="subtable-lookup-switch">
                  <span>{{ $t('microConfig.lookupImport') }}</span>
                  <el-switch v-model="subTable.enableLookup"></el-switch>
                </label>
                <div v-if="subTable.enableLookup" class="subtable-lookup-body">
                  <el-select
                    v-model="subTable.lookupDataSourceCode"
                    size="small"
                    clearable
                    filterable
                    :placeholder="$t('microConfig.selectEsbDataSource')"
                  >
                    <el-option
                      v-for="source in esbDataSources"
                      :key="source.Code || source.code"
                      :label="`${source.Name || source.name}（${source.Code || source.code}）`"
                      :value="source.Code || source.code"
                    ></el-option>
                  </el-select>
                  <el-input-number
                    v-model="subTable.lookupPageSize"
                    size="small"
                    :min="5"
                    :max="200"
                    :step="5"
                    :placeholder="$t('microConfig.pageSize')"
                  ></el-input-number>
                  <el-input
                    v-model="subTable.lookupParams"
                    size="small"
                    type="textarea"
                    :rows="2"
                    :placeholder="$t('microConfig.staticParamsJsonExample')"
                  ></el-input>
                  <div class="subtable-lookup-title">{{ $t('microConfig.lookupColumns') }}</div>
                  <div
                    v-for="(column, columnIndex) in subTable.lookupColumns"
                    :key="columnIndex"
                    class="subtable-lookup-row subtable-lookup-row--columns"
                  >
                    <el-input
                      v-model="column.field"
                      size="small"
                      :placeholder="$t('microConfig.returnField')"
                    ></el-input>
                    <el-input
                      v-model="column.label"
                      size="small"
                      :placeholder="$t('microConfig.columnTitle')"
                    ></el-input>
                    <el-button
                      class="subtable-lookup-delete-button"
                      size="small"
                      type="danger"
                      @click="removeSubTableLookupColumn(subTable, columnIndex)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-button size="small" icon="Plus" @click="addSubTableLookupColumn(subTable)">
                    {{ $t('microConfig.addDisplayColumn') }}
                  </el-button>
                  <div class="subtable-lookup-title">{{ $t('microConfig.lookupMappings') }}</div>
                  <div
                    v-for="(mapping, mappingIndex) in subTable.lookupMappings"
                    :key="mappingIndex"
                    class="subtable-lookup-row"
                  >
                    <el-input
                      v-model="mapping.sourceField"
                      size="small"
                      :placeholder="$t('microConfig.returnField')"
                    ></el-input>
                    <el-select
                      v-model="mapping.targetField"
                      size="small"
                      filterable
                      :placeholder="$t('microConfig.detailField')"
                    >
                      <el-option
                        v-for="field in subTable.fields"
                        :key="field.fieldName"
                        :label="`${field.label || field.fieldName}（${field.fieldName}）`"
                        :value="field.fieldName"
                      ></el-option>
                    </el-select>
                    <el-button
                      class="subtable-lookup-delete-button"
                      size="small"
                      type="danger"
                      @click="removeSubTableLookupMapping(subTable, mappingIndex)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-button size="small" icon="Plus" @click="addSubTableLookupMapping(subTable)">
                    {{ $t('microConfig.addLookupMapping') }}
                  </el-button>
                </div>
              </div>
              <div class="subtable-field-actions">
                <span>{{ $t('microConfig.fieldCount', { count: subTable.fields.length }) }}</span>
                <el-button size="small" icon="Plus" @click="addSubTableField(subTable)">
                  {{ $t('microConfig.field') }}
                </el-button>
              </div>
              <el-tree
                class="field-tree subtable-field-tree"
                :data="subTable.fields"
                :props="{ label: 'label', children: 'children' }"
                node-key="__uiKey"
                :expand-on-click-node="false"
                :current-node-key="selectedFieldKey"
                draggable
                :allow-drop="allowFieldDrop"
                @node-drop="() => handleSubTableFieldDrop(subTable)"
                @node-click="(data) => selectSubTableField(subTable, data)"
              >
                <template #default="{ data }">
                  <div class="field-tree-node">
                    <span class="field-tree-node__main">
                      <el-icon class="field-tree-node__drag"><Rank /></el-icon>
                      <span class="field-tree-node__text">
                        <span class="field-tree-node__label">{{ data.label || $t('microConfig.unnamedField') }}</span>
                        <span class="field-tree-node__meta">{{ data.fieldName || 'field_name' }}</span>
                      </span>
                    </span>
                    <span class="field-tree-node__side">
                      <el-tag size="small" effect="plain" :type="getFieldTypeTagType(data.fieldType)">
                        {{ getFieldTypeLabel(data.fieldType) }}
                      </el-tag>
                      <button
                        class="field-tree-node__delete"
                        type="button"
                        @click.stop="deleteSubTableField(subTable, data.__uiKey)"
                      >
                        <el-icon><Delete /></el-icon>
                        <span>{{ $t('common.delete') }}</span>
                      </button>
                    </span>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>
        </aside>

        <main class="visual-workspace">
          <section class="workspace-panel app-settings-panel">
            <div class="panel-head">
              <div>
                <div class="section-kicker">{{ $t('microConfig.generationStrategy') }}</div>
                <div class="section-title">{{ $t('microConfig.pageCapabilities') }}</div>
              </div>
              <div class="visual-config-actions">
                <el-button @click="visualConfigVisible = false">{{ $t('common.cancel') }}</el-button>
                <el-button type="primary" @click="saveVisualConfig">{{ $t('microConfig.saveConfig') }}</el-button>
              </div>
            </div>

            <el-form :model="MicroAppForm" class="compact-form" label-position="top">
              <div class="switch-matrix">
                <label class="switch-tile">
                  <span>{{ $t('common.add') }}</span>
                  <el-switch v-model="MicroAppForm.SupportCreate"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>{{ $t('microConfig.update') }}</span>
                  <el-switch v-model="MicroAppForm.SupportUpdate"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>{{ $t('common.delete') }}</span>
                  <el-switch v-model="MicroAppForm.SupportDelete"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>{{ $t('microConfig.batchDelete') }}</span>
                  <el-switch v-model="MicroAppForm.SupportBatchDelete"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>{{ $t('microConfig.import') }}</span>
                  <el-switch v-model="MicroAppForm.SupportImport"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>{{ $t('microConfig.export') }}</span>
                  <el-switch v-model="MicroAppForm.SupportExport"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>{{ $t('microConfig.listSubTable') }}</span>
                  <el-switch v-model="MicroAppForm.ShowSubTablesInList"></el-switch>
                </label>
              </div>

              <div class="settings-grid">
                <el-form-item :label="$t('microConfig.dataScope')">
                  <el-select v-model="MicroAppForm.DataScope" :placeholder="$t('microConfig.selectDataScope')">
                    <el-option :label="$t('microConfig.allData')" value="all"></el-option>
                    <el-option :label="$t('microConfig.selfData')" value="self"></el-option>
                    <el-option :label="$t('microConfig.departmentData')" value="department"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item :label="$t('microConfig.formColumns')">
                  <el-select v-model="MicroAppForm.FormColumns" :placeholder="$t('microConfig.selectColumnsPerRow')">
                    <el-option :label="$t('microConfig.oneColumn')" :value="1"></el-option>
                    <el-option :label="$t('microConfig.twoColumns')" :value="2"></el-option>
                    <el-option :label="$t('microConfig.threeColumns')" :value="3"></el-option>
                    <el-option :label="$t('microConfig.fourColumns')" :value="4"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item :label="$t('microConfig.searchColumns')">
                  <el-select v-model="MicroAppForm.QueryColumns" :placeholder="$t('microConfig.selectSearchColumns')">
                    <el-option :label="$t('microConfig.oneColumn')" :value="1"></el-option>
                    <el-option :label="$t('microConfig.twoColumns')" :value="2"></el-option>
                    <el-option :label="$t('microConfig.threeColumns')" :value="3"></el-option>
                    <el-option :label="$t('microConfig.fourColumns')" :value="4"></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </el-form>
          </section>

          <section class="workspace-panel field-editor-panel">
            <template v-if="selectedFieldData">
              <div class="field-editor-head">
                <div>
                  <div class="section-kicker">{{ $t('microConfig.fieldProperties') }}</div>
                  <div class="field-editor-title">
                    {{ selectedFieldData.label || $t('microConfig.unnamedField') }}
                    <el-tag size="small" effect="plain" :type="getFieldTypeTagType(selectedFieldData.fieldType)">
                      {{ getFieldTypeLabel(selectedFieldData.fieldType) }}
                    </el-tag>
                  </div>
                </div>
                <div class="field-editor-meta">{{ selectedFieldData.fieldName || 'field_name' }}</div>
              </div>

              <el-form :model="selectedFieldData" class="field-config-form" label-position="top">
                <div class="config-section">
                  <div class="config-section-title">{{ $t('microConfig.baseInfo') }}</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item :label="$t('microConfig.fieldName')">
                      <el-input
                        v-model="selectedFieldData.label"
                        :placeholder="$t('microConfig.fieldNameExample')"
                      ></el-input>
                    </el-form-item>
                    <el-form-item :label="$t('microConfig.fieldCode')">
                      <el-input
                        v-model="selectedFieldData.fieldName"
                        :placeholder="$t('microConfig.fieldCodeExample')"
                      ></el-input>
                    </el-form-item>
                    <el-form-item :label="$t('microConfig.fieldType')">
                      <el-select
                        v-model="selectedFieldData.fieldType"
                        :placeholder="$t('microConfig.selectFieldType')"
                        @change="handleFieldTypeChange"
                      >
                        <el-option :label="$t('microConfig.text')" value="string"></el-option>
                        <el-option :label="$t('microConfig.number')" value="number"></el-option>
                        <el-option :label="$t('microConfig.datetime')" value="datetime"></el-option>
                        <el-option :label="$t('microConfig.booleanValue')" value="boolean"></el-option>
                        <el-option :label="$t('microConfig.textarea')" value="textarea"></el-option>
                        <el-option :label="$t('microConfig.selectField')" value="select"></el-option>
                        <el-option :label="$t('microConfig.radio')" value="radio"></el-option>
                        <el-option :label="$t('microConfig.checkbox')" value="checkbox"></el-option>
                        <el-option
                          v-if="selectedFieldScope === 'main'"
                          :label="$t('microConfig.lookupQuery')"
                          value="lookup"
                        ></el-option>
                        <el-option :label="$t('microConfig.attachmentUpload')" value="attachment"></el-option>
                      </el-select>
                    </el-form-item>
                  </div>
                </div>

                <div class="config-section">
                  <div class="config-section-title">{{ $t('microConfig.displayEdit') }}</div>
                  <div class="switch-matrix switch-matrix--field">
                    <label class="switch-tile">
                      <span>{{ $t('microConfig.required') }}</span>
                      <el-switch v-model="selectedFieldData.required"></el-switch>
                    </label>
                    <label class="switch-tile">
                      <span>{{ $t('microConfig.showInList') }}</span>
                      <el-switch v-model="selectedFieldData.showInList"></el-switch>
                    </label>
                    <label class="switch-tile">
                      <span>{{ $t('microConfig.editable') }}</span>
                      <el-switch v-model="selectedFieldData.editable"></el-switch>
                    </label>
                    <label class="switch-tile">
                      <span>{{ $t('microConfig.sortable') }}</span>
                      <el-switch
                        v-model="selectedFieldData.sortable"
                        :disabled="isAttachmentField(selectedFieldData)"
                      ></el-switch>
                    </label>
                  </div>
                  <div class="form-grid form-grid--3">
                    <el-form-item :label="$t('microConfig.columnWidth')">
                      <el-input-number
                        v-model="selectedFieldData.columnWidth"
                        :min="80"
                        :max="600"
                        :step="10"
                        :placeholder="$t('microConfig.auto')"
                      ></el-input-number>
                    </el-form-item>
                    <el-form-item :label="$t('microConfig.columnAlign')">
                      <el-select
                        v-model="selectedFieldData.columnAlign"
                        :placeholder="$t('microConfig.selectColumnAlign')"
                      >
                        <el-option :label="$t('microConfig.alignLeft')" value="left"></el-option>
                        <el-option :label="$t('microConfig.alignCenter')" value="center"></el-option>
                        <el-option :label="$t('microConfig.alignRight')" value="right"></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('microConfig.fixedColumn')">
                      <el-select v-model="selectedFieldData.fixed" :placeholder="$t('microConfig.selectFixedColumn')">
                        <el-option :label="$t('microConfig.fixedNone')" value="none"></el-option>
                        <el-option :label="$t('microConfig.fixedLeft')" value="left"></el-option>
                        <el-option :label="$t('microConfig.fixedRight')" value="right"></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item v-if="!isAttachmentField(selectedFieldData)" :label="$t('microConfig.defaultValue')">
                      <el-input
                        v-model="selectedFieldData.defaultValue"
                        :placeholder="$t('microConfig.defaultValuePlaceholder')"
                      ></el-input>
                    </el-form-item>
                  </div>
                </div>

                <div v-if="isDateField(selectedFieldData)" class="config-section">
                  <div class="config-section-title">{{ $t('microConfig.dateSettings') }}</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item :label="$t('microConfig.dateFormat')">
                      <el-select
                        v-model="selectedFieldData.dateFormat"
                        :placeholder="$t('microConfig.selectDateFormat')"
                      >
                        <el-option :label="$t('microConfig.year')" value="year"></el-option>
                        <el-option :label="$t('microConfig.month')" value="month"></el-option>
                        <el-option :label="$t('microConfig.day')" value="date"></el-option>
                        <el-option :label="$t('microConfig.time')" value="datetime"></el-option>
                      </el-select>
                    </el-form-item>
                  </div>
                </div>

                <div class="config-section">
                  <div class="config-section-title">{{ $t('microConfig.querySettings') }}</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item :label="$t('microConfig.queryMode')">
                      <el-select v-model="selectedFieldData.queryMode" :placeholder="$t('microConfig.selectQueryMode')">
                        <el-option
                          v-for="option in getQueryModeOptions(selectedFieldData)"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        ></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item v-if="selectedFieldData.queryMode !== 'none'" :label="$t('microConfig.queryWidth')">
                      <el-input-number
                        v-model="selectedFieldData.queryWidth"
                        :min="100"
                        :max="600"
                        :step="10"
                        placeholder="150"
                      ></el-input-number>
                    </el-form-item>
                  </div>
                </div>

                <div v-if="supportsColumnLength(selectedFieldData)" class="config-section">
                  <div class="config-section-title">{{ $t('microConfig.dbLength') }}</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item :label="$t('microConfig.fieldLength')">
                      <el-input-number
                        v-model="selectedFieldData.columnLength"
                        :min="1"
                        :max="2000"
                        :step="10"
                        :placeholder="getDefaultColumnLengthPlaceholder(selectedFieldData)"
                      ></el-input-number>
                    </el-form-item>
                  </div>
                </div>

                <div v-if="hasValidationConfig(selectedFieldData)" class="config-section">
                  <div class="config-section-title">{{ $t('microConfig.validationRules') }}</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item v-if="supportsLengthRule(selectedFieldData)" :label="$t('microConfig.minLength')">
                      <el-input-number
                        v-model="selectedFieldData.minLength"
                        :min="0"
                        :max="10000"
                        :placeholder="$t('microConfig.minLength')"
                      ></el-input-number>
                    </el-form-item>
                    <el-form-item v-if="supportsLengthRule(selectedFieldData)" :label="$t('microConfig.maxLength')">
                      <el-input-number
                        v-model="selectedFieldData.maxLength"
                        :min="0"
                        :max="10000"
                        :placeholder="$t('microConfig.maxLength')"
                      ></el-input-number>
                    </el-form-item>
                    <el-form-item v-if="supportsNumberRange(selectedFieldData)" :label="$t('microConfig.minValue')">
                      <el-input-number
                        v-model="selectedFieldData.minValue"
                        :placeholder="$t('microConfig.minValue')"
                      ></el-input-number>
                    </el-form-item>
                    <el-form-item v-if="supportsNumberRange(selectedFieldData)" :label="$t('microConfig.maxValue')">
                      <el-input-number
                        v-model="selectedFieldData.maxValue"
                        :placeholder="$t('microConfig.maxValue')"
                      ></el-input-number>
                    </el-form-item>
                    <el-form-item
                      v-if="supportsPatternRule(selectedFieldData)"
                      :label="$t('microConfig.pattern')"
                      class="form-grid-span-2"
                    >
                      <el-input
                        v-model="selectedFieldData.pattern"
                        :placeholder="$t('microConfig.patternPlaceholder')"
                      ></el-input>
                    </el-form-item>
                  </div>
                </div>

                <div v-if="selectedFieldScope === 'main' && isLookupField(selectedFieldData)" class="config-section">
                  <div class="config-section-title">{{ $t('microConfig.lookupQuery') }}</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item :label="$t('microConfig.esbDataSource')">
                      <el-select
                        v-model="selectedFieldData.lookupDataSourceCode"
                        clearable
                        filterable
                        :placeholder="$t('microConfig.selectEsbDataSource')"
                      >
                        <el-option
                          v-for="source in esbDataSources"
                          :key="source.Code || source.code"
                          :label="`${source.Name || source.name}（${source.Code || source.code}）`"
                          :value="source.Code || source.code"
                        ></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('microConfig.lookupValueField')">
                      <el-input
                        v-model="selectedFieldData.lookupValueField"
                        :placeholder="$t('microConfig.lookupValueFieldExample')"
                      ></el-input>
                    </el-form-item>
                    <el-form-item :label="$t('microConfig.pageSize')">
                      <el-input-number
                        v-model="selectedFieldData.lookupPageSize"
                        :min="5"
                        :max="200"
                        :step="5"
                        style="width: 100%"
                      ></el-input-number>
                    </el-form-item>
                  </div>
                  <el-form-item :label="$t('microConfig.staticParamsJson')">
                    <el-input
                      ref="lookupParamsInput"
                      v-model="selectedFieldData.lookupParams"
                      type="textarea"
                      :rows="2"
                      :placeholder="$t('microConfig.lookupParamsExample')"
                    ></el-input>
                    <div class="esb-variable-panel">
                      <span class="esb-variable-title">{{ $t('microConfig.availableVariables') }}</span>
                      <el-tag
                        v-for="variable in esbVariableOptions"
                        :key="variable.value"
                        class="esb-variable-tag"
                        effect="plain"
                        @click="insertLookupVariable(variable.value)"
                      >
                        {{ $t(variable.labelKey) }} {{ variable.value }}
                      </el-tag>
                    </div>
                  </el-form-item>
                  <el-form-item :label="$t('microConfig.lookupColumns')">
                    <div class="lookup-config-list">
                      <div
                        v-for="(column, index) in selectedFieldData.lookupColumns"
                        :key="index"
                        class="lookup-config-row lookup-config-row--columns"
                      >
                        <el-input v-model="column.field" :placeholder="$t('microConfig.returnField')"></el-input>
                        <el-input v-model="column.label" :placeholder="$t('microConfig.columnTitle')"></el-input>
                        <el-input-number
                          v-model="column.width"
                          :min="80"
                          :max="500"
                          :placeholder="$t('microConfig.width')"
                        ></el-input-number>
                        <el-button type="danger" icon="Delete" @click="removeLookupColumn(index)"></el-button>
                      </div>
                      <el-button icon="Plus" @click="addLookupColumn">
                        {{ $t('microConfig.addLookupColumn') }}
                      </el-button>
                    </div>
                  </el-form-item>
                  <el-form-item :label="$t('microConfig.lookupMappings')">
                    <div class="lookup-config-list">
                      <div
                        v-for="(mapping, index) in selectedFieldData.lookupMappings"
                        :key="index"
                        class="lookup-config-row"
                      >
                        <el-input v-model="mapping.sourceField" :placeholder="$t('microConfig.returnField')"></el-input>
                        <el-select
                          v-model="mapping.targetField"
                          filterable
                          :placeholder="$t('microConfig.targetField')"
                        >
                          <el-option
                            v-for="field in lookupTargetFieldOptions"
                            :key="field.fieldName"
                            :label="`${field.label || field.fieldName}（${field.fieldName}）`"
                            :value="field.fieldName"
                          ></el-option>
                        </el-select>
                        <el-button type="danger" icon="Delete" @click="removeLookupMapping(index)"></el-button>
                      </div>
                      <el-button icon="Plus" @click="addLookupMapping">
                        {{ $t('microConfig.addTargetMapping') }}
                      </el-button>
                    </div>
                  </el-form-item>
                </div>

                <div v-if="supportsOptions(selectedFieldData)" class="config-section">
                  <div class="config-section-head">
                    <div class="config-section-title">{{ $t('microConfig.optionConfig') }}</div>
                    <el-button
                      v-if="selectedFieldData.optionSource === 'manual'"
                      type="primary"
                      size="small"
                      icon="Plus"
                      @click="addOption"
                    >
                      {{ $t('microConfig.addOption') }}
                    </el-button>
                  </div>
                  <div class="option-source-row">
                    <el-radio-group v-model="selectedFieldData.optionSource" @change="handleOptionSourceChange">
                      <el-radio value="manual">{{ $t('microConfig.manualOptions') }}</el-radio>
                      <el-radio value="dictionary">{{ $t('microConfig.dictionary') }}</el-radio>
                      <el-radio value="esb">{{ $t('microConfig.esbDataSource') }}</el-radio>
                    </el-radio-group>
                    <el-select
                      v-if="selectedFieldData.optionSource === 'dictionary'"
                      v-model="selectedFieldData.dictCode"
                      class="dict-code-select"
                      clearable
                      filterable
                      :placeholder="$t('microConfig.selectDictionary')"
                    >
                      <el-option
                        v-for="dict in dictionaryTypes"
                        :key="dict.DictCode"
                        :label="`${dict.DictName}（${dict.DictCode}）`"
                        :value="dict.DictCode"
                      ></el-option>
                    </el-select>
                    <el-select
                      v-if="selectedFieldData.optionSource === 'esb'"
                      v-model="selectedFieldData.esbDataSourceCode"
                      class="dict-code-select"
                      clearable
                      filterable
                      :placeholder="$t('microConfig.selectEsbDataSource')"
                    >
                      <el-option
                        v-for="source in esbDataSources"
                        :key="source.Code || source.code"
                        :label="`${source.Name || source.name}（${source.Code || source.code}）`"
                        :value="source.Code || source.code"
                      ></el-option>
                    </el-select>
                  </div>
                  <div v-if="selectedFieldData.optionSource === 'esb'" class="esb-option-grid">
                    <el-input
                      ref="esbParamsInput"
                      v-model="selectedFieldData.esbParams"
                      type="textarea"
                      :rows="2"
                      :placeholder="$t('microConfig.lookupParamsExample')"
                    ></el-input>
                    <div class="esb-variable-panel">
                      <span class="esb-variable-title">{{ $t('microConfig.availableVariables') }}</span>
                      <el-tag
                        v-for="variable in esbVariableOptions"
                        :key="variable.value"
                        class="esb-variable-tag"
                        effect="plain"
                        @click="insertEsbVariable(variable.value)"
                      >
                        {{ $t(variable.labelKey) }} {{ variable.value }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="options-container">
                    <div v-if="selectedFieldData.optionSource === 'dictionary'" class="empty-inline">
                      {{ $t('microConfig.dictionaryRuntimeTip') }}
                    </div>
                    <div v-else-if="selectedFieldData.optionSource === 'esb'" class="empty-inline">
                      {{ $t('microConfig.esbRuntimeTip') }}
                    </div>
                    <div
                      v-else-if="selectedFieldData.options && selectedFieldData.options.length > 0"
                      class="option-list"
                    >
                      <div v-for="(option, index) in selectedFieldData.options" :key="index" class="option-item">
                        <el-input v-model="option.label" :placeholder="$t('microConfig.optionLabel')"></el-input>
                        <el-input v-model="option.value" :placeholder="$t('microConfig.optionValue')"></el-input>
                        <el-tooltip :content="$t('microConfig.deleteOption')" placement="top">
                          <el-button
                            class="option-delete-button"
                            type="danger"
                            size="small"
                            icon="Delete"
                            @click="deleteOption(index)"
                          >
                            {{ $t('common.delete') }}
                          </el-button>
                        </el-tooltip>
                      </div>
                    </div>
                    <div v-else class="empty-inline">{{ $t('microConfig.noOptions') }}</div>
                  </div>
                </div>
              </el-form>
            </template>
            <div v-else class="no-selection">
              <div class="no-selection-title">{{ $t('microConfig.noSelectionTitle') }}</div>
              <div class="no-selection-subtitle">{{ $t('microConfig.noSelectionSubtitle') }}</div>
            </div>
          </section>
        </main>
      </div>
    </el-dialog>

    <!-- 接口文档对话框 -->
    <ApiDocDialog v-model="apiDocVisible" :apis="generatedApis" />
  </div>
</template>

<script>
import { addMicroAppConfig, deleteMicroAppConfig, getMicroAppConfigs, updateMicroAppConfig } from '@/api/microApp'
import { getDictionaryTypes } from '@/api/dictionary'
import { getEsbDataSources } from '@/api/esb'
import { Delete, Document, Edit, Plus, Refresh, Search, Setting } from '@element-plus/icons-vue'
import { markRaw } from 'vue'
import MicroAppConfigDialog from './components/MicroAppConfigDialog.vue'
import ApiDocDialog from './components/ApiDocDialog.vue'

export default {
  name: 'MicroApp',
  components: {
    Delete,
    Search,
    MicroAppConfigDialog,
    ApiDocDialog
  },
  data() {
    return {
      Delete: markRaw(Delete),
      Document: markRaw(Document),
      Edit: markRaw(Edit),
      Plus: markRaw(Plus),
      Refresh: markRaw(Refresh),
      Setting: markRaw(Setting),
      // 查询条件
      queryInfo: {
        query: '',
        pagenum: 1,
        pagesize: 10
      },
      // 微应用配置列表
      MicroAppList: [],
      // 总数
      total: 0,
      // 对话框显示状态
      dialogVisible: false,
      // 对话框标题
      dialogTitle: '',
      // 可视化配置对话框显示状态
      visualConfigVisible: false,
      // 接口文档对话框显示状态
      apiDocVisible: false,
      // 当前激活的 API 标签
      activeApiTab: 'api-list',
      // 选中的字段 key
      selectedFieldKey: '',
      fieldUiKeySeed: 0,
      selectedFieldScope: 'main',
      selectedSubTableName: '',
      // 展开的节点 keys
      expandedKeys: [],
      // 选中的字段数据
      selectedFieldData: null,
      dictionaryTypes: [],
      esbDataSources: [],
      esbVariableOptions: [
        { labelKey: 'microConfig.currentUserAccount', value: '${currentUser.account}' },
        { labelKey: 'microConfig.currentUserName', value: '${currentUser.displayName}' },
        { labelKey: 'microConfig.currentUserEmail', value: '${currentUser.email}' }
      ],
      // 生成的API列表
      generatedApis: [],
      // 微应用配置表单
      MicroAppForm: {
        ItemId: '',
        ConfigName: '',
        ModelName: '',
        MicroAppPath: '',
        configDesc: '',
        Status: 1,
        SupportCreate: true,
        SupportUpdate: true,
        SupportDelete: true,
        SupportBatchDelete: false,
        SupportImport: false,
        SupportExport: false,
        ShowSubTablesInList: true,
        DataScope: 'all',
        FormColumns: 1,
        QueryColumns: 1,
        Fields: [],
        SubTables: []
      },
      // 表单验证规则
      rules: {
        ConfigName: [
          { required: true, message: this.$t('microConfig.configNameRequired'), trigger: 'blur' },
          { min: 2, max: 20, message: this.$t('microConfig.configNameLength'), trigger: 'blur' }
        ],
        ModelName: [
          { required: true, message: this.$t('microConfig.modelNameRequired'), trigger: 'blur' },
          {
            pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
            message: this.$t('microConfig.modelNamePattern'),
            trigger: 'blur'
          }
        ],
        MicroAppPath: [
          { required: true, message: this.$t('microConfig.microAppPathRequired'), trigger: 'blur' },
          {
            pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
            message: this.$t('microConfig.microAppPathPattern'),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    microAppStats() {
      return this.MicroAppList.reduce(
        (stats, item) => {
          if (item.Status === 1) {
            stats.enabled += 1
          } else {
            stats.disabled += 1
          }
          return stats
        },
        { enabled: 0, disabled: 0 }
      )
    },
    queryConfigCount() {
      return this.MicroAppForm.Fields.filter((field) => field.queryMode && field.queryMode !== 'none').length
    },
    listConfigCount() {
      return this.MicroAppForm.Fields.filter((field) => field.showInList).length
    },
    lookupTargetFieldOptions() {
      if (this.selectedFieldScope === 'sub') {
        const subTable = this.MicroAppForm.SubTables.find((item) => item.tableName === this.selectedSubTableName)
        return (subTable?.fields || []).filter((field) => field.fieldName)
      }
      return this.MicroAppForm.Fields.filter((field) => field.fieldName)
    }
  },
  created() {
    this.getMicroApps()
    this.loadDictionaryTypes()
    this.loadEsbDataSources()
  },
  methods: {
    async loadDictionaryTypes() {
      try {
        const { data: res } = await getDictionaryTypes({ Enabled: true })
        if (res.success) {
          this.dictionaryTypes = res.data || []
        }
      } catch (error) {
        console.error(this.$t('microConfig.loadDictionaryFailed'), error)
      }
    },
    async loadEsbDataSources() {
      try {
        const { data: res } = await getEsbDataSources({
          sourceType: 'sql',
          status: 1,
          pageNum: 1,
          pageSize: 200
        })
        this.esbDataSources = res?.success ? res.data || [] : []
      } catch (error) {
        this.esbDataSources = []
      }
    },
    isTextField(field) {
      return ['string', 'textarea'].includes(field?.fieldType)
    },
    isNumberField(field) {
      return field?.fieldType === 'number'
    },
    isDateField(field) {
      return field?.fieldType === 'datetime'
    },
    isAttachmentField(field) {
      return field?.fieldType === 'attachment'
    },
    isLookupField(field) {
      return field?.fieldType === 'lookup'
    },
    supportsOptions(field) {
      return ['select', 'radio', 'checkbox'].includes(field?.fieldType)
    },
    supportsColumnLength(field) {
      return ['string', 'select', 'radio', 'checkbox', 'lookup'].includes(field?.fieldType)
    },
    getDefaultColumnLength(field) {
      return field?.fieldType === 'select' ? 200 : 500
    },
    getDefaultColumnLengthPlaceholder(field) {
      return String(this.getDefaultColumnLength(field))
    },
    supportsLengthRule(field) {
      return this.isTextField(field)
    },
    supportsNumberRange(field) {
      return this.isNumberField(field)
    },
    supportsPatternRule(field) {
      return this.isTextField(field)
    },
    hasValidationConfig(field) {
      return this.supportsLengthRule(field) || this.supportsNumberRange(field) || this.supportsPatternRule(field)
    },
    getFieldTypeLabel(fieldType) {
      const typeMap = {
        string: this.$t('microConfig.text'),
        number: this.$t('microConfig.number'),
        datetime: this.$t('microConfig.date'),
        boolean: this.$t('microConfig.boolean'),
        textarea: this.$t('microConfig.textarea'),
        select: this.$t('microConfig.select'),
        radio: this.$t('microConfig.radio'),
        checkbox: this.$t('microConfig.checkbox'),
        lookup: this.$t('microConfig.lookup'),
        attachment: this.$t('microConfig.attachment')
      }

      return typeMap[fieldType] || this.$t('microConfig.field')
    },
    getFieldTypeTagType(fieldType) {
      const tagMap = {
        number: 'success',
        datetime: 'warning',
        boolean: 'info',
        lookup: 'success',
        attachment: 'info'
      }

      return tagMap[fieldType]
    },
    getQueryModeOptions(field) {
      const options = [{ label: this.$t('microConfig.noQuery'), value: 'none' }]

      if (this.isTextField(field) || this.isLookupField(field)) {
        return options.concat([
          { label: this.$t('microConfig.exactQuery'), value: 'exact' },
          { label: this.$t('microConfig.fuzzyQuery'), value: 'fuzzy' }
        ])
      }

      if (this.isNumberField(field) || this.isDateField(field)) {
        return options.concat([
          { label: this.$t('microConfig.exactQuery'), value: 'exact' },
          { label: this.$t('microConfig.rangeQuery'), value: 'range' }
        ])
      }

      if (this.supportsOptions(field) || field?.fieldType === 'boolean') {
        return options.concat([{ label: this.$t('microConfig.exactQuery'), value: 'exact' }])
      }

      return options
    },
    normalizeFieldByType(field) {
      if (!field) return

      const allowedQueryModes = this.getQueryModeOptions(field).map((option) => option.value)
      if (!allowedQueryModes.includes(field.queryMode)) {
        field.queryMode = 'none'
      }

      if (!this.isDateField(field)) {
        field.dateFormat = 'datetime'
      }

      if (this.isAttachmentField(field)) {
        field.defaultValue = ''
        field.sortable = false
      }

      if (!['left', 'center', 'right'].includes(field.columnAlign)) {
        field.columnAlign = 'left'
      }

      if (this.supportsColumnLength(field)) {
        const defaultLength = this.getDefaultColumnLength(field)
        const parsedLength = Number(field.columnLength)
        field.columnLength = Number.isInteger(parsedLength) && parsedLength > 0 ? parsedLength : defaultLength
      } else {
        field.columnLength = null
      }

      if (!this.supportsOptions(field)) {
        field.options = []
        field.optionSource = 'manual'
        field.dictCode = ''
        field.esbDataSourceCode = ''
        field.esbParams = ''
      } else {
        field.optionSource = ['dictionary', 'esb'].includes(field.optionSource) ? field.optionSource : 'manual'
        if (field.optionSource === 'dictionary') {
          field.esbDataSourceCode = ''
          field.esbParams = ''
        } else if (field.optionSource === 'esb') {
          field.dictCode = ''
          field.options = []
        } else {
          field.dictCode = ''
          field.esbDataSourceCode = ''
          field.esbParams = ''
        }
      }

      if (!this.supportsLengthRule(field)) {
        field.minLength = null
        field.maxLength = null
      }

      if (!this.supportsNumberRange(field)) {
        field.minValue = null
        field.maxValue = null
      }

      if (!this.supportsPatternRule(field)) {
        field.pattern = ''
      }

      if (this.isLookupField(field)) {
        field.lookupDataSourceCode = field.lookupDataSourceCode || ''
        field.lookupParams = field.lookupParams || ''
        field.lookupValueField = field.lookupValueField || ''
        field.lookupPageSize = this.normalizeLookupPageSize(field.lookupPageSize)
        field.lookupColumns = this.normalizeLookupColumns(field.lookupColumns)
        field.lookupMappings = this.normalizeLookupMappings(field.lookupMappings)
      } else {
        field.lookupDataSourceCode = ''
        field.lookupParams = ''
        field.lookupValueField = ''
        field.lookupPageSize = 10
        field.lookupColumns = []
        field.lookupMappings = []
      }
    },
    normalizeLookupPageSize(pageSize) {
      const value = Number(pageSize)
      return Number.isInteger(value) && value >= 5 && value <= 200 ? value : 10
    },
    normalizeLookupColumns(columns) {
      let normalized = columns
      if (typeof normalized === 'string') {
        try {
          normalized = JSON.parse(normalized)
        } catch (error) {
          normalized = []
        }
      }
      if (!Array.isArray(normalized)) return []
      return normalized
        .filter((column) => column && typeof column === 'object')
        .map((column) => ({
          field: column.Field || column.field || '',
          label: column.Label || column.label || '',
          width: column.Width !== undefined && column.Width !== null ? column.Width : column.width || null
        }))
    },
    normalizeLookupMappings(mappings) {
      let normalized = mappings
      if (typeof normalized === 'string') {
        try {
          normalized = JSON.parse(normalized)
        } catch (error) {
          normalized = []
        }
      }
      if (!Array.isArray(normalized)) return []
      return normalized
        .filter((mapping) => mapping && typeof mapping === 'object')
        .map((mapping) => ({
          sourceField: mapping.SourceField || mapping.sourceField || '',
          targetField: mapping.TargetField || mapping.targetField || ''
        }))
    },
    normalizeFieldOptions(options) {
      let normalized = options

      if (typeof normalized === 'string') {
        try {
          normalized = JSON.parse(normalized)
        } catch (error) {
          normalized = []
        }
      }

      if (!Array.isArray(normalized)) {
        return []
      }

      return normalized
        .filter((option) => option && typeof option === 'object')
        .map((option) => ({
          label: option.Label || option.label || '',
          value: option.Value || option.value || ''
        }))
    },
    normalizeFormColumns(formColumns) {
      const value = Number(formColumns)
      return Number.isInteger(value) && value >= 1 && value <= 4 ? value : 1
    },
    normalizeQueryColumns(queryColumns) {
      const value = Number(queryColumns)
      return Number.isInteger(value) && value >= 1 && value <= 4 ? value : 1
    },
    normalizeShowSubTablesInList(config) {
      if (config?.ShowSubTablesInList !== undefined && config.ShowSubTablesInList !== null) {
        return Boolean(config.ShowSubTablesInList)
      }
      if (config?.showSubTablesInList !== undefined && config.showSubTablesInList !== null) {
        return Boolean(config.showSubTablesInList)
      }
      return true
    },
    normalizeFieldOrder(fields) {
      return Array.isArray(fields)
        ? [...fields]
            .map((field, index) => ({
              ...field,
              sortOrder:
                field.sortOrder !== undefined && field.sortOrder !== null && field.sortOrder !== ''
                  ? Number(field.sortOrder)
                  : index + 1
            }))
            .sort((a, b) => a.sortOrder - b.sortOrder)
        : []
    },
    normalizeFields(fields) {
      let normalized = fields || []

      if (typeof normalized === 'string') {
        try {
          normalized = JSON.parse(normalized)
        } catch (error) {
          normalized = []
        }
      }

      if (!Array.isArray(normalized)) {
        return []
      }

      const usedUiKeys = new Set()
      const normalizedFields = this.normalizeFieldOrder(
        normalized.map((field, index) => ({
          __uiKey: this.getUniqueFieldUiKey(field.__uiKey, index, usedUiKeys),
          label: field.Label || field.label || '',
          fieldName: field.FieldName || field.fieldName || '',
          fieldType: field.FieldType || field.fieldType || 'string',
          sortOrder:
            field.SortOrder !== undefined && field.SortOrder !== null
              ? field.SortOrder
              : field.sortOrder !== undefined && field.sortOrder !== null
                ? field.sortOrder
                : index + 1,
          required:
            field.Required !== undefined ? field.Required : field.required !== undefined ? field.required : false,
          showInList:
            field.ShowInList !== undefined
              ? field.ShowInList
              : field.showInList !== undefined
                ? field.showInList
                : true,
          editable:
            field.Editable !== undefined ? field.Editable : field.editable !== undefined ? field.editable : true,
          validation: field.Validation || field.validation || '',
          columnWidth: field.ColumnWidth || field.columnWidth || null,
          columnLength:
            field.ColumnLength !== undefined
              ? field.ColumnLength
              : field.columnLength !== undefined
                ? field.columnLength
                : null,
          sortable:
            field.Sortable !== undefined ? field.Sortable : field.sortable !== undefined ? field.sortable : false,
          columnAlign: field.ColumnAlign || field.columnAlign || 'left',
          fixed: field.Fixed || field.fixed || 'none',
          queryMode: field.QueryMode || field.queryMode || 'none',
          queryWidth:
            field.QueryWidth !== undefined && field.QueryWidth !== null
              ? field.QueryWidth
              : field.queryWidth !== undefined && field.queryWidth !== null
                ? field.queryWidth
                : 150,
          dateFormat: field.DateFormat || field.dateFormat || 'datetime',
          minLength: field.MinLength !== undefined ? field.MinLength : field.minLength || null,
          maxLength: field.MaxLength !== undefined ? field.MaxLength : field.maxLength || null,
          minValue: field.MinValue !== undefined ? field.MinValue : field.minValue || null,
          maxValue: field.MaxValue !== undefined ? field.MaxValue : field.maxValue || null,
          pattern: field.Pattern || field.pattern || '',
          defaultValue: field.DefaultValue || field.defaultValue || '',
          optionSource: field.OptionSource || field.optionSource || 'manual',
          dictCode: field.DictCode || field.dictCode || '',
          esbDataSourceCode: field.EsbDataSourceCode || field.esbDataSourceCode || '',
          esbParams: field.EsbParams || field.esbParams || '',
          lookupDataSourceCode: field.LookupDataSourceCode || field.lookupDataSourceCode || '',
          lookupParams: field.LookupParams || field.lookupParams || '',
          lookupValueField: field.LookupValueField || field.lookupValueField || '',
          lookupPageSize: field.LookupPageSize || field.lookupPageSize || 10,
          lookupColumns: this.normalizeLookupColumns(field.LookupColumns || field.lookupColumns || []),
          lookupMappings: this.normalizeLookupMappings(field.LookupMappings || field.lookupMappings || []),
          options: this.normalizeFieldOptions(field.Options || field.options || [])
        }))
      )

      normalizedFields.forEach((field) => this.normalizeFieldByType(field))
      return normalizedFields
    },
    getUniqueFieldUiKey(preferredKey, index, usedKeys) {
      const baseKey = preferredKey || `field-${index + 1}`
      let uiKey = baseKey
      let suffix = 1
      while (usedKeys.has(uiKey)) {
        uiKey = `${baseKey}-${suffix}`
        suffix += 1
      }
      usedKeys.add(uiKey)
      return uiKey
    },
    normalizeSubTables(subTables) {
      let normalized = subTables || []

      if (typeof normalized === 'string') {
        try {
          normalized = JSON.parse(normalized)
        } catch (error) {
          normalized = []
        }
      }

      if (!Array.isArray(normalized)) {
        return []
      }

      return normalized
        .filter((subTable) => subTable && typeof subTable === 'object')
        .map((subTable, index) => ({
          label: subTable.Label || subTable.label || '',
          tableName: subTable.TableName || subTable.tableName || '',
          minRows:
            subTable.MinRows !== undefined && subTable.MinRows !== null
              ? Number(subTable.MinRows)
              : subTable.minRows !== undefined && subTable.minRows !== null
                ? Number(subTable.minRows)
                : 0,
          maxRows:
            subTable.MaxRows !== undefined && subTable.MaxRows !== null
              ? Number(subTable.MaxRows)
              : subTable.maxRows !== undefined && subTable.maxRows !== null
                ? Number(subTable.maxRows)
                : null,
          sortOrder:
            subTable.SortOrder !== undefined && subTable.SortOrder !== null
              ? Number(subTable.SortOrder)
              : subTable.sortOrder !== undefined && subTable.sortOrder !== null
                ? Number(subTable.sortOrder)
                : index + 1,
          enableLookup:
            subTable.EnableLookup !== undefined
              ? Boolean(subTable.EnableLookup)
              : subTable.enableLookup !== undefined
                ? Boolean(subTable.enableLookup)
                : false,
          lookupDataSourceCode: subTable.LookupDataSourceCode || subTable.lookupDataSourceCode || '',
          lookupParams: subTable.LookupParams || subTable.lookupParams || '',
          lookupPageSize: subTable.LookupPageSize || subTable.lookupPageSize || 10,
          lookupColumns: this.normalizeLookupColumns(subTable.LookupColumns || subTable.lookupColumns || []),
          lookupMappings: this.normalizeLookupMappings(subTable.LookupMappings || subTable.lookupMappings || []),
          fields: this.normalizeFields(subTable.Fields || subTable.fields || [])
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },
    // 获取微应用配置列表
    async getMicroApps() {
      try {
        const params = {
          PageNum: this.queryInfo.pagenum,
          PageSize: this.queryInfo.pagesize
        }
        // 只有当 query 不为空时才添加 Keyword 参数
        if (this.queryInfo.query) {
          params.Keyword = this.queryInfo.query
        }
        const { data: res } = await getMicroAppConfigs(params)
        if (res.success) {
          // 兼容旧返回字段，并统一映射到微应用路径
          this.MicroAppList = res.data.map((item) => ({
            ...item,
            MicroAppPath: item.MicroAppPath || item.ApiPrefix || item.ModelName || '',
            DataScope: item.DataScope || item.dataScope || 'all',
            FormColumns: this.normalizeFormColumns(item.FormColumns || item.formColumns),
            QueryColumns: this.normalizeQueryColumns(item.QueryColumns || item.queryColumns),
            ShowSubTablesInList: this.normalizeShowSubTablesInList(item),
            SubTables: this.normalizeSubTables(item.SubTables || item.subTables || []),
            configDesc: item.ConfigDesc || item.configDesc || ''
          }))
          this.total = res.total
        } else {
          this.$message.error(res.msg || this.$t('microConfig.loadListFailed'))
        }
      } catch (error) {
        this.$message.error(`${this.$t('microConfig.loadListFailed')}: ${error.message}`)
      }
    },
    // 处理分页大小变化
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.getMicroApps()
    },
    // 处理当前页变化
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.getMicroApps()
    },
    // 添加微应用
    addMicroApp() {
      this.dialogTitle = this.$t('microConfig.create')
      this.MicroAppForm = {
        ItemId: '',
        ConfigName: '',
        ModelName: '',
        MicroAppPath: '',
        configDesc: '',
        Status: 1,
        SupportCreate: true,
        SupportUpdate: true,
        SupportDelete: true,
        SupportBatchDelete: false,
        SupportImport: false,
        SupportExport: false,
        ShowSubTablesInList: true,
        DataScope: 'all',
        FormColumns: 1,
        QueryColumns: 1,
        Fields: [],
        SubTables: []
      }
      this.dialogVisible = true
    },
    // 编辑微应用
    editMicroApp(row) {
      this.dialogTitle = this.$t('microConfig.edit')
      this.MicroAppForm = {
        ...row,
        MicroAppPath: row.MicroAppPath || row.ApiPrefix || row.ModelName || '',
        DataScope: row.DataScope || row.dataScope || 'all',
        FormColumns: this.normalizeFormColumns(row.FormColumns || row.formColumns),
        QueryColumns: this.normalizeQueryColumns(row.QueryColumns || row.queryColumns),
        ShowSubTablesInList: this.normalizeShowSubTablesInList(row),
        SubTables: this.normalizeSubTables(row.SubTables || row.subTables || []),
        configDesc: row.ConfigDesc || row.configDesc || ''
      }
      this.dialogVisible = true
    },
    // 删除微应用
    deleteMicroApp(ItemId) {
      this.$confirm(this.$t('microConfig.deleteConfirm'), this.$t('microRuntime.warning'), {
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel'),
        type: 'warning'
      })
        .then(async () => {
          try {
            const { data: res } = await deleteMicroAppConfig(ItemId)
            if (res.success) {
              this.$message.success(res.msg || this.$t('language.deleteSuccess'))
              this.getMicroApps()
            } else {
              this.$message.error(res.msg || this.$t('language.deleteFailed'))
            }
          } catch (error) {
            this.$message.error(`${this.$t('language.deleteFailed')}: ${error.message}`)
          }
        })
        .catch(() => {
          this.$message.info(this.$t('organization.deleteCanceled'))
        })
    },
    // 提交表单
    async submitForm() {
      this.$refs.MicroAppFormRef.validate(async (valid) => {
        if (!valid) return
        try {
          const submitData = {
            ...this.MicroAppForm,
            ConfigDesc: this.MicroAppForm.configDesc || this.MicroAppForm.ConfigDesc || '',
            MicroAppPath: this.MicroAppForm.MicroAppPath || this.MicroAppForm.ModelName,
            FormColumns: this.normalizeFormColumns(this.MicroAppForm.FormColumns),
            QueryColumns: this.normalizeQueryColumns(this.MicroAppForm.QueryColumns),
            ShowSubTablesInList: this.MicroAppForm.ShowSubTablesInList !== false
          }
          let res
          if (this.MicroAppForm.ItemId) {
            res = await updateMicroAppConfig(submitData)
          } else {
            res = await addMicroAppConfig(submitData)
          }
          if (res.data.success) {
            this.$message.success(
              res.data.msg ||
                (this.MicroAppForm.id ? this.$t('apiKey.updateSuccess') : this.$t('microConfig.addSuccess'))
            )
            this.dialogVisible = false
            this.getMicroApps()
          } else {
            this.$message.error(res.data.msg || this.$t('microConfig.operationFailed'))
          }
        } catch (error) {
          this.$message.error(`${this.$t('microConfig.operationFailed')}: ${error.message}`)
        }
      })
    },
    // 可视化配置
    visualConfig(row) {
      const fields = this.normalizeFields(row.Fields)
      const subTables = this.normalizeSubTables(row.SubTables || row.subTables || [])

      this.MicroAppForm = {
        ...row,
        MicroAppPath: row.MicroAppPath || row.ApiPrefix || row.ModelName || '',
        DataScope: row.DataScope || row.dataScope || 'all',
        FormColumns: this.normalizeFormColumns(row.FormColumns || row.formColumns),
        QueryColumns: this.normalizeQueryColumns(row.QueryColumns || row.queryColumns),
        ShowSubTablesInList: this.normalizeShowSubTablesInList(row),
        configDesc: row.ConfigDesc || row.configDesc || '',
        Fields: fields,
        SubTables: subTables
      }

      // 初始化展开的节点
      this.expandedKeys = []
      // 重置选中状态
      this.selectedFieldKey = ''
      this.selectedFieldScope = 'main'
      this.selectedSubTableName = ''
      this.selectedFieldData = null
      this.visualConfigVisible = true
    },
    // 添加字段
    createNewField(sortOrder) {
      return {
        __uiKey: `field-new-${Date.now()}-${++this.fieldUiKeySeed}`,
        label: this.$t('microConfig.newField'),
        fieldName: 'new_field',
        fieldType: 'string',
        required: false,
        showInList: true,
        editable: true,
        validation: '',
        columnWidth: null,
        sortable: false,
        columnAlign: 'left',
        fixed: 'none',
        queryMode: 'none',
        queryWidth: 150,
        dateFormat: 'datetime',
        sortOrder,
        minLength: null,
        maxLength: null,
        minValue: null,
        maxValue: null,
        pattern: '',
        defaultValue: '',
        columnLength: 500,
        optionSource: 'manual',
        dictCode: '',
        esbDataSourceCode: '',
        esbParams: '',
        lookupDataSourceCode: '',
        lookupParams: '',
        lookupValueField: '',
        lookupPageSize: 10,
        lookupColumns: [],
        lookupMappings: [],
        options: []
      }
    },
    addField() {
      const newField = this.createNewField(this.MicroAppForm.Fields.length + 1)
      this.MicroAppForm.Fields.push(newField)
      this.selectField(newField)
      this.$nextTick(() => {
        this.$refs.mainFieldTree?.setCurrentKey(newField.__uiKey)
      })
    },
    addSubTable() {
      const index = this.MicroAppForm.SubTables.length + 1
      const subTable = {
        label: this.$t('microConfig.subTableDefaultName', { index }),
        tableName: `sub_table_${index}`,
        minRows: 0,
        maxRows: null,
        sortOrder: index,
        enableLookup: false,
        lookupDataSourceCode: '',
        lookupParams: '',
        lookupPageSize: 10,
        lookupColumns: [],
        lookupMappings: [],
        fields: []
      }
      this.MicroAppForm.SubTables.push(subTable)
    },
    deleteSubTable(index) {
      const subTable = this.MicroAppForm.SubTables[index]
      this.MicroAppForm.SubTables.splice(index, 1)
      if (subTable && this.selectedFieldScope === 'sub' && this.selectedSubTableName === subTable.tableName) {
        this.selectedFieldKey = ''
        this.selectedFieldScope = 'main'
        this.selectedSubTableName = ''
        this.selectedFieldData = null
      }
    },
    addSubTableField(subTable) {
      if (!subTable.fields) subTable.fields = []
      const newField = this.createNewField(subTable.fields.length + 1)
      subTable.fields.push(newField)
      this.selectSubTableField(subTable, newField)
    },
    deleteSubTableField(subTable, uiKey) {
      const index = subTable.fields.findIndex((item) => item.__uiKey === uiKey)
      if (index > -1) {
        const field = subTable.fields[index]
        subTable.fields.splice(index, 1)
        if (
          this.selectedFieldScope === 'sub' &&
          this.selectedSubTableName === subTable.tableName &&
          this.selectedFieldData?.__uiKey === field.__uiKey
        ) {
          this.selectedFieldKey = ''
          this.selectedFieldScope = 'main'
          this.selectedSubTableName = ''
          this.selectedFieldData = null
        }
        this.refreshSubTableFieldSortOrder(subTable)
      }
    },
    // 添加选项
    addOption() {
      if (!this.selectedFieldData.options) {
        this.selectedFieldData.options = []
      }
      // 使用setTimeout避免ResizeObserver循环
      setTimeout(() => {
        this.selectedFieldData.options.push({
          label: '',
          value: ''
        })
      }, 0)
    },
    // 删除选项
    deleteOption(index) {
      if (this.selectedFieldData.options && this.selectedFieldData.options.length > 0) {
        // 使用setTimeout避免ResizeObserver循环
        setTimeout(() => {
          this.selectedFieldData.options.splice(index, 1)
        }, 0)
      }
    },
    handleOptionSourceChange() {
      if (!this.selectedFieldData) return
      if (this.selectedFieldData.optionSource === 'dictionary') {
        this.selectedFieldData.options = []
        this.selectedFieldData.esbDataSourceCode = ''
        this.selectedFieldData.esbParams = ''
      } else if (this.selectedFieldData.optionSource === 'esb') {
        this.selectedFieldData.options = []
        this.selectedFieldData.dictCode = ''
      } else {
        this.selectedFieldData.dictCode = ''
        this.selectedFieldData.esbDataSourceCode = ''
        this.selectedFieldData.esbParams = ''
        this.selectedFieldData.options = this.selectedFieldData.options || []
      }
    },
    insertEsbVariable(variable) {
      if (!this.selectedFieldData) return

      const token = `"${variable}"`
      const currentValue = this.selectedFieldData.esbParams || ''
      const inputComponent = this.$refs.esbParamsInput
      const textarea = inputComponent?.$el?.querySelector('textarea')

      if (!textarea) {
        this.selectedFieldData.esbParams = currentValue + token
        return
      }

      const start = textarea.selectionStart ?? currentValue.length
      const end = textarea.selectionEnd ?? currentValue.length
      this.selectedFieldData.esbParams = currentValue.slice(0, start) + token + currentValue.slice(end)

      this.$nextTick(() => {
        textarea.focus()
        const cursor = start + token.length
        textarea.setSelectionRange(cursor, cursor)
      })
    },
    insertLookupVariable(variable) {
      if (!this.selectedFieldData) return

      const token = `"${variable}"`
      const currentValue = this.selectedFieldData.lookupParams || ''
      const inputComponent = this.$refs.lookupParamsInput
      const textarea = inputComponent?.$el?.querySelector('textarea')

      if (!textarea) {
        this.selectedFieldData.lookupParams = currentValue + token
        return
      }

      const start = textarea.selectionStart ?? currentValue.length
      const end = textarea.selectionEnd ?? currentValue.length
      this.selectedFieldData.lookupParams = currentValue.slice(0, start) + token + currentValue.slice(end)

      this.$nextTick(() => {
        textarea.focus()
        const cursor = start + token.length
        textarea.setSelectionRange(cursor, cursor)
      })
    },
    addLookupColumn() {
      if (!this.selectedFieldData.lookupColumns) this.selectedFieldData.lookupColumns = []
      this.selectedFieldData.lookupColumns.push({ field: '', label: '', width: null })
    },
    removeLookupColumn(index) {
      this.selectedFieldData.lookupColumns.splice(index, 1)
    },
    addLookupMapping() {
      if (!this.selectedFieldData.lookupMappings) this.selectedFieldData.lookupMappings = []
      this.selectedFieldData.lookupMappings.push({ sourceField: '', targetField: '' })
    },
    removeLookupMapping(index) {
      this.selectedFieldData.lookupMappings.splice(index, 1)
    },
    addSubTableLookupColumn(subTable) {
      if (!subTable.lookupColumns) subTable.lookupColumns = []
      subTable.lookupColumns.push({ field: '', label: '', width: null })
    },
    removeSubTableLookupColumn(subTable, index) {
      subTable.lookupColumns.splice(index, 1)
    },
    addSubTableLookupMapping(subTable) {
      if (!subTable.lookupMappings) subTable.lookupMappings = []
      subTable.lookupMappings.push({ sourceField: '', targetField: '' })
    },
    removeSubTableLookupMapping(subTable, index) {
      subTable.lookupMappings.splice(index, 1)
    },
    // 选择字段
    selectField(data) {
      this.selectedFieldKey = data.__uiKey
      this.selectedFieldScope = 'main'
      this.selectedSubTableName = ''
      this.selectedFieldData = data
    },
    selectSubTableField(subTable, data) {
      this.selectedFieldKey = data.__uiKey
      this.selectedFieldScope = 'sub'
      this.selectedSubTableName = subTable.tableName
      this.selectedFieldData = data
    },
    allowFieldDrop(draggingNode, dropNode, type) {
      return type !== 'inner'
    },
    refreshFieldSortOrder() {
      this.MicroAppForm.Fields = this.MicroAppForm.Fields.map((field, index) => ({
        ...field,
        sortOrder: index + 1
      }))

      if (this.selectedFieldScope === 'main' && this.selectedFieldKey) {
        this.selectedFieldData =
          this.MicroAppForm.Fields.find((field) => field.__uiKey === this.selectedFieldKey) || null
      }
    },
    handleFieldDrop() {
      this.refreshFieldSortOrder()
    },
    refreshSubTableFieldSortOrder(subTable) {
      subTable.fields = (subTable.fields || []).map((field, index) => ({
        ...field,
        sortOrder: index + 1
      }))

      if (
        this.selectedFieldScope === 'sub' &&
        this.selectedSubTableName === subTable.tableName &&
        this.selectedFieldKey
      ) {
        this.selectedFieldData = subTable.fields.find((field) => field.__uiKey === this.selectedFieldKey) || null
      }
    },
    handleSubTableFieldDrop(subTable) {
      this.refreshSubTableFieldSortOrder(subTable)
    },
    // 处理字段类型变化
    handleFieldTypeChange() {
      // 使用setTimeout避免ResizeObserver循环
      setTimeout(() => {
        if (this.selectedFieldData && this.supportsOptions(this.selectedFieldData)) {
          if (!this.selectedFieldData.options) {
            this.selectedFieldData.options = []
          }
        }
        if (this.selectedFieldData && this.selectedFieldData.fieldType === 'datetime') {
          this.selectedFieldData.dateFormat = this.selectedFieldData.dateFormat || 'datetime'
        }
        if (this.selectedFieldData && !this.supportsOptions(this.selectedFieldData)) {
          this.selectedFieldData.optionSource = 'manual'
          this.selectedFieldData.dictCode = ''
        }
        this.normalizeFieldByType(this.selectedFieldData)
      }, 0)
    },
    // 删除字段
    deleteField(uiKey) {
      const index = this.MicroAppForm.Fields.findIndex((item) => item.__uiKey === uiKey)
      if (index > -1) {
        const field = this.MicroAppForm.Fields[index]
        this.MicroAppForm.Fields.splice(index, 1)
        if (this.selectedFieldData && this.selectedFieldData.__uiKey === field.__uiKey) {
          this.selectedFieldKey = ''
          this.selectedFieldData = null
        }
        this.refreshFieldSortOrder()
      }
    },
    toFieldSubmitData(field) {
      this.normalizeFieldByType(field)
      return {
        Label: field.label,
        FieldName: field.fieldName,
        FieldType: field.fieldType,
        SortOrder: field.sortOrder,
        Required: field.required,
        ShowInList: field.showInList,
        Editable: field.editable,
        Validation: field.validation,
        ColumnWidth: field.columnWidth,
        ColumnLength: field.columnLength,
        Sortable: field.sortable,
        ColumnAlign: field.columnAlign || 'left',
        Fixed: field.fixed || 'none',
        QueryMode: field.queryMode || 'none',
        QueryWidth: field.queryMode && field.queryMode !== 'none' ? field.queryWidth || 150 : null,
        DateFormat: field.fieldType === 'datetime' ? field.dateFormat || 'datetime' : null,
        MinLength: field.minLength,
        MaxLength: field.maxLength,
        MinValue: field.minValue,
        MaxValue: field.maxValue,
        Pattern: field.pattern,
        DefaultValue: field.defaultValue,
        OptionSource: field.optionSource || 'manual',
        DictCode: field.optionSource === 'dictionary' ? field.dictCode || '' : '',
        EsbDataSourceCode: field.optionSource === 'esb' ? field.esbDataSourceCode || '' : '',
        EsbParams: field.optionSource === 'esb' ? field.esbParams || '' : '',
        LookupDataSourceCode: field.fieldType === 'lookup' ? field.lookupDataSourceCode || '' : '',
        LookupParams: field.fieldType === 'lookup' ? field.lookupParams || '' : '',
        LookupValueField: field.fieldType === 'lookup' ? field.lookupValueField || '' : '',
        LookupPageSize: field.fieldType === 'lookup' ? this.normalizeLookupPageSize(field.lookupPageSize) : null,
        LookupColumns:
          field.fieldType === 'lookup'
            ? this.normalizeLookupColumns(field.lookupColumns).filter((column) => column.field && column.label)
            : [],
        LookupMappings:
          field.fieldType === 'lookup'
            ? this.normalizeLookupMappings(field.lookupMappings).filter(
                (mapping) => mapping.sourceField && mapping.targetField
              )
            : [],
        Options: this.normalizeFieldOptions(field.options)
      }
    },
    // 保存可视化配置
    async saveVisualConfig() {
      try {
        const normalizedSubTables = this.normalizeSubTables(this.MicroAppForm.SubTables)
        const allFields = this.MicroAppForm.Fields.concat(normalizedSubTables.flatMap((subTable) => subTable.fields))
        const invalidSubTable = normalizedSubTables.find(
          (subTable) => !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(subTable.tableName || '')
        )
        if (invalidSubTable) {
          this.$message.error(
            this.$t('microConfig.invalidSubTableName', {
              name: invalidSubTable.label || this.$t('microConfig.unnamedSubTable')
            })
          )
          return
        }

        const invalidDictField = allFields.find(
          (field) => this.supportsOptions(field) && field.optionSource === 'dictionary' && !field.dictCode
        )
        if (invalidDictField) {
          this.$message.error(
            this.$t('microConfig.missingDictionary', {
              name: invalidDictField.label || invalidDictField.fieldName
            })
          )
          return
        }

        const invalidEsbField = allFields.find(
          (field) => this.supportsOptions(field) && field.optionSource === 'esb' && !field.esbDataSourceCode
        )
        if (invalidEsbField) {
          this.$message.error(
            this.$t('microConfig.missingEsbDataSource', {
              name: invalidEsbField.label || invalidEsbField.fieldName
            })
          )
          return
        }

        const invalidLookupField = allFields.find(
          (field) =>
            this.isLookupField(field) &&
            (!field.lookupDataSourceCode ||
              !field.lookupValueField ||
              this.normalizeLookupColumns(field.lookupColumns).length === 0)
        )
        if (invalidLookupField) {
          this.$message.error(
            this.$t('microConfig.incompleteLookup', {
              name: invalidLookupField.label || invalidLookupField.fieldName
            })
          )
          return
        }

        const invalidLookupSubTable = normalizedSubTables.find(
          (subTable) =>
            subTable.enableLookup &&
            (!subTable.lookupDataSourceCode ||
              this.normalizeLookupColumns(subTable.lookupColumns).filter((column) => column.field && column.label)
                .length === 0 ||
              this.normalizeLookupMappings(subTable.lookupMappings).filter(
                (mapping) => mapping.sourceField && mapping.targetField
              ).length === 0)
        )
        if (invalidLookupSubTable) {
          this.$message.error(
            this.$t('microConfig.incompleteSubTableLookup', {
              name: invalidLookupSubTable.label || invalidLookupSubTable.tableName
            })
          )
          return
        }

        // 将小驼峰命名转换为大驼峰命名，以适配后台接口
        const submitData = {
          ...this.MicroAppForm,
          ConfigName: this.MicroAppForm.ConfigName,
          ModelName: this.MicroAppForm.ModelName,
          MicroAppPath: this.MicroAppForm.MicroAppPath,
          ConfigDesc: this.MicroAppForm.configDesc || this.MicroAppForm.ConfigDesc,
          DataScope: this.MicroAppForm.DataScope || 'all',
          FormColumns: this.normalizeFormColumns(this.MicroAppForm.FormColumns),
          QueryColumns: this.normalizeQueryColumns(this.MicroAppForm.QueryColumns),
          ShowSubTablesInList: this.MicroAppForm.ShowSubTablesInList !== false,
          Fields: this.normalizeFieldOrder(this.MicroAppForm.Fields).map((field) => this.toFieldSubmitData(field)),
          SubTables: normalizedSubTables.map((subTable, index) => ({
            Label: subTable.label,
            TableName: subTable.tableName,
            MinRows: Number(subTable.minRows) || 0,
            MaxRows: Number(subTable.maxRows) || null,
            SortOrder: subTable.sortOrder || index + 1,
            EnableLookup: Boolean(subTable.enableLookup),
            LookupDataSourceCode: subTable.enableLookup ? subTable.lookupDataSourceCode || '' : '',
            LookupParams: subTable.enableLookup ? subTable.lookupParams || '' : '',
            LookupPageSize: subTable.enableLookup ? this.normalizeLookupPageSize(subTable.lookupPageSize) : null,
            LookupColumns: subTable.enableLookup
              ? this.normalizeLookupColumns(subTable.lookupColumns).filter((column) => column.field && column.label)
              : [],
            LookupMappings: subTable.enableLookup
              ? this.normalizeLookupMappings(subTable.lookupMappings).filter(
                  (mapping) => mapping.sourceField && mapping.targetField
                )
              : [],
            Fields: this.normalizeFieldOrder(subTable.fields).map((field) => this.toFieldSubmitData(field))
          }))
        }

        const res = await updateMicroAppConfig(submitData)
        if (res.data.success) {
          this.$message.success(res.data.msg || this.$t('language.saveSuccess'))
          this.visualConfigVisible = false
          this.getMicroApps()
        } else {
          this.$message.error(res.data.msg || this.$t('microConfig.saveFailed'))
        }
      } catch (error) {
        this.$message.error(`${this.$t('microConfig.saveFailed')}: ${error.message}`)
      }
    },
    // 生成接口文档
    generateApiDoc(row) {
      const fields = this.normalizeFields(row.Fields)
      const subTables = this.normalizeSubTables(row.SubTables || row.subTables || [])

      this.MicroAppForm = {
        ...row,
        MicroAppPath: row.MicroAppPath || row.ApiPrefix || row.ModelName || '',
        DataScope: row.DataScope || row.dataScope || 'all',
        FormColumns: this.normalizeFormColumns(row.FormColumns || row.formColumns),
        QueryColumns: this.normalizeQueryColumns(row.QueryColumns || row.queryColumns),
        ShowSubTablesInList: this.normalizeShowSubTablesInList(row),
        configDesc: row.ConfigDesc || row.configDesc || '',
        Fields: fields,
        SubTables: subTables
      }

      this.generateApis()
      this.apiDocVisible = true
    },
    // 生成API列表
    generateApis() {
      const { ModelName, Fields, SupportCreate, SupportUpdate, SupportDelete } = this.MicroAppForm
      const basePath = `/api/${ModelName.toLowerCase()}`

      this.generatedApis = []

      // 确保Fields是数组
      const fields = Array.isArray(Fields) ? Fields : []

      // 查询列表接口
      this.generatedApis.push({
        method: 'GET',
        path: `${basePath}`,
        description: this.$t('microConfig.apiDescriptionList', { app: this.MicroAppForm.ConfigName }),
        requestParams: [
          { name: 'pageNum', type: 'int', required: true, description: this.$t('microConfig.pageNum') },
          { name: 'pageSize', type: 'int', required: true, description: this.$t('microConfig.pageSizeDescription') },
          { name: 'keyword', type: 'string', required: false, description: this.$t('microConfig.keywordDescription') }
        ],
        responseExample: JSON.stringify(
          {
            success: true,
            msg: this.$t('microConfig.getSuccess'),
            data: {
              list: [
                fields.reduce(
                  (obj, field) => {
                    if (field.fieldName) obj[field.fieldName] = ''
                    return obj
                  },
                  { ItemId: 3175191353393221 }
                )
              ],
              total: 1
            }
          },
          null,
          2
        )
      })

      // 详情接口
      this.generatedApis.push({
        method: 'GET',
        path: `${basePath}/:id`,
        description: this.$t('microConfig.apiDescriptionDetail', { app: this.MicroAppForm.ConfigName }),
        requestParams: [{ name: 'id', type: 'long', required: true, description: 'ID' }],
        responseExample: JSON.stringify(
          {
            success: true,
            msg: this.$t('microConfig.getSuccess'),
            data: fields.reduce(
              (obj, field) => {
                if (field.fieldName) obj[field.fieldName] = ''
                return obj
              },
              { ItemId: 3175191353393221 }
            )
          },
          null,
          2
        )
      })

      // 添加接口
      if (SupportCreate) {
        this.generatedApis.push({
          method: 'POST',
          path: `${basePath}`,
          description: this.$t('microConfig.apiDescriptionCreate', { app: this.MicroAppForm.ConfigName }),
          requestParams: fields
            .filter((f) => f.fieldName)
            .map((field) => ({
              name: field.fieldName,
              type: field.fieldType || 'string',
              required: field.required || false,
              description: field.label || field.fieldName
            })),
          responseExample: JSON.stringify(
            {
              success: true,
              msg: this.$t('microConfig.addSuccess'),
              data: fields.reduce(
                (obj, field) => {
                  if (field.fieldName) obj[field.fieldName] = ''
                  return obj
                },
                { ItemId: 3175191353393221 }
              )
            },
            null,
            2
          )
        })
      }

      // 更新接口
      if (SupportUpdate) {
        this.generatedApis.push({
          method: 'PUT',
          path: `${basePath}/:id`,
          description: this.$t('microConfig.apiDescriptionUpdate', { app: this.MicroAppForm.ConfigName }),
          requestParams: [
            { name: 'id', type: 'long', required: true, description: 'ID' },
            ...fields
              .filter((f) => f.fieldName)
              .map((field) => ({
                name: field.fieldName,
                type: field.fieldType || 'string',
                required: field.required || false,
                description: field.label || field.fieldName
              }))
          ],
          responseExample: JSON.stringify(
            {
              success: true,
              msg: this.$t('apiKey.updateSuccess'),
              data: null
            },
            null,
            2
          )
        })
      }

      // 删除接口
      if (SupportDelete) {
        this.generatedApis.push({
          method: 'DELETE',
          path: `${basePath}/:id`,
          description: this.$t('microConfig.apiDescriptionDelete', { app: this.MicroAppForm.ConfigName }),
          requestParams: [{ name: 'id', type: 'long', required: true, description: 'ID' }],
          responseExample: JSON.stringify(
            {
              success: true,
              msg: this.$t('language.deleteSuccess'),
              data: null
            },
            null,
            2
          )
        })
      }
    }
  }
}
</script>

<style scoped>
.crud-config-container {
  height: 100%;
  min-height: 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.micro-actions {
  min-width: 120px;
  display: grid;
  grid-template-columns: repeat(4, 30px);
  justify-content: end;
  gap: 6px;
}

.micro-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 5px;
}

/* 可视化配置容器 */
:deep(.visual-config-dialog) {
  display: flex;
  height: 100vh;
  max-height: 100vh;
  flex-direction: column;
  margin: 0;
  overflow: hidden;
}

:deep(.visual-config-dialog .el-dialog__header) {
  flex: 0 0 auto;
}

:deep(.visual-config-dialog .el-dialog__body) {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 12px 18px 0;
  background: #f6f8fb;
}

:deep(.visual-config-dialog .el-dialog__footer) {
  display: none;
}

.visual-config-container {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.field-sidebar,
.workspace-panel {
  border: 1px solid #dfe7f2;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(31, 56, 88, 0.06);
}

.field-sidebar {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
}

.sidebar-head,
.panel-head,
.field-editor-head,
.config-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.visual-config-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.visual-config-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.section-kicker {
  margin-bottom: 3px;
  color: #6b7c93;
  font-size: 12px;
  line-height: 16px;
}

.section-title {
  color: #1f2d3d;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
}

.field-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 14px 0 12px;
}

.metric-item {
  position: relative;
  min-width: 0;
  padding: 10px;
  border: 1px solid #e6edf7;
  border-radius: 8px;
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
}

.metric-item::before {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 5px;
  height: 20px;
  border-radius: 999px;
  background: #2f6bff;
  content: '';
}

.metric-value {
  display: block;
  color: #1f2d3d;
  font-size: 20px;
  font-weight: 700;
  line-height: 24px;
}

.metric-label {
  display: block;
  margin-top: 2px;
  color: #8a98aa;
  font-size: 12px;
}

.field-tree {
  flex: 0 0 auto;
  min-height: 0;
  max-height: 300px;
  overflow-y: auto;
}

.field-tree :deep(.el-tree-node__content) {
  height: 52px;
  margin: 4px 0;
  border-radius: 8px;
  padding-right: 8px;
}

.field-tree :deep(.el-tree-node__content:hover),
.field-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #eef4ff;
}

.field-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  box-shadow: inset 3px 0 0 #2f6bff;
}

.field-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  gap: 8px;
  padding-right: 10px;
}

.field-tree-node__main {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.field-tree-node__drag {
  color: #8a98aa;
  cursor: grab;
  flex-shrink: 0;
}

.field-tree-node__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.field-tree-node__label,
.field-tree-node__meta {
  max-width: 132px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-tree-node__label {
  color: #1f2d3d;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.field-tree-node__meta {
  color: #8a98aa;
  font-size: 12px;
  line-height: 16px;
}

.field-tree-node__side {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.field-tree-node__delete {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f56c6c;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}

.field-tree-node__delete .el-icon {
  font-size: 13px;
}

.field-tree-node__delete:hover,
.field-tree-node__delete:focus {
  color: #f56c6c;
}

.subtable-sidebar {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e6edf7;
}

.sidebar-head--subtable {
  margin-bottom: 12px;
}

.subtable-config-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid #e6edf7;
  border-radius: 8px;
  background: #fbfdff;
}

.subtable-config-card__head,
.subtable-field-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #344563;
  font-size: 13px;
  font-weight: 600;
}

.subtable-icon-button,
.subtable-lookup-delete-button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 32px !important;
  min-width: 32px !important;
  height: 32px !important;
  min-height: 32px !important;
  box-sizing: border-box;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 10px !important;
  background: #f35b64 !important;
  color: #ffffff !important;
  cursor: pointer;
  line-height: 32px !important;
}

.subtable-icon-button:hover,
.subtable-icon-button:focus,
.subtable-lookup-delete-button:hover,
.subtable-lookup-delete-button:focus {
  background: #df3f49 !important;
  color: #ffffff !important;
  outline: none;
}

.subtable-icon-button .el-icon,
.subtable-lookup-delete-button :deep(.el-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: #ffffff !important;
  font-size: 16px;
  line-height: 16px;
}

.subtable-icon-button .el-icon svg,
.subtable-lookup-delete-button :deep(.el-icon svg) {
  width: 1em;
  height: 1em;
}

.subtable-config-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}

.subtable-field-tree {
  max-height: 220px;
  overflow-y: auto;
}

.visual-workspace {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

.workspace-panel {
  padding: 14px;
}

.app-settings-panel {
  flex: 0 0 auto;
}

.field-editor-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.compact-form :deep(.el-form-item),
.field-config-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.compact-form :deep(.el-form-item__label),
.field-config-form :deep(.el-form-item__label) {
  margin-bottom: 4px;
  color: #5d6f85;
  font-size: 12px;
  line-height: 18px;
}

.compact-form :deep(.el-select),
.compact-form :deep(.el-input-number),
.field-config-form :deep(.el-select),
.field-config-form :deep(.el-input),
.field-config-form :deep(.el-input-number) {
  width: 100%;
}

.switch-matrix {
  display: grid;
  grid-template-columns: repeat(6, minmax(92px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.switch-matrix--field {
  grid-template-columns: repeat(4, minmax(112px, 1fr));
  margin: 0 0 12px;
}

.switch-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #e6edf7;
  border-radius: 8px;
  background: #fbfdff;
  color: #344563;
  font-size: 13px;
  line-height: 20px;
}

.settings-grid,
.form-grid {
  display: grid;
  gap: 12px;
}

.settings-grid {
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  margin-top: 12px;
}

.form-grid--3 {
  grid-template-columns: repeat(3, minmax(180px, 1fr));
}

.form-grid-span-2 {
  grid-column: span 2;
}

.field-editor-head {
  position: sticky;
  top: -14px;
  z-index: 1;
  margin: -14px -14px 0;
  padding: 14px;
  border-bottom: 1px solid #e6edf7;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
}

.field-editor-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2d3d;
  font-size: 18px;
  font-weight: 700;
  line-height: 26px;
}

.field-editor-meta {
  max-width: 260px;
  overflow: hidden;
  color: #6b7c93;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-config-form {
  padding-top: 14px;
}

.config-section {
  padding: 14px 0;
  border-bottom: 1px solid #edf2f7;
}

.config-section:first-child {
  padding-top: 0;
}

.config-section:last-child {
  border-bottom: 0;
}

.config-section-title {
  margin-bottom: 10px;
  color: #1f2d3d;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.inline-control-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 选项容器样式 */
.options-container {
  width: 100%;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(160px, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.option-delete-button {
  width: 72px !important;
  height: 32px !important;
  padding: 0 12px !important;
  border: 0 !important;
  border-radius: 8px !important;
  background: #e5484d !important;
  color: #ffffff !important;
  font-size: 13px !important;
}

.option-delete-button:hover,
.option-delete-button:focus {
  background: #c73338 !important;
  color: #ffffff !important;
  box-shadow: none !important;
}

.option-delete-button :deep(.el-icon),
.option-delete-button :deep(span) {
  color: #ffffff !important;
}

.option-source-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.dict-code-select {
  width: 320px;
  max-width: 100%;
}

.esb-option-grid {
  display: block;
  margin: 0 0 12px;
}

.esb-variable-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.esb-variable-title {
  color: #667085;
  font-size: 13px;
  line-height: 22px;
}

.esb-variable-tag {
  cursor: pointer;
  user-select: none;
}

.lookup-config-list {
  width: 100%;
}

.lookup-config-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 40px;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.lookup-config-row--columns {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 120px 40px;
}

.subtable-lookup-config {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #edf2f7;
}

.subtable-lookup-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #344563;
  font-size: 13px;
  line-height: 20px;
}

.subtable-lookup-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.subtable-lookup-title {
  color: #667085;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.subtable-lookup-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 32px;
  gap: 6px;
  align-items: center;
}

.subtable-lookup-row--columns {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 32px;
}

.empty-inline {
  padding: 12px;
  border: 1px dashed #d9e3f0;
  border-radius: 8px;
  background: #fbfdff;
  color: #8a98aa;
  font-size: 13px;
  line-height: 20px;
}

.no-selection {
  display: flex;
  height: 100%;
  min-height: 280px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 1px dashed #d9e3f0;
  border-radius: 8px;
  background: #fbfdff;
  text-align: center;
}

.no-selection-title {
  color: #1f2d3d;
  font-size: 16px;
  font-weight: 600;
}

.no-selection-subtitle {
  max-width: 360px;
  margin-top: 8px;
  color: #8a98aa;
  font-size: 13px;
  line-height: 20px;
}

@media (max-width: 1180px) {
  .visual-config-container {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .switch-matrix,
  .switch-matrix--field,
  .settings-grid,
  .form-grid--3 {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
}

@media (max-width: 860px) {
  .visual-config-container {
    grid-template-columns: 1fr;
  }

  .field-sidebar {
    max-height: 280px;
  }

  .settings-grid,
  .form-grid--3,
  .option-item {
    grid-template-columns: 1fr;
  }

  .option-delete-button {
    justify-self: end;
  }

  .form-grid-span-2 {
    grid-column: auto;
  }
}

html[data-theme='dark'] .crud-config-container .visual-config-container,
html[data-theme='dark'] .crud-config-container .field-sidebar,
html[data-theme='dark'] .crud-config-container .field-detail,
html[data-theme='dark'] .crud-config-container .field-card,
html[data-theme='dark'] .crud-config-container .config-card,
html[data-theme='dark'] .crud-config-container .empty-inline,
html[data-theme='dark'] .crud-config-container .no-selection {
  background: var(--dt-surface) !important;
  border-color: var(--dt-border) !important;
  box-shadow: var(--dt-shadow-soft);
}

html[data-theme='dark'] :deep(.visual-config-dialog .el-dialog__body) {
  background: var(--dt-bg) !important;
}

html[data-theme='dark'] .crud-config-container .workspace-panel,
html[data-theme='dark'] .crud-config-container .subtable-config-card,
html[data-theme='dark'] .crud-config-container .metric-item,
html[data-theme='dark'] .crud-config-container .switch-tile {
  background: var(--dt-surface) !important;
  border-color: var(--dt-border) !important;
  box-shadow: var(--dt-shadow-soft);
}

html[data-theme='dark'] .crud-config-container .metric-item {
  background: linear-gradient(180deg, var(--dt-surface-soft) 0%, var(--dt-surface) 100%) !important;
}

html[data-theme='dark'] .crud-config-container .metric-item::before {
  background: var(--dt-primary) !important;
}

html[data-theme='dark'] .crud-config-container .field-tree :deep(.el-tree-node__content:hover),
html[data-theme='dark'] .crud-config-container .field-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--dt-primary-subtle) !important;
}

html[data-theme='dark'] .crud-config-container .field-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  box-shadow: inset 3px 0 0 var(--dt-primary) !important;
}

html[data-theme='dark'] .crud-config-container .field-editor-head {
  border-bottom-color: var(--dt-border) !important;
  background: color-mix(in srgb, var(--dt-surface) 92%, #0f172a 8%) !important;
}

html[data-theme='dark'] .crud-config-container .config-section,
html[data-theme='dark'] .crud-config-container .subtable-sidebar,
html[data-theme='dark'] .crud-config-container .subtable-lookup-config {
  border-color: var(--dt-border) !important;
}

html[data-theme='dark'] .crud-config-container .field-card.is-active,
html[data-theme='dark'] .crud-config-container .field-row.is-active,
html[data-theme='dark'] .crud-config-container .option-item.is-active {
  background: var(--dt-primary-subtle) !important;
  box-shadow: inset 3px 0 0 var(--dt-primary) !important;
}

html[data-theme='dark'] .crud-config-container .field-name,
html[data-theme='dark'] .crud-config-container .config-title,
html[data-theme='dark'] .crud-config-container .no-selection-title,
html[data-theme='dark'] .crud-config-container .section-title,
html[data-theme='dark'] .crud-config-container .metric-value,
html[data-theme='dark'] .crud-config-container .field-tree-node__label,
html[data-theme='dark'] .crud-config-container .field-editor-title,
html[data-theme='dark'] .crud-config-container .config-section-title,
html[data-theme='dark'] .crud-config-container .subtable-config-card__head,
html[data-theme='dark'] .crud-config-container .subtable-field-actions,
html[data-theme='dark'] .crud-config-container .switch-tile,
html[data-theme='dark'] .crud-config-container .subtable-lookup-switch {
  color: var(--dt-text) !important;
}

html[data-theme='dark'] .crud-config-container .field-meta,
html[data-theme='dark'] .crud-config-container .config-subtitle,
html[data-theme='dark'] .crud-config-container .subtable-lookup-title,
html[data-theme='dark'] .crud-config-container .empty-inline,
html[data-theme='dark'] .crud-config-container .no-selection-subtitle,
html[data-theme='dark'] .crud-config-container .section-kicker,
html[data-theme='dark'] .crud-config-container .metric-label,
html[data-theme='dark'] .crud-config-container .field-tree-node__meta,
html[data-theme='dark'] .crud-config-container .field-tree-node__drag,
html[data-theme='dark'] .crud-config-container .field-editor-meta,
html[data-theme='dark'] .crud-config-container .compact-form :deep(.el-form-item__label),
html[data-theme='dark'] .crud-config-container .field-config-form :deep(.el-form-item__label),
html[data-theme='dark'] .crud-config-container .esb-variable-title {
  color: var(--dt-text-muted) !important;
}

html[data-theme='dark'] .crud-config-container .option-delete-button,
html[data-theme='dark'] .crud-config-container .subtable-icon-button,
html[data-theme='dark'] .crud-config-container .subtable-lookup-delete-button {
  background: var(--dt-danger) !important;
  color: #ffffff !important;
}

html[data-theme='dark'] .crud-config-container .option-delete-button:hover,
html[data-theme='dark'] .crud-config-container .option-delete-button:focus,
html[data-theme='dark'] .crud-config-container .subtable-icon-button:hover,
html[data-theme='dark'] .crud-config-container .subtable-icon-button:focus,
html[data-theme='dark'] .crud-config-container .subtable-lookup-delete-button:hover,
html[data-theme='dark'] .crud-config-container .subtable-lookup-delete-button:focus {
  background: color-mix(in srgb, var(--dt-danger) 84%, #000000 16%) !important;
}
</style>
