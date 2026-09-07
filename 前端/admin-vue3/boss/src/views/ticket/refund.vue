<template>
  <div class="refund-manager">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部" style="width: 140px">
            <el-option
              v-for="(label, key) in REFUND_STATUS_MAP"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="订单ID">
          <el-input v-model="searchForm.orderId" clearable placeholder="可选" style="width: 140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="refundNo" label="退款单号" min-width="150" />
        <el-table-column prop="ticketId" label="工单ID" width="90" align="center" />
        <el-table-column prop="orderId" label="订单ID" width="90" align="center" />
        <el-table-column prop="passengerPhone" label="乘客手机" width="130" />
        <el-table-column prop="orderPrice" label="订单金额" width="100" align="right">
          <template #default="{ row }">{{ formatMoney(row.orderPrice) }}</template>
        </el-table-column>
        <el-table-column prop="refundAmount" label="退款金额" width="100" align="right">
          <template #default="{ row }">
            <span class="amount">{{ formatMoney(row.refundAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="渠道" width="110" align="center">
          <template #default="{ row }">
            {{ REFUND_CHANNEL_MAP[row.refundChannel] || row.refundChannel || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="refundTag(row.status)">
              {{ REFUND_STATUS_MAP[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reasonText" label="原因" min-width="140" show-overflow-tooltip />
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.gmtCreate) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button
              v-if="canExecute(row)"
              link
              type="success"
              @click="openExecute(row, 'MANUAL')"
            >手动退</el-button>
            <el-tooltip
              v-if="canExecute(row)"
              :disabled="!!row.payOrderId"
              content="该退款单无支付宝交易号，无法原路退，请用手动退"
              placement="top"
            >
              <span style="margin-left: 12px">
                <el-button
                  link
                  type="warning"
                  :disabled="!row.payOrderId"
                  @click="openExecute(row, 'ALIPAY')"
                >支付宝退</el-button>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="退款单详情" width="600px">
      <el-descriptions v-if="current" :column="1" border>
        <el-descriptions-item label="退款单号">{{ current.refundNo }}</el-descriptions-item>
        <el-descriptions-item label="工单ID">{{ current.ticketId }}</el-descriptions-item>
        <el-descriptions-item label="订单ID">{{ current.orderId }}</el-descriptions-item>
        <el-descriptions-item label="支付单号">{{ current.payOrderId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">{{ formatMoney(current.orderPrice) }}</el-descriptions-item>
        <el-descriptions-item label="退款金额">{{ formatMoney(current.refundAmount) }}</el-descriptions-item>
        <el-descriptions-item label="渠道">
          {{ REFUND_CHANNEL_MAP[current.refundChannel] || current.refundChannel || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">{{ REFUND_STATUS_MAP[current.status] || current.status }}</el-descriptions-item>
        <el-descriptions-item label="凭证号">{{ current.voucherNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付宝流水">{{ current.alipayRefundNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="司机账已回退">{{ current.driverSettled === 1 ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="原因说明">{{ current.reasonText || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ current.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="退款完成时间">{{ formatDateTime(current.refundedAt) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ current.operatorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(current.gmtCreate) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="current && canReject(current)"
          type="danger"
          plain
          :loading="actionLoading"
          @click="handleReject"
        >驳回登记</el-button>
        <el-button
          v-if="current && canExecute(current)"
          type="success"
          :loading="actionLoading"
          @click="openExecute(current, 'MANUAL')"
        >手动确认退款</el-button>
        <el-tooltip
          v-if="current && canExecute(current)"
          :disabled="!!current.payOrderId"
          content="该退款单无支付宝交易号，无法原路退，请用手动退"
          placement="top"
        >
          <span style="margin-left: 12px">
            <el-button
              type="warning"
              :loading="actionLoading"
              :disabled="!current.payOrderId"
              @click="openExecute(current, 'ALIPAY')"
            >支付宝退款</el-button>
          </span>
        </el-tooltip>
        <el-button
          v-if="current?.ticketId"
          type="primary"
          @click="goTicket(current.ticketId)"
        >查看工单</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="executeVisible"
      :title="executeChannel === 'ALIPAY' ? '支付宝原路退款' : '手动确认退款'"
      width="480px"
    >
      <el-form label-width="100px">
        <el-form-item label="退款单号">{{ executeRow?.refundNo }}</el-form-item>
        <el-form-item label="退款金额">
          <span class="amount">{{ formatMoney(executeRow?.refundAmount) }}</span>
        </el-form-item>
        <el-form-item v-if="executeChannel === 'MANUAL'" label="凭证号">
          <el-input v-model="voucherNo" maxlength="64" placeholder="线下转账流水/后台单号等" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="executeRemark" type="textarea" :rows="2" maxlength="200" />
        </el-form-item>
        <el-alert
          v-if="executeChannel === 'ALIPAY'"
          type="warning"
          :closable="false"
          show-icon
          title="将调用支付宝退款接口（沙箱），成功后自动回退司机当月收入。"
        />
        <el-alert
          v-else
          type="info"
          :closable="false"
          show-icon
          title="请确认线下已完成退款。确认后订单退款状态更新，并回退司机当月收入。"
        />
      </el-form>
      <template #footer>
        <el-button @click="executeVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="submitExecute">确认执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getRefundList,
  getRefundDetail,
  executeTicketRefund,
  rejectTicketRefund
} from '@/api/ticket'
import {
  REFUND_STATUS_MAP,
  REFUND_CHANNEL_MAP,
  REFUND_EXECUTABLE_STATUSES,
  REFUND_REJECTABLE_STATUSES
} from '@/utils/ticketDict'

const router = useRouter()
const loading = ref(false)
const actionLoading = ref(false)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailVisible = ref(false)
const current = ref(null)
const executeVisible = ref(false)
const executeRow = ref(null)
const executeChannel = ref('MANUAL')
const voucherNo = ref('')
const executeRemark = ref('')

const searchForm = reactive({
  status: '',
  orderId: ''
})

const operator = () => ({
  operatorId: 1,
  operatorName: '运营'
})

const canExecute = (row) => REFUND_EXECUTABLE_STATUSES.includes(row?.status)
const canReject = (row) => REFUND_REJECTABLE_STATUSES.includes(row?.status)

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getRefundList({
      page: currentPage.value,
      limit: pageSize.value,
      ...(searchForm.status ? { status: searchForm.status } : {}),
      ...(searchForm.orderId ? { orderId: Number(searchForm.orderId) } : {})
    })
    tableData.value = res.data?.items || []
    total.value = res.data?.total || 0
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

const resetSearch = () => {
  searchForm.status = ''
  searchForm.orderId = ''
  handleSearch()
}

const openDetail = async (row) => {
  try {
    const res = await getRefundDetail(row.id)
    current.value = res.data
    detailVisible.value = true
  } catch (e) {
    // ignore
  }
}

const openExecute = (row, channel) => {
  executeRow.value = row
  executeChannel.value = channel
  voucherNo.value = ''
  executeRemark.value = ''
  executeVisible.value = true
}

const submitExecute = async () => {
  if (!executeRow.value) return
  actionLoading.value = true
  try {
    await executeTicketRefund({
      refundId: executeRow.value.id,
      channel: executeChannel.value,
      voucherNo: voucherNo.value || undefined,
      remark: executeRemark.value || undefined,
      ...operator()
    })
    ElMessage.success(executeChannel.value === 'ALIPAY' ? '支付宝退款成功' : '已确认手动退款')
    executeVisible.value = false
    detailVisible.value = false
    await fetchList()
  } catch (e) {
    // request 已提示
  } finally {
    actionLoading.value = false
  }
}

const handleReject = async () => {
  if (!current.value) return
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回退款登记', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '原因不能为空'
    })
    actionLoading.value = true
    await rejectTicketRefund({
      refundId: current.value.id,
      reason: value,
      ...operator()
    })
    ElMessage.success('已驳回')
    detailVisible.value = false
    await fetchList()
  } catch (e) {
    if (e !== 'cancel') {
      // ignore
    }
  } finally {
    actionLoading.value = false
  }
}

const goTicket = (ticketId) => {
  detailVisible.value = false
  router.push({ path: '/ticket/list', query: { ticketId: String(ticketId) } })
}

const refundTag = (status) => {
  if (status === 'REFUNDED') return 'success'
  if (status === 'REJECTED' || status === 'FAILED') return 'danger'
  if (status === 'PENDING' || status === 'APPROVED' || status === 'REFUNDING') return 'warning'
  return 'info'
}

const formatMoney = (v) => {
  if (v == null || v === '') return '-'
  return `¥${Number(v).toFixed(2)}`
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
}

onMounted(fetchList)
</script>

<style scoped>
.refund-manager {
  padding: 0;
}
.search-card {
  margin-bottom: 20px;
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.amount {
  color: #f56c6c;
  font-weight: 600;
}
</style>
