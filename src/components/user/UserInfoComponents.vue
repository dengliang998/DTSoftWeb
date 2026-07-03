<template>
  <div id="app">
    <!-- 内容主体区域 -->
    <el-form ref="UserFormRef" :model="UserForm" label-width="70px">
      <el-form-item label="头像">
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
            <span class="upload-text">点击上传</span>
          </div>
        </el-upload>
      </el-form-item>
      <el-form-item label="账号">
        <el-input v-model="UserForm.Account" :disabled="OpenType === 'Edit'" placeholder="请填写账号"></el-input>
      </el-form-item>
      <el-form-item label="用户名" prop="DisplayName">
        <el-input v-model="UserForm.DisplayName" placeholder="请填写用户名"></el-input>
      </el-form-item>
      <el-form-item v-if="OpenType === 'New'" label="密码" prop="PassWord">
        <el-input v-model="UserForm.PassWord" show-password placeholder="请填写密码"></el-input>
      </el-form-item>
      <el-form-item label="性别">
        <el-radio v-model="UserForm.Sex" value="Male">男</el-radio>
        <el-radio v-model="UserForm.Sex" value="Female">女</el-radio>
      </el-form-item>
      <el-form-item label="职位">
        <el-input v-model="UserForm.Position" placeholder="请输入职位"></el-input>
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="UserForm.Email" placeholder="请输入邮箱"></el-input>
      </el-form-item>
      <el-form-item label="直属主管">
        <div class="supervisor-row">
          <el-input v-model="supervisorDisplay" readonly placeholder="请选择直属主管" style="width: 70%" />
          <el-button type="primary" @click="openSupervisorPicker">选择</el-button>
          <el-button @click="clearSupervisor">清空</el-button>
        </div>
      </el-form-item>
    </el-form>
    <UserPickerDialog
      v-model="supervisorPickerVisible"
      title="选择直属主管"
      :exclude-account="UserForm.Account"
      @select="onSupervisorSelected"
    />
  </div>
</template>

<script>
import axios from '@/api/http'
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
        this.$message.error('上传头像图片只能是 jpeg、gif、png 格式!')
        return false
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!')
        return false
      }
    },
    LoadData(Account) {
      //初始化数据
      let me = this
      const params = new URLSearchParams()
      params.append('account', Account)
      axios
        .post('/api/User/GetUserDetailByAccount', params)
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
            me.imageUrl = 'api/User/GetUserAvatar?Account=' + Account
          } else {
            me.$message.error('用户获取失败：' + response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('用户获取失败，请稍后重试！')
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
          axios
            .post('/api/User/ModifyUserInfo', params)
            .then(function (response) {
              if (response.data.success) {
                me.$message.success('更新用户信息成功')
                me.$emit('oncallback', res)
              } else {
                me.$message.error('更新用户信息失败：' + response.data.Msg)
                res.success = false
                me.$emit('oncallback', res)
              }
            })
            .catch(function () {
              me.$message.error('修改失败，请稍后重试！')
              res.success = false
              me.$emit('oncallback', res)
            })
        } else {
          me.$message.error('表单内容不允许为空！')
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
          axios
            .post('/api/User/CreateUser', params)
            .then(function (response) {
              if (response.data.success) {
                me.$message.success('用户添加成功')
                me.$emit('oncallback', res)
              } else {
                me.$message.error('添加失败:' + response.data.Msg)
                res.success = false
                me.$emit('oncallback', res)
              }
            })
            .catch(function () {
              me.$message.error('添加失败,请稍后重试!')
              res.success = false
              me.$emit('oncallback', res)
            })
        } else {
          me.$message.error('表单内容不允许为空!')
          res.success = false
          me.$emit('oncallback', res)
        }
      })
    }
  }
}
</script>
<style scoped>
#app {
  background: #ffffff;
  padding: 0 10px;
  margin: 0;
}

.el-form-item {
  margin-bottom: 18px;
}

.el-input {
  width: 70%;
}

.avatar-uploader .el-upload {
  border: 2px dashed #3498db;
  border-radius: 12px;
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
  font-size: 32px;
  color: #3498db;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
}

.upload-text {
  font-size: 12px;
  color: #3498db;
  margin-top: 4px;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
}

.supervisor-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
