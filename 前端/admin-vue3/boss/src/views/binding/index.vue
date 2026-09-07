<template>
  <div class="binding-manager">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon binding-icon">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">当前绑定数</div>
              <div class="stat-number">{{ bindingCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon driver-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">已绑定司机</div>
              <div class="stat-number">{{ boundDriverCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon car-icon">
              <el-icon><Van /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">已绑定车辆</div>
              <div class="stat-number">{{ boundCarCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon history-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">历史绑定记录</div>
              <div class="stat-number">{{ historyCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 绑定操作区 -->
    <el-card class="binding-card" shadow="never">
      <div class="binding-operation">
        <span class="operation-title">新增绑定</span>
        <div class="operation-form">
          <el-select
            v-model="selectedDriverId"
            placeholder="请选择司机"
            filterable
            clearable
            style="width: 280px"
            :loading="driverLoading"
          >
            <el-option
              v-for="driver in availableDriverList"
              :key="driver.id"
              :label="`${driver.driverName} (${driver.driverPhone})`"
              :value="driver.id"
            />
          </el-select>
          <el-select
            v-model="selectedCarId"
            placeholder="请选择车辆"
            filterable
            clearable
            style="width: 280px"
            :loading="carLoading"
          >
            <el-option
              v-for="car in availableCarList"
              :key="car.id"
              :label="`${car.vehicleNo} (${car.brand} ${car.model})`"
              :value="car.id"
            />
          </el-select>
          <el-button type="primary" :icon="Plus" @click="handleBind" :loading="bindingLoading">绑定</el-button>
        </div>
      </div>
    </el-card>

    <!-- 列表切换选项卡 -->
    <el-card class="list-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="当前绑定关系" name="active">
          <el-table :data="activeBindingList" v-loading="loading" border stripe style="width: 100%">
            <el-table-column prop="driverName" label="司机姓名" min-width="120" />
            <el-table-column prop="driverPhone" label="司机手机号" width="130" />
            <el-table-column prop="vehicleNo" label="车牌号" width="120" />
            <el-table-column prop="carModel" label="车辆型号" min-width="150">
              <template #default="{ row }">
                {{ row.brand }} {{ row.model }}
              </template>
            </el-table-column>
            <el-table-column prop="bindingTime" label="绑定时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.bindingTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleUnbind(row)">解绑</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper" v-if="activeBindingList.length > 0">
            <el-pagination
              v-model:current-page="activePage"
              v-model:page-size="activePageSize"
              :page-sizes="[10, 20, 50]"
              :total="activeTotal"
              layout="total, sizes, prev, pager, next"
              @size-change="handleActiveSizeChange"
              @current-change="handleActiveCurrentChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="历史解绑记录" name="history">
          <el-table :data="historyBindingList" v-loading="loading" border stripe style="width: 100%">
            <el-table-column prop="driverName" label="司机姓名" min-width="120" />
            <el-table-column prop="driverPhone" label="司机手机号" width="130" />
            <el-table-column prop="vehicleNo" label="车牌号" width="120" />
            <el-table-column prop="carModel" label="车辆型号" min-width="150">
              <template #default="{ row }">
                {{ row.brand }} {{ row.model }}
              </template>
            </el-table-column>
            <el-table-column prop="bindingTime" label="绑定时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.bindingTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="unBindingTime" label="解绑时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.unBindingTime) }}
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper" v-if="historyBindingList.length > 0">
            <el-pagination
              v-model:current-page="historyPage"
              v-model:page-size="historyPageSize"
              :page-sizes="[10, 20, 50]"
              :total="historyTotal"
              layout="total, sizes, prev, pager, next"
              @size-change="handleHistorySizeChange"
              @current-change="handleHistoryCurrentChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, User, Van, Clock, Plus } from '@element-plus/icons-vue'
import { getDriverUserList } from '@/api/driverUser'
import { getCarList } from '@/api/car'
import { getBindingList, binding, unbinding } from '@/api/binding'

// ---------- 数据定义 ----------
const loading = ref(false)
const bindingList = ref([])           // 原始绑定列表（全部）
const driverList = ref([])            // 所有司机（有效）
const carList = ref([])               // 所有车辆（有效）
const driverLoading = ref(false)
const carLoading = ref(false)

// 绑定操作
const selectedDriverId = ref(null)
const selectedCarId = ref(null)
const bindingLoading = ref(false)

// 选项卡
const activeTab = ref('active')

// 分页
const activePage = ref(1)
const activePageSize = ref(10)
const historyPage = ref(1)
const historyPageSize = ref(10)

// 映射：司机ID -> 司机对象，车辆ID -> 车辆对象
const driverMap = ref(new Map())
const carMap = ref(new Map())

// ---------- 计算属性 ----------
// 当前绑定关系（bindState=1）
const activeBindings = computed(() => {
  return bindingList.value.filter(item => item.bindState === 1)
})

// 历史解绑记录（bindState≠1，通常为0）
const historyBindings = computed(() => {
  return bindingList.value.filter(item => item.bindState !== 1)
})

// 已绑定的司机ID集合
const boundDriverIds = computed(() => {
  return new Set(activeBindings.value.map(item => item.driverId))
})

// 已绑定的车辆ID集合
const boundCarIds = computed(() => {
  return new Set(activeBindings.value.map(item => item.carId))
})

// 可绑定的司机列表（未绑定的有效司机）
const availableDriverList = computed(() => {
  return driverList.value.filter(driver => !boundDriverIds.value.has(driver.id))
})

// 可绑定的车辆列表（未绑定的有效车辆）
const availableCarList = computed(() => {
  return carList.value.filter(car => !boundCarIds.value.has(car.id))
})

// 当前绑定列表（分页后）
const activeBindingList = computed(() => {
  const start = (activePage.value - 1) * activePageSize.value
  const end = start + activePageSize.value
  return activeBindings.value.slice(start, end)
})

const activeTotal = computed(() => activeBindings.value.length)

const historyBindingList = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize.value
  const end = start + historyPageSize.value
  return historyBindings.value.slice(start, end)
})

const historyTotal = computed(() => historyBindings.value.length)

// 统计卡片数据
const bindingCount = computed(() => activeBindings.value.length)
const boundDriverCount = computed(() => boundDriverIds.value.size)
const boundCarCount = computed(() => boundCarIds.value.size)
const historyCount = computed(() => historyBindings.value.length)

// ---------- 数据加载 ----------
// 加载司机列表（有效）
const loadDrivers = async () => {
  driverLoading.value = true
  try {
    const res = await getDriverUserList({ page: 1, limit: 1000, state: 0 })
    if (res.code === 1 && res.data) {
      driverList.value = res.data.items || []
      driverMap.value.clear()
      driverList.value.forEach(driver => {
        driverMap.value.set(driver.id, driver)
      })
    } else {
      ElMessage.error(res.message || '获取司机列表失败')
    }
  } catch (error) {
    ElMessage.error('请求司机列表失败')
  } finally {
    driverLoading.value = false
  }
}

// 加载车辆列表（有效）
const loadCars = async () => {
  carLoading.value = true
  try {
    const res = await getCarList({ page: 1, limit: 1000, state: 0 })
    if (res.code === 1 && res.data) {
      carList.value = res.data.items || []
      carMap.value.clear()
      carList.value.forEach(car => {
        carMap.value.set(car.id, car)
      })
    } else {
      ElMessage.error(res.message || '获取车辆列表失败')
    }
  } catch (error) {
    ElMessage.error('请求车辆列表失败')
  } finally {
    carLoading.value = false
  }
}

// 加载绑定列表
const loadBindings = async () => {
  loading.value = true
  try {
    const res = await getBindingList()
    if (res.code === 1 && res.data) {
      const rawList = res.data || []
      // 补充司机和车辆信息
      bindingList.value = rawList.map(item => {
        const driver = driverMap.value.get(item.driverId) || {}
        const car = carMap.value.get(item.carId) || {}
        return {
          ...item,
          driverName: driver.driverName || '未知',
          driverPhone: driver.driverPhone || '',
          brand: car.brand || '',
          model: car.model || '',
          carModel: `${car.brand || ''} ${car.model || ''}`.trim()
        }
      })
    } else {
      ElMessage.error(res.message || '获取绑定列表失败')
    }
  } catch (error) {
    ElMessage.error('请求绑定列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新所有数据（重新加载司机、车辆、绑定列表）
const refreshData = async () => {
  await loadDrivers()
  await loadCars()
  await loadBindings()
}

// ---------- 绑定/解绑操作 ----------
// 绑定
const handleBind = async () => {
  if (!selectedDriverId.value || !selectedCarId.value) {
    ElMessage.warning('请选择司机和车辆')
    return
  }

  // 再次检查司机是否已有绑定
  if (boundDriverIds.value.has(selectedDriverId.value)) {
    ElMessage.error('该司机已绑定其他车辆，无法重复绑定')
    return
  }

  // 再次检查车辆是否已有绑定
  if (boundCarIds.value.has(selectedCarId.value)) {
    ElMessage.error('该车辆已绑定其他司机，无法重复绑定')
    return
  }

  bindingLoading.value = true
  try {
    const res = await binding({
      driverId: selectedDriverId.value,
      carId: selectedCarId.value
    })
    if (res.code === 1) {
      ElMessage.success('绑定成功')
      selectedDriverId.value = null
      selectedCarId.value = null
      await refreshData()
    } else {
      ElMessage.error(res.message || '绑定失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    bindingLoading.value = false
  }
}

// 解绑
const handleUnbind = async (row) => {
  try {
    await ElMessageBox.confirm(`确认解绑司机“${row.driverName}”与车辆“${row.vehicleNo}”的绑定关系吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await unbinding({
      driverId: row.driverId,
      carId: row.carId
    })
    if (res.code === 1) {
      ElMessage.success('解绑成功')
      await refreshData()
    } else {
      ElMessage.error(res.message || '解绑失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('解绑失败')
    }
  }
}

// ---------- 选项卡切换 ----------
const handleTabChange = (tab) => {
  if (tab === 'active') {
    activePage.value = 1
  } else {
    historyPage.value = 1
  }
}

// ---------- 分页处理 ----------
const handleActiveSizeChange = (size) => {
  activePageSize.value = size
  activePage.value = 1
}
const handleActiveCurrentChange = (page) => {
  activePage.value = page
}
const handleHistorySizeChange = (size) => {
  historyPageSize.value = size
  historyPage.value = 1
}
const handleHistoryCurrentChange = (page) => {
  historyPage.value = page
}

// ---------- 辅助函数 ----------
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

// ---------- 生命周期 ----------
onMounted(async () => {
  await loadDrivers()
  await loadCars()
  await loadBindings()
})
</script>

<style scoped>
/* 样式保持不变，与之前相同 */
.binding-manager {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s;
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
.binding-icon {
  background-color: #e1f3e1;
  color: #67c23a;
}
.driver-icon {
  background-color: #ecf5ff;
  color: #409eff;
}
.car-icon {
  background-color: #e6f7ff;
  color: #1890ff;
}
.history-icon {
  background-color: #f4f4f5;
  color: #909399;
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

.binding-card {
  margin-bottom: 20px;
}
.binding-operation {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.operation-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}
.operation-form {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.list-card {
  margin-bottom: 0;
}
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>