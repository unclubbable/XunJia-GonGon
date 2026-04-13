<template>
  <div class="online-driver-monitor">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon online-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">当前在线司机</div>
              <div class="stat-number">{{ onlineCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">总司机数</div>
              <div class="stat-number">{{ totalDriverCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon rate-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">在线率</div>
              <div class="stat-number">{{ onlineRate.toFixed(1) }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon city-icon">
              <el-icon><Location /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">覆盖城市</div>
              <div class="stat-number">{{ cityCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <el-card class="action-card" shadow="never">
      <div class="action-bar">
        <div class="left-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索司机姓名/手机号"
            clearable
            style="width: 220px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" :icon="Refresh" @click="refreshData">立即刷新</el-button>
        </div>
        <div class="right-actions">
          <el-switch
            v-model="autoRefresh"
            active-text="自动刷新"
            inactive-text="手动"
            @change="toggleAutoRefresh"
          />
          <span v-if="autoRefresh" class="refresh-tip">每10秒自动刷新</span>
        </div>
      </div>
    </el-card>

    <!-- 在线司机表格 -->
    <el-card shadow="never">
      <el-table :data="filteredOnlineDrivers" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="driverName" label="司机姓名" min-width="120" />
        <el-table-column prop="driverPhone" label="手机号" width="130" />
        <el-table-column prop="adname" label="运营城市" width="120" />
        <el-table-column label="最后在线时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.gmtModified) }}
          </template>
        </el-table-column>
        <el-table-column label="在线时长" width="140">
          <template #default="{ row }">
            {{ formatOnlineDuration(row.gmtModified) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalOrders" label="历史总单数" width="100" align="center" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, User, DataAnalysis, Location, Search, Refresh } from '@element-plus/icons-vue'
import { getWorkStatus } from '@/api/workStatus'
import { getDriverUserList } from '@/api/driverUser'

// 原始数据
const driverList = ref([])        // 全部司机信息
const workStatusList = ref([])    // 工作状态列表
const loading = ref(false)
const searchKeyword = ref('')
const autoRefresh = ref(false)
let refreshTimer = null

// 合并司机信息与工作状态
const combinedData = computed(() => {
  const statusMap = new Map()
  workStatusList.value.forEach(item => {
    statusMap.set(item.driverId, item)
  })
  return driverList.value.map(driver => {
    const status = statusMap.get(driver.id)
    return {
      ...driver,
      workStatus: status?.workStatus ?? 0,
      adname: status?.adname || '未知',
      gmtModified: status?.gmtModified || driver.gmtModified
    }
  })
})

// 在线司机列表
const onlineDrivers = computed(() => {
  return combinedData.value.filter(d => d.workStatus === 1)
})

// 筛选后的在线司机（按关键词）
const filteredOnlineDrivers = computed(() => {
  if (!searchKeyword.value) return onlineDrivers.value
  const keyword = searchKeyword.value.trim().toLowerCase()
  return onlineDrivers.value.filter(d =>
    d.driverName?.toLowerCase().includes(keyword) ||
    d.driverPhone?.includes(keyword)
  )
})

// 统计数据
const onlineCount = computed(() => onlineDrivers.value.length)
const totalDriverCount = computed(() => combinedData.value.length)
const onlineRate = computed(() => totalDriverCount.value ? (onlineCount.value / totalDriverCount.value) * 100 : 0)
const cityCount = computed(() => {
  const cities = new Set(onlineDrivers.value.map(d => d.adname).filter(c => c && c !== '未知'))
  return cities.size
})

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

// 计算在线时长（基于最后修改时间）
const formatOnlineDuration = (dateStr) => {
  if (!dateStr) return '未知'
  const lastTime = new Date(dateStr)
  if (isNaN(lastTime.getTime())) return '未知'
  const now = new Date()
  const diffMs = now - lastTime
  if (diffMs < 0) return '刚上线'
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}天前`
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    // 并发请求司机列表和工作状态
    const [driverRes, statusRes] = await Promise.all([
      getDriverUserList({ page: 1, limit: 1000 }),
      getWorkStatus()
    ])
    if (driverRes.code === 1 && driverRes.data) {
      driverList.value = driverRes.data.items || []
    } else {
      ElMessage.error(driverRes.message || '获取司机列表失败')
    }
    if (statusRes.code === 1 && statusRes.data) {
      workStatusList.value = statusRes.data
    } else {
      ElMessage.error(statusRes.message || '获取工作状态失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据（手动）
const refreshData = () => {
  fetchData()
}

// 搜索
const handleSearch = () => {
  // 搜索依赖计算属性，无需额外逻辑
}

// 自动刷新控制
const toggleAutoRefresh = (val) => {
  if (val) {
    if (refreshTimer) clearInterval(refreshTimer)
    refreshTimer = setInterval(() => {
      fetchData()
    }, 10000) // 10秒
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
}

// 生命周期
onMounted(() => {
  fetchData()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.online-driver-monitor {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.online-icon {
  background-color: #e1f3e1;
  color: #67c23a;
}

.total-icon {
  background-color: #e6f7ff;
  color: #1890ff;
}

.rate-icon {
  background-color: #f4f4f5;
  color: #909399;
}

.city-icon {
  background-color: #fff7e6;
  color: #faad14;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
}

.action-card {
  margin-bottom: 20px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.left-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-tip {
  font-size: 12px;
  color: #909399;
}
</style>