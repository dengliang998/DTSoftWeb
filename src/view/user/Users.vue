<template>
  <div class="user-container">
    <!-- 卡片视图区域 -->
    <el-card class="table-card">
      <!-- 搜索与添加区域 -->
      <el-row :gutter="20">
        <el-col :span="7">
          <!-- 搜索与添加区域 -->
          <el-input clearable placeholder="请输入内容" v-model="queryInfo.query" @clear="getUserList">
            <template #append>
              <el-button icon="Search" @click="getUserList"></el-button>
            </template>
          </el-input>
        </el-col>

        <el-col :span="4">
          <el-button type="primary" @click="
            UserAddDialogVisible = true;
          imageUrl = '';
          ">添加用户</el-button>
        </el-col>
      </el-row>

      <!-- 用户列表区域 -->
      <el-table :data="userList" :row-style="{ height: '40px' }" :cell-style="{ padding: '0px' }"
        border stripe class="table-wrapper">
        <el-table-column label="#" type="index" :index="indexMethod"></el-table-column>
        <el-table-column label="账号" prop="Account"></el-table-column>
        <el-table-column label="用户名" prop="DisplayName"></el-table-column>
        <el-table-column label="性别" prop="Sex" :formatter="SetSex"></el-table-column>
        <el-table-column label="职位" prop="Position"></el-table-column>
        <el-table-column label="邮箱" prop="Email"></el-table-column>
        <el-table-column label="直属主管" prop="SupervisorDisplayName">
          <template v-slot:default="scope">
            <span>{{ scope.row.SupervisorDisplayName || scope.row.SupervisorAcc || "" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="禁用">
          <!-- 作用域插槽 slot-scope="scope" -->
          <template v-slot:default="scope">
            <el-switch :disabled="scope.row.Account == 'Admin' || scope.row.Account == 'admin'" v-model="scope.row.Disable"
              @change="userStateChanged(scope.row.Account, scope.row.Disable)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180px">
          <template v-slot:default="scope">
            <div class="operation-buttons">
              <!-- 修改按钮 -->
              <el-button type="primary" size="small" icon="Edit"
                @click="UserEditDialog(scope.row.Account)"></el-button>
              <!-- 密码重置 -->
              <el-button type="primary" size="small" icon="Unlock"
                @click="showResetPasswordDialog(scope.row.Account)"></el-button>
              <!-- 删除按钮 -->
              <el-button type="danger" size="small" icon="Delete" :disabled="scope.row.Account == 'admin' || scope.row.Account == 'admin'"
                @click="removeUserById(scope.row.Account)"></el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange"
        :current-page="queryInfo.pagenum" :page-sizes="[1, 2, 5, 10]" :page-size="queryInfo.pagesize"
        layout="total, sizes, prev, pager, next, jumper" :total="total">
      </el-pagination>
    </el-card>

    <!-- 添加用户的对话框 -->
    <el-dialog title="添加用户" v-model="UserAddDialogVisible" width="50%" @close="UserAddDialogClosed">
      <UserInfo-components :Account="SelUser" OpenType="New" ref="UserInfo" @oncallback="oncallback"
        v-if="UserAddDialogVisible"></UserInfo-components>
      <!-- 底部区域 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="UserAddDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="AddUser">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改用户的对话框 -->
    <el-dialog title="修改用户" v-model="UserDialogVisible" width="50%" @close="UserDialogClosed">
      <UserInfo-components :Account="SelUser" OpenType="Edit" ref="UserInfo" @oncallback="oncallback"
        v-if="UserDialogVisible"></UserInfo-components>
      <!-- 底部区域 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="UserDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="UpdateUserInfo">确 定</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 密码重置的对话框 -->
    <el-dialog title="重置密码" v-model="ResetPwdDialogVisible" width="30%" @close="resetPasswordDialogClosed">
      <!-- 内容主体区域 -->
      <el-form :model="ResetPwdForm" ref="resetPasswordFormRef" label-width="70px">
        <el-form-item label="账号">
          <el-input v-model="ResetPwdForm.Account" disabled></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="NewPwd">
          <el-input v-model="ResetPwdForm.NewPwd" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="ConfirmPwd">
          <el-input v-model="ResetPwdForm.ConfirmPwd" show-password></el-input>
        </el-form-item>
      </el-form>
      <!-- 底部区域 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="ResetPwdDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="ResetPassword">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from '@/api/http';
import UserInfoComponents from "../../components/user/UserInfoComponents.vue";

export default {
  components: {
    UserInfoComponents,
  },
  created() {
    this.getUserList();
  },
  name: "User",
  data() {
    return {
      queryInfo: {
        query: "",
        // 当前的页数
        pagenum: 1,
        // 当前每页显示多少条数据
        pagesize: 10,
      },
      // 用户列表
      userList: [],
      // 总数据
      total: 0,
      userInfo: {},
      ResetPwdDialogVisible: false,
      ResetPwdForm: { Account: "", NewPwd: "", ConfirmPwd: "" },
      SelUser: "",
      UserDialogVisible: false,
      UserAddDialogVisible: false,
    };
  },
  methods: {
    // 获取用户列表
    async getUserList() {
      try {
        const params = new URLSearchParams();
        params.append("Keyword", this.queryInfo.query);
        params.append("PageNum", this.queryInfo.pagenum);
        params.append("PageSize", this.queryInfo.pagesize);

        const { data: res } = await axios.post("/api/User/GetUserList", params);
        if (res.success) {
          this.userList = res.data;
          this.total = res.Total;
        } else {
          this.$message.error("用户列表获取失败：" + res.Msg);
        }
      } catch (error) {
        this.$message.error("用户列表获取失败，请稍后重试！");
      }
    },
    SetSex(row, column, cellValue, index) {
      return cellValue === "Male" ? "男" : "女";
    },
    // 监听 pageSize 改变的事件
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize;
      this.getUserList();
    },

    // 监听 页码值 页面值改变的事件
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage;
      this.getUserList();
    },

    // 保存用户的状态
    async userStateChanged(Account, Disable) {
      try {
        const params = new URLSearchParams();
        params.append("Account", Account);
        params.append("Disable", Disable);

        const { data: res } = await axios.post("/api/User/ModifyUserInfo", params);
        if (res.success) {
          this.$message.success("更新用户信息成功");
        } else {
          this.$message.error("修改失败：" + res.Msg);
        }
      } catch (error) {
        this.$message.error("修改失败：" + error.message);
      }
    },
    showResetPasswordDialog(Account) {
      this.ResetPwdForm = {};
      this.ResetPwdForm.Account = Account;
      this.ResetPwdDialogVisible = true;
    },
    async ResetPassword() {
      if (!this.ResetPwdForm.NewPwd || !this.ResetPwdForm.ConfirmPwd) {
        return this.$message.error("密码不能为空");
      }

      if (this.ResetPwdForm.NewPwd !== this.ResetPwdForm.ConfirmPwd) {
        return this.$message.error("密码不一致");
      }

      const params = new URLSearchParams();
      params.append("Account", this.ResetPwdForm.Account);
      params.append("PassWord", this.ResetPwdForm.ConfirmPwd);

      const { data: res } = await axios.post("/api/User/ResetPassword", params);
      if (res.success) {
        this.$message.success(res.Msg);
        this.ResetPwdDialogVisible = false;
        this.getUserList();
      } else {
        this.$message.error("重置失败：" + res.Msg);
      }
    },
    resetPasswordDialogClosed() {
      this.$refs.resetPasswordFormRef.resetFields();
    },
    UpdateUserInfo() {
      //调用组件方法执行更新
      this.$refs.UserInfo.UpdateUserInfo();
    },
    AddUser() {
      //调用组件方法执行添加
      this.$refs.UserInfo.AddUser();
    },
    oncallback(res) {
      //UserInfo组件回调事件
      if (res.success && res.OpenType === "Edit") {
        this.UserDialogVisible = false;
        this.getUserList();
      } else if (res.success && res.OpenType === "New") {
        this.UserAddDialogVisible = false;
        this.getUserList();
      }
    },
    UserDialogClosed() {
      this.UserDialogVisible = false;
    },
    UserAddDialogClosed() {
      //关闭
      this.UserAddDialogVisible = false;
    },
    UserEditDialog(Account) {
      //打开修改对话框
      //增加用户传参数
      this.SelUser = Account;
      this.UserDialogVisible = true;
    },
    // 根据ID删除对应的用户信息

    async removeUserById(Account) {
      // 询问用户是否删除数据
      const confirmResult = await this.$confirm(
        "此操作将永久删除该用户, 是否继续?",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      ).catch((err) => err);

      //如果用户确认了删除，则字符串返回 confirm
      //如果用户取消了删除，则字符串返回 cancel
      //console.log(confirmResult);
      if (confirmResult !== "confirm") {
        return this.$message.info("已经取消了删除");
      }

      //发起删除请求，判读状态码，删除成功提示消息并且刷新用户列表
      try {
        const params = new URLSearchParams();
        params.append("Account", Account);

        const { data: res } = await axios.post("/api/User/DelUser", params);
        if (res.success) {
          this.$message.success("删除用户成功");
          this.getUserList();
        } else {
          this.$message.error("删除用户失败：" + res.Msg);
        }
      } catch (error) {
        this.$message.error("删除失败，请稍后重试！");
      }
    },
    //处理行号
    indexMethod(index) {
      index =
        index + 1 + (this.queryInfo.pagenum - 1) * this.queryInfo.pagesize;
      return index;
    },
  },
};
</script>

<style scoped>
.user-container {
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

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 5px;
}
</style>
