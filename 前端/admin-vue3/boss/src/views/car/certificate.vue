<template>
  <div class="certificate-manager">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="车牌号">
          <el-input v-model="searchForm.vehicleNo" placeholder="请输入车牌号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 车辆列表 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="vehicleNo" label="车牌号" width="120" />
        <el-table-column prop="brand" label="品牌" width="120" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column label="运输证有效期" width="200">
          <template #default="{ row }">
            <span :class="{ 'expired-warning': isExpired(row.transDateEnd) }">
              {{ formatDate(row.transDateStart) }} ~ {{ formatDate(row.transDateEnd) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="下次年检" width="120">
          <template #default="{ row }">
            <span :class="{ 'expired-warning': isExpired(row.nextFixDate) }">
              {{ formatDate(row.nextFixDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="年审状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getCheckStateType(row.checkState)" size="small">
              {{ getCheckStateText(row.checkState) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="GPS安装日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.gpsInstallDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.state === 0 ? 'success' : 'danger'" size="small">
              {{ row.state === 0 ? '有效' : '失效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openCertificateDrawer(row)">证件管理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchCarList"
          @current-change="fetchCarList"
        />
      </div>
    </el-card>

    <!-- 证件管理抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="`车辆证件管理 - ${currentCar?.vehicleNo || ''}`"
      size="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="certFormRef"
        :model="certForm"
        label-width="140px"
        class="cert-form"
      >
        <!-- 运输证信息 -->
        <el-divider content-position="left">运输证信息</el-divider>
        <el-form-item label="发证机构">
          <el-input v-model="certForm.transAgency" placeholder="请输入发证机构" />
        </el-form-item>
        <el-form-item label="经营区域">
          <el-input v-model="certForm.transArea" placeholder="请输入经营区域" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="有效期起">
              <el-date-picker v-model="certForm.transDateStart" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期止">
              <el-date-picker v-model="certForm.transDateEnd" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 年检信息 -->
        <el-divider content-position="left">年检信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检修状态">
              <el-select v-model="certForm.fixState" placeholder="请选择">
                <el-option label="未检修" value="0" />
                <el-option label="已检修" value="1" />
                <el-option label="未知" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下次年检时间">
              <el-date-picker v-model="certForm.nextFixDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="年度审验状态">
          <el-select v-model="certForm.checkState" placeholder="请选择">
            <el-option label="未年审" value="0" />
            <el-option label="年审合格" value="1" />
            <el-option label="年审不合格" value="2" />
          </el-select>
        </el-form-item>

        <!-- GPS信息 -->
        <el-divider content-position="left">GPS设备信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="GPS品牌">
              <el-input v-model="certForm.gpsBrand" placeholder="请输入GPS品牌" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="GPS型号">
              <el-input v-model="certForm.gpsModel" placeholder="请输入GPS型号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="GPS安装日期">
          <el-date-picker v-model="certForm.gpsInstallDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>

        <!-- 其他 -->
        <el-divider content-position="left">其他信息</el-divider>
        <el-form-item label="发票打印设备序列号">
          <el-input v-model="certForm.feePrintId" placeholder="请输入发票打印设备序列号" />
        </el-form-item>

        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCertificate" :loading="saving">保存</el-button>
        </div>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getCarList, getCar, createOrUpdateCar } from '@/api/car'

// ---------- 搜索表单 ----------
const searchForm = reactive({
  vehicleNo: '',
  state: null
})

// ---------- 表格数据 ----------
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// ---------- 抽屉相关 ----------
const drawerVisible = ref(false)
const currentCar = ref(null)
const certForm = reactive({
  transAgency: '',
  transArea: '',
  transDateStart: '',
  transDateEnd: '',
  fixState: '',
  nextFixDate: '',
  checkState: '',
  gpsBrand: '',
  gpsModel: '',
  gpsInstallDate: '',
  feePrintId: ''
})
const certFormRef = ref(null)
const saving = ref(false)

// ---------- 辅助函数 ----------
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const isExpired = (dateStr) => {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expireDate = new Date(dateStr)
  expireDate.setHours(0, 0, 0, 0)
  return expireDate < today
}

const getCheckStateText = (state) => {
  const map = { '0': '未年审', '1': '年审合格', '2': '年审不合格' }
  return map[state] || '未知'
}

const getCheckStateType = (state) => {
  const map = { '0': 'danger', '1': 'success', '2': 'warning' }
  return map[state] || 'info'
}

// ---------- 获取车辆列表 ----------
const fetchCarList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...(searchForm.vehicleNo && { vehicleNo: searchForm.vehicleNo })
    }
    const res = await getCarList(params)
    if (res.code === 1 && res.data) {
      tableData.value = res.data.items || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取车辆列表失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchCarList()
}

const resetSearch = () => {
  searchForm.vehicleNo = ''
  searchForm.state = null
  handleSearch()
}

// ---------- 打开证件管理抽屉 ----------
const openCertificateDrawer = async (row) => {
  currentCar.value = row
  try {
    // 获取最新车辆详情，确保数据完整
    const res = await getCar(row.id)
    if (res.code === 1 && res.data) {
      const car = res.data
      // 填充表单
      Object.assign(certForm, {
        transAgency: car.transAgency || '',
        transArea: car.transArea || '',
        transDateStart: car.transDateStart || '',
        transDateEnd: car.transDateEnd || '',
        fixState: car.fixState || '',
        nextFixDate: car.nextFixDate || '',
        checkState: car.checkState || '',
        gpsBrand: car.gpsBrand || '',
        gpsModel: car.gpsModel || '',
        gpsInstallDate: car.gpsInstallDate || '',
        feePrintId: car.feePrintId || ''
      })
    } else {
      ElMessage.error('获取车辆详情失败')
      return
    }
    drawerVisible.value = true
  } catch (error) {
    ElMessage.error('获取车辆详情失败')
  }
}

// ---------- 保存证件信息 ----------
const saveCertificate = async () => {
  if (!currentCar.value) return
  saving.value = true
  try {
    // 构建更新数据：将当前证件表单数据合并到原车辆数据中
    const updateData = {
      ...currentCar.value,
      ...certForm
    }
    const res = await createOrUpdateCar(updateData)
    if (res.code === 1) {
      ElMessage.success('证件信息保存成功')
      drawerVisible.value = false
      // 刷新列表
      fetchCarList()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    saving.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchCarList()
})
</script>

<style scoped>
.certificate-manager {
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

.expired-warning {
  color: #f56c6c;
  font-weight: bold;
}

.drawer-footer {
  text-align: right;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.cert-form {
  padding: 0 12px;
}
</style>