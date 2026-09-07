<template>
  <div class="agent-page">
    <el-card shadow="never" class="block">
      <template #header>
        <span>AI 工单协查</span>
      </template>
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="工单ID">
          <el-input-number v-model="ticketId" :min="1" :controls="false" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="assistLoading" :disabled="!ticketId" @click="handleAssist">
            发起协查
          </el-button>
          <el-button @click="goTicketList">去工单列表</el-button>
        </el-form-item>
      </el-form>
      <pre v-if="assistResult" class="result-pre">{{ pretty(assistResult) }}</pre>
    </el-card>

    <el-card shadow="never" class="block">
      <template #header>
        <span>协议 RAG 多轮问答（同一会话 thread）</span>
      </template>
      <el-form label-width="90px" @submit.prevent>
        <el-form-item label="关联工单">
          <el-input-number v-model="chatTicketId" :min="1" :controls="false" placeholder="可选" />
          <span class="tip">可选；填写后按工单来源过滤乘客/司机协议</span>
        </el-form-item>
        <el-form-item label="受众">
          <el-select v-model="audience" clearable placeholder="不限" style="width: 160px">
            <el-option label="乘客协议" value="passenger" />
            <el-option label="司机协议" value="driver" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题">
          <el-input v-model="question" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="chatLoading" :disabled="!question.trim()" @click="handleChat(false)">
            发送（续聊）
          </el-button>
          <el-button :loading="chatLoading" :disabled="!question.trim()" @click="handleChat(true)">
            新开会话并问
          </el-button>
        </el-form-item>
      </el-form>

      <div v-if="threadId" class="thread">当前 threadId：{{ threadId }}</div>
      <div class="chat-list">
        <div v-for="(m, idx) in chatMessages" :key="idx" class="chat-item" :class="m.role">
          <div class="role">{{ m.role === 'user' ? '我' : '助手' }}</div>
          <pre>{{ m.content }}</pre>
          <div v-if="m.citations?.length" class="cites">
            引用：
            <div v-for="(c, i) in m.citations" :key="i" class="cite">
              [{{ i + 1 }}] {{ c.source }} / {{ c.section }}（{{ Number(c.score || 0).toFixed(3) }}）
            </div>
          </div>
          <el-tag v-if="m.refused" type="warning" size="small">已拒答</el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ticketAiAssist, ticketAiChat } from '@/api/ticket'

const router = useRouter()
const ticketId = ref(null)
const assistLoading = ref(false)
const assistResult = ref(null)

const chatTicketId = ref(null)
const audience = ref('')
const question = ref('')
const chatLoading = ref(false)
const threadId = ref('')
const chatMessages = ref([])

const handleAssist = async () => {
  if (!ticketId.value) return
  assistLoading.value = true
  assistResult.value = null
  try {
    const res = await ticketAiAssist({
      ticketId: ticketId.value,
      operatorId: 1,
      operatorName: 'admin',
      newThread: false
    })
    assistResult.value = res.data
    ElMessage.success('协查完成')
  } catch (e) {
    // ignore
  } finally {
    assistLoading.value = false
  }
}

const handleChat = async (newThread) => {
  const q = question.value.trim()
  if (!q) return
  chatLoading.value = true
  try {
    const history = chatMessages.value
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))
    const res = await ticketAiChat({
      ticketId: chatTicketId.value || undefined,
      question: q,
      operatorId: 1,
      operatorName: 'admin',
      audience: audience.value || undefined,
      newThread: !!newThread,
      history: newThread ? [] : history
    })
    const data = res.data || {}
    threadId.value = data.threadId || threadId.value
    chatMessages.value.push({ role: 'user', content: q })
    chatMessages.value.push({
      role: 'assistant',
      content: data.answer || data.message || '',
      citations: data.citations || [],
      refused: !!data.refused
    })
    question.value = ''
  } catch (e) {
    // ignore
  } finally {
    chatLoading.value = false
  }
}

const pretty = (obj) => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

const goTicketList = () => router.push('/ticket/list')
</script>

<style scoped>
.agent-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.result-pre,
.chat-item pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
}
.result-pre {
  margin-top: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}
.thread {
  margin-bottom: 8px;
  color: #606266;
  font-size: 12px;
}
.chat-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chat-item {
  padding: 10px 12px;
  border-radius: 8px;
  background: #f5f7fa;
}
.chat-item.user {
  background: #ecf5ff;
}
.role {
  font-weight: 600;
  margin-bottom: 4px;
}
.cites {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}
.cite {
  margin-top: 2px;
}
</style>
