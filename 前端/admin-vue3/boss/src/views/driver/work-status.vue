<template>
  <div class="work-status-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon online-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">在线司机</div>
              <div class="stat-number">{{ onlineCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon offline-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">离线司机</div>
              <div class="stat-number">{{ offlineCount }}</div>
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

    <!-- 图表与表格区域 -->
    <el-row :gutter="20">
      <!-- 图表区域 -->
      <el-col :span="8">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span>司机在线状态占比</span>
          </template>
          <!-- 图表容器 -->
          <div ref="chartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <!-- 表格区域 -->
      <el-col :span="16">
        <el-card shadow="never">
          <!-- 筛选栏 -->
          <div class="filter-bar">
            <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 140px" @change="handleFilter">
              <el-option label="全部状态" value="" />
              <el-option label="在线" :value="1" />
              <el-option label="离线" :value="0" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索司机姓名/手机号"
              clearable
              style="width: 220px"
              @clear="handleFilter"
              @keyup.enter="handleFilter"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" :icon="Refresh" @click="refreshData">刷新</el-button>
          </div>

          <!-- 表格 -->
          <el-table :data="filteredTableData" v-loading="loading" border stripe style="width: 100%">
            <el-table-column prop="driverName" label="司机姓名" min-width="120" />
            <el-table-column prop="driverPhone" label="手机号" width="130" />
            <el-table-column prop="workStatus" label="工作状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="row.workStatus === 1 ? 'success' : 'info'" size="small">
                  {{ row.workStatus === 1 ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="adname" label="运营城市" width="120" />
            <el-table-column prop="gmtModified" label="最后更新时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.gmtModified) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right" align="center">
              <template #default="{ row }">
                <el-select
                  v-model="row.workStatus"
                  size="small"
                  placeholder="修改状态"
                  @change="handleStatusChange(row)"
                  style="width: 100px"
                >
                  <el-option label="在线" :value="1" />
                  <el-option label="离线" :value="0" />
                </el-select>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, User, Location, Search, Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getWorkStatus, changeWorkStatus } from '@/api/workStatus'
import { getDriverUserList } from '@/api/driverUser'


const loading = ref(false)
const workStatusList = ref([])        // 原始工作状态数据
const driverList = ref([])            // 原始司机信息列表

const filterStatus = ref(null)        // 状态筛选
const searchKeyword = ref('')         // 搜索关键词


// 合并后的完整数据（司机信息 + 工作状态）
const mergedData = computed(() => {
  // 构建 driverId 到工作状态的映射
  const statusMap = new Map()
  workStatusList.value.forEach(item => {
    statusMap.set(item.driverId, item)
  })

  // 遍历司机列表，合并工作状态
  return driverList.value.map(driver => {
    const status = statusMap.get(driver.id) || {}
    return {
      ...driver,
      workStatus: status.workStatus !== undefined ? status.workStatus : 0, // 默认离线
      adname: status.adname || '未知',
      gmtModified: status.gmtModified || driver.gmtModified
    }
  })
})

// 筛选后的数据
const filteredTableData = computed(() => {
  let data = mergedData.value
  if (filterStatus.value !== null && filterStatus.value !== '') {
    data = data.filter(item => item.workStatus === filterStatus.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    data = data.filter(item =>
      (item.driverName && item.driverName.includes(keyword)) ||
      (item.driverPhone && item.driverPhone.includes(keyword))
    )
  }
  return data
})

// 统计数值
const onlineCount = computed(() => mergedData.value.filter(item => item.workStatus === 1).length)
const offlineCount = computed(() => mergedData.value.filter(item => item.workStatus === 0).length)
const totalDriverCount = computed(() => mergedData.value.length)
const cityCount = computed(() => {
  const cities = new Set(mergedData.value.map(item => item.adname).filter(c => c && c !== '未知'))
  return cities.size
})

// ---------- 获取数据 ----------
const fetchWorkStatus = async () => {
  try {
    const res = await getWorkStatus()
    if (res.code === 1 && res.data) {
      workStatusList.value = res.data
    } else {
      ElMessage.error(res.message || '获取工作状态失败')
    }
  } catch (error) {
    ElMessage.error('请求工作状态接口失败')
  }
}

const fetchDriverList = async () => {
  try {
    // 获取所有司机（不分页，获取全部，可根据实际情况调整）
    const res = await getDriverUserList({ page: 1, limit: 1000 }) // 假设司机总数不超过1000
    if (res.code === 1 && res.data) {
      driverList.value = res.data.items || []
    } else {
      ElMessage.error(res.message || '获取司机列表失败')
    }
  } catch (error) {
    ElMessage.error('请求司机列表失败')
  }
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([fetchWorkStatus(), fetchDriverList()])
    await nextTick()
    renderChart()
  } catch (error) {
    console.error('加载数据失败', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  loadData()
}

// 筛选变化
const handleFilter = () => {
  // 无需额外操作，依赖 computed 自动更新
}

// 修改工作状态
const handleStatusChange = async (row) => {
  console.log(row);

  try {
    const res = await changeWorkStatus({
      driverId: row.id,
      workStatus: row.workStatus
    })
    if (res.code === 1) {
      ElMessage.success(`已${row.workStatus === 1 ? '上线' : '下线'}司机 ${row.driverName}`)
      // 更新本地工作状态列表中的对应记录
      const statusItem = workStatusList.value.find(s => s.driverId === row.id)
      if (statusItem) {
        statusItem.workStatus = row.workStatus
        statusItem.gmtModified = new Date().toISOString()
      } else {
        // 若原来没有记录，则新增一条
        workStatusList.value.push({
          driverId: row.id,
          workStatus: row.workStatus,
          adname: row.adname,
          gmtModified: new Date().toISOString()
        })
      }
      // 重新渲染图表
      renderChart()
    } else {
      ElMessage.error(res.message || '修改失败')
      // 回滚
      row.workStatus = originalStatus
    }
  } catch (error) {
    ElMessage.error('请求失败')
    row.workStatus = originalStatus
  }
}
// Echart图表
const chartRef = ref(null)
let chartInstance = null
// 渲染饼图
const renderChart = () => {
  if (!chartRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '司机状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: onlineCount.value, name: '在线', itemStyle: { color: '#67c23a' } },
          { value: offlineCount.value, name: '离线', itemStyle: { color: '#909399' } }
        ],
        emphasis: {
          scale: true,
          label: { show: true, formatter: '{b}: {d}%' }
        }
      }
    ]
  }
  chartInstance.setOption(option)
}

// 监听数据变化重新渲染图表
watch([onlineCount, offlineCount], () => {
  renderChart()
})

// 辅助函数====格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.work-status-container {
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
  background-color: #ecf5ff;
  color: #409eff;
}

.online-icon {
  background-color: #e1f3e1;
  color: #67c23a;
}

.offline-icon {
  background-color: #f4f4f5;
  color: #909399;
}

.total-icon {
  background-color: #e6f7ff;
  color: #1890ff;
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

.chart-card {
  height: 100%;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}
</style>