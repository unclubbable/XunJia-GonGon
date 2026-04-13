<template>
  <div class="fare-rule-container">
    <!-- 查询表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="城市">
          <el-select
            v-model="searchForm.cityCode"
            placeholder="请选择城市"
            clearable
            filterable
            style="width: 200px"
          >
            <el-option
              v-for="city in cityOptions"
              :key="city.addressCode"
              :label="city.addressName"
              :value="city.addressCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="success" :icon="Plus" @click="handleAdd">新增规则</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="cityName" label="城市" min-width="120" />
        <el-table-column label="车辆类型" width="100">
          <template #default="{ row }">
            {{ vehicleTypeMap[row.vehicleType] || row.vehicleType }}
          </template>
        </el-table-column>
        <el-table-column prop="startFare" label="起步价" width="100" align="right" />
        <el-table-column prop="startMile" label="起步公里" width="120" align="right" />
        <el-table-column prop="unitPricePerMile" label="每公里单价" width="130" align="right" />
        <el-table-column prop="unitPricePerMinute" label="每分钟单价" width="130" align="right" />
        <el-table-column prop="fareVersion" label="计价版本" width="100" align="center" />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
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
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增计价规则' : '编辑计价规则'"
      width="500px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
      >
        <el-form-item label="城市" prop="cityCode">
          <el-select
            v-model="formData.cityCode"
            placeholder="请选择城市"
            filterable
            :disabled="dialogType === 'edit'"
            style="width: 100%"
          >
            <el-option
              v-for="city in cityOptions"
              :key="city.addressCode"
              :label="city.addressName"
              :value="city.addressCode"
            />
          </el-select>
          <div v-if="dialogType === 'edit'" class="form-tip">编辑时不可修改城市和车辆类型</div>
        </el-form-item>
        <el-form-item label="车辆类型" prop="vehicleType">
          <el-select
            v-model="formData.vehicleType"
            placeholder="请选择车辆类型"
            :disabled="dialogType === 'edit'"
            style="width: 100%"
          >
            <el-option
              v-for="(label, value) in vehicleTypeMap"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
          <div v-if="dialogType === 'edit'" class="form-tip">编辑时不可修改城市和车辆类型</div>
        </el-form-item>
        <el-form-item label="起步价" prop="startFare">
          <el-input-number v-model="formData.startFare" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="起步里程" prop="startMile">
          <el-input-number v-model="formData.startMile" :min="0" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每公里单价" prop="unitPricePerMile">
          <el-input-number v-model="formData.unitPricePerMile" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每分钟单价" prop="unitPricePerMinute">
          <el-input-number v-model="formData.unitPricePerMinute" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { getRuleList, addRule, editRule } from '@/api/rules'
import { getDicDistrictlist } from '@/api/city'

// 车辆类型映射
const vehicleTypeMap = {
  '1': '轿车',
  '2': 'SUV',
  '3': 'MPV',
  '4': '面包车',
  '9': '其他'
}

// 城市选项（从本地省/市字典获取，仅市级）
const cityOptions = ref([])

// 查询表单
const searchForm = reactive({
  cityCode: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 弹窗
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' 或 'edit'
const formRef = ref(null)
const formData = reactive({
  cityCode: '',
  vehicleType: '',
  startFare: 0,
  startMile: 0,
  unitPricePerMile: 0,
  unitPricePerMinute: 0
})

// 表单校验规则
const formRules = {
  cityCode: [{ required: true, message: '请选择城市', trigger: 'change' }],
  vehicleType: [{ required: true, message: '请选择车辆类型', trigger: 'change' }],
  startFare: [{ required: true, message: '请输入起步价', trigger: 'blur' }],
  startMile: [{ required: true, message: '请输入起步里程', trigger: 'blur' }],
  unitPricePerMile: [{ required: true, message: '请输入每公里单价', trigger: 'blur' }],
  unitPricePerMinute: [{ required: true, message: '请输入每分钟单价', trigger: 'blur' }]
}

// 获取城市列表（省/市级，只需市级）
const fetchCityList = async () => {
  try {
    const res = await getDicDistrictlist()
    if (res.code === 1 && res.data) {
      // 过滤出市级（level === 2）的数据
      cityOptions.value = res.data.filter(item => item.level === 2)
    } else {
      ElMessage.error(res.message || '获取城市列表失败')
    }
  } catch (error) {
    ElMessage.error('请求城市列表失败')
  }
}

// 获取规则列表
const fetchRuleList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...(searchForm.cityCode && { cityCode: searchForm.cityCode })
    }
    const res = await getRuleList(params)
    if (res.code === 1 && res.data) {
      // 为每条记录添加城市名称
      const items = (res.data.items || []).map(item => {
        const city = cityOptions.value.find(c => c.addressCode === item.cityCode)
        return {
          ...item,
          cityName: city ? city.addressName : item.cityCode
        }
      })
      tableData.value = items
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取规则列表失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  currentPage.value = 1
  fetchRuleList()
}

// 重置查询
const resetSearch = () => {
  searchForm.cityCode = ''
  handleSearch()
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchRuleList()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchRuleList()
}

// 新增
const handleAdd = () => {
  dialogType.value = 'add'
  resetFormData()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogType.value = 'edit'
  // 填充表单数据（注意：cityCode 和 vehicleType 不可编辑，但需要显示）
  formData.cityCode = row.cityCode
  formData.vehicleType = row.vehicleType
  formData.startFare = row.startFare
  formData.startMile = row.startMile
  formData.unitPricePerMile = row.unitPricePerMile
  formData.unitPricePerMinute = row.unitPricePerMinute
  dialogVisible.value = true
}

// 重置表单数据
const resetFormData = () => {
  formData.cityCode = ''
  formData.vehicleType = ''
  formData.startFare = 0
  formData.startMile = 0
  formData.unitPricePerMile = 0
  formData.unitPricePerMinute = 0
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      let res
      if (dialogType.value === 'add') {
        res = await addRule(formData)
      } else {
        // 编辑时只传递需要更新的字段，但接口要求 cityCode 和 vehicleType 作为主键
        const updateData = {
          cityCode: formData.cityCode,
          vehicleType: formData.vehicleType,
          startFare: formData.startFare,
          startMile: formData.startMile,
          unitPricePerMile: formData.unitPricePerMile,
          unitPricePerMinute: formData.unitPricePerMinute
        }
        res = await editRule(updateData)
      }
      if (res.code === 1) {
        ElMessage.success(dialogType.value === 'add' ? '新增成功' : '更新成功')
        dialogVisible.value = false
        fetchRuleList() // 刷新列表
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  })
}

// 重置弹窗表单
const resetForm = () => {
  formRef.value?.resetFields()
  resetFormData()
}

// 初始化
onMounted(async () => {
  await fetchCityList()
  fetchRuleList()
})
</script>

<style scoped>
.fare-rule-container {
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>