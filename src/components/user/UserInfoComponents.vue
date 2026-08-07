<template>
  <div class="user-info-panel">
    <!-- 内容主体区域 -->
    <el-form ref="UserFormRef" :model="UserForm" label-position="top" class="user-info-form">
      <el-form-item :label="$t('user.form.avatar')" class="avatar-form-item">
        <el-upload
          class="avatar-uploader"
          :action="UploadActionUrl"
          name="files"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
        >
          <img v-if="imageUrl" :src="imageUrl" class="avatar" />
          <div v-else class="upload-placeholder">
            <i class="el-icon-plus avatar-uploader-icon"></i>
            <span class="upload-text">{{ $t('user.form.upload') }}</span>
          </div>
        </el-upload>
      </el-form-item>
      <el-form-item :label="$t('user.form.account')">
        <el-input
          v-model="UserForm.Account"
          :disabled="OpenType === 'Edit'"
          :placeholder="$t('user.form.accountPlaceholder')"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('user.form.username')" prop="DisplayName">
        <el-input v-model="UserForm.DisplayName" :placeholder="$t('user.form.usernamePlaceholder')"></el-input>
      </el-form-item>
      <el-form-item v-if="OpenType === 'New'" :label="$t('user.form.password')" prop="PassWord">
        <el-input
          v-model="UserForm.PassWord"
          show-password
          :placeholder="$t('user.form.passwordPlaceholder')"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('user.form.gender')">
        <el-radio v-model="UserForm.Sex" value="Male">{{ $t('user.form.male') }}</el-radio>
        <el-radio v-model="UserForm.Sex" value="Female">{{ $t('user.form.female') }}</el-radio>
      </el-form-item>
      <el-form-item :label="$t('user.form.position')">
        <el-input v-model="UserForm.Position" :placeholder="$t('user.form.positionPlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('user.form.email')">
        <el-input v-model="UserForm.Email" :placeholder="$t('user.form.emailPlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('user.form.supervisor')" class="supervisor-form-item">
        <div class="supervisor-row">
          <el-input v-model="supervisorDisplay" readonly :placeholder="$t('user.form.supervisorPlaceholder')" />
          <el-button type="primary" @click="openSupervisorPicker">{{ $t('user.form.select') }}</el-button>
          <el-button @click="clearSupervisor">{{ $t('user.form.clear') }}</el-button>
        </div>
      </el-form-item>
    </el-form>
    <UserPickerDialog
      v-model="supervisorPickerVisible"
      :title="$t('user.form.selectSupervisor')"
      :exclude-account="UserForm.Account"
      @select="onSupervisorSelected"
    />
  </div>
</template>

<script>
import { createUser, getUserAvatarUrl, getUserDetailByAccount, modifyUserInfo } from '@/api/user'
import UserPickerDialog from './UserPickerDialog.vue'

export default {
  name: 'UserInfoComponents',
  components: {
    UserPickerDialog
  },
  props: {
    Account: String, //账号
    OpenType: String, //New,Edit
    OuId: {
      // 部门ID
      type: Number,
      default: null
    }
  },
  data() {
    return {
      UserForm: {
        Avatar: '',
        Account: '',
        PassWord: '',
        DisplayName: '',
        Sex: 'Male',
        Position: '',
        Email: '',
        SupervisorAcc: '',
        SupervisorDisplayName: ''
      },
      UploadActionUrl: 'api/User/UploadAvatar',
      imageUrl: '',
      supervisorTouched: false,
      supervisorPickerVisible: false
    }
  },
  computed: {
    supervisorDisplay() {
      const acc = this.UserForm.SupervisorAcc || ''
      const name = this.UserForm.SupervisorDisplayName || ''
      if (!acc) return ''
      return name && name !== acc ? `${name}（${acc}）` : acc
    }
  },
  created() {
    if (this.OpenType === 'New') {
      this.UserForm.Account = ''
      this.UserForm.PassWord = ''
      this.UserForm.DisplayName = ''
    } else if (this.OpenType === 'Edit') {
      this.LoadData(this.Account)
    }
  },
  activated() {},
  methods: {
    openSupervisorPicker() {
      this.supervisorPickerVisible = true
    },
    onSupervisorSelected(user) {
      this.supervisorTouched = true
      this.UserForm.SupervisorAcc = user.Account || ''
      this.UserForm.SupervisorDisplayName = user.DisplayName || user.Account || ''
    },
    clearSupervisor() {
      this.supervisorTouched = true
      this.UserForm.SupervisorAcc = ''
      this.UserForm.SupervisorDisplayName = ''
    },
    handleAvatarSuccess(res, file) {
      //新增
      this.UserForm.Avatar = res.AvatarID
      //修改
      this.UserForm.Avatar = res.AvatarID
      //预览
      this.imageUrl = URL.createObjectURL(file.raw)
    },
    beforeAvatarUpload(file) {
      const imgtype = file.type // === "image/jpeg";
      const isLt2M = file.size / 1024 / 1024 < 2
      if (imgtype != 'image/jpeg' && imgtype != 'image/png' && imgtype != 'image/gif') {
        this.$message.error(this.$t('user.form.avatarFormatError'))
        return false
      }
      if (!isLt2M) {
        this.$message.error(this.$t('user.form.avatarSizeError'))
        return false
      }
    },
    LoadData(Account) {
      //初始化数据
      let me = this
      getUserDetailByAccount(Account)
        .then(function (response) {
          if (response.data.success) {
            const payload =
              response.data && typeof response.data === 'object' ? response.data.data || response.data : {}
            const cleaned = { ...payload }
            delete cleaned.success
            delete cleaned.Msg
            delete cleaned.message
            delete cleaned.Total
            delete cleaned.data
            me.UserForm = { ...me.UserForm, ...cleaned }
            me.supervisorTouched = false
            //加载头像
            me.imageUrl = getUserAvatarUrl(Account).replace(/^\//, '')
          } else {
            me.$message.error(`${me.$t('user.form.getFailed')}：${response.data.Msg}`)
          }
        })
        .catch(function () {
          me.$message.error(me.$t('user.form.getFailedRetry'))
        })
    },
    // 修改用户信息保存提交
    UpdateUserInfo() {
      // 表单预验证
      this.$refs.UserFormRef.validate(async (valid) => {
        // 验证失败返回
        if (!valid) return
        // 发起修改用户信息的数据请求
        let me = this
        let res = { success: true, OpenType: 'Edit' }

        if (me.UserForm.DisplayName != '') {
          const params = new URLSearchParams()
          params.append('Account', me.UserForm.Account)
          params.append('DisplayName', me.UserForm.DisplayName)
          params.append('Sex', me.UserForm.Sex)
          params.append('Avatar', me.UserForm.Avatar)
          params.append('Position', me.UserForm.Position)
          params.append('Email', me.UserForm.Email)
          if (me.supervisorTouched) {
            params.append('SupervisorAcc', me.UserForm.SupervisorAcc || '')
          }
          modifyUserInfo(params)
            .then(function (response) {
              if (response.data.success) {
                me.$message.success(me.$t('user.form.updateSuccess'))
                me.$emit('oncallback', res)
              } else {
                me.$message.error(`${me.$t('user.form.updateFailed')}：${response.data.Msg}`)
                res.success = false
                me.$emit('oncallback', res)
              }
            })
            .catch(function () {
              me.$message.error(me.$t('user.form.modifyFailedRetry'))
              res.success = false
              me.$emit('oncallback', res)
            })
        } else {
          me.$message.error(me.$t('user.form.required'))
          res.success = false
          me.$emit('oncallback', res)
        }
      })
    },
    // 点击确定按钮,添加新用户
    AddUser(deptId) {
      this.$refs.UserFormRef.validate(async (valid) => {
        if (!valid) return
        let me = this
        let res = { success: true, OpenType: 'New' }
        if (me.UserForm.Account != '' && me.UserForm.DisplayName != '' && me.UserForm.PassWord != '') {
          const params = new URLSearchParams()
          params.append('Account', me.UserForm.Account)
          params.append('DisplayName', me.UserForm.DisplayName)
          params.append('PassWord', me.UserForm.PassWord)
          params.append('Sex', me.UserForm.Sex)
          params.append('Avatar', me.UserForm.Avatar)
          params.append('Position', me.UserForm.Position)
          params.append('Email', me.UserForm.Email)
          if (me.UserForm.SupervisorAcc) {
            params.append('SupervisorAcc', me.UserForm.SupervisorAcc)
          }
          // 传递部门ID
          if (deptId) {
            params.append('OuId', deptId)
          }
          createUser(params)
            .then(function (response) {
              if (response.data.success) {
                me.$message.success(me.$t('user.form.addSuccess'))
                me.$emit('oncallback', res)
              } else {
                me.$message.error(`${me.$t('user.form.addFailed')}: ${response.data.Msg}`)
                res.success = false
                me.$emit('oncallback', res)
              }
            })
            .catch(function () {
              me.$message.error(me.$t('user.form.addFailedRetry'))
              res.success = false
              me.$emit('oncallback', res)
            })
        } else {
          me.$message.error(me.$t('user.form.required'))
          res.success = false
          me.$emit('oncallback', res)
        }
      })
    }
  }
}
</script>
<style scoped>
.user-info-panel {
  background: #ffffff;
  padding: 0;
  margin: 0;
}

.user-info-form {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px 16px;
  align-items: start;
}

.user-info-form .el-form-item {
  min-width: 0;
  margin-bottom: 0;
}

.user-info-form :deep(.el-form-item__label) {
  padding-bottom: 4px;
  line-height: 20px;
  color: #4b5563;
  font-size: 13px;
}

.user-info-form :deep(.el-form-item__content) {
  line-height: 1;
}

.user-info-form :deep(.el-input),
.user-info-form :deep(.el-select),
.user-info-form :deep(.el-input-number) {
  width: 100%;
}

.avatar-form-item {
  grid-row: 1 / span 3;
}

.supervisor-form-item {
  grid-column: 1 / -1;
}

.avatar-uploader .el-upload {
  border: 2px dashed #3498db;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
  transition: all 0.3s ease;
}

.avatar-uploader .el-upload:hover {
  border-color: #2980b9;
  background: linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.25);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #3498db;
  width: 86px;
  height: 86px;
  line-height: 86px;
  text-align: center;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 86px;
  height: 86px;
}

.upload-text {
  font-size: 12px;
  color: #3498db;
  margin-top: 4px;
}

.avatar {
  width: 86px;
  height: 86px;
  display: block;
  object-fit: cover;
}

.supervisor-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.supervisor-row :deep(.el-input) {
  flex: 1;
  min-width: 0;
}

.supervisor-row :deep(.el-button) {
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .user-info-form {
    grid-template-columns: 1fr;
  }

  .avatar-form-item,
  .supervisor-form-item {
    grid-column: 1;
    grid-row: auto;
  }

  .supervisor-row {
    align-items: stretch;
    flex-direction: column;
  }
}

html[data-theme='dark'] .user-info-panel {
  background: transparent;
}

html[data-theme='dark'] .user-info-form :deep(.el-form-item__label) {
  color: var(--dt-text-muted);
}

html[data-theme='dark'] .avatar-uploader .el-upload {
  border-color: var(--dt-primary-border);
  background: linear-gradient(135deg, var(--dt-surface-soft) 0%, var(--dt-surface) 100%);
}

html[data-theme='dark'] .avatar-uploader .el-upload:hover {
  border-color: var(--dt-primary);
  background: linear-gradient(135deg, var(--dt-primary-subtle) 0%, var(--dt-surface-soft) 100%);
  box-shadow: 0 4px 15px color-mix(in srgb, var(--dt-primary) 20%, transparent);
}

html[data-theme='dark'] .avatar-uploader-icon,
html[data-theme='dark'] .upload-text {
  color: var(--dt-primary-light);
}
</style>
