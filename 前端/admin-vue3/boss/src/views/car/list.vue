<template>
  <div class="car-list-container">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="注册城市">
          <el-cascader
            v-model="searchForm.address"
            :options="districtOptions"
            :props="{ value: 'addressCode', label: 'addressName', children: 'children', checkStrictly: true }"
            placeholder="请选择省/市/区"
            clearable
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="searchForm.vehicleNo" placeholder="请输入车牌号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="success" :icon="Plus" @click="handleAdd">新增车辆</el-button>
          <el-button type="warning" :icon="Download" @click="exportToCSV">导出当前页</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="vehicleNo" label="车牌号" min-width="120" />
        <el-table-column prop="brand" label="品牌" width="120" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="seats" label="座位数" width="80" align="center" />
        <el-table-column label="车辆类型" width="100">
          <template #default="{ row }">
            {{ vehicleTypeMap[row.vehicleType] || row.vehicleType }}
          </template>
        </el-table-column>
        <el-table-column label="车牌颜色" width="90">
          <template #default="{ row }">
            {{ plateColorMap[row.plateColor] || row.plateColor }}
          </template>
        </el-table-column>
        <el-table-column label="所有人" prop="ownerName" min-width="120" />
        <el-table-column label="注册日期" width="110">
          <template #default="{ row }">
            {{ formatDate(row.certifyDateA) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.state === 0 ? 'success' : 'danger'" size="small">
              {{ row.state === 0 ? '有效' : '失效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            <el-switch
              v-model="row.state"
              :active-value="0"
              :inactive-value="1"
              active-text="有效"
              inactive-text="失效"
              size="small"
              @change="toggleState(row)"
            />
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

    <!-- 新增/编辑/详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增车辆' : dialogType === 'edit' ? '编辑车辆' : '车辆详情'"
      width="800px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="130px"
        :disabled="dialogType === 'view'"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号" prop="vehicleNo">
              <el-input v-model="formData.vehicleNo" placeholder="请输入车牌号（必填）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车牌颜色" prop="plateColor">
              <el-select v-model="formData.plateColor" placeholder="请选择">
                <el-option label="蓝色" value="1" />
                <el-option label="黄色" value="2" />
                <el-option label="黑色" value="3" />
                <el-option label="白色" value="4" />
                <el-option label="绿色" value="5" />
                <el-option label="其他" value="9" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="formData.brand" placeholder="请输入品牌" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号" prop="model">
              <el-input v-model="formData.model" placeholder="请输入型号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车辆类型" prop="vehicleType">
              <el-select v-model="formData.vehicleType" placeholder="请选择">
                <el-option label="轿车" value="1" />
                <el-option label="SUV" value="2" />
                <el-option label="MPV" value="3" />
                <el-option label="面包车" value="4" />
                <el-option label="其他" value="9" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="座位数" prop="seats">
              <el-input-number v-model="formData.seats" :min="1" :max="20" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="车辆所有人" prop="ownerName">
          <el-input v-model="formData.ownerName" placeholder="请输入车辆所有人" />
        </el-form-item>
        <el-form-item label="车辆颜色" prop="vehicleColor">
          <el-select v-model="formData.vehicleColor" placeholder="请选择">
            <el-option label="白色" value="1" />
            <el-option label="黑色" value="2" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发动机号" prop="engineId">
              <el-input v-model="formData.engineId" placeholder="请输入发动机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆识别码(VIN)" prop="vin">
              <el-input v-model="formData.vin" placeholder="请输入VIN码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="燃料类型" prop="fueType">
              <el-select v-model="formData.fueType" placeholder="请选择">
                <el-option label="汽油" value="1" />
                <el-option label="柴油" value="2" />
                <el-option label="天然气" value="3" />
                <el-option label="液化气" value="4" />
                <el-option label="电动" value="5" />
                <el-option label="其他" value="9" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发动机排量(ml)" prop="engineDisplace">
              <el-input v-model="formData.engineDisplace" placeholder="如：1500" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="注册城市" prop="address">
              <el-cascader
                v-model="formAddressArray"
                :options="districtOptions"
                :props="{ value: 'addressCode', label: 'addressName', children: 'children' }"
                placeholder="请选择注册城市"
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆注册日期" prop="certifyDateA">
              <el-date-picker
                v-model="formData.certifyDateA"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="服务类型" prop="commercialType">
          <el-select v-model="formData.commercialType" placeholder="请选择">
            <el-option label="网络预约出租车" :value="1" />
            <el-option label="巡游出租车" :value="2" />
            <el-option label="私人小客车合乘" :value="3" />
          </el-select>
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
import { getCarList, createOrUpdateCar, getCar, deleteCar } from '@/api/car'
import { getDicDistrict } from '@/api/driverUser'

// ---------- 字典映射 ----------
const vehicleTypeMap = { 1: '轿车', 2: 'SUV', 3: 'MPV', 4: '面包车', 9: '其他' }
const plateColorMap = { 1: '蓝色', 2: '黄色', 3: '黑色', 4: '白色', 5: '绿色', 9: '其他' }

// ---------- 搜索表单 ----------
const searchForm = reactive({
  address: [],        // 级联选择器返回数组
  vehicleNo: ''
})

// ---------- 表格数据 ----------
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// ---------- 地区字典 ----------
const districtOptions = ref([])
// 地址编码到路径数组的映射，用于回显
const addressPathMap = ref(new Map())

// 获取地区字典
const fetchDistrict = async () => {
  try {
    const res = await getDicDistrict()
    if (res.code === 1 && res.data) {
      const flatData = res.data
      // 构建树形结构
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
      
      // 构建地址路径映射：从地址编码到路径数组（从根到该节点）
      const buildPathMap = (nodes, path = []) => {
        nodes.forEach(node => {
          const currentPath = [...path, node.addressCode]
          addressPathMap.value.set(node.addressCode, currentPath)
          if (node.children && node.children.length) {
            buildPathMap(node.children, currentPath)
          }
        })
      }
      buildPathMap(districtOptions.value)
    }
  } catch (error) {
    console.error('获取地区字典失败', error)
  }
}

// 根据地址编码获取级联选择器所需的数组路径
const getAddressArray = (addressCode) => {
  if (!addressCode) return []
  return addressPathMap.value.get(addressCode) || []
}

// ---------- 获取车辆列表 ----------
const fetchCarList = async () => {
  loading.value = true
  try {
    // 处理 address：取数组中最后一个元素作为地址编码
    let addressParam = ''
    if (searchForm.address && searchForm.address.length > 0) {
      addressParam = searchForm.address[searchForm.address.length - 1]
    }
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...(addressParam && { address: addressParam }),
      ...(searchForm.vehicleNo && { vehicleNo: searchForm.vehicleNo })
    }
    const res = await getCarList(params)
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
  fetchCarList()
}

// 重置
const resetSearch = () => {
  searchForm.address = []
  searchForm.vehicleNo = ''
  handleSearch()
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchCarList()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchCarList()
}

// ---------- 新增/编辑/详情弹窗 ----------
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add', 'edit', 'view'
const formRef = ref(null)
const formData = reactive({
  id: undefined,
  address: '',      // 存储字符串形式的地址编码
  vehicleNo: '',
  plateColor: '',
  seats: 5,
  brand: '',
  model: '',
  vehicleType: '1',
  ownerName: '',
  vehicleColor: '',
  engineId: '',
  vin: '',
  certifyDateA: '',
  fueType: '',
  engineDisplace: '',
  transAgency: '',
  transArea: '',
  transDateStart: '',
  transDateEnd: '',
  certifyDateB: '',
  fixState: '',
  nextFixDate: '',
  checkState: '',
  feePrintId: '',
  gpsBrand: '',
  gpsModel: '',
  gpsInstallDate: '',
  registerDate: '',
  commercialType: 1,
  fareType: '',
  state: 0               // 0-有效，1-失效
})

// 用于表单中绑定的地址（数组形式，用于级联选择器）
const formAddressArray = ref([])

const formRules = {
  vehicleNo: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  plateColor: [{ required: true, message: '请选择车牌颜色', trigger: 'change' }],
  brand: [{ required: true, message: '请输入品牌', trigger: 'blur' }],
  seats: [{ required: true, message: '请输入座位数', trigger: 'blur' }]
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  Object.keys(formData).forEach(key => {
    if (key === 'state') formData[key] = 0
    else if (key === 'seats') formData[key] = 5
    else if (key === 'commercialType') formData[key] = 1
    else if (key === 'vehicleType') formData[key] = '1'
    else formData[key] = undefined
  })
  formAddressArray.value = []
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
  try {
    const res = await getCar(row.id)
    if (res.code === 1 && res.data) {
      Object.assign(formData, res.data)
      // 将地址编码转换为数组用于级联选择器回显
      formAddressArray.value = getAddressArray(formData.address)
      dialogVisible.value = true
    } else {
      ElMessage.error(res.message || '获取详情失败')
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 详情
const handleView = async (row) => {
  dialogType.value = 'view'
  try {
    const res = await getCar(row.id)
    if (res.code === 1 && res.data) {
      Object.assign(formData, res.data)
      formAddressArray.value = getAddressArray(formData.address)
      dialogVisible.value = true
    } else {
      ElMessage.error(res.message || '获取详情失败')
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    // 将地址数组转换为字符串（取最后一个元素）
    if (formAddressArray.value && formAddressArray.value.length > 0) {
      formData.address = formAddressArray.value[formAddressArray.value.length - 1]
    } else {
      formData.address = ''
    }
    try {
      const res = await createOrUpdateCar(formData)
      if (res.code === 1) {
        ElMessage.success(dialogType.value === 'add' ? '新增成功' : '更新成功')
        dialogVisible.value = false
        fetchCarList()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  })
}

// 删除车辆
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除车辆 ${row.vehicleNo} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deleteCar(row.id)
    if (res.code === 1) {
      ElMessage.success('删除成功')
      fetchCarList()
    } else {
      ElMessage.error(res.message || '删除失败（可能已绑定司机）')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 切换状态（有效/失效）
const toggleState = async (row) => {
  const newState = row.state
  const oldState = newState === 0 ? 1 : 0
  try {
    const updateData = { ...row, state: newState }
    const res = await createOrUpdateCar(updateData)
    if (res.code === 1) {
      ElMessage.success(`车辆已${newState === 1 ? '失效' : '有效'}`)
    } else {
      ElMessage.error(res.message || '状态修改失败')
      row.state = oldState
    }
  } catch (error) {
    ElMessage.error('请求失败')
    row.state = oldState
  }
}

// ---------- 导出当前页 CSV ----------
const exportToCSV = () => {
  if (!tableData.value.length) {
    ElMessage.warning('无数据可导出')
    return
  }
  const columns = [
    { label: '车牌号', prop: 'vehicleNo' },
    { label: '品牌', prop: 'brand' },
    { label: '型号', prop: 'model' },
    { label: '座位数', prop: 'seats' },
    { label: '车辆类型', formatter: (row) => vehicleTypeMap[row.vehicleType] || row.vehicleType },
    { label: '车牌颜色', formatter: (row) => plateColorMap[row.plateColor] || row.plateColor },
    { label: '所有人', prop: 'ownerName' },
    { label: '注册日期', formatter: (row) => formatDate(row.certifyDateA) },
    { label: '状态', formatter: (row) => (row.state === 1 ? '失效' : '有效') }
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
  link.setAttribute('download', `车辆列表_${new Date().toISOString().slice(0, 19)}.csv`)
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
  fetchCarList()
})
</script>

<style scoped>
.car-list-container {
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