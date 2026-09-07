<template>
  <div class="login-container">
    <!-- 动态背景装饰 -->
    <div class="bg-decoration">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
    </div>

    <!-- 登录表单卡片 -->
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      auto-complete="on"
      label-position="left"
    >
      <!-- 品牌区域 -->
      <div class="brand-container">
        <div class="logo-wrapper">
          <el-icon :size="36" color="white">
            <Van />
          </el-icon>
        </div>
        <h3 class="title">讯家出行管理后台</h3>
        <p class="subtitle">Xunjia Travel Management Backend</p>
      </div>

      <!-- 用户名输入框 -->
      <el-form-item prop="username">
        <div class="input-wrapper">
          <span class="svg-container">
            <el-icon><User /></el-icon>
          </span>
          <el-input
            ref="usernameInputRef"
            v-model="loginForm.username"
            placeholder="用户名 / Username"
            name="username"
            type="text"
            tabindex="1"
            auto-complete="on"
          />
        </div>
      </el-form-item>

      <!-- 密码输入框 -->
      <el-form-item prop="password">
        <div class="input-wrapper">
          <span class="svg-container">
            <el-icon><Lock /></el-icon>
          </span>
          <el-input
            ref="passwordInputRef"
            v-model="loginForm.password"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="密码 / Password"
            name="password"
            tabindex="2"
            auto-complete="on"
            @keyup.enter="handleLogin"
          />
          <span class="show-pwd" @click="togglePasswordVisibility">
            <el-icon>
              <View v-if="!passwordVisible" />
              <Hide v-else />
            </el-icon>
          </span>
        </div>
      </el-form-item>

      <!-- 登录按钮 -->
      <el-button
        :loading="loading"
        type="primary"
        class="login-btn"
        @click.prevent="handleLogin"
      >
        {{ loading ? '登录中...' : '登 录' }}
      </el-button>

      <!-- 底部提示（纯装饰） -->
      <div class="footer-tip">
        <span>内网访问,禁止泄露</span>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { login } from '../../api/user'
import { setToken } from '../../utils/auth'
import { ElMessage } from 'element-plus'
import { User, Lock, View, Hide, Van } from '@element-plus/icons-vue'

// 路由与状态管理
const router = useRouter()
const route = useRoute()
const store = useStore()

// 表单数据
const loginForm = reactive({
  username: 'admin',
  password: ''
})

// 密码显隐控制
const passwordVisible = ref(false)

// 加载状态
const loading = ref(false)

// 表单引用
const loginFormRef = ref(null)
const usernameInputRef = ref(null)
const passwordInputRef = ref(null)

// 密码校验规则
const validatePassword = (rule, value, callback) => {
  if (value.length < 6) {
    callback(new Error('密码不能少于6位字符'))
  } else {
    callback()
  }
}

// 表单校验规则
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, trigger: 'blur', validator: validatePassword }]
}

// 切换密码显示/隐藏
const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
  nextTick(() => {
    passwordInputRef.value?.focus()
  })
}

// 登录提交
const handleLogin = () => {
  loginFormRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true
      login(loginForm)
        .then((res) => {
          setToken(res.data.token);
          ElMessage({
            message: '登录成功',
            type: 'success',
          });
          router.push({ path: '/' });
        })
        .catch(() => {
          // 登录失败，不做额外处理
          ElMessage.error('登录失败')
        })
        .finally(() => {
          loading.value = false
        })
    } else {
      ElMessage.error('登录验证失败')
      return false
    }
  })
}

// 自动聚焦用户名输入框
onMounted(() => {
  usernameInputRef.value?.focus()
})
</script>

<style scoped>
/* 全局容器 - 全屏背景渐变 */
.login-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* 动态装饰背景 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  filter: blur(60px);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  top: 10%;
  left: -5%;
  width: 300px;
  height: 300px;
  background: rgba(120, 100, 200, 0.3);
  animation-delay: 0s;
}

.shape-2 {
  bottom: 10%;
  right: -5%;
  width: 400px;
  height: 400px;
  background: rgba(200, 120, 200, 0.25);
  animation-delay: -5s;
}

.shape-3 {
  top: 40%;
  left: 20%;
  width: 200px;
  height: 200px;
  background: rgba(100, 200, 200, 0.2);
  animation-delay: -10s;
}

.shape-4 {
  bottom: 20%;
  left: 30%;
  width: 250px;
  height: 250px;
  background: rgba(255, 180, 100, 0.2);
  animation-delay: -15s;
}

@keyframes float {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, 20px) scale(1.1);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

/* 登录表单卡片 */
.login-form {
  position: relative;
  z-index: 2;
  width: 460px;
  max-width: 90%;
  padding: 48px 40px 40px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 32px;
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-form:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 55px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.3);
}

/* 品牌区域 */
.brand-container {
  text-align: center;
  margin-bottom: 36px;
}

.logo-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  background: linear-gradient(120deg, #2d3748, #4a5568);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
  letter-spacing: 0.5px;
}

/* 输入框包装器 */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  transition: all 0.2s;
}

/* 图标容器样式 */
.svg-container {
  position: absolute;
  left: 12px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  transition: color 0.2s;
  pointer-events: none;
}

.svg-container .el-icon {
  width: 18px;
  height: 18px;
}

/* 显示密码图标 */
.show-pwd {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #a0aec0;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.show-pwd:hover {
  color: #667eea;
}

.show-pwd .el-icon {
  width: 18px;
  height: 18px;
}

/* 深度修改 Element Plus 输入框样式 */
:deep(.el-input) {
  width: 100%;
}

:deep(.el-input__wrapper) {
  background-color: #f7fafc;
  border-radius: 16px;
  padding: 6px 32px 6px 44px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), inset 0 0 0 1px #e2e8f0;
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), inset 0 0 0 1px #cbd5e0;
}

:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2), inset 0 0 0 1px #667eea;
  background-color: #ffffff;
}

:deep(.el-input__inner) {
  font-size: 15px;
  color: #1a202c;
  height: 48px;
  line-height: 48px;
}

:deep(.el-input__inner::placeholder) {
  color: #cbd5e0;
  font-weight: 400;
}

/* 表单项间距 */
.el-form-item {
  margin-bottom: 28px;
}

/* 错误信息样式优化 */
:deep(.el-form-item__error) {
  font-size: 12px;
  padding-top: 6px;
  padding-left: 12px;
  color: #f56565;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 16px;
  margin-top: 8px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.login-btn:hover,
.login-btn:focus {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(102, 126, 234, 0.4);
}

.login-btn:active {
  transform: translateY(1px);
}

/* 底部提示装饰 */
.footer-tip {
  text-align: center;
  font-size: 12px;
  color: #a0aec0;
  margin-top: 8px;
  user-select: none;
  letter-spacing: 0.3px;
}

/* 响应式调整 */
@media (max-width: 576px) {
  .login-form {
    padding: 32px 24px 28px;
    border-radius: 28px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .logo-wrapper {
    width: 52px;
    height: 52px;
  }
  
  :deep(.el-input__inner) {
    height: 44px;
    line-height: 44px;
  }
  
  .login-btn {
    height: 48px;
  }
}
</style>