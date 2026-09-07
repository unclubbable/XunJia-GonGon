<template>
  <div class="dict-car-class-container">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true">
        <el-form-item>
          <el-button type="success" :icon="Plus" @click="handleAdd">新增车辆类型</el-button>
          <el-button :icon="Refresh" @click="fetchList">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="classCode" label="类型编码" width="120" />
        <el-table-column prop="className" label="类型名称" min-width="160" />
        <el-table-column prop="sortOrder" label="排序" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.state === 0 ? 'success' : 'info'" size="small">
              {{ row.state === 0 ? '有效' : '失效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gmtCreate" label="创建时间" min-width="170" />
        <el-table-column prop="gmtModified" label="修改时间" min-width="170" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增车辆类型' : '编辑车辆类型'"
      width="480px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="类型编码" prop="classCode">
          <el-input
            v-model="formData.classCode"
            placeholder="如 1、2、5"
            :disabled="dialogType === 'edit'"
          />
          <div v-if="dialogType === 'edit'" class="form-tip">编辑时不可修改编码</div>
        </el-form-item>
        <el-form-item label="类型名称" prop="className">
          <el-input v-model="formData.className" placeholder="如 轿车、SUV" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="state">
          <el-radio-group v-model="formData.state">
            <el-radio :label="0">有效</el-radio>
            <el-radio :label="1">失效</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import {
  getDictCarClassList,
  saveDictCarClass,
  deleteDictCarClass
} from '@/api/dictCarClass'

const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const formData = reactive({
  id: null,
  classCode: '',
  className: '',
  sortOrder: 0,
  state: 0
})

const formRules = {
  classCode: [{ required: true, message: '请输入类型编码', trigger: 'blur' }],
  className: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
  sortOrder: [{ required: true, message: '请输入排序', trigger: 'change' }],
  state: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getDictCarClassList({
      page: currentPage.value,
      limit: pageSize.value
    })
    if (res.code === 1 && res.data) {
      tableData.value = res.data.items || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取列表失败')
    }
  } catch (e) {
    ElMessage.error('请求车辆类型列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogType.value = 'add'
  resetFormData()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  formData.id = row.id
  formData.classCode = row.classCode
  formData.className = row.className
  formData.sortOrder = row.sortOrder
  formData.state = row.state
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除车辆类型「${row.className}」吗？`, '提示', {
      type: 'warning'
    })
    const res = await deleteDictCarClass(row.id)
    if (res.code === 1) {
      ElMessage.success('删除成功')
      fetchList()
    }
  } catch (e) {
    // 取消确认框，或业务失败（拦截器已弹出后端 message）时不再二次提示
    if (e === 'cancel' || e === 'close' || e?.action === 'cancel') return
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    const payload = {
      id: dialogType.value === 'edit' ? formData.id : null,
      classCode: String(formData.classCode).trim(),
      className: formData.className.trim(),
      sortOrder: formData.sortOrder,
      state: formData.state
    }
    try {
      const res = await saveDictCarClass(payload)
      if (res.code === 1) {
        ElMessage.success(dialogType.value === 'add' ? '新增成功' : '更新成功')
        dialogVisible.value = false
        fetchList()
      } else {
        ElMessage.error(res.message || '保存失败')
      }
    } catch (e) {
      ElMessage.error('保存请求失败')
    }
  })
}

const resetFormData = () => {
  formData.id = null
  formData.classCode = ''
  formData.className = ''
  formData.sortOrder = 0
  formData.state = 0
}

const resetForm = () => {
  formRef.value?.resetFields()
  resetFormData()
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.dict-car-class-container {
  padding: 0;
}

.search-card {
  margin-bottom: 16px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
