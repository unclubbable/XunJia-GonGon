<template>
  <div class="online-driver-map">
    <!-- 顶部控制栏 -->
    <div class="map-controls">
      <div class="search-area">
        <el-input
          v-model="searchPlate"
          placeholder="输入车牌号定位车辆"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch" />
          </template>
        </el-input>
        <el-button type="primary" :icon="Refresh" @click="refreshPositions">刷新位置</el-button>
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          inactive-text="手动"
          @change="toggleAutoRefresh"
        />
        <span v-if="autoRefresh" class="refresh-tip">每30秒自动刷新</span>
      </div>
      <div class="stats">
        <el-tag type="success">在线车辆：{{ vehicleCount }}</el-tag>
        <el-tag type="info">总车辆：{{ vehicleList.length }}</el-tag>
      </div>
    </div>

    <!-- 地图组件 -->
    <BMap ref="mapComponentRef" style="height: calc(100vh - 140px)" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import BMap from '../../components/BMap.vue'  
import { getTerminalList, getTerminalByVehicleNo } from '@/api/user'

// 地图组件引用
const mapComponentRef = ref(null)

// 数据
const vehicleList = ref([])        // 原始车辆位置数据
const searchPlate = ref('')
const autoRefresh = ref(false)
let refreshTimer = null

// 有位置数据的车辆数
const vehicleCount = computed(() => {
  return vehicleList.value.filter(v => v.location && v.location.longitude && v.location.latitude).length
})

// 获取车辆位置数据
const fetchVehiclePositions = async () => {
  try {
    const res = await getTerminalList()
    if (res.code === 1 && res.data) {
      vehicleList.value = res.data
      // 绘制到地图
      if (mapComponentRef.value) {
        mapComponentRef.value.drawVehiclePositions(vehicleList.value)
      }
    } else {
      ElMessage.error(res.message || '获取车辆位置失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  }
}

// 刷新位置（手动）
const refreshPositions = () => {
  fetchVehiclePositions()
}

// 搜索车辆
const handleSearch = async () => {
  if (!searchPlate.value.trim()) {
    ElMessage.warning('请输入车牌号')
    return
  }
  if (mapComponentRef.value) {
    // 从已有车辆列表中查找，若找不到则调用接口
    await mapComponentRef.value.searchVehicleByPlate(searchPlate.value, vehicleList.value)
  }
}

// 自动刷新控制
const toggleAutoRefresh = (val) => {
  if (val) {
    if (refreshTimer) clearInterval(refreshTimer)
    refreshTimer = setInterval(() => {
      fetchVehiclePositions()
    }, 30000) // 30秒
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
}

// 生命周期
onMounted(() => {
  fetchVehiclePositions()
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.online-driver-map {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.map-controls {
  background-color: #fff;
  padding: 12px 20px;
  margin-bottom: 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.search-area {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.refresh-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.stats {
  display: flex;
  gap: 12px;
}
</style>