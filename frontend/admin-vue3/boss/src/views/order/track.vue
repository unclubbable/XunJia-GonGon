<template>
  <div class="order-track-page">
    <!-- 查询与轨迹选项 -->
    <el-card class="select-card" shadow="never">
      <el-form :inline="true" class="toolbar-form">
        <el-form-item label="选择订单">
          <el-select
            v-model="selectedOrderId"
            placeholder="请选择订单"
            filterable
            clearable
            style="width: 520px"
            :loading="orderLoading"
            @change="handleOrderChange"
          >
            <el-option
              v-for="order in orderList"
              :key="order.id"
              :label="formatOrderLabel(order)"
              :value="order.id"
            >
              <div class="order-option">
                <span class="order-option-main">{{ formatOrderLabel(order) }}</span>
                <el-tag :type="getStatusType(order.orderStatus)" size="small" class="order-option-status">
                  {{ getOrderStatusText(order.orderStatus) }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="轨迹模式">
          <el-radio-group v-model="simplifyType" @change="reloadCurrentTrack">
            <el-radio :label="1">全量点</el-radio>
            <el-radio :label="2">距离抽稀</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="simplifyType === 2" label="抽稀距离">
          <el-input-number
            v-model="distanceMeters"
            :min="5"
            :max="500"
            :step="5"
            @change="reloadCurrentTrack"
          />
          <span class="unit-text">米</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="trackLoading" @click="loadOrderBySelect">查看轨迹</el-button>
          <el-button @click="handleResetMap">重置地图</el-button>
        </el-form-item>
      </el-form>
      <div v-if="trackSummary" class="track-summary">
        <el-tag type="info">原始点 {{ trackSummary.rawPointCount ?? 0 }}</el-tag>
        <el-tag type="success">展示点 {{ trackSummary.pointCount ?? 0 }}</el-tag>
        <el-tag v-if="trackSummary.driveMile != null">里程 {{ (trackSummary.driveMile / 1000).toFixed(2) }} km</el-tag>
        <el-tag v-if="trackSummary.driveTime != null">时长 {{ trackSummary.driveTime }} 分钟</el-tag>
        <span class="legend">
          <i class="line actual"></i>实际上报轨迹
          <i class="line planned"></i>预计起终点
          <i class="dot waypoint"></i>关键节点
        </span>
      </div>
    </el-card>

    <!-- 地图：默认 3D，左上可切 2D/俯仰/旋转/跟随；左下为比例尺 -->
    <div class="map-wrapper" v-loading="trackLoading">
      <BMap ref="mapRef" :initial-view-mode="'3D'" :initial-pitch="48" />
    </div>

    <!-- 订单信息 -->
    <el-card v-if="displayOrder" class="info-card" shadow="hover">
      <div class="order-info">
        <h3>订单信息</h3>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单ID">{{ displayOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getOrderStatusText(displayOrder.orderStatus) }}</el-descriptions-item>
          <el-descriptions-item label="出发地">{{ displayTrip.departure || '-' }}</el-descriptions-item>
          <el-descriptions-item label="目的地">{{ displayTrip.destination || '-' }}</el-descriptions-item>
          <el-descriptions-item label="司机手机">{{ displayOrder.driverPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="车牌号">{{ displayOrder.vehicleNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="上车时间">{{ formatDateTime(displayTrip.pickUpPassengerTime) }}</el-descriptions-item>
          <el-descriptions-item label="下车时间">{{ formatDateTime(displayTrip.passengerGetoffTime) }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDateTime(displayOrder.orderTime) }}</el-descriptions-item>
          <el-descriptions-item label="金额">{{ displayOrder.price != null ? `${displayOrder.price.toFixed(2)} 元` : '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderList, getOrderDetailNested } from '@/api/order'
import { getCar } from '@/api/car'
import { trsearch } from '@/api/map'
import BMap from '@/components/BMap.vue'

const route = useRoute()
const router = useRouter()

const orderList = ref([])
const selectedOrderId = ref(null)
const displayOrder = ref(null)
const displayTrip = ref({})
const orderLoading = ref(false)
const trackLoading = ref(false)
const mapRef = ref(null)

/** 1=全量，2=距离抽稀（管理端画线默认抽稀） */
const simplifyType = ref(2)
const distanceMeters = ref(20)
const trackSummary = ref(null)

const orderStatusMap = {
  0: '无效订单',
  1: '订单开始',
  2: '司机接单',
  3: '去接乘客',
  4: '司机到达乘客起点',
  5: '乘客上车，开始行程',
  6: '到达目的地，未支付',
  7: '发起收款',
  8: '支付完成',
  9: '订单取消'
}

const getOrderStatusText = (status) => orderStatusMap[status] || '未知'

const getStatusType = (status) => {
  if (status === 8) return 'success'
  if (status === 9) return 'danger'
  if (status >= 5 && status <= 7) return 'warning'
  return 'info'
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const formatOrderLabel = (order) => {
  const dep = order.departure || '未知出发地'
  const dest = order.destination || '未知目的地'
  return `订单 ${order.id} - ${dep} → ${dest}`
}

/** 后端 LocalDateTime / Date 字符串 → 毫秒时间戳（按东八区解析） */
const toEpochMs = (dateStr) => {
  if (!dateStr) return null
  const normalized = String(dateStr).trim().replace(' ', 'T')
  const withZone = normalized.includes('+') ? normalized : `${normalized}+08:00`
  const ts = Date.parse(withZone)
  return Number.isNaN(ts) ? null : ts
}

const fetchOrderList = async () => {
  orderLoading.value = true
  try {
    const res = await getOrderList({ page: 1, limit: 1000 })
    orderList.value = res.data?.items || []
  } catch (error) {
    console.error(error)
  } finally {
    orderLoading.value = false
  }
}

/** 订单状态：9 = 已取消 */
const ORDER_STATUS_CANCEL = 9

/** 从高德拉取上车～下车时段的实际轨迹点 */
const fetchTrackPoints = async (order, trip) => {
  // 取消订单：不查上报轨迹，仅由地图绘制关键节点
  if (Number(order?.orderStatus) === ORDER_STATUS_CANCEL) {
    return { points: [], meta: null, message: '乘客未上车，订单取消' }
  }
  if (!order?.carId) {
    return { points: [], meta: null, message: '订单未绑定车辆，无法查询上报轨迹' }
  }
  if (!trip?.pickUpPassengerTime) {
    return { points: [], meta: null, message: '乘客尚未上车，暂无行程轨迹' }
  }

  const starttime = toEpochMs(trip.pickUpPassengerTime)
  let endtime = toEpochMs(trip.passengerGetoffTime)
  if (!endtime) {
    endtime = Date.now()
  }
  if (!starttime || endtime <= starttime) {
    return { points: [], meta: null, message: '上车/下车时间无效，无法查询轨迹' }
  }

  try {
    const carRes = await getCar(order.carId)
    const tid = carRes.data?.tid
    if (!tid) {
      return { points: [], meta: null, message: '车辆未绑定高德终端 tid' }
    }

    const params = {
      tid,
      starttime,
      endtime,
      simplifyType: simplifyType.value,
      needPoints: true
    }
    if (simplifyType.value === 2) {
      params.distanceMeters = distanceMeters.value
    }

    const trRes = await trsearch(params)
    return {
      points: trRes.data?.points || [],
      meta: trRes.data || null,
      message: ''
    }
  } catch (error) {
    console.error(error)
    return { points: [], meta: null, message: '轨迹查询失败，已展示关键节点' }
  }
}

const loadOrderTrack = async (orderId) => {
  if (!orderId) return
  trackLoading.value = true
  trackSummary.value = null
  try {
    const res = await getOrderDetailNested(orderId)
    const nested = res.data || {}
    const order = nested.order || {}
    const trip = nested.trip || {}

    displayOrder.value = order
    displayTrip.value = trip

    const { points, meta, message } = await fetchTrackPoints(order, trip)
    trackSummary.value = meta

    const isCancelled = Number(order.orderStatus) === ORDER_STATUS_CANCEL
    if (message) {
      // 取消单用 info，避免当成异常告警
      if (isCancelled) {
        ElMessage.info(message)
      } else {
        ElMessage.warning(message)
      }
    }

    if (mapRef.value) {
      await mapRef.value.drawOrderTrack({
        order,
        trip,
        trackPoints: isCancelled ? [] : points,
        trackMeta: meta || {},
        silentNoTrack: isCancelled
      })
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('加载订单轨迹失败')
  } finally {
    trackLoading.value = false
  }
}

const handleOrderChange = (orderId) => {
  if (!orderId) return
  router.replace({ query: { orderId } })
  loadOrderTrack(orderId)
}

const loadOrderBySelect = () => {
  if (!selectedOrderId.value) {
    ElMessage.warning('请先选择订单')
    return
  }
  handleOrderChange(selectedOrderId.value)
}

const reloadCurrentTrack = () => {
  if (selectedOrderId.value) {
    loadOrderTrack(selectedOrderId.value)
  }
}

const handleResetMap = () => {
  mapRef.value?.resetMap()
  trackSummary.value = null
}

const loadFromUrl = async () => {
  const orderId = route.query.orderId
  if (!orderId) return
  selectedOrderId.value = parseInt(orderId, 10)
  await loadOrderTrack(selectedOrderId.value)
}

onMounted(async () => {
  await fetchOrderList()
  await loadFromUrl()
})
</script>

<style scoped>
.order-track-page {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.select-card {
  flex-shrink: 0;
}

.toolbar-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.unit-text {
  margin-left: 6px;
  color: #909399;
  font-size: 13px;
}

.track-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.legend {
  margin-left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #606266;
  font-size: 13px;
}

.legend .line {
  display: inline-block;
  width: 24px;
  height: 0;
  border-top: 3px solid;
  margin-right: 4px;
  vertical-align: middle;
}

.legend .line.actual {
  border-color: #1677ff;
}

.legend .line.planned {
  border-color: #faad14;
  border-top-style: dashed;
}

.legend .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
}

.legend .dot.waypoint {
  background: #1890ff;
}

.map-wrapper {
  flex: 1;
  min-height: 520px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.info-card {
  flex-shrink: 0;
}

.order-info h3 {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 500;
}

.order-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.order-option-main {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-option-status {
  flex-shrink: 0;
}
</style>
