<template>
  <div class="dynamic-app-container">
    <!-- 动态加载的应用内容 -->
    <div v-if="!loading && appConfig" class="app-content">
      <!-- 列表页面 -->
      <div class="list-page">
        <el-card class="table-card">
          <!-- 搜索与添加区域 -->
          <el-row :gutter="20" style="margin-bottom: 15px;">
            <el-col :span="14">
              <div style="display: flex; align-items: center;">
                <!-- 搜索区域 -->
                <el-input clearable placeholder="请输入关键词搜索" v-model="searchKeyword" @clear="getAppData" style="width: 50%; margin-right: 5px;">
                  <template #append>
                    <el-button icon="Search" @click="getAppData"></el-button>
                  </template>
                </el-input>
                <!-- 操作按钮 -->
                <el-button v-if="appConfig.supportCreate" type="primary" icon="Plus" @click="openCreateDialog" style="margin-left: 15px;">新增</el-button>
                <el-button v-if="appConfig.supportExport" type="primary" icon="Download" @click="exportData" style="margin-right: 5px;">导出Excel</el-button>
                <el-button v-if="appConfig.supportImport" type="primary" icon="Upload" @click="openImportDialog" style="margin-right: 5px;">导入Excel</el-button>
              </div>
            </el-col>
          </el-row>

          <!-- 数据列表 -->
          <div class="table-container">
            <el-table
              :data="appData.list"
              :row-style="{ height: '40px' }"
              :cell-style="{ padding: '0px' }"
              border
              stripe
              class="table-wrapper"
              height="100%"
            >
              <!-- 序号列 -->
              <el-table-column type="index" label="序号" width="80"></el-table-column>
              <!-- 渲染所有有效的字段 -->
              <template v-for="field in appConfig.fields" :key="field.fieldName">
                <el-table-column
                  v-if="field?.showInList && field?.fieldName"
                  :prop="field.fieldName"
                  :label="field.label || field.fieldName || '未知字段'"
                ></el-table-column>
              </template>
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <div class="operation-buttons">
                    <el-button v-if="appConfig.supportUpdate" type="primary" size="small" icon="Edit"
                      @click="openEditDialog(scope.row)">编辑</el-button>
                    <el-button v-if="appConfig.supportDelete" type="danger" size="small" icon="Delete"
                      @click="deleteData(scope.row)">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 分页 -->
          <el-pagination layout="total, sizes, prev, pager, next, jumper" :total="appData.total"
            :page-size="pagination.pageSize" :current-page="pagination.currentPage" @size-change="handleSizeChange"
            @current-change="handleCurrentChange" style="margin-top: 15px;"></el-pagination>
        </el-card>
      </div>


    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-container" v-loading="loading" element-loading-text="加载应用配置中...">
    </div>
    <!-- 应用配置未找到 -->
    <div v-else-if="!loading && !appConfig" class="loading-container">
      <div style="text-align: center; color: #909399;">
        <el-icon size="48" style="margin-bottom: 10px;"><WarningFilled /></el-icon>
        <div>应用配置未找到</div>
      </div>
    </div>
    
    <!-- 新增/编辑数据对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="50%"
      :top="'20vh'"
      :close-on-click-modal="false"
    >
      <div class="dialog-form-container">
        <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
          <!-- 表单字段 -->
          <el-form-item v-for="(field, index) in appConfig.fields" :key="index"
            :label="field.label || field.fieldName || `字段${index}`" :prop="field.fieldName"
            :rules="getFieldRules(field)">
            <!-- 根据字段类型渲染不同的表单控件 -->
            <el-input v-if="field.fieldType === 'string'" v-model="formData[field.fieldName]"
              :placeholder="'请输入' + (field.label || field.fieldName || `字段${index}`)"
              :disabled="dialogType === 'edit' && !field.editable"></el-input>
            
            <el-input-number v-else-if="field.fieldType === 'number'" v-model="formData[field.fieldName]"
              :placeholder="'请输入' + (field.label || field.fieldName || `字段${index}`)"
              :disabled="dialogType === 'edit' && !field.editable"></el-input-number>
            
            <el-date-picker v-else-if="field.fieldType === 'datetime'" v-model="formData[field.fieldName]"
              type="datetime" :placeholder="'选择' + (field.label || field.fieldName || `字段${index}`)"
              style="width: 100%;" :disabled="dialogType === 'edit' && !field.editable"></el-date-picker>
            
            <el-switch v-else-if="field.fieldType === 'boolean'" v-model="formData[field.fieldName]"
              :disabled="dialogType === 'edit' && !field.editable"></el-switch>
            
            <el-input v-else-if="field.fieldType === 'textarea'" v-model="formData[field.fieldName]"
              type="textarea" :rows="4" :placeholder="'请输入' + (field.label || field.fieldName || `字段${index}`)"
              :disabled="dialogType === 'edit' && !field.editable"></el-input>
            
            <el-select v-else-if="field.fieldType === 'select'" v-model="formData[field.fieldName]"
              :placeholder="'请选择' + (field.label || field.fieldName || `字段${index}`)" style="width: 100%;"
              :disabled="dialogType === 'edit' && !field.editable">
              <!-- 根据配置动态生成选项 -->
              <el-option v-for="option in field.options || []" :key="option.value" :label="option.label"
                :value="option.value"></el-option>
              <!-- 默认选项 -->
              <el-option v-if="!(field.options && field.options.length)" label="选项1" value="1"></el-option>
              <el-option v-if="!(field.options && field.options.length)" label="选项2" value="2"></el-option>
            </el-select>
            
            <!-- 单选框组 -->
            <el-radio-group v-else-if="field.fieldType === 'radio'" v-model="formData[field.fieldName]"
              :disabled="dialogType === 'edit' && !field.editable">
              <!-- 根据配置动态生成单选选项 -->
              <el-radio v-for="option in field.options || []" :key="option.value" :label="option.value">
                {{ option.label }}
              </el-radio>
              <!-- 默认选项 -->
              <el-radio v-if="!(field.options && field.options.length)" label="1">选项1</el-radio>
              <el-radio v-if="!(field.options && field.options.length)" label="2">选项2</el-radio>
            </el-radio-group>
            
            <!-- 多选框组 -->
            <el-checkbox-group v-else-if="field.fieldType === 'checkbox'" v-model="formData[field.fieldName]"
              :disabled="dialogType === 'edit' && !field.editable">
              <!-- 根据配置动态生成多选选项 -->
              <el-checkbox v-for="option in field.options || []" :key="option.value" :label="option.value">
                {{ option.label }}
              </el-checkbox>
              <!-- 默认选项 -->
              <el-checkbox v-if="!(field.options && field.options.length)" label="1">选项1</el-checkbox>
              <el-checkbox v-if="!(field.options && field.options.length)" label="2">选项2</el-checkbox>
            </el-checkbox-group>
            
            <!-- 其他字段类型默认显示为文本输入框 -->
            <el-input v-else v-model="formData[field.fieldName]"
              :placeholder="'请输入' + (field.label || field.fieldName || `字段${index}`)"
              :disabled="dialogType === 'edit' && !field.editable"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">提交</el-button>
        </span>
      </template>
    </el-dialog>
    
      <!-- 导入对话框 -->
      <el-dialog
        title="Excel导入"
        v-model="importDialogVisible"
        width="50%"
        :top="'20vh'"
        :close-on-click-modal="false"
        :close-on-press-escape="!importLoading"
      >
        <el-form label-width="100px">
          <el-form-item label="选择文件">
            <el-upload
              v-model:file-list="importFileList"
              :auto-upload="false"
              :show-file-list="true"
              accept=".xlsx,.xls"
              drag
              :multiple="false"
              @change="handleFileChange"
              :disabled="importLoading"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                拖拽文件到此处或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传 .xlsx, .xls 格式文件
                </div>
              </template>
            </el-upload>
          </el-form-item>
          <el-form-item label="导入说明">
            <div class="import-tips">
              <p>• 请确保Excel文件列头与系统字段匹配</p>
              <p>• 数据量较大时可能需要等待较长时间</p>
              <p>• 导入过程中请勿关闭页面</p>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="closeImportDialog" :disabled="importLoading">取消</el-button>
            <el-button 
              type="primary" 
              @click="importData" 
              :loading="importLoading"
              :disabled="importLoading || importFileList.length === 0"
            >
              {{ importLoading ? '导入中...' : '导入' }}
            </el-button>
          </span>
        </template>
      </el-dialog>
  </div>
</template>

<script>
import axios from '@/api/http';
export default {
  name: 'DynamicAppPage',
  data() {
    return {
      // 应用配置
      appConfig: null,
      // 加载状态
      loading: false,
      // 当前激活的菜单
      activeMenu: 'list',
      // 搜索关键词
      searchKeyword: '',
      // 分页配置
      pagination: {
        currentPage: 1,
        pageSize: 10
      },
      // 应用数据
      appData: {
        list: [],
        total: 0
      },
      // 表单数据
      formData: {},
      // 表单验证规则
      formRules: {},
      // 对话框显示状态
      dialogVisible: false,
      // 对话框标题
      dialogTitle: '',
      // 对话框类型：create/edit
      dialogType: '',
      // 导入对话框
      importDialogVisible: false,
      // 导入文件列表
      importFileList: [],
      // 导入加载状态
      importLoading: false
    };
  },
  created() {
    // 初始化应用
    this.initApp();
  },
  watch: {
    // 监听路由变化，重新初始化应用
    $route: {
      handler: function (to) {
        // 只有当路由是动态应用路由时才重新初始化
        if (to.path.startsWith('/app/')) {
          this.initApp();
        }
      },
      immediate: true
    }
  },
  methods: {
    // 初始化应用
    async initApp() {
      this.loading = true;
      try {
        // 获取应用路径
        const appPath = this.$route.params.appPath;

        // 加载应用配置 - 使用现有的GetDynamicAppConfigs接口，并传入modelName参数
        const { data: res } = await axios.get('/api/DynamicApp/GetDynamicAppConfigs', {
          params: {
            PageNum: 1,
            PageSize: 1, // 只获取一个应用的配置
            modelName: appPath // 传入appPath作为modelName参数
          }
        });
        if (res.success) {
          // 直接使用返回的数据，因为已经通过modelName过滤
          const config = res.data && res.data.length > 0 ? res.data[0] : null;

          if (config) {
            // 将大驼峰命名转换为小驼峰命名，并过滤fields中的undefined值
            this.appConfig = {
              configName: config.ConfigName || config.configName || '',
              modelName: config.ModelName || config.modelName || '',
              configDesc: config.ConfigDesc || config.configDesc || '',
              status: config.Status !== undefined ? config.Status : (config.status !== undefined ? config.status : 1),
              supportCreate: config.SupportCreate !== undefined ? config.SupportCreate : (config.supportCreate !== undefined ? config.supportCreate : true),
              supportUpdate: config.SupportUpdate !== undefined ? config.SupportUpdate : (config.supportUpdate !== undefined ? config.supportUpdate : true),
              supportDelete: config.SupportDelete !== undefined ? config.SupportDelete : (config.supportDelete !== undefined ? config.supportDelete : true),
              supportImport: config.SupportImport !== undefined ? config.SupportImport : (config.supportImport !== undefined ? config.supportImport : false),
              supportExport: config.SupportExport !== undefined ? config.SupportExport : (config.supportExport !== undefined ? config.supportExport : false),
              fields: Array.isArray(config.Fields) ? config.Fields.filter(field => field && typeof field === 'object').map(field => ({
                label: field.Label || field.label || '',
                fieldName: field.FieldName || field.fieldName || '',
                fieldType: field.FieldType || field.fieldType || 'string',
                required: field.Required !== undefined ? field.Required : (field.required !== undefined ? field.required : false),
                showInList: field.ShowInList !== undefined ? field.ShowInList : (field.showInList !== undefined ? field.showInList : true),
                editable: field.Editable !== undefined ? field.Editable : (field.editable !== undefined ? field.editable : true),
                validation: field.Validation || field.validation || '',
                defaultValue: field.DefaultValue || field.defaultValue || '',
                options: field.Options || field.options || []
              })) : []
            };

            // 初始化表单数据
            this.initFormData();

            // 获取应用数据
            this.getAppData();
          } else {
            this.$message.error('未找到对应的应用配置');
          }
        } else {
          this.$message.error('加载应用配置失败：' + (res.msg || '未知错误'));
        }
      } catch (error) {
        this.$message.error('加载应用配置失败：' + (error.message || '网络错误'));
      } finally {
        this.loading = false;
      }
    },

    // 初始化表单数据
    initFormData() {
      this.formData = {};
      // 为每个字段设置默认值，确保fields是数组
      const fields = Array.isArray(this.appConfig.fields) ? this.appConfig.fields : [];
      fields.forEach(field => {
        // 多选字段默认值应为数组
        if (field.fieldType === 'checkbox') {
          this.formData[field.fieldName] = field.defaultValue ? (Array.isArray(field.defaultValue) ? field.defaultValue : []) : [];
        } else {
          this.formData[field.fieldName] = field.defaultValue || '';
        }
      });
    },

    // 获取字段验证规则
    getFieldRules(field) {
      const rules = [];
      // 必填验证
      if (field.required) {
        rules.push({ required: true, message: '请输入' + field.label, trigger: 'blur' });
      }
      // 自定义验证规则
      if (field.validation) {
        try {
          const validation = JSON.parse(field.validation);
          if (validation && Array.isArray(validation)) {
            rules.push(...validation);
          }
        } catch (e) {
          console.error('字段验证规则解析失败：', e);
        }
      }
      return rules;
    },

    // 获取应用数据
    async getAppData() {
      try {
        // 使用默认路径/api/{ModelName}
        const apiPath = `/api/${this.appConfig.modelName}`;

        const params = {
          PageNum: this.pagination.currentPage,
          PageSize: this.pagination.pageSize,
          Keyword: this.searchKeyword
        };

        // 调用应用对应的API获取数据
        const { data: res } = await axios.get(apiPath, { params });
        if (res.success) {
          this.appData = res.data || { list: [], total: 0 };
        } else {
          this.$message.error('获取数据失败：' + (res.msg || '未知错误'));
        }
      } catch (error) {
        this.$message.error('获取数据失败：' + (error.message || '网络错误'));
      }
    },

    // 打开新增对话框
    openCreateDialog() {
      this.dialogType = 'create';
      this.dialogTitle = '新增' + this.appConfig.configName;
      this.initFormData();
      this.dialogVisible = true;
    },
    // 打开编辑对话框
    openEditDialog(row) {
      this.dialogType = 'edit';
      this.dialogTitle = '编辑' + this.appConfig.configName;
      this.formData = { ...row };
      
      // 确保多选字段的值是数组类型
      const fields = Array.isArray(this.appConfig.fields) ? this.appConfig.fields : [];
      fields.forEach(field => {
        if (field.fieldType === 'checkbox') {
          const fieldValue = this.formData[field.fieldName];
          if (fieldValue !== undefined && fieldValue !== null) {
            // 如果是字符串类型，尝试按逗号分隔转换为数组
            if (typeof fieldValue === 'string') {
              this.formData[field.fieldName] = fieldValue.split(',').map(item => item.trim());
            } else if (!Array.isArray(fieldValue)) {
              // 如果不是数组，转换为数组
              this.formData[field.fieldName] = [fieldValue];
            }
          } else {
            // 如果值为空，设置为空数组
            this.formData[field.fieldName] = [];
          }
        }
      });
      
      this.dialogVisible = true;
    },

    // 删除数据
    deleteData(row) {
      this.$confirm('确定要删除这条数据吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 从行数据中获取id，支持不同的id字段名
          const id = row.id || row.Id || row.ID || row.idField;
          if (!id) {
            this.$message.error('删除失败：无法获取数据ID');
            return;
          }

          // 使用默认路径/api/{ModelName}
          const apiPath = `/api/${this.appConfig.modelName}`;

          const { data: res } = await axios.delete(`${apiPath}/${id}`);
          if (res.success) {
            this.$message.success(res.msg || '删除成功');
            this.getAppData();
          } else {
            this.$message.error('删除失败：' + (res.msg || '未知错误'));
          }
        } catch (error) {
          this.$message.error('删除失败：' + (error.message || '网络错误'));
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },

    // 提交表单
    submitForm() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return;

        try {
          // 使用默认路径/api/{ModelName}
          const apiPath = `/api/${this.appConfig.modelName}`;

          // 移除不需要的字段
          const submitData = { ...this.formData };
          delete submitData.CreateTime;
          delete submitData.UpdateTime;
          delete submitData.createTime;
          delete submitData.updateTime;
          
          // 处理多选字段，将数组转换为逗号分隔的字符串
          const fields = Array.isArray(this.appConfig.fields) ? this.appConfig.fields : [];
          fields.forEach(field => {
            if (field.fieldType === 'checkbox') {
              const fieldValue = submitData[field.fieldName];
              // 如果是数组，转换为逗号分隔的字符串
              if (Array.isArray(fieldValue)) {
                submitData[field.fieldName] = fieldValue.join(',');
              }
            }
          });

          let res;
          if (this.dialogType === 'create') {
            // 新增数据
            res = await axios.post(apiPath, submitData);
          } else {
            // 更新数据
            // 从行数据中获取id，支持不同的id字段名
            const id = submitData.id || submitData.Id || submitData.ID || submitData.idField;
            if (!id) {
              this.$message.error('更新失败：无法获取数据ID');
              return;
            }
            res = await axios.put(`${apiPath}/${id}`, submitData);
          }

          const result = res.data;
          if (result.success) {
              this.$message.success(result.msg || (this.dialogType === 'create' ? '新增成功' : '更新成功'));
              this.dialogVisible = false;
              this.getAppData();
              this.initFormData();
            } else {
              this.$message.error((this.dialogType === 'create' ? '新增' : '更新') + '失败：' + (result.msg || '未知错误'));
            }
        } catch (error) {
          this.$message.error((this.dialogType === 'create' ? '新增' : '更新') + '失败：' + (error.message || '网络错误'));
        }
      });
    },

    // 处理分页大小变化
    handleSizeChange(newSize) {
      this.pagination.pageSize = newSize;
      this.getAppData();
    },

    // 处理当前页变化
    handleCurrentChange(newPage) {
      this.pagination.currentPage = newPage;
      this.getAppData();
    },
    // 导出Excel数据
    async exportData() {
      // 检查列表数据是否为空
      if (!this.appData.list || this.appData.list.length === 0) {
        this.$message.warning('当前列表为空，无法导出数据');
        return;
      }
      
      try {
        // 使用默认路径/api/{ModelName}/export
        const apiPath = `/api/${this.appConfig.modelName}/export`;
        
        // 构建查询参数
        const params = {
          Keyword: this.searchKeyword
        };
        
        // 发起导出请求
        const { data: res } = await axios.get(apiPath, {
          params,
          responseType: 'blob' // 重要：设置响应类型为blob
        });
        
        // 处理响应，生成下载链接
        const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.appConfig.configName}列表.xlsx`;
        link.click();
        
        // 释放URL对象
        window.URL.revokeObjectURL(url);
        
        this.$message.success('导出成功');
      } catch (error) {
        this.$message.error('导出失败：' + (error.message || '网络错误'));
      }
    },
    // 打开导入对话框
    openImportDialog() {
      this.importFileList = [];
      this.importDialogVisible = true;
    },
    // 关闭导入对话框
    closeImportDialog() {
      this.importFileList = [];
      this.importDialogVisible = false;
    },
    // 处理文件选择
    handleFileChange(file, fileList) {
      // 确保只保留最新选择的一个文件
      this.importFileList = fileList.slice(-1);
    },
    // 导入Excel数据
    async importData() {
      if (this.importFileList.length === 0) {
        this.$message.error('请选择要导入的文件');
        return;
      }
      
      // 设置加载状态
      this.importLoading = true;
      
      try {
        // 使用默认路径/api/{ModelName}/import
        const apiPath = `/api/${this.appConfig.modelName}/import`;
        
        // 创建FormData对象，添加文件
        const formData = new FormData();
        formData.append('file', this.importFileList[0].raw);
        
        // 发起导入请求
        const { data: res } = await axios.post(apiPath, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (res.success) {
          this.$message.success(res.msg || '导入成功');
          this.closeImportDialog();
          this.getAppData(); // 重新加载数据
        } else {
          this.$message.error(res.msg || '导入失败');
        }
      } catch (error) {
        this.$message.error('导入失败：' + (error.message || '网络错误'));
      } finally {
        // 无论成功或失败，都关闭加载状态
        this.importLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.dynamic-app-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: visible;
  display: flex;
  flex-direction: column;
}
/* 应用内容 */
.app-content {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

/* 列表页面 */
.list-page {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
  min-height: 0;
}

/* 表单页面 */
.form-page {
  width: 100%;
  overflow: hidden;
}

/* 加载中 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-height: 0;
  width: 100%;
  text-align: center;
}

/* 表格卡片样式 */
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
  min-height: 0;
}

.table-container {
  flex: 1;
  min-height: 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

/* 操作按钮样式 */
.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 5px;
}

/* 表格样式优化 */
:deep(.el-table) {
  width: 100%;
  min-width: auto;
  table-layout: auto;
}

:deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

/* 表格列样式优化 */
:deep(.el-table-column) {
  min-width: 80px;
}

/* 操作列固定宽度 */
:deep(.el-table-column--name__操作) {
  width: 200px !important;
  min-width: 200px !important;
  max-width: 200px !important;
  flex: none !important;
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  max-height: 75vh;
  display: flex;
  flex-direction: column;
}

:deep(.el-dialog__body) {
  flex: 1;
  overflow: hidden;
  padding-bottom: 10px;
}

/* 对话框表单容器样式 */
.dialog-form-container {
  max-height: 40vh;
  overflow-y: auto;
  padding-right: 10px;
}

/* 防止对话框打开时页面滚动 */
:deep(.el-overlay) {
  overflow: hidden;
}

/* 滚动条样式优化 */
.dialog-form-container::-webkit-scrollbar {
  width: 6px;
}

.dialog-form-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dialog-form-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dialog-form-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 导入说明样式 */
.import-tips {
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.import-tips p {
  margin: 0;
  padding: 2px 0;
}
</style>
