<template>
  <div class="order-manager">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="行政区划">
          <el-cascader
            v-model="searchForm.address"
            :options="districtOptions"
            :props="{ value: 'addressCode', label: 'addressName', children: 'children', checkStrictly: true }"
            placeholder="请选择省/市/区"
            clearable
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="乘客/司机手机号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="订单ID" width="80" align="center" />
        <el-table-column prop="passengerPhone" label="乘客手机号" width="130" />
        <el-table-column prop="driverPhone" label="司机手机号" width="130" />
        <el-table-column prop="vehicleNo" label="车牌号" width="120" />
        <el-table-column prop="departure" label="出发地" min-width="180" show-overflow-tooltip />
        <el-table-column prop="destination" label="目的地" min-width="180" show-overflow-tooltip />
        <el-table-column label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.orderStatus)" size="small">
              {{ orderStatusMap[row.orderStatus] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="金额(元)" width="100" align="right">
          <template #default="{ row }">
            {{ row.price?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="orderTime" label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.orderTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
              <el-dropdown trigger="click" @command="(cmd) => handleStatusChange(row, cmd)" v-if="row.orderStatus!=9">
                <el-button link type="primary" size="small">
                  修改状态 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="(label, value) in allowedStatusTransitions(row.orderStatus)"
                      :key="value"
                      :command="parseInt(value)"
                    >
                      {{ label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchOrderList"
          @current-change="fetchOrderList"
        />
      </div>
    </el-card>

    <!-- 订单详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单ID">{{ currentOrder.id }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.orderStatus)" size="small">
            {{ orderStatusMap[currentOrder.orderStatus] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="乘客ID">{{ currentOrder.passengerId }}</el-descriptions-item>
        <el-descriptions-item label="乘客手机号">{{ currentOrder.passengerPhone }}</el-descriptions-item>
        <el-descriptions-item label="司机ID">{{ currentOrder.driverId }}</el-descriptions-item>
        <el-descriptions-item label="司机手机号">{{ currentOrder.driverPhone }}</el-descriptions-item>
        <el-descriptions-item label="车辆ID">{{ currentOrder.carId }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ currentOrder.vehicleNo }}</el-descriptions-item>
        <el-descriptions-item label="发起地行政区划">{{ currentOrder.address }}</el-descriptions-item>
        <el-descriptions-item label="运价类型">{{ currentOrder.fareType }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDateTime(currentOrder.orderTime) }}</el-descriptions-item>
        <el-descriptions-item label="预计用车时间">{{ formatDateTime(currentOrder.departTime) }}</el-descriptions-item>
        <el-descriptions-item label="出发地">{{ currentOrder.departure }}</el-descriptions-item>
        <el-descriptions-item label="目的地">{{ currentOrder.destination }}</el-descriptions-item>
        <el-descriptions-item label="出发地经纬度">{{ currentOrder.depLongitude }}, {{ currentOrder.depLatitude }}</el-descriptions-item>
        <el-descriptions-item label="目的地经纬度">{{ currentOrder.destLongitude }}, {{ currentOrder.destLatitude }}</el-descriptions-item>
        <el-descriptions-item label="接单时间">{{ formatDateTime(currentOrder.receiveOrderTime) }}</el-descriptions-item>
        <el-descriptions-item label="司机到达上车点时间">{{ formatDateTime(currentOrder.driverArrivedDepartureTime) }}</el-descriptions-item>
        <el-descriptions-item label="乘客上车时间">{{ formatDateTime(currentOrder.pickUpPassengerTime) }}</el-descriptions-item>
        <el-descriptions-item label="乘客下车时间">{{ formatDateTime(currentOrder.passengerGetoffTime) }}</el-descriptions-item>
        <el-descriptions-item label="载客里程(米)">{{ currentOrder.driveMile }}</el-descriptions-item>
        <el-descriptions-item label="载客时间(分)">{{ currentOrder.driveTime }}</el-descriptions-item>
        <el-descriptions-item label="金额(元)">{{ currentOrder.price?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="支付订单号">{{ currentOrder.payOrderId }}</el-descriptions-item>
        <el-descriptions-item label="取消时间">{{ formatDateTime(currentOrder.cancelTime) }}</el-descriptions-item>
        <el-descriptions-item label="取消发起者">{{ cancelOperatorMap[currentOrder.cancelOperator] }}</el-descriptions-item>
        <el-descriptions-item label="取消类型">{{ cancelTypeMap[currentOrder.cancelTypeCode] }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentOrder.gmtCreate) }}</el-descriptions-item>
        <el-descriptions-item label="修改时间">{{ formatDateTime(currentOrder.gmtModified) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button type="success" plain @click="goToTrack">订单轨迹</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { getOrderList, updateOrder } from '@/api/order'
import { getDicDistrict } from '@/api/driverUser'
import router from '@/router'

// ---------- 订单状态映射 ----------
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

// 取消相关映射
const cancelOperatorMap = {
  1: '乘客',
  2: '驾驶员',
  3: '平台公司'
}
const cancelTypeMap = {
  1: '乘客提前撤销',
  2: '驾驶员提前撤销',
  3: '平台公司撤销',
  4: '乘客违约撤销',
  5: '驾驶员违约撤销'
}

// 根据订单状态获取标签类型
const getStatusType = (status) => {
  if (status === 8) return 'success'
  if (status === 9) return 'danger'
  if (status >= 5 && status <= 7) return 'warning'
  return 'info'
}

// 允许的状态变更（根据业务规则）
const allowedStatusTransitions = (currentStatus) => {
  
  const transitions = {}
  
  // 如果当前状态不是已取消，都可以改为取消
  if (currentStatus !== 9) {
    transitions[9] = '取消订单'
  }
  
  // 如果当前状态是乘客已上车，可以改为行程结束（未支付）
  if (currentStatus === 5) {
    transitions[6] = '行程结束(未支付)'
  }
  
  // 如果当前状态是未支付或发起收款，可以改为支付完成
  if (currentStatus === 6 || currentStatus === 7) {
    transitions[8] = '支付完成'
  }
  
  // 如果当前状态是司机接单，可改为司机到达上车点
  if (currentStatus === 2) {
    transitions[4] = '司机到达上车点'
  }
  
  // 如果当前状态是司机到达上车点，可改为乘客上车
  if (currentStatus === 4) {
    transitions[5] = '乘客上车'
  }
  
  return transitions
}

// ---------- 搜索表单 ----------
const searchForm = reactive({
  address: [],
  phone: ''
})

// ---------- 表格数据 ----------
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// ---------- 地区字典 ----------
const districtOptions = ref([])

// 获取地区字典并构建树形结构
const fetchDistrict = async () => {
  try {
    const res = await getDicDistrict()
    if (res.code === 1 && res.data) {
      const flatData = res.data
      const map = new Map()
      const roots = []
      flatData.forEach(item => {
        map.set(item.addressCode, { ...item, children: [] })
      })
      flatData.forEach(item => {
        const node = map.get(item.addressCode)
        if (item.parentAddressCode && map.has(item.parentAddressCode)) {
          const parent = map.get(item.parentAddressCode)
          parent.children.push(node)
        } else if (item.parentAddressCode !== '0' && item.level !== 0) {
          roots.push(node)
        }
      })
      districtOptions.value = roots.filter(opt => opt.addressCode !== '100000')
    }
  } catch (error) {
    console.error('获取地区字典失败', error)
  }
}

// ---------- 获取订单列表 ----------
const fetchOrderList = async () => {
  loading.value = true
  try {
    let addressParam = ''
    if (searchForm.address && searchForm.address.length > 0) {
      addressParam = searchForm.address[searchForm.address.length - 1]
    }
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...(addressParam && { address: addressParam }),
      ...(searchForm.phone && { phone: searchForm.phone })
    }
    const res = await getOrderList(params)
    if (res.code === 1 && res.data) {
      tableData.value = res.data.items || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取订单列表失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchOrderList()
}

// 重置
const resetSearch = () => {
  searchForm.address = []
  searchForm.phone = ''
  handleSearch()
}

// ---------- 订单详情 ----------
const detailVisible = ref(false)
const currentOrder = ref({})

const openDetail = (row) => {
  currentOrder.value = { ...row }
  detailVisible.value = true
}

// 跳转到轨迹
const goToTrack = () => {
  detailVisible.value = false;
  router.push({ path: '/order/track', query: { orderId: currentOrder.value.id } })
}

// ---------- 订单状态修改 ----------
const handleStatusChange = async (row, newStatus) => {
  const updatedOrder = { ...row, orderStatus: newStatus }
  if (newStatus === 9) {
    updatedOrder.cancelTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
    updatedOrder.cancelOperator = 3
    updatedOrder.cancelTypeCode = 3
  }
  try {
    await ElMessageBox.confirm(`确认将订单状态改为“${orderStatusMap[newStatus]}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await updateOrder(updatedOrder)
    if (res.code === 1) {
      ElMessage.success('状态更新成功')
      await fetchOrderList()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('更新失败')
    }
  }
}

// ---------- 辅助函数 ----------
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  fetchDistrict()
  fetchOrderList()
})
</script>

<style scoped>
.order-manager {
  padding: 0;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  text-align: right;
}

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.action-buttons .el-button {
  margin: 0;
}
</style>