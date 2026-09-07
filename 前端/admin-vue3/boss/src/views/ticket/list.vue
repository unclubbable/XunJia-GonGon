<template>
  <div class="ticket-manager">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="来源">
          <el-select v-model="searchForm.source" clearable placeholder="全部" style="width: 120px">
            <el-option label="乘客" :value="1" />
            <el-option label="司机" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.category" clearable filterable placeholder="全部" style="width: 180px">
            <el-option
              v-for="(label, key) in ALL_CATEGORY_MAP"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部" style="width: 140px">
            <el-option
              v-for="(label, key) in TICKET_STATUS_MAP"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" clearable placeholder="乘客/司机" style="width: 160px" />
        </el-form-item>
        <el-form-item label="订单ID">
          <el-input v-model="searchForm.orderId" clearable placeholder="可选" style="width: 120px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="ticketNo" label="工单号" min-width="150" show-overflow-tooltip />
        <el-table-column label="来源" width="80" align="center">
          <template #default="{ row }">{{ TICKET_SOURCE_MAP[row.source] || '-' }}</template>
        </el-table-column>
        <el-table-column label="类型" min-width="130">
          <template #default="{ row }">{{ formatCategory(row.category) }}</template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="TICKET_STATUS_TAG[row.status] || 'info'" size="small">
              {{ formatTicketStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderId" label="订单ID" width="90" align="center" />
        <el-table-column label="联系人" width="130">
          <template #default="{ row }">
            {{ row.source === 1 ? row.passengerPhone : row.driverPhone }}
          </template>
        </el-table-column>
        <el-table-column prop="assigneeName" label="处理人" width="100" />
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.gmtCreate) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      size="56%"
      destroy-on-close
      class="ticket-drawer"
      @closed="onDrawerClosed"
    >
      <template #header>
        <div v-if="detail?.ticket" class="drawer-header">
          <div class="drawer-header-main">
            <span class="drawer-title">{{ detail.ticket.ticketNo }}</span>
            <el-tag :type="TICKET_STATUS_TAG[detail.ticket.status]" size="small">
              {{ formatTicketStatus(detail.ticket.status) }}
            </el-tag>
            <span class="drawer-sub">
              {{ formatCategory(detail.ticket.category) }} · {{ TICKET_SOURCE_MAP[detail.ticket.source] }}
            </span>
          </div>
          <el-button type="primary" plain :loading="aiLoading" @click="handleAiAssist">
            {{ hasAssistResult ? '重新生成建议' : '生成协查建议' }}
          </el-button>
        </div>
        <div v-else class="drawer-title">工单处理</div>
      </template>

      <div v-loading="detailLoading" class="drawer-body">
        <template v-if="detail?.ticket">
          <div class="drawer-grid">
            <div class="drawer-col">
              <section class="panel">
                <h3 class="panel-title">工单信息</h3>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="订单">
                    <template v-if="detail.ticket.orderId">
                      {{ detail.ticket.orderId }}
                      <el-button link type="primary" @click="goOrderTrack(detail.ticket.orderId)">轨迹</el-button>
                    </template>
                    <span v-else>-</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="联系人">
                    {{ detail.ticket.source === 1 ? detail.ticket.passengerPhone : detail.ticket.driverPhone }}
                  </el-descriptions-item>
                  <el-descriptions-item label="标题" :span="2">{{ detail.ticket.title }}</el-descriptions-item>
                  <el-descriptions-item label="内容" :span="2">{{ detail.ticket.content }}</el-descriptions-item>
                  <el-descriptions-item v-if="detail.ticket.requestPayload" label="申请数据" :span="2">
                    <pre class="payload-pre">{{ prettyPayload(detail.ticket.requestPayload) }}</pre>
                  </el-descriptions-item>
                  <el-descriptions-item v-if="detail.ticket.resultSummary" label="结案说明" :span="2">
                    {{ detail.ticket.resultSummary }}
                  </el-descriptions-item>
                  <el-descriptions-item v-if="detail.ticket.rejectReason" label="驳回原因" :span="2">
                    {{ detail.ticket.rejectReason }}
                  </el-descriptions-item>
                </el-descriptions>
              </section>

              <section class="panel">
                <h3 class="panel-title">沟通记录</h3>
                <el-timeline v-if="detail.messages?.length">
                  <el-timeline-item
                    v-for="msg in detail.messages"
                    :key="msg.id"
                    :timestamp="formatDateTime(msg.gmtCreate)"
                    placement="top"
                  >
                    <div class="msg-item">
                      <el-tag size="small" type="info">{{ senderLabel(msg.senderType) }}</el-tag>
                      <span v-if="msg.senderName" class="msg-name">{{ msg.senderName }}</span>
                      <p>{{ msg.content }}</p>
                    </div>
                  </el-timeline-item>
                </el-timeline>
                <el-empty v-else description="暂无消息" :image-size="56" />
              </section>

              <section v-if="detail.refund" class="panel">
                <h3 class="panel-title">关联退款</h3>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="退款单号">{{ detail.refund.refundNo }}</el-descriptions-item>
                  <el-descriptions-item label="金额">¥{{ detail.refund.refundAmount }}</el-descriptions-item>
                  <el-descriptions-item label="状态">
                    {{ REFUND_STATUS_MAP[detail.refund.status] || detail.refund.status }}
                  </el-descriptions-item>
                </el-descriptions>
              </section>

              <section v-if="canProcess" class="panel panel-actions">
                <h3 class="panel-title">处理操作</h3>
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="4"
                  maxlength="500"
                  show-word-limit
                  placeholder="回复用户内容（可从右侧「填入回复」带入草稿）"
                />
                <div class="action-row">
                  <el-checkbox v-model="waitUser">回复后等待用户补充</el-checkbox>
                </div>
                <div class="action-row buttons">
                  <el-button
                    v-if="detail.ticket.status === 'OPEN'"
                    type="primary"
                    :loading="actionLoading"
                    @click="handleAccept"
                  >受理</el-button>
                  <el-button
                    type="primary"
                    plain
                    :loading="actionLoading"
                    :disabled="!replyContent.trim()"
                    @click="handleReply"
                  >发送回复</el-button>
                  <el-button type="success" :loading="actionLoading" @click="openResolve">结案</el-button>
                  <el-button type="danger" plain :loading="actionLoading" @click="openReject">驳回</el-button>
                  <el-button
                    v-if="EXECUTABLE_DRIVER_CATEGORIES.includes(detail.ticket.category)"
                    type="warning"
                    :loading="actionLoading"
                    @click="handleApproveExecute"
                  >通过并执行</el-button>
                </div>

                <div v-if="detail.ticket.orderId" class="refund-box">
                  <div class="refund-title">登记退款</div>
                  <el-form label-width="80px" size="small">
                    <el-form-item label="退款金额">
                      <el-input-number v-model="refundAmount" :min="0.01" :precision="2" :step="1" />
                    </el-form-item>
                    <el-form-item label="原因说明">
                      <el-input v-model="refundReason" maxlength="200" placeholder="可选" />
                    </el-form-item>
                    <el-button type="danger" :loading="actionLoading" @click="handleCreateRefund">
                      提交退款登记
                    </el-button>
                  </el-form>
                </div>
              </section>
            </div>

            <aside class="drawer-col assist-col">
              <section class="assist-panel">
                <div class="assist-head">
                  <div>
                    <h3 class="panel-title">协查建议</h3>
                    <p class="assist-hint">辅助决策，不会自动结案或退款；正式操作请用左侧按钮。</p>
                  </div>
                  <el-tag v-if="aiSuggestion?.confidence" size="small" effect="plain">
                    置信度 {{ confidenceLabel(aiSuggestion.confidence) }}
                  </el-tag>
                </div>

                <div v-if="aiLoading" class="assist-loading">
                  <el-icon class="is-loading"><Refresh /></el-icon>
                  <span>正在分析工单与协议，约需数十秒…</span>
                </div>

                <template v-else-if="hasAssistResult">
                  <div v-if="detail.ticket.aiSummary" class="assist-block">
                    <div class="assist-label">案情摘要</div>
                    <p class="assist-summary">{{ detail.ticket.aiSummary }}</p>
                  </div>

                  <div v-if="aiSuggestion?.recommended_actions?.length" class="assist-block">
                    <div class="assist-label">建议动作</div>
                    <div class="assist-tags">
                      <el-tag
                        v-for="act in aiSuggestion.recommended_actions"
                        :key="act"
                        size="small"
                        class="ai-tag"
                      >{{ actionLabel(act) }}</el-tag>
                    </div>
                  </div>

                  <div v-if="aiSuggestion?.risk_notes?.length" class="assist-block">
                    <div class="assist-label">风险与待核实</div>
                    <ul class="assist-list">
                      <li v-for="(note, i) in aiSuggestion.risk_notes" :key="i">{{ note }}</li>
                    </ul>
                  </div>

                  <div v-if="aiSuggestion?.reply_draft" class="assist-block">
                    <div class="assist-label-row">
                      <span class="assist-label">回复草稿</span>
                      <el-button v-if="canProcess" link type="primary" @click="fillReplyDraft">
                        填入左侧回复框
                      </el-button>
                    </div>
                    <pre class="assist-draft">{{ aiSuggestion.reply_draft }}</pre>
                  </div>

                  <div v-if="aiSuggestion?.resolve_draft" class="assist-block">
                    <div class="assist-label">结案草稿</div>
                    <p>{{ aiSuggestion.resolve_draft }}</p>
                  </div>
                  <div v-if="aiSuggestion?.reject_draft" class="assist-block">
                    <div class="assist-label">驳回草稿</div>
                    <p>{{ aiSuggestion.reject_draft }}</p>
                  </div>

                  <div v-if="showRefundAdvice" class="assist-block assist-decision">
                    <div class="assist-label">退款建议</div>
                    <el-tag
                      :type="aiSuggestion.refund_advice.suggest_refund ? 'danger' : 'info'"
                      size="small"
                      effect="plain"
                    >
                      {{ aiSuggestion.refund_advice.suggest_refund ? '倾向登记退款（待确认）' : '暂不建议退款' }}
                    </el-tag>
                    <p v-if="aiSuggestion.refund_advice.reason" class="mt-6">
                      {{ aiSuggestion.refund_advice.reason }}
                    </p>
                    <p v-if="aiSuggestion.refund_advice.amount_hint" class="muted">
                      金额提示：{{ aiSuggestion.refund_advice.amount_hint }}
                    </p>
                    <ul v-if="aiSuggestion.refund_advice.evidence_needed?.length" class="assist-list">
                      <li v-for="(e, i) in aiSuggestion.refund_advice.evidence_needed" :key="i">{{ e }}</li>
                    </ul>
                    <p v-if="aiSuggestion.refund_advice.caution" class="assist-caution">
                      {{ aiSuggestion.refund_advice.caution }}
                    </p>
                  </div>

                  <div v-if="showExecuteAdvice" class="assist-block assist-decision">
                    <div class="assist-label">通过并执行建议</div>
                    <el-tag
                      :type="aiSuggestion.execute_advice.suggest_approve ? 'warning' : 'info'"
                      size="small"
                      effect="plain"
                    >
                      {{ aiSuggestion.execute_advice.suggest_approve ? '倾向通过并执行（待确认）' : '暂不建议通过' }}
                    </el-tag>
                    <p v-if="aiSuggestion.execute_advice.reason" class="mt-6">
                      {{ aiSuggestion.execute_advice.reason }}
                    </p>
                    <ul v-if="aiSuggestion.execute_advice.checklist?.length" class="assist-list">
                      <li v-for="(e, i) in aiSuggestion.execute_advice.checklist" :key="i">{{ e }}</li>
                    </ul>
                    <p v-if="aiSuggestion.execute_advice.caution" class="assist-caution">
                      {{ aiSuggestion.execute_advice.caution }}
                    </p>
                  </div>
                </template>

                <div v-else class="assist-empty">
                  <p>还没有协查结果</p>
                  <p class="muted">点右上角生成建议，系统会结合工单与平台协议给出摘要和草稿。</p>
                  <el-button type="primary" :loading="aiLoading" @click="handleAiAssist">
                    生成协查建议
                  </el-button>
                </div>

                <!-- 同工单多轮追问（复用 agent_conversation.thread_id） -->
                <div class="assist-chat">
                  <div class="assist-label-row">
                    <span class="assist-label">协议追问</span>
                    <span v-if="chatThreadId" class="muted thread-id">thread {{ shortThread(chatThreadId) }}</span>
                  </div>
                  <p class="assist-hint chat-hint">基于乘客/司机协议检索回答；不足会拒答。对话归属存在 service-ai 会话表。</p>

                  <div v-if="chatMessages.length" class="chat-list">
                    <div
                      v-for="(m, idx) in chatMessages"
                      :key="idx"
                      class="chat-item"
                      :class="m.role"
                    >
                      <div class="chat-role">{{ m.role === 'user' ? '我' : '助手' }}</div>
                      <pre class="chat-content">{{ m.content }}</pre>
                      <div v-if="m.citations?.length" class="chat-cites">
                        <div v-for="(c, i) in m.citations" :key="i" class="cite">
                          [{{ i + 1 }}] {{ c.source }} / {{ c.section }}
                        </div>
                      </div>
                      <el-tag v-if="m.refused" type="warning" size="small" class="refuse-tag">已拒答</el-tag>
                    </div>
                  </div>

                  <el-input
                    v-model="chatQuestion"
                    type="textarea"
                    :rows="2"
                    maxlength="300"
                    show-word-limit
                    placeholder="例如：投诉绕路后多久反馈？司机信用分怎么扣？"
                    @keydown.enter.ctrl="() => handleChat(false)"
                  />
                  <div class="chat-actions">
                    <el-button
                      type="primary"
                      size="small"
                      :loading="chatLoading"
                      :disabled="!chatQuestion.trim()"
                      @click="handleChat(false)"
                    >发送追问</el-button>
                    <el-button
                      size="small"
                      :loading="chatLoading"
                      :disabled="!chatQuestion.trim()"
                      @click="handleChat(true)"
                    >新开追问会话</el-button>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getTicketList,
  getTicketDetail,
  acceptTicket,
  replyTicket,
  resolveTicket,
  rejectTicket,
  approveExecuteTicket,
  createTicketRefund,
  ticketAiAssist,
  ticketAiChat
} from '@/api/ticket'
import {
  TICKET_STATUS_MAP,
  TICKET_STATUS_TAG,
  TICKET_SOURCE_MAP,
  ALL_CATEGORY_MAP,
  REFUND_STATUS_MAP,
  ACTIVE_TICKET_STATUSES,
  EXECUTABLE_DRIVER_CATEGORIES,
  formatCategory,
  formatTicketStatus
} from '@/utils/ticketDict'

const ACTION_LABELS = {
  ACCEPT: '受理',
  REPLY: '回复',
  RESOLVE: '结案',
  REJECT: '驳回',
  REFUND_CREATE: '登记退款',
  APPROVE_EXECUTE: '通过并执行',
  NEED_MORE_INFO: '补充材料'
}

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const detailLoading = ref(false)
const actionLoading = ref(false)
const aiLoading = ref(false)
const chatLoading = ref(false)
const chatQuestion = ref('')
const chatMessages = ref([])
const chatThreadId = ref('')
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const drawerVisible = ref(false)
const detail = ref(null)
const replyContent = ref('')
const waitUser = ref(false)
const refundAmount = ref(1)
const refundReason = ref('')

const searchForm = reactive({
  source: undefined,
  category: '',
  status: '',
  phone: '',
  orderId: ''
})

const canProcess = computed(() => {
  const status = detail.value?.ticket?.status
  return status && ACTIVE_TICKET_STATUSES.includes(status)
})

const aiSuggestion = computed(() => {
  const raw = detail.value?.ticket?.aiSuggestionJson
  if (!raw) return null
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
})

const hasAssistResult = computed(() => !!(detail.value?.ticket?.aiSummary || aiSuggestion.value))

const showRefundAdvice = computed(() => {
  const r = aiSuggestion.value?.refund_advice
  if (!r) return false
  return !!(r.reason || r.amount_hint || r.caution || r.suggest_refund || r.evidence_needed?.length)
})

const showExecuteAdvice = computed(() => {
  const e = aiSuggestion.value?.execute_advice
  if (!e) return false
  const category = detail.value?.ticket?.category
  if (!EXECUTABLE_DRIVER_CATEGORIES.includes(category) && !e.suggest_approve && !e.reason && !e.checklist?.length) {
    return false
  }
  return !!(e.reason || e.caution || e.suggest_approve || e.checklist?.length)
})

const operator = () => ({
  assigneeId: 1,
  assigneeName: 'admin'
})

const actionLabel = (act) => ACTION_LABELS[act] || act
const confidenceLabel = (c) => ({ high: '高', medium: '中', low: '低' }[c] || c)
const shortThread = (id) => (id && id.length > 10 ? `${id.slice(0, 8)}…` : id)

const resetChat = () => {
  chatQuestion.value = ''
  chatMessages.value = []
  chatThreadId.value = ''
  chatLoading.value = false
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...(searchForm.source != null && searchForm.source !== '' ? { source: searchForm.source } : {}),
      ...(searchForm.category ? { category: searchForm.category } : {}),
      ...(searchForm.status ? { status: searchForm.status } : {}),
      ...(searchForm.phone ? { phone: searchForm.phone.trim() } : {}),
      ...(searchForm.orderId ? { orderId: Number(searchForm.orderId) } : {})
    }
    const res = await getTicketList(params)
    tableData.value = res.data?.items || []
    total.value = res.data?.total || 0
  } catch (e) {
    // request 已提示
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

const resetSearch = () => {
  searchForm.source = undefined
  searchForm.category = ''
  searchForm.status = ''
  searchForm.phone = ''
  searchForm.orderId = ''
  handleSearch()
}

const openDetail = async (row) => {
  drawerVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await getTicketDetail(row.id)
    detail.value = res.data
    replyContent.value = ''
    waitUser.value = false
    refundAmount.value = 1
    refundReason.value = ''
    resetChat()
  } catch (e) {
    drawerVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

const openDetailFromQuery = async () => {
  const raw = route.query.ticketId || route.query.highlightId
  if (!raw) return
  const ticketId = Number(raw)
  if (!ticketId) return
  await openDetail({ id: ticketId })
}

const refreshDetail = async () => {
  if (!detail.value?.ticket?.id) return
  const res = await getTicketDetail(detail.value.ticket.id)
  detail.value = res.data
  await fetchList()
}

const onDrawerClosed = () => {
  detail.value = null
  aiLoading.value = false
  resetChat()
}

const handleAccept = async () => {
  actionLoading.value = true
  try {
    await acceptTicket({
      ticketId: detail.value.ticket.id,
      version: detail.value.ticket.version,
      ...operator()
    })
    ElMessage.success('已受理')
    await refreshDetail()
  } catch (e) {
    // ignore
  } finally {
    actionLoading.value = false
  }
}

const handleReply = async () => {
  const content = replyContent.value.trim()
  if (!content) {
    ElMessage.warning('请输入回复内容')
    return
  }
  actionLoading.value = true
  try {
    await replyTicket({
      ticketId: detail.value.ticket.id,
      content,
      waitUser: waitUser.value,
      ...operator()
    })
    ElMessage.success('回复已发送')
    replyContent.value = ''
    await refreshDetail()
  } catch (e) {
    // ignore
  } finally {
    actionLoading.value = false
  }
}

const openResolve = async () => {
  try {
    const refund = detail.value?.refund
    const unfinished = refund && ['PENDING', 'APPROVED', 'REFUNDING', 'FAILED'].includes(refund.status)
    const tip = unfinished
      ? `当前工单有未完成退款（${refund.refundNo} / ${refund.status}），仍可结案。请输入结案说明（可空）`
      : '请输入结案说明（可空）'
    const { value } = await ElMessageBox.prompt(tip, unfinished ? '结案（有未完成退款）' : '结案', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '处理结果说明',
      inputValue: replyContent.value.trim() || aiSuggestion.value?.resolve_draft || '',
      type: unfinished ? 'warning' : undefined
    })
    actionLoading.value = true
    await resolveTicket({
      ticketId: detail.value.ticket.id,
      version: detail.value.ticket.version,
      resultSummary: value || '已处理完成',
      ...operator()
    })
    ElMessage.success('已结案')
    await refreshDetail()
  } catch (e) {
    if (e !== 'cancel') {
      // request 已提示
    }
  } finally {
    actionLoading.value = false
  }
}

const openReject = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '驳回原因不能为空',
      inputValue: aiSuggestion.value?.reject_draft || ''
    })
    actionLoading.value = true
    await rejectTicket({
      ticketId: detail.value.ticket.id,
      version: detail.value.ticket.version,
      rejectReason: value,
      ...operator()
    })
    ElMessage.success('已驳回')
    await refreshDetail()
  } catch (e) {
    if (e !== 'cancel') {
      // ignore
    }
  } finally {
    actionLoading.value = false
  }
}

const handleApproveExecute = async () => {
  try {
    await ElMessageBox.confirm(
      '将直接修改司机运营城市或个人信息，确认执行？',
      '通过并执行',
      { type: 'warning' }
    )
    actionLoading.value = true
    await approveExecuteTicket({
      ticketId: detail.value.ticket.id,
      version: detail.value.ticket.version,
      resultSummary: '申请已通过并执行',
      ...operator()
    })
    ElMessage.success('已执行并结案')
    await refreshDetail()
  } catch (e) {
    if (e !== 'cancel') {
      // ignore
    }
  } finally {
    actionLoading.value = false
  }
}

const handleCreateRefund = async () => {
  if (!refundAmount.value || refundAmount.value <= 0) {
    ElMessage.warning('请输入正确的退款金额')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认登记退款 ¥${refundAmount.value}？登记后请到「退款登记」页执行实际退款。`,
      '退款登记',
      { type: 'warning' }
    )
    actionLoading.value = true
    await createTicketRefund({
      ticketId: detail.value.ticket.id,
      refundAmount: refundAmount.value,
      reasonCode: detail.value.ticket.category,
      reasonText: refundReason.value || undefined,
      operatorId: 1,
      operatorName: 'admin'
    })
    ElMessage.success('退款单已登记，请到退款页执行')
    await refreshDetail()
  } catch (e) {
    if (e !== 'cancel') {
      // ignore
    }
  } finally {
    actionLoading.value = false
  }
}

const handleAiAssist = async () => {
  if (!detail.value?.ticket?.id) return
  aiLoading.value = true
  try {
    const res = await ticketAiAssist({
      ticketId: detail.value.ticket.id,
      operatorId: operator().assigneeId,
      operatorName: operator().assigneeName,
      newThread: false
    })
    if (res.data?.threadId) {
      chatThreadId.value = res.data.threadId
    }
    await refreshDetail()
    ElMessage.success('协查建议已更新')
  } catch (e) {
    // request 已提示
  } finally {
    aiLoading.value = false
  }
}

const handleChat = async (newThread = false) => {
  const q = chatQuestion.value.trim()
  if (!q || !detail.value?.ticket?.id) return
  chatLoading.value = true
  try {
    const audience = detail.value.ticket.source === 1
      ? 'passenger'
      : (detail.value.ticket.source === 2 ? 'driver' : undefined)
    const history = chatMessages.value.map((m) => ({ role: m.role, content: m.content }))
    const res = await ticketAiChat({
      ticketId: detail.value.ticket.id,
      question: q,
      operatorId: operator().assigneeId,
      operatorName: operator().assigneeName,
      audience,
      newThread: !!newThread,
      history: newThread ? [] : history
    })
    const data = res.data || {}
    if (data.threadId) {
      chatThreadId.value = data.threadId
    }
    if (newThread) {
      chatMessages.value = []
    }
    chatMessages.value.push({ role: 'user', content: q })
    chatMessages.value.push({
      role: 'assistant',
      content: data.answer || data.message || '',
      citations: data.citations || [],
      refused: !!data.refused
    })
    chatQuestion.value = ''
  } catch (e) {
    // request 已提示
  } finally {
    chatLoading.value = false
  }
}

const fillReplyDraft = () => {
  const draft = aiSuggestion.value?.reply_draft
  if (!draft) return
  replyContent.value = draft
  ElMessage.success('已填入左侧回复框')
}

const goOrderTrack = (orderId) => {
  router.push({ path: '/order/track', query: { orderId } })
}

const senderLabel = (type) => {
  const map = { 1: '乘客', 2: '司机', 3: '运营', 4: '系统' }
  return map[type] || '未知'
}

const prettyPayload = (raw) => {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
}

onMounted(async () => {
  await fetchList()
  await openDetailFromQuery()
})

watch(
  () => route.query.ticketId || route.query.highlightId,
  async (id, oldId) => {
    if (id && String(id) !== String(oldId || '')) {
      await openDetailFromQuery()
    }
  }
)
</script>

<style scoped>
.ticket-manager {
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

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding-right: 12px;
}
.drawer-header-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2a37;
}
.drawer-sub {
  color: #6b7280;
  font-size: 13px;
}

.drawer-body {
  height: 100%;
  padding: 0 4px 12px;
}
.drawer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 16px;
  align-items: start;
  min-height: calc(100vh - 120px);
}
.drawer-col {
  min-width: 0;
}
.assist-col {
  position: sticky;
  top: 0;
}

.panel {
  margin-bottom: 14px;
  padding: 14px 14px 12px;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
}
.panel-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}
.panel-actions {
  background: #fbfcfd;
}

.payload-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
}
.msg-item {
  line-height: 1.5;
}
.msg-name {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}
.action-row {
  margin-top: 12px;
}
.action-row.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.refund-box {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
}
.refund-title {
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 13px;
}

.assist-panel {
  padding: 14px;
  background: #f7f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  min-height: 420px;
}
.assist-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}
.assist-hint {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.5;
}
.assist-loading,
.assist-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 28px 8px;
  color: #4b5563;
}
.assist-empty .muted,
.muted {
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.5;
}
.assist-block {
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}
.assist-block:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
.assist-label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.02em;
}
.assist-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.assist-summary,
.assist-block p {
  margin: 0;
  color: #1f2937;
  line-height: 1.65;
  font-size: 13px;
}
.assist-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ai-tag {
  margin: 0;
}
.assist-list {
  margin: 0;
  padding-left: 18px;
  color: #374151;
  font-size: 13px;
  line-height: 1.6;
}
.assist-draft {
  margin: 0;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.6;
  color: #111827;
}
.assist-decision {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}
.assist-caution {
  margin-top: 8px !important;
  color: #b45309 !important;
  font-size: 12px !important;
}
.mt-6 {
  margin-top: 6px !important;
}

.assist-chat {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;
}
.chat-hint {
  margin: 0 0 10px;
}
.thread-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
}
.chat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 10px;
  padding-right: 2px;
}
.chat-item {
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
}
.chat-item.user {
  background: #f0f7ff;
  border-color: #d6e8ff;
}
.chat-role {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}
.chat-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.55;
  color: #111827;
  font-family: inherit;
}
.chat-cites {
  margin-top: 6px;
  font-size: 11px;
  color: #6b7280;
}
.cite {
  margin-top: 2px;
}
.refuse-tag {
  margin-top: 6px;
}
.chat-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

@media (max-width: 1200px) {
  .drawer-grid {
    grid-template-columns: 1fr;
  }
  .assist-col {
    position: static;
  }
}
</style>

<style>
/* drawer 本体加宽后，内容区尽量吃满 */
.ticket-drawer.el-drawer {
  min-width: 960px;
}
.ticket-drawer .el-drawer__header {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef0f3;
}
.ticket-drawer .el-drawer__body {
  padding-top: 8px;
}
</style>
