<template>
  <div class="attachment-container">
    <!-- 卡片视图区域 -->
    <el-card class="table-card">
      <!-- 搜索与添加区域 -->
      <el-row :gutter="20">
        <el-col :span="7">
          <!-- 搜索与添加区域 -->
          <el-input v-model="queryInfo.query" clearable placeholder="请输入内容" @clear="GetFileList">
            <template #append>
              <el-button icon="Search" @click="GetFileList"></el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <div style="display: flex; align-items: center; gap: 20px">
            <!-- 文件上传按钮 -->
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
              <el-button type="primary">上传文件</el-button>
            </el-upload>

            <!-- 上传进度条 -->
            <el-progress
              v-if="showUploadProgress"
              :percentage="uploadProgress"
              :stroke-width="10"
              striped
              animated
              style="width: 200px; margin-top: 0"
            ></el-progress>
          </div>
        </el-col>
      </el-row>

      <!-- 用户列表区域 -->
      <el-table :data="userList" border stripe class="table-wrapper">
        <el-table-column label="#" type="index" :index="indexMethod"></el-table-column>
        <el-table-column label="文件编号" prop="FileID"></el-table-column>
        <el-table-column label="文件名称" prop="FileName"></el-table-column>
        <el-table-column label="文件路径" prop="FilePath"></el-table-column>
        <el-table-column label="文件大小(MB)" prop="Size"></el-table-column>
        <el-table-column label="创建人" prop="CreateUser"></el-table-column>
        <el-table-column label="创建时间" prop="CreateDate"></el-table-column>
        <el-table-column label="操作" width="180px">
          <template #default="scope">
            <!-- 下载按钮 -->
            <el-button type="primary" size="small" @click="FileDownload(scope.row.FileID)">
              <el-icon><Download /></el-icon>
            </el-button>
            <!-- 图片预览按钮 -->
            <el-button
              v-if="
                scope.row.Ext === '.jpeg' ||
                scope.row.Ext === '.jpg' ||
                scope.row.Ext === '.gif' ||
                scope.row.Ext === '.png'
              "
              type="primary"
              size="small"
              @click="FilePreview(scope.row.FileID, scope.row.FilePath)"
            >
              <el-icon><Picture /></el-icon>
            </el-button>
            <el-button
              v-if="scope.row.Ext.toLowerCase() === '.mp4' || scope.row.Ext.toLowerCase() === '.mov'"
              type="primary"
              size="small"
              @click="VideoPreview(scope.row.FileID)"
            >
              <el-icon><VideoCamera /></el-icon>
            </el-button>
            <!-- 删除按钮 -->
            <el-button type="danger" size="small" @click="RemoveFile(scope.row.FileID)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <el-pagination
        :current-page="queryInfo.pagenum"
        :page-sizes="[1, 2, 5, 10]"
        :page-size="queryInfo.pagesize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </el-card>

    <!-- 视频预览对话框 -->
    <VideoPreviewDialog v-model="VideoPreviewDialogVisible" :video-url="Video" />

    <el-image-viewer v-if="ShowViewer" :url-list="[guidePic]" @close="showViewerClose"></el-image-viewer>
  </div>
</template>

<script>
import { getFileDownloadUrl, getFileList, getUploadHeaders, previewOfficeFile, removeFile } from '@/api/file'
import { ElImageViewer } from 'element-plus'
import { Download, Picture, VideoCamera, Delete } from '@element-plus/icons-vue'
import VideoPreviewDialog from './components/VideoPreviewDialog.vue'

export default {
  name: 'Attachment',
  components: {
    ElImageViewer,
    VideoPreviewDialog,
    Download,
    Picture,
    VideoCamera,
    Delete
  },
  data() {
    return {
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
  created() {
    this.GetFileList()
  },
  methods: {
    // 监听上传成功的事件
    handleUploadSuccess(response, file, fileList) {
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
    handleUploadError(err, file, fileList) {
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
    handleUploadProgress(event, file, fileList) {
      this.showUploadProgress = true
      this.uploadProgress = Math.round(event.percent)
    },

    // 上传前的检查
    beforeUpload(file) {
      // 可以在这里添加文件类型或大小限制检查
      return true
    },
    handleResponse(response, file, fileList) {
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
        .catch(function (error) {
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

.el-breadcrumb {
  margin-bottom: 15px;
}
</style>
