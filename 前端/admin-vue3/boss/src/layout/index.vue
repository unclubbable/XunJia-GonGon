<template>
  <div class="app-layout">
    <el-container class="layout-container">
      <!-- 顶部导航栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <div class="logo-area">
            <img src="../assets/logo.png" alt="讯家出行" class="logo-img"" />
            <span class="logo-text">讯家出行</span>
          </div>
        </div>
        <div class="header-right">

          <!-- 消息提醒 -->
          <div class="header-actions">
            <el-badge :value="reminderCount" :hidden="reminderCount === 0" type="danger">
              <el-icon :size="24" class="action-icon" @click="showReminders">
                <Bell />
              </el-icon>
            </el-badge>
            <!-- 用户下拉菜单 -->
            <el-dropdown @command="handleCommand">
              <div class="user-info">
                <el-avatar :size="36" :src="userAvatar" />
                <span class="username">{{ username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-container>
        <!-- 左侧菜单栏 (固定宽度) -->
        <el-aside class="layout-aside" width="260px">
          <el-menu
            :default-active="activeMenu"
            router
            unique-opened
            class="el-menu-vertical"
            :collapse="false"
            background-color="#ffffff"
            text-color="#303133"
            active-text-color="#1890ff"
          >
            <!-- 数据概览 (首页仪表盘) -->
            <el-menu-item index="/dashboard">
              <el-icon><DataLine /></el-icon>
              <template #title>首页</template>
            </el-menu-item>

            <!-- 司机管理 -->
            <el-sub-menu index="/driver">
              <template #title>
                <el-icon><User /></el-icon>
                <span>司机管理</span>
              </template>
              <el-menu-item index="/driver/list">司机信息列表</el-menu-item>
              <el-menu-item index="/driver/work-status">工作状态管理</el-menu-item>
            </el-sub-menu>

            <!-- 车辆管理 -->
            <el-sub-menu index="/car">
              <template #title>
                <el-icon><Van /></el-icon>
                <span>车辆管理</span>
              </template>
              <el-menu-item index="/car/list">车辆信息列表</el-menu-item>
              <el-menu-item index="/car/certificate">车辆证件管理</el-menu-item>
            </el-sub-menu>

            <!-- 司机-车辆绑定管理 -->
            <el-menu-item index="/binding">
              <el-icon><Connection /></el-icon>
              <template #title>司机-车辆绑定管理</template>
            </el-menu-item>

            <!-- 订单管理 -->
            <el-sub-menu index="/order">
              <template #title>
                <el-icon><List /></el-icon>
                <span>订单管理</span>
              </template>
              <el-menu-item index="/order/list">订单列表</el-menu-item>
              <el-menu-item index="/order/track">订单地图轨迹</el-menu-item>
            </el-sub-menu>

            <!-- 财务管理 -->
            <el-sub-menu index="/finance">
              <template #title>
                <el-icon><Money /></el-icon>
                <span>财务管理</span>
              </template>
              <el-menu-item index="/finance/income">司机收入明细</el-menu-item>
              <el-menu-item index="/finance/payment">收入发放管理</el-menu-item>
              <el-menu-item index="/finance/commission">平台抽成统计</el-menu-item>
            </el-sub-menu>

            <!-- 运营监控 -->
            <el-sub-menu index="/monitor">
              <template #title>
                <el-icon><Monitor /></el-icon>
                <span>运营监控</span>
              </template>
              <el-menu-item index="/monitor/map">司机实时位置</el-menu-item>
              <el-menu-item index="/monitor/online">在线司机监控</el-menu-item>
              <el-menu-item index="/monitor/city">运营城市统计</el-menu-item>
              <el-menu-item index="/monitor/fare">运价规则管理</el-menu-item>
            </el-sub-menu>

            <!-- 数据概览 (首页仪表盘) -->
            <el-menu-item index="/android">
              <el-icon><DataLine /></el-icon>
              <template #title>安卓端展示</template>
            </el-menu-item>

            
          </el-menu>
        </el-aside>

        <!-- 右侧内容区域，子页面展示区 -->
        <el-main class="layout-main">
          <router-view v-slot="{ Component }">
              <component :is="Component" />
          </router-view>
        </el-main>
      </el-container>
    </el-container>

    <!-- 提醒抽屉 (简易展示到期提醒列表) -->
    <el-drawer v-model="reminderDrawer" title="到期提醒" direction="rtl" size="400px">
      <div class="reminder-list">
        <div v-if="reminders.length === 0" class="empty-tip">暂无到期提醒</div>
        <div v-for="item in reminders" :key="item.id" class="reminder-item">
          <el-icon><WarningFilled /></el-icon>
          <span>{{ item.content }}</span>
          <span class="reminder-date">{{ item.date }}</span>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { removeToken, getToken } from '../utils/auth'
import {
  Search, Bell, ArrowDown, DataLine, User, Van, Connection,
  List, Money, Monitor, Setting, Tools, WarningFilled
} from '@element-plus/icons-vue'

const router = useRouter()

// 用户信息相关
const username = ref('admin')
const userAvatar = ref('https://java-cjw11.oss-cn-beijing.aliyuncs.com/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-03-22%20173314.png') // 默认头像，可替换



// 提醒相关
const reminderCount = ref(1) // 示例未读提醒数量，实际从接口获取
const reminderDrawer = ref(false)
const reminders = ref([
  { id: 1, content: '以后使用MQ消息队列开发,目前没有该功能', date: '2026-3-27' }
])

// 当前激活菜单 (根据路由高亮)
const activeMenu = computed(() => {
  return router.currentRoute.value.path
})

// 退出登录
const logout = () => {
  removeToken()
  router.push('/login')
}




// 展示提醒抽屉
const showReminders = () => {
  reminderDrawer.value = true
  // 标记已读提醒可在此处调用接口，但不强制
}

// 下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    logout()
  } else if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'settings') {
    router.push('/settings')
  }
}


// 获取当前登录用户信息、未读提醒数量等
const fetchUserInfo = async () => {

}

// 获取到期提醒列表 (可在展示抽屉时动态拉取)
const fetchReminders = async () => {
}

onMounted(() => {
  // 校验登录态
  if (!getToken() || getToken() === '') {
    router.push('/login')
  } else {
    fetchUserInfo()
    fetchReminders()
  }
})
</script>

<style scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

.layout-header {
  background-color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  z-index: 10;
}

.header-left .logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-img {
  height: 40px;
  width: auto;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.global-search {
  margin-right: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.action-icon {
  cursor: pointer;
  color: #5a5e66;
  transition: color 0.2s;
}

.action-icon:hover {
  color: #1890ff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background 0.2s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  font-size: 14px;
  color: #303133;
}

.layout-aside {
  background-color: #ffffff;
  border-right: 1px solid #eaeef2;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.el-menu-vertical {
  border-right: none;
  height: 100%;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 100%;
}

.layout-main {
  background-color: #f0f2f6;
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 64px);
}



/* 提醒抽屉样式 */
.reminder-list {
  padding: 0 12px;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.reminder-item .reminder-date {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 24px 0;
}
</style>
