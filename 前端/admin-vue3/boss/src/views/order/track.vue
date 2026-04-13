<template>
  <div class="order-track-page">
    <!-- 订单选择栏 -->
    <el-card class="select-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="选择订单">
          <el-select
            v-model="selectedOrderId"
            placeholder="请选择订单"
            filterable
            clearable
            style="width: 400px"
            @change="handleOrderChange"
            :loading="orderLoading"
          >
            <el-option
              v-for="order in orderList"
              :key="order.id"
              :label="`订单 ${order.id} - ${order.departure} → ${order.destination}`"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!orderIdFromUrl">
          <el-button type="primary" @click="loadOrderBySelect">查看轨迹</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 地图组件 -->
    <div class="map-wrapper">
      <BMap ref="mapRef" />
    </div>

    <!-- 订单信息卡片 -->
    <el-card v-if="currentOrder" class="info-card" shadow="hover">
      <div class="order-info">
        <h3>订单信息</h3>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单ID">{{ currentOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getOrderStatusText(currentOrder.orderStatus) }}</el-descriptions-item>
          <el-descriptions-item label="出发地">{{ currentOrder.departure }}</el-descriptions-item>
          <el-descriptions-item label="目的地">{{ currentOrder.destination }}</el-descriptions-item>
          <el-descriptions-item label="司机">{{ currentOrder.driverName || currentOrder.driverId }}</el-descriptions-item>
          <el-descriptions-item label="车牌号">{{ currentOrder.vehicleNo }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDateTime(currentOrder.orderTime) }}</el-descriptions-item>
          <el-descriptions-item label="金额">{{ currentOrder.price?.toFixed(2) }}元</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderList } from '@/api/order'
import BMap from '@/components/BMap.vue'

const route = useRoute()
const router = useRouter()

const orderList = ref([])
const selectedOrderId = ref(null)
const currentOrder = ref(null)
const orderLoading = ref(false)
const orderIdFromUrl = ref(null)
const mapRef = ref(null)

const orderStatusMap = {
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

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

// 获取订单列表
const fetchOrderList = async () => {
  orderLoading.value = true
  try {
    const res = await getOrderList({ page: 1, limit: 1000 })
    if (res.code === 1 && res.data) {
      orderList.value = res.data.items || []
    } else {
      ElMessage.error(res.message || '获取订单列表失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    orderLoading.value = false
  }
}

const getOrderById = (id) => orderList.value.find(order => order.id === parseInt(id))
// 根据订单ID加载订单轨迹
const loadOrderTrack = async (orderId) => {
  const order = getOrderById(orderId)
  
  if (!order) {
    ElMessage.warning('未找到该订单，请重新选择')
    return
  }
  currentOrder.value = order
  if (mapRef.value) {
    await mapRef.value.drawOrderTrack(order)    // 绘制订单轨迹
  }
}

// 订单选择框选择订单
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
// 从URL中加载订单
const loadFromUrl = () => {
  const orderId = route.query.orderId
  if (orderId) {
    orderIdFromUrl.value = orderId
    selectedOrderId.value = parseInt(orderId)
    if (orderList.value.length) {
      loadOrderTrack(orderId)
    } else {
      const unwatch = watch(orderList, (newVal) => {
        if (newVal.length) {
          loadOrderTrack(orderId)
          unwatch()
        }
      })
    }
  }
}

onMounted(async () => {
  await fetchOrderList()
  loadFromUrl()
})
</script>

<style scoped>
.order-track-page {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.select-card {
  flex-shrink: 0;
}
.map-wrapper {
  flex: 1;
  min-height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.info-card {
  flex-shrink: 0;
}
.order-info h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 500;
}
</style>