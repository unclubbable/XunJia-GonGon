<template>
  <div class="driver-list-container">
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
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.state" placeholder="全部" clearable style="width: 120px">
            <el-option label="有效" :value="0" />
            <el-option label="失效" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="success" :icon="Plus" @click="handleAdd">新增司机</el-button>
          <el-button type="warning" :icon="Download" @click="exportToCSV">导出当前页</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="司机ID" width="80" align="center" />
        <el-table-column prop="driverName" label="姓名" min-width="100" />
        <el-table-column prop="driverPhone" label="手机号" width="130" />
        <el-table-column prop="driverGender" label="性别" width="70" align="center">
          <template #default="{ row }">
            {{ row.driverGender === 1 ? '男' : row.driverGender === 2 ? '女' : '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="driverNation" label="民族" width="100" />
        <el-table-column prop="totalOrders" label="总单数" width="90" align="center" />
        <el-table-column label="证件有效期" width="140">
          <template #default="{ row }">
            <div v-if="row.driverLicenseOff">
              {{ formatDate(row.driverLicenseOn) }} ~ {{ formatDate(row.driverLicenseOff) }}
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="资格证有效期" width="140">
          <template #default="{ row }">
            <div v-if="row.networkCarProofOn && row.networkCarProofOff">
              {{ formatDate(row.networkCarProofOn) }} ~ {{ formatDate(row.networkCarProofOff) }}
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="state" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.state === 0 ? 'success' : 'danger'" size="small">
              {{ row.state === 0 ? '有效' : '失效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              link
              :type="row.state === 0 ? 'warning' : 'success'"
              size="small"
              @click="toggleState(row)"
            >
              {{ row.state === 0 ? '禁用' : '启用' }}
            </el-button>
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
      :title="dialogType === 'add' ? '新增司机' : dialogType === 'edit' ? '编辑司机' : '司机详情'"
      width="800px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="140px"
        :disabled="dialogType === 'view'"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓" prop="driverSurname">
              <el-input v-model="formData.driverSurname" placeholder="请输入姓" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名" prop="driverName">
              <el-input v-model="formData.driverName" placeholder="请输入名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="driverPhone">
              <el-input v-model="formData.driverPhone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="driverGender">
              <el-select v-model="formData.driverGender" placeholder="请选择">
                <el-option label="男" :value="1" />
                <el-option label="女" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="民族" prop="driverNation">
              <el-input v-model="formData.driverNation" placeholder="请输入民族" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生日" prop="driverBirthday">
              <el-date-picker
                v-model="formData.driverBirthday"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="联系地址" prop="driverContactAddress">
          <el-input v-model="formData.driverContactAddress" placeholder="请输入联系地址" />
        </el-form-item>
        <el-divider content-position="left">证件信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="驾驶证号" prop="licenseId">
              <el-input v-model="formData.licenseId" placeholder="请输入驾驶证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="初次领证日期" prop="getDriverLicenseDate">
              <el-date-picker
                v-model="formData.getDriverLicenseDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="驾驶证有效期起" prop="driverLicenseOn">
              <el-date-picker
                v-model="formData.driverLicenseOn"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="驾驶证有效期止" prop="driverLicenseOff">
              <el-date-picker
                v-model="formData.driverLicenseOff"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="巡游出租汽车" prop="taxiDriver">
              <el-select v-model="formData.taxiDriver" placeholder="请选择">
                <el-option label="是" :value="1" />
                <el-option label="否" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务类型" prop="commercialType">
              <el-select v-model="formData.commercialType" placeholder="请选择">
                <el-option label="网络预约出租车" :value="1" />
                <el-option label="巡游出租车" :value="2" />
                <el-option label="私人小客车合乘" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">资格证信息</el-divider>
        <el-form-item label="资格证号" prop="certificateNo">
          <el-input v-model="formData.certificateNo" placeholder="请输入资格证号" />
        </el-form-item>
        <el-form-item label="发证机构" prop="networkCarIssueOrganization">
          <el-input v-model="formData.networkCarIssueOrganization" placeholder="请输入发证机构" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资格证发证日期" prop="networkCarIssueDate">
              <el-date-picker
                v-model="formData.networkCarIssueDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="初次领取资格证日期" prop="getNetworkCarProofDate">
              <el-date-picker
                v-model="formData.getNetworkCarProofDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资格证有效期起" prop="networkCarProofOn">
              <el-date-picker
                v-model="formData.networkCarProofOn"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资格证有效期止" prop="networkCarProofOff">
              <el-date-picker
                v-model="formData.networkCarProofOff"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">合同信息</el-divider>
        <el-form-item label="合同签署公司" prop="contractCompany">
          <el-input v-model="formData.contractCompany" placeholder="请输入合同签署公司" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同有效期起" prop="contractOn">
              <el-date-picker
                v-model="formData.contractOn"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同有效期止" prop="contractOff">
              <el-date-picker
                v-model="formData.contractOff"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="报备日期" prop="registerDate">
          <el-date-picker
            v-model="formData.registerDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="行政区划代码" prop="address">
          <el-cascader
            v-model="formData.address"
            :options="districtOptions"
            :props="{ value: 'addressCode', label: 'addressName', children: 'children' }"
            placeholder="请选择行政区划"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="state">
          <el-radio-group v-model="formData.state">
            <el-radio :label="0">有效</el-radio>
            <el-radio :label="1">失效</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button v-if="dialogType !== 'view'" type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Download } from '@element-plus/icons-vue'
import {
  getDriverUserList,
  createOrUpdateDriverUser,
  getDriverUserByDriverId,
  getDicDistrict
} from '@/api/driverUser' // 根据实际路径调整

// ---------- 搜索表单 ----------
const searchForm = reactive({
  address: '',
  phone: '',
  state: null
})

// ---------- 表格数据 ----------
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// ---------- 地区字典（级联选择器选项）----------
const districtOptions = ref([])

// 获取地区字典并构建树形结构
const fetchDistrict = async () => {
  try {
    const res = await getDicDistrict()
    if (res.code === 1 && res.data) {
      const flatData = res.data
      // 构建树形结构 (根据 parentAddressCode)
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
        } else if (item.parentAddressCode === '0' || item.level === 0) {
          // 根节点跳过
        } else {
          roots.push(node)
        }
      })
      // 过滤掉 level 为 0 的根节点（如“中华人民共和国”）
      districtOptions.value = roots.filter(opt => opt.addressCode !== '100000')
    }
  } catch (error) {
    console.error('获取地区字典失败', error)
  }
}

// ---------- 获取司机列表 ----------
const fetchDriverList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...(searchForm.address && { address: searchForm.address }),
      ...(searchForm.phone && { phone: searchForm.phone }),
      ...(searchForm.state !== null && searchForm.state !== '' && { state: searchForm.state })
    }
    const res = await getDriverUserList(params)
    if (res.code === 1 && res.data) {
      tableData.value = res.data.items || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取数据失败')
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
  fetchDriverList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.address = ''
  searchForm.phone = ''
  searchForm.state = null
  handleSearch()
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchDriverList()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchDriverList()
}

// ---------- 新增/编辑/详情弹窗 ----------
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add', 'edit', 'view'
const formRef = ref(null)
const formData = reactive({
  id: undefined,
  address: '',
  driverSurname: '',
  driverName: '',
  driverPhone: '',
  driverGender: null,
  driverBirthday: '',
  driverNation: '',
  totalOrders: 0,
  driverContactAddress: '',
  licenseId: '',
  getDriverLicenseDate: '',
  driverLicenseOn: '',
  driverLicenseOff: '',
  taxiDriver: null,
  certificateNo: '',
  networkCarIssueOrganization: '',
  networkCarIssueDate: '',
  getNetworkCarProofDate: '',
  networkCarProofOn: '',
  networkCarProofOff: '',
  registerDate: '',
  commercialType: null,
  contractCompany: '',
  contractOn: '',
  contractOff: '',
  state: 0
})

// 表单校验规则
const formRules = {
  driverSurname: [{ required: true, message: '请输入姓', trigger: 'blur' }],
  driverName: [{ required: true, message: '请输入名', trigger: 'blur' }],
  driverPhone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  driverGender: [{ required: true, message: '请选择性别', trigger: 'change' }]
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    id: undefined,
    address: '',
    driverSurname: '',
    driverName: '',
    driverPhone: '',
    driverGender: null,
    driverBirthday: '',
    driverNation: '',
    totalOrders: 0,
    driverContactAddress: '',
    licenseId: '',
    getDriverLicenseDate: '',
    driverLicenseOn: '',
    driverLicenseOff: '',
    taxiDriver: null,
    certificateNo: '',
    networkCarIssueOrganization: '',
    networkCarIssueDate: '',
    getNetworkCarProofDate: '',
    networkCarProofOn: '',
    networkCarProofOff: '',
    registerDate: '',
    commercialType: null,
    contractCompany: '',
    contractOn: '',
    contractOff: '',
    state: 0
  })
}

// 新增
const handleAdd = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row) => {
  dialogType.value = 'edit'
  // 获取详情填充表单
  try {
    const res = await getDriverUserByDriverId(row.id)
    if (res.code === 1 && res.data) {
      Object.assign(formData, res.data)
      dialogVisible.value = true
    } else {
      ElMessage.error(res.message || '获取详情失败')
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 查看详情
const handleView = async (row) => {
  dialogType.value = 'view'
  try {
    const res = await getDriverUserByDriverId(row.id)
    if (res.code === 1 && res.data) {
      Object.assign(formData, res.data)
      dialogVisible.value = true
    } else {
      ElMessage.error(res.message || '获取详情失败')
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 提交表单（新增/编辑）
const submitForm = async () => {
  if (!formRef.value) return
  // 修改address字段（数组转字符串）
  const lastAddress = formData.address[formData.address.length - 1]; 
  formData.address = lastAddress;
  //提交表单数据
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const res = await createOrUpdateDriverUser(formData)
      if (res.code === 1) {
        ElMessage.success(dialogType.value === 'add' ? '新增成功' : '更新成功')
        dialogVisible.value = false
        fetchDriverList() // 刷新列表
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  })
}

// 启用/禁用司机
const toggleState = async (row) => {
  const action = row.state === 0 ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确认要${action}司机“${row.driverName}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const newState = row.state === 0 ? 1 : 0
    const updateData = { ...row, state: newState }
    const res = await createOrUpdateDriverUser(updateData)
    if (res.code === 1) {
      ElMessage.success(`${action}成功`)
      fetchDriverList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// ---------- 导出 CSV（当前页数据）----------
const exportToCSV = () => {
  if (!tableData.value.length) {
    ElMessage.warning('无数据可导出')
    return
  }
  // 定义列标题与字段映射
  const columns = [
    { label: '司机ID', prop: 'id' },
    { label: '姓名', prop: 'driverName' },
    { label: '手机号', prop: 'driverPhone' },
    { label: '性别', formatter: (row) => (row.driverGender === 1 ? '男' : row.driverGender === 2 ? '女' : '未知') },
    { label: '民族', prop: 'driverNation' },
    { label: '总单数', prop: 'totalOrders' },
    { label: '驾驶证有效期', formatter: (row) => `${formatDate(row.driverLicenseOn)}~${formatDate(row.driverLicenseOff)}` },
    { label: '资格证有效期', formatter: (row) => `${formatDate(row.networkCarProofOn)}~${formatDate(row.networkCarProofOff)}` },
    { label: '状态', formatter: (row) => (row.state === 0 ? '有效' : '失效') }
  ]
  const csvData = tableData.value.map(row => {
    return columns.map(col => {
      if (col.formatter) return col.formatter(row)
      return row[col.prop] !== undefined ? row[col.prop] : ''
    }).join(',')
  })
  const header = columns.map(col => col.label).join(',')
  const csvContent = [header, ...csvData].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.setAttribute('download', `司机列表_${new Date().toISOString().slice(0, 19)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 辅助函数：格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  fetchDistrict()
  fetchDriverList()
})
</script>

<style scoped>
.driver-list-container {
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
</style>