<template>
  <div class="app-layout">
    <el-container class="layout-container">
      <!-- 顶部导航栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <div class="logo-area">
            <img src="../assets/logo.png" alt="讯家出行" class="logo-img" />
            <span class="logo-text">讯家出行</span>
          </div>
        </div>
        <div class="header-right">

          <!-- 消息提醒 -->
          <div class="header-actions">
            <div
              v-if="wsVisible"
              class="ws-chip"
              :class="'ws-chip--' + wsStatus"
              :title="wsLabel"
              @click="retryWs"
            >
              <span class="ws-chip-dot" />
              <span class="ws-chip-text">{{ wsShortLabel }}</span>
            </div>
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
              <el-menu-item index="/car/dict">车辆类型管理</el-menu-item>
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

            <!-- 工单与客服 -->
            <el-sub-menu index="/ticket">
              <template #title>
                <el-icon><Tickets /></el-icon>
                <span>工单管理</span>
              </template>
              <el-menu-item index="/ticket/list">工单列表</el-menu-item>
              <el-menu-item index="/ticket/refund">退款登记</el-menu-item>
            </el-sub-menu>

            <el-menu-item index="/agent">
              <el-icon><Cpu /></el-icon>
              <template #title>AI 协查</template>
            </el-menu-item>

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

    <!-- 新工单提示：顶栏右侧下方，从左往右滑入 -->
    <div class="ticket-toast-stack">
      <transition-group name="ticket-toast-slide">
        <div
          v-for="item in ticketToasts"
          :key="item.id"
          class="ticket-toast"
          :class="'ticket-toast--' + item.kind"
          @click="openTicketFromToast(item)"
        >
          <div class="ticket-toast-title">{{ item.headline }}</div>
          <div class="ticket-toast-body">
            {{ item.sourceLabel }} · {{ item.title || item.ticketNo || ('#' + item.ticketId) }}
          </div>
          <div v-if="item.content" class="ticket-toast-content">{{ item.content }}</div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { clearSession, getToken, getUsername } from '../utils/auth'
import { stopAdminWs, onWs, getWsStatus, retryAdminWs } from '../utils/wsHub'
import { logout as apiLogout } from '../api/user'
import { TICKET_SOURCE_MAP, formatCategory } from '../utils/ticketDict'
import {
  Search, Bell, ArrowDown, DataLine, User, Van, Connection,
  List, Money, Monitor, Setting, Tools, WarningFilled, Tickets, Cpu
} from '@element-plus/icons-vue'

const router = useRouter()

// 用户信息相关
const username = ref(getUsername() || 'admin')
const userAvatar = ref('https://java-cjw11.oss-cn-beijing.aliyuncs.com/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-03-22%20173314.png') // 默认头像，可替换



// 提醒相关
const reminderCount = ref(1) // 示例未读提醒数量，实际从接口获取
const reminderDrawer = ref(false)
const reminders = ref([
  { id: 1, content: '以后使用MQ消息队列开发,目前没有该功能', date: '2026-3-27' }
])

/** WebSocket 连接状态 */
const wsInfo = ref(getWsStatus())
let offWsStatus = null
let wsCountdownTimer = null
const wsRemainSec = ref(0)

const wsStatus = computed(() => wsInfo.value.status || 'idle')
const wsVisible = computed(() => ['connecting', 'reconnecting', 'failed'].includes(wsStatus.value))
const wsShortLabel = computed(() => {
  const s = wsStatus.value
  const n = wsInfo.value.reconnectCount || 0
  const max = wsInfo.value.maxReconnect || 10
  if (s === 'connecting') return '信号不好，连接中'
  if (s === 'reconnecting') {
    return wsRemainSec.value > 0
      ? `信号不好，重连 ${n}/${max} · ${wsRemainSec.value}s`
      : `信号不好，正在重连 ${n}/${max}`
  }
  if (s === 'failed') return '实时连接已中断'
  return ''
})
const wsLabel = computed(() => {
  const s = wsStatus.value
  if (s === 'connecting') return '当前信号不好，正在连接实时通道，点击可立即重试'
  if (s === 'reconnecting') return '当前信号不好，正在重连，点击可立即重试'
  if (s === 'failed') return '实时连接已中断，点击重试'
  return ''
})

function clearWsCountdown() {
  if (wsCountdownTimer) {
    clearInterval(wsCountdownTimer)
    wsCountdownTimer = null
  }
  wsRemainSec.value = 0
}

function startWsCountdown(delayMs) {
  clearWsCountdown()
  if (!delayMs || delayMs <= 0) return
  wsRemainSec.value = Math.ceil(delayMs / 1000)
  wsCountdownTimer = setInterval(() => {
    wsRemainSec.value = Math.max(0, wsRemainSec.value - 1)
    if (wsRemainSec.value <= 0) clearWsCountdown()
  }, 1000)
}

function applyWsStatus(info) {
  wsInfo.value = info || getWsStatus()
  if (wsInfo.value.status === 'reconnecting') {
    startWsCountdown(wsInfo.value.nextRetryDelayMs || 0)
  } else {
    clearWsCountdown()
  }
}

const retryWs = () => {
  retryAdminWs()
}

/** 工单右上角滑入提示（新建 / 撤销） */
const ticketToasts = ref([])
let toastSeq = 0
let offTicketCreated = null
let offTicketCancelled = null
const TOAST_TTL_MS = 8000

const pushTicketToast = (payload, kind = 'created') => {
  if (!payload?.ticketId) return
  const id = ++toastSeq
  const sourceLabel = TICKET_SOURCE_MAP[payload.source] || '用户'
  const categoryLabel = formatCategory(payload.category)
  const headline = kind === 'cancelled' ? '用户已撤销工单' : '新工单待受理'
  const content = kind === 'cancelled'
    ? (payload.content || '请停止处理该工单')
    : (payload.content || '')
  ticketToasts.value = [
    {
      id,
      kind,
      headline,
      ticketId: payload.ticketId,
      ticketNo: payload.ticketNo,
      title: payload.title || categoryLabel,
      content: String(content).slice(0, 60),
      sourceLabel
    },
    ...ticketToasts.value
  ].slice(0, 4)
  setTimeout(() => {
    ticketToasts.value = ticketToasts.value.filter((t) => t.id !== id)
  }, TOAST_TTL_MS)
}

const openTicketFromToast = (item) => {
  ticketToasts.value = ticketToasts.value.filter((t) => t.id !== item.id)
  router.push({ path: '/ticket/list', query: { ticketId: item.ticketId } })
}

// 当前激活菜单 (根据路由高亮)
const activeMenu = computed(() => {
  return router.currentRoute.value.path
})

// 退出登录：先调后端作废 Redis token，再清本地
const logout = async () => {
  try {
    await apiLogout()
  } catch (e) {
    // 即便接口失败也清本地，避免卡在已坏会话
  }
  stopAdminWs()
  clearSession()
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
  applyWsStatus(getWsStatus())
  offWsStatus = onWs('status', applyWsStatus)
  offTicketCreated = onWs('ticketCreated', (p) => pushTicketToast(p, 'created'))
  offTicketCancelled = onWs('ticketCancelled', (p) => pushTicketToast(p, 'cancelled'))
})

onUnmounted(() => {
  if (offWsStatus) offWsStatus()
  if (offTicketCreated) offTicketCreated()
  if (offTicketCancelled) offTicketCancelled()
  offWsStatus = null
  offTicketCreated = null
  offTicketCancelled = null
  clearWsCountdown()
})
</script>

<style scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
  background: var(--xj-bg-page, #f0f2f6);
}

.layout-container {
  height: 100%;
}

.layout-header {
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  box-shadow: 0 1px 0 var(--xj-border, #e8ecf0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: var(--xj-header-height, 64px);
  z-index: 10;
}

.header-left .logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-img {
  height: 40px;
  width: auto;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--xj-primary, #1890ff);
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
  color: var(--xj-primary, #1890ff);
}

.ws-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 14px;
  border-radius: 17px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
}

.ws-chip--connecting,
.ws-chip--reconnecting {
  background: #fff7e6;
  border-color: #ffd591;
  color: #d46b08;
}

.ws-chip--failed {
  background: #fff1f0;
  border-color: #ffa39e;
  color: #cf1322;
}

.ws-chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.ws-chip--connecting .ws-chip-dot,
.ws-chip--reconnecting .ws-chip-dot {
  animation: ws-chip-pulse 1.2s ease-in-out infinite;
}

.ws-chip-text {
  font-weight: 600;
  letter-spacing: 0.2px;
}

@keyframes ws-chip-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 20px;
  transition: background 0.2s;
  border: 1px solid transparent;
}

.user-info:hover {
  background-color: var(--xj-primary-soft, #e6f7ff);
  border-color: #91d5ff;
}

.username {
  font-size: 14px;
  color: var(--xj-text, #303133);
  font-weight: 500;
}

.layout-aside {
  background-color: var(--xj-bg-aside, #ffffff);
  border-right: 1px solid var(--xj-border, #eaeef2);
  overflow-y: auto;
}

.el-menu-vertical {
  border-right: none;
  height: 100%;
  padding: 8px 0;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 100%;
}

.el-menu-vertical :deep(.el-menu-item.is-active) {
  background: var(--xj-primary-soft, #e6f7ff) !important;
  border-right: 3px solid var(--xj-primary, #1890ff);
  font-weight: 600;
}

.el-menu-vertical :deep(.el-menu-item:hover),
.el-menu-vertical :deep(.el-sub-menu__title:hover) {
  background: #f7f9fc !important;
}

.layout-main {
  background-color: var(--xj-bg-page, #f0f2f6);
  padding: 16px 20px;
  overflow-y: auto;
  height: calc(100vh - var(--xj-header-height, 64px));
}

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

.ticket-toast-stack {
  position: fixed;
  top: calc(var(--xj-header-height, 64px) + 12px);
  right: 24px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-width: 360px;
}

.ticket-toast {
  pointer-events: auto;
  cursor: pointer;
  background: #fff;
  border: 1px solid #91d5ff;
  border-left: 4px solid var(--xj-primary, #1890ff);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.15);
  padding: 12px 14px;
  min-width: 280px;
}

.ticket-toast--created:hover {
  background: #f0f9ff;
}

.ticket-toast--cancelled {
  border-color: #ffd591;
  border-left-color: #fa8c16;
  box-shadow: 0 8px 24px rgba(250, 140, 22, 0.18);
}

.ticket-toast--cancelled:hover {
  background: #fff7e6;
}

.ticket-toast--cancelled .ticket-toast-title {
  color: #d46b08;
}

.ticket-toast-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--xj-primary, #1890ff);
  margin-bottom: 4px;
}

.ticket-toast-body {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.ticket-toast-content {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 从左往右滑入 */
.ticket-toast-slide-enter-active,
.ticket-toast-slide-leave-active {
  transition: all 0.35s ease;
}

.ticket-toast-slide-enter-from {
  opacity: 0;
  transform: translateX(-48px);
}

.ticket-toast-slide-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
