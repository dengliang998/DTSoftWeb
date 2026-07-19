<template>
  <div class="attachment-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>附件管理</h1>
          <p>维护系统上传文件，支持下载、图片预览、视频预览和删除。</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="GetFileList">刷新</el-button>
          <el-upload
            class="upload-demo"
            action="/api/File/Save"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :show-file-list="false"
            :headers="uploadHeaders"
            :on-response="handleResponse"
            :on-progress="handleUploadProgress"
            multiple
            name="Files"
          >
            <el-button type="primary" :icon="Upload">上传文件</el-button>
          </el-upload>
        </div>
      </div>

      <div class="dt-toolbar attachment-toolbar">
        <el-input
          v-model="queryInfo.query"
          class="dt-search"
          clearable
          placeholder="搜索文件名称或路径"
          @clear="GetFileList"
          @keyup.enter="GetFileList"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-progress
          v-if="showUploadProgress"
          class="upload-progress"
          :percentage="uploadProgress"
          :stroke-width="10"
          striped
          animated
        />
      </div>

      <div class="dt-panel">
        <div class="dt-panel__header">
          <div>
            <strong>附件列表</strong>
            <span>服务端总数 {{ total }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">本页 {{ userList.length }}</span>
            <span class="dt-chip dt-chip--success">图片 {{ fileStats.images }}</span>
            <span class="dt-chip">视频 {{ fileStats.videos }}</span>
          </div>
        </div>

        <el-table
          :data="userList"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          empty-text="暂无附件"
        >
          <el-table-column label="#" width="72" align="center">
            <template #default="scope">
              <span class="dt-index-chip">{{ indexMethod(scope.$index) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="文件" prop="FileName" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="dt-name-copy">
                <strong>{{ row.FileName }}</strong>
                <small>{{ row.FileID }}</small>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="文件路径" prop="FilePath" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">
              <code class="dt-code">{{ row.FilePath || '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column label="大小" prop="Size" width="110">
            <template #default="{ row }">
              <span class="dt-muted-pill">{{ row.Size || 0 }} MB</span>
            </template>
          </el-table-column>
          <el-table-column label="创建人" prop="CreateUser" width="130">
            <template #default="{ row }">
              <span class="dt-muted-pill">{{ row.CreateUser || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" prop="CreateDate" width="180">
            <template #default="{ row }">
              <code class="dt-code">{{ row.CreateDate || '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="156" fixed="right" align="right">
            <template #default="{ row }">
              <div class="dt-operation-buttons attachment-actions">
                <el-tooltip content="下载文件" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--add"
                    :icon="Download"
                    @click="FileDownload(row.FileID)"
                  />
                </el-tooltip>
                <el-tooltip v-if="isImageFile(row)" content="预览图片" placement="top">
                  <el-button class="dt-icon-action" :icon="PictureIcon" @click="FilePreview(row.FileID)" />
                </el-tooltip>
                <el-tooltip v-if="isVideoFile(row)" content="预览视频" placement="top">
                  <el-button class="dt-icon-action" :icon="VideoCamera" @click="VideoPreview(row.FileID)" />
                </el-tooltip>
                <el-tooltip content="删除文件" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--danger"
                    :icon="Delete"
                    @click="RemoveFile(row.FileID)"
                  />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="dt-pagination"
          :current-page="queryInfo.pagenum"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="queryInfo.pagesize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <!-- 视频预览对话框 -->
    <VideoPreviewDialog v-model="VideoPreviewDialogVisible" :video-url="Video" />

    <el-image-viewer v-if="ShowViewer" :url-list="[guidePic]" @close="showViewerClose"></el-image-viewer>
  </div>
</template>

<script>
import { getFileDownloadUrl, getFileList, getUploadHeaders, previewOfficeFile, removeFile } from '@/api/file'
import { ElImageViewer } from 'element-plus'
import { Delete, Download, Picture as PictureIcon, Refresh, Search, Upload, VideoCamera } from '@element-plus/icons-vue'
import { markRaw } from 'vue'
import VideoPreviewDialog from './components/VideoPreviewDialog.vue'

export default {
  name: 'Attachment',
  components: {
    ElImageViewer,
    VideoPreviewDialog,
    Search
  },
  data() {
    return {
      Delete: markRaw(Delete),
      Download: markRaw(Download),
      PictureIcon: markRaw(PictureIcon),
      Refresh: markRaw(Refresh),
      Upload: markRaw(Upload),
      VideoCamera: markRaw(VideoCamera),
      ShowViewer: false,
      guidePic: null,
      // 获取参数对象
      queryInfo: {
        query: '',
        // 当前的页数
        pagenum: 1,
        // 当前每页显示多少条数据
        pagesize: 10
      },
      // 用户列表
      userList: [],
      // 总数据
      total: 0,
      // 是否显示添加用户对话框
      addDialogVisible: false,
      // 控制修改用户对话框的显示与隐藏
      editDialogVisible: false,
      filehtml: '',
      Video: '',
      VideoPreviewDialogVisible: false,
      uploadHeaders: getUploadHeaders(),
      // 上传进度相关变量
      uploadProgress: 0,
      showUploadProgress: false
    }
  },
  computed: {
    fileStats() {
      return this.userList.reduce(
        (stats, file) => {
          if (this.isImageFile(file)) stats.images += 1
          if (this.isVideoFile(file)) stats.videos += 1
          return stats
        },
        { images: 0, videos: 0 }
      )
    }
  },
  created() {
    this.GetFileList()
  },
  methods: {
    // 监听上传成功的事件
    handleUploadSuccess(response) {
      this.showUploadProgress = false
      this.uploadProgress = 0

      // 检查后端返回的状态
      if (response.success) {
        this.GetFileList()
        this.$message.success('文件上传成功')
      } else {
        // 显示后端返回的错误消息
        const errorMsg = response.Msg || response.message || '文件上传失败'
        this.$message.error(errorMsg)
      }
    },
    // 监听上传失败的事件
    handleUploadError(err) {
      this.showUploadProgress = false
      this.uploadProgress = 0

      let errorMessage = '文件上传失败'
      // 尝试从错误对象中提取后端返回的错误消息
      if (err && err.response && err.response.data) {
        const responseData = err.response.data
        errorMessage = responseData.Msg || responseData.message || errorMessage
      }
      this.$message.error(errorMessage)
    },
    // 上传进度处理
    handleUploadProgress(event) {
      this.showUploadProgress = true
      this.uploadProgress = Math.round(event.percent)
    },

    // 上传前的检查
    beforeUpload() {
      // 可以在这里添加文件类型或大小限制检查
      return true
    },
    handleResponse(response) {
      this.showUploadProgress = false
      this.uploadProgress = 0

      // 检查后端返回的状态
      if (response && !response.success) {
        // 显示后端返回的错误消息
        const errorMsg = response.Msg || response.message || '文件上传失败'
        this.$message.error(errorMsg)
      }
    },
    async GetFileList() {
      const me = this
      getFileList({
        pageNum: me.queryInfo.pagenum,
        pageSize: me.queryInfo.pagesize,
        keyword: me.queryInfo.query
      })
        .then(function (response) {
          if (response.data.success) {
            me.userList = response.data.data
            me.total = response.data.Total
          } else {
            me.$message.error(response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('文件列表获取失败，请稍后重试！')
        })
    },
    // 监听 pageSize 改变的事件
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.GetFileList()
    },

    // 监听 页码值 页面值改变的事件
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.GetFileList()
    },

    async RemoveFile(FileID) {
      const confirmResult = await this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch((err) => err)

      if (confirmResult !== 'confirm') {
        return this.$message.info('已经取消了删除')
      }

      const me = this
      removeFile(FileID)
        .then(function (response) {
          if (response.data.success) {
            me.GetFileList()
            me.$message.success('删除文件成功')
          } else {
            me.$message.error('删除失败！' + response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('删除失败，请稍后重试！')
        })
    },

    FileDownload(FileID) {
      window.location.href = getFileDownloadUrl(FileID)
    },
    FilePreview(FileID) {
      this.guidePic = getFileDownloadUrl(FileID)
      this.ShowViewer = true
    },
    VideoPreview(FileID) {
      this.Video = getFileDownloadUrl(FileID)
      this.VideoPreviewDialogVisible = true
    },
    getFileExt(row) {
      return String(row?.Ext || '').toLowerCase()
    },
    isImageFile(row) {
      return ['.jpeg', '.jpg', '.gif', '.png', '.webp'].includes(this.getFileExt(row))
    },
    isVideoFile(row) {
      return ['.mp4', '.mov'].includes(this.getFileExt(row))
    },

    FilePreviewDialogClosed() {
      this.FilePreviewDialogVisible = false
    },
    FilePreview_Office(FileID) {
      //预览有问题
      let me = this
      previewOfficeFile(FileID)
        .then(function (response) {
          if (response.data.success) {
            me.FilePreviewDialogVisible = true
            me.filehtml = response.data.html
          } else {
            me.$message.error('预览失败:' + response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('预览失败，请稍后重试！')
        })
    },
    showViewerClose() {
      this.ShowViewer = false
    },
    //处理行号
    indexMethod(index) {
      index = index + 1 + (this.queryInfo.pagenum - 1) * this.queryInfo.pagesize
      return index
    }
  }
}
</script>

<style scoped>
.attachment-container {
  height: 100%;
  min-height: 0;
}

.attachment-toolbar {
  grid-template-columns: minmax(260px, 360px) minmax(200px, 320px) 1fr;
}

.upload-progress {
  width: 100%;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.attachment-actions {
  min-width: 120px;
}

.attachment-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
