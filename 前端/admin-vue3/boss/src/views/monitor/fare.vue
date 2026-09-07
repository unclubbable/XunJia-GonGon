<template>
  <div class="fare-rule-container">
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

    <el-card shadow="never">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        row-key="cityCode"
        :expand-row-keys="expandRowKeys"
        @expand-change="handleExpandChange"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="vehicle-rule-panel">
              <div class="vehicle-rule-layout">
                <div class="vehicle-chart-wrap">
                  <div class="vehicle-chart-title">{{ row.cityName }} · 车型计价对比</div>
                  <div
                    class="vehicle-chart"
                    :ref="el => setChartRef(row.cityCode, el)"
                  />
                </div>
                <div class="vehicle-table-wrap">
                  <el-table :data="row.vehicleRows" border size="small" style="width: 100%">
                    <el-table-column label="车辆类型" width="100">
                      <template #default="{ row: vRow }">
                        {{ vRow.vehicleTypeName }}
                      </template>
                    </el-table-column>
                    <el-table-column label="起步价" width="90" align="right">
                      <template #default="{ row: vRow }">
                        {{ vRow.configured ? vRow.startFare : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="起步公里" width="90" align="right">
                      <template #default="{ row: vRow }">
                        {{ vRow.configured ? vRow.startMile : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="每公里单价" width="100" align="right">
                      <template #default="{ row: vRow }">
                        {{ vRow.configured ? vRow.unitPricePerMile : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="每分钟单价" width="100" align="right">
                      <template #default="{ row: vRow }">
                        {{ vRow.configured ? vRow.unitPricePerMinute : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="计价版本" width="90" align="center">
                      <template #default="{ row: vRow }">
                        {{ vRow.configured ? vRow.fareVersion : '未配置' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="80" align="center">
                      <template #default="{ row: vRow }">
                        <el-button
                          v-if="vRow.configured"
                          link
                          type="primary"
                          size="small"
                          @click="handleEdit(vRow)"
                        >
                          编辑
                        </el-button>
                        <el-button
                          v-else
                          link
                          type="success"
                          size="small"
                          @click="handleAddSingle(row, vRow)"
                        >
                          配置
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="cityName" label="城市" min-width="160" />
        <el-table-column label="已配置车型" min-width="220">
          <template #default="{ row }">
            <span v-if="row.configuredCount">{{ row.configuredNames }}</span>
            <span v-else class="text-muted">暂无</span>
          </template>
        </el-table-column>
        <el-table-column label="配置进度" width="140" align="center">
          <template #default="{ row }">
            {{ row.configuredCount }} / {{ vehicleTypeOptions.length }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="toggleExpand(row)">
              {{ expandRowKeys.includes(row.cityCode) ? '收起' : '查看车型' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 新增：按城市配置多车型 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增计价规则"
      width="720px"
      :close-on-click-modal="false"
      @closed="resetAddForm"
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addFormRules" label-width="90px">
        <el-form-item label="城市" prop="cityCode">
          <el-select
            v-model="addForm.cityCode"
            placeholder="请选择城市"
            filterable
            style="width: 100%"
            :disabled="addSingleMode"
            @change="onAddCityChange"
          >
            <el-option
              v-for="city in cityOptions"
              :key="city.addressCode"
              :label="city.addressName"
              :value="city.addressCode"
            />
          </el-select>
        </el-form-item>

        <div v-if="addForm.cityCode" class="vehicle-config-list">
          <div class="vehicle-config-tip">勾选需要配置的车辆类型并填写计价参数</div>
          <div
            v-for="item in addForm.vehicleRules"
            :key="item.vehicleType"
            class="vehicle-config-item"
            :class="{ disabled: item.alreadyExists }"
          >
            <div class="vehicle-config-header">
              <el-checkbox
                v-model="item.enabled"
                :disabled="item.alreadyExists || addSingleMode"
              >
                {{ item.vehicleTypeName }}
              </el-checkbox>
              <el-tag v-if="item.alreadyExists" size="small" type="info">已配置</el-tag>
            </div>
            <div v-if="item.enabled && !item.alreadyExists" class="vehicle-config-fields">
              <el-form-item label="起步价" label-width="80px">
                <el-input-number v-model="item.startFare" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
              <el-form-item label="起步里程" label-width="80px">
                <el-input-number v-model="item.startMile" :min="0" :precision="0" style="width: 100%" />
              </el-form-item>
              <el-form-item label="公里单价" label-width="80px">
                <el-input-number v-model="item.unitPricePerMile" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
              <el-form-item label="分钟单价" label-width="80px">
                <el-input-number v-model="item.unitPricePerMinute" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAdd">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑：单个城市下单个车型 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑计价规则"
      width="500px"
      :close-on-click-modal="false"
      @closed="resetEditForm"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-width="110px">
        <el-form-item label="城市">
          <el-input :model-value="editForm.cityName" disabled />
        </el-form-item>
        <el-form-item label="车辆类型">
          <el-input :model-value="editForm.vehicleTypeName" disabled />
          <div class="form-tip">编辑时不可修改城市和车辆类型</div>
        </el-form-item>
        <el-form-item label="起步价" prop="startFare">
          <el-input-number v-model="editForm.startFare" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="起步里程" prop="startMile">
          <el-input-number v-model="editForm.startMile" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每公里单价" prop="unitPricePerMile">
          <el-input-number v-model="editForm.unitPricePerMile" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每分钟单价" prop="unitPricePerMinute">
          <el-input-number v-model="editForm.unitPricePerMinute" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getRuleList, addRule, addRuleBatch, editRule } from '@/api/rules'
import { getDicDistrictlist } from '@/api/city'
import { getDictCarClassAll } from '@/api/dictCarClass'

const vehicleTypeMap = ref({})
const vehicleTypeOptions = ref([])

const loadVehicleTypeDict = async () => {
  try {
    const res = await getDictCarClassAll()
    if (res.code === 1 && Array.isArray(res.data)) {
      const map = {}
      vehicleTypeOptions.value = res.data.map(item => {
        const code = String(item.classCode)
        map[code] = item.className
        return { value: code, label: item.className }
      })
      vehicleTypeMap.value = map
    }
  } catch (e) {
    console.error('获取车辆类型字典失败', e)
  }
}

const cityOptions = ref([])
const searchForm = reactive({ cityCode: '' })

const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const expandRowKeys = ref([])
const submitting = ref(false)

/** 城市已配置车型缓存，用于新增时过滤 */
const cityConfiguredMap = ref({})

const buildVehicleRows = (cityCode, cityName, rules = []) => {
  const ruleMap = {}
  ;(rules || []).forEach(r => {
    ruleMap[String(r.vehicleType)] = r
  })
  return vehicleTypeOptions.value.map(opt => {
    const rule = ruleMap[opt.value]
    return {
      cityCode,
      cityName,
      vehicleType: opt.value,
      vehicleTypeName: opt.label,
      configured: !!rule,
      id: rule?.id,
      startFare: rule?.startFare,
      startMile: rule?.startMile,
      unitPricePerMile: rule?.unitPricePerMile,
      unitPricePerMinute: rule?.unitPricePerMinute,
      fareVersion: rule?.fareVersion,
      fareType: rule?.fareType
    }
  })
}

const fetchCityList = async () => {
  try {
    const res = await getDicDistrictlist()
    if (res.code === 1 && res.data) {
      cityOptions.value = res.data.filter(item => item.level === 2)
    } else {
      ElMessage.error(res.message || '获取城市列表失败')
    }
  } catch (error) {
    ElMessage.error('请求城市列表失败')
  }
}

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
      const configured = { ...cityConfiguredMap.value }
      const items = (res.data.items || []).map(item => {
        const city = cityOptions.value.find(c => c.addressCode === item.cityCode)
        const cityName = city ? city.addressName : item.cityCode
        const rules = item.rules || []
        const vehicleRows = buildVehicleRows(item.cityCode, cityName, rules)
        const configuredRows = vehicleRows.filter(r => r.configured)
        configured[item.cityCode] = configuredRows.map(r => r.vehicleType)
        return {
          cityCode: item.cityCode,
          cityName,
          rules,
          vehicleRows,
          configuredCount: configuredRows.length,
          configuredNames: configuredRows.map(r => r.vehicleTypeName).join('、')
        }
      })
      cityConfiguredMap.value = configured
      tableData.value = items
      total.value = res.data.total || 0
      // 默认展开第一行
      if (items.length && !expandRowKeys.value.length) {
        expandRowKeys.value = [items[0].cityCode]
      }
      refreshExpandedCharts()
    } else {
      ElMessage.error(res.message || '获取规则列表失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  expandRowKeys.value = []
  fetchRuleList()
}

const resetSearch = () => {
  searchForm.cityCode = ''
  handleSearch()
}

const handleSizeChange = val => {
  pageSize.value = val
  fetchRuleList()
}

const handleCurrentChange = val => {
  currentPage.value = val
  fetchRuleList()
}

const handleExpandChange = (row, expandedRows) => {
  expandRowKeys.value = expandedRows.map(r => r.cityCode)
  nextTick(() => {
    expandRowKeys.value.forEach(code => renderCityChart(code))
  })
}

const toggleExpand = row => {
  const idx = expandRowKeys.value.indexOf(row.cityCode)
  if (idx >= 0) {
    expandRowKeys.value = expandRowKeys.value.filter(k => k !== row.cityCode)
  } else {
    expandRowKeys.value = [...expandRowKeys.value, row.cityCode]
  }
  nextTick(() => {
    if (expandRowKeys.value.includes(row.cityCode)) {
      renderCityChart(row.cityCode)
    }
  })
}

// ---------- 展开区左侧折线图 ----------
const chartDomMap = new Map()
const chartInstanceMap = new Map()

const setChartRef = (cityCode, el) => {
  if (el) {
    chartDomMap.set(cityCode, el)
    nextTick(() => renderCityChart(cityCode))
  } else {
    disposeCityChart(cityCode)
    chartDomMap.delete(cityCode)
  }
}

const disposeCityChart = cityCode => {
  const chart = chartInstanceMap.get(cityCode)
  if (chart) {
    chart.dispose()
    chartInstanceMap.delete(cityCode)
  }
}

const buildChartOption = vehicleRows => {
  const categories = vehicleRows.map(r => r.vehicleTypeName)
  const toSeriesData = key =>
    vehicleRows.map(r => (r.configured && r[key] != null ? Number(r[key]) : null))

  return {
    color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'],
    tooltip: {
      trigger: 'axis',
      valueFormatter: val => (val == null ? '未配置' : val)
    },
    legend: {
      data: ['起步价', '起步公里', '每公里单价', '每分钟单价'],
      top: 0,
      textStyle: { fontSize: 12 }
    },
    grid: {
      left: 48,
      right: 20,
      top: 36,
      bottom: 28
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: categories,
      axisLabel: { interval: 0, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    series: [
      {
        name: '起步价',
        type: 'line',
        smooth: true,
        connectNulls: false,
        data: toSeriesData('startFare')
      },
      {
        name: '起步公里',
        type: 'line',
        smooth: true,
        connectNulls: false,
        data: toSeriesData('startMile')
      },
      {
        name: '每公里单价',
        type: 'line',
        smooth: true,
        connectNulls: false,
        data: toSeriesData('unitPricePerMile')
      },
      {
        name: '每分钟单价',
        type: 'line',
        smooth: true,
        connectNulls: false,
        data: toSeriesData('unitPricePerMinute')
      }
    ]
  }
}

const renderCityChart = cityCode => {
  const el = chartDomMap.get(cityCode)
  const row = tableData.value.find(r => r.cityCode === cityCode)
  if (!el || !row) return

  let chart = chartInstanceMap.get(cityCode)
  if (!chart) {
    chart = echarts.init(el)
    chartInstanceMap.set(cityCode, chart)
  }
  chart.setOption(buildChartOption(row.vehicleRows), true)
  chart.resize()
}

const refreshExpandedCharts = () => {
  nextTick(() => {
    expandRowKeys.value.forEach(code => renderCityChart(code))
  })
}

const handleChartResize = () => {
  chartInstanceMap.forEach(chart => chart.resize())
}

// ---------- 新增 ----------
const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addSingleMode = ref(false)
const addForm = reactive({
  cityCode: '',
  vehicleRules: []
})

const addFormRules = {
  cityCode: [{ required: true, message: '请选择城市', trigger: 'change' }]
}

const createEmptyVehicleRules = (preselectType = null, existingTypes = []) => {
  return vehicleTypeOptions.value.map(opt => {
    const alreadyExists = existingTypes.includes(opt.value)
    const enabled = preselectType ? opt.value === preselectType : false
    return {
      vehicleType: opt.value,
      vehicleTypeName: opt.label,
      enabled: enabled && !alreadyExists,
      alreadyExists,
      startFare: 0,
      startMile: 0,
      unitPricePerMile: 0,
      unitPricePerMinute: 0
    }
  })
}

const syncExistingTypesForCity = async cityCode => {
  // 优先用当前页缓存；若城市不在本页，再拉一页该城市数据
  let existing = cityConfiguredMap.value[cityCode]
  if (!existing) {
    try {
      const res = await getRuleList({ page: 1, limit: 1, cityCode })
      if (res.code === 1 && res.data?.items?.length) {
        existing = (res.data.items[0].rules || []).map(r => String(r.vehicleType))
        cityConfiguredMap.value[cityCode] = existing
      } else {
        existing = []
      }
    } catch (e) {
      existing = []
    }
  }
  return existing
}

const onAddCityChange = async cityCode => {
  if (!cityCode) {
    addForm.vehicleRules = []
    return
  }
  const existing = await syncExistingTypesForCity(cityCode)
  addForm.vehicleRules = createEmptyVehicleRules(null, existing)
}

const handleAdd = () => {
  addSingleMode.value = false
  addForm.cityCode = ''
  addForm.vehicleRules = []
  addDialogVisible.value = true
}

const handleAddSingle = async (cityRow, vehicleRow) => {
  addSingleMode.value = true
  addForm.cityCode = cityRow.cityCode
  const existing = await syncExistingTypesForCity(cityRow.cityCode)
  addForm.vehicleRules = createEmptyVehicleRules(vehicleRow.vehicleType, existing)
  addDialogVisible.value = true
}

const resetAddForm = () => {
  addFormRef.value?.resetFields()
  addForm.cityCode = ''
  addForm.vehicleRules = []
  addSingleMode.value = false
}

const submitAdd = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async valid => {
    if (!valid) return
    const selected = addForm.vehicleRules.filter(r => r.enabled && !r.alreadyExists)
    if (!selected.length) {
      ElMessage.warning('请至少勾选一种未配置的车辆类型')
      return
    }
    submitting.value = true
    try {
      const payload = {
        cityCode: addForm.cityCode,
        rules: selected.map(r => ({
          vehicleType: r.vehicleType,
          startFare: r.startFare,
          startMile: r.startMile,
          unitPricePerMile: r.unitPricePerMile,
          unitPricePerMinute: r.unitPricePerMinute
        }))
      }
      // 单车型走原 add，多车型走 batch（内部仍复用 add）
      let res
      if (payload.rules.length === 1) {
        res = await addRule({
          cityCode: payload.cityCode,
          ...payload.rules[0]
        })
      } else {
        res = await addRuleBatch(payload)
      }
      if (res.code === 1) {
        ElMessage.success('新增成功')
        addDialogVisible.value = false
        // 清理该城市缓存后刷新
        delete cityConfiguredMap.value[addForm.cityCode]
        fetchRuleList()
      } else {
        ElMessage.error(res.message || '新增失败')
      }
    } catch (e) {
      ElMessage.error('请求失败')
    } finally {
      submitting.value = false
    }
  })
}

// ---------- 编辑 ----------
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  cityCode: '',
  cityName: '',
  vehicleType: '',
  vehicleTypeName: '',
  startFare: 0,
  startMile: 0,
  unitPricePerMile: 0,
  unitPricePerMinute: 0
})

const editFormRules = {
  startFare: [{ required: true, message: '请输入起步价', trigger: 'blur' }],
  startMile: [{ required: true, message: '请输入起步里程', trigger: 'blur' }],
  unitPricePerMile: [{ required: true, message: '请输入每公里单价', trigger: 'blur' }],
  unitPricePerMinute: [{ required: true, message: '请输入每分钟单价', trigger: 'blur' }]
}

const handleEdit = row => {
  editForm.cityCode = row.cityCode
  editForm.cityName = row.cityName
  editForm.vehicleType = row.vehicleType
  editForm.vehicleTypeName = row.vehicleTypeName
  editForm.startFare = row.startFare
  editForm.startMile = row.startMile
  editForm.unitPricePerMile = row.unitPricePerMile
  editForm.unitPricePerMinute = row.unitPricePerMinute
  editDialogVisible.value = true
}

const resetEditForm = () => {
  editFormRef.value?.resetFields()
}

const submitEdit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async valid => {
    if (!valid) return
    submitting.value = true
    try {
      const res = await editRule({
        cityCode: editForm.cityCode,
        vehicleType: editForm.vehicleType,
        startFare: editForm.startFare,
        startMile: editForm.startMile,
        unitPricePerMile: editForm.unitPricePerMile,
        unitPricePerMinute: editForm.unitPricePerMinute
      })
      if (res.code === 1) {
        ElMessage.success('更新成功')
        editDialogVisible.value = false
        fetchRuleList()
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    } catch (e) {
      ElMessage.error('请求失败')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(async () => {
  await loadVehicleTypeDict()
  await fetchCityList()
  fetchRuleList()
  window.addEventListener('resize', handleChartResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize)
  chartInstanceMap.forEach(chart => chart.dispose())
  chartInstanceMap.clear()
  chartDomMap.clear()
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

.text-muted {
  color: #909399;
}

.vehicle-rule-panel {
  padding: 12px 20px 16px 40px;
  background: #fafafa;
}

.vehicle-rule-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.vehicle-chart-wrap {
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px 12px 4px;
}

.vehicle-chart-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.vehicle-chart {
  width: 100%;
  height: 260px;
}

.vehicle-table-wrap {
  flex: 1;
  min-width: 0;
}

@media (max-width: 1100px) {
  .vehicle-rule-layout {
    flex-direction: column;
  }

  .vehicle-chart {
    height: 220px;
  }
}

.vehicle-config-list {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
}

.vehicle-config-tip {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.vehicle-config-item {
  padding: 12px;
  margin-bottom: 10px;
  background: #f8f9fb;
  border-radius: 4px;
}

.vehicle-config-item.disabled {
  opacity: 0.65;
}

.vehicle-config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.vehicle-config-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
  margin-top: 8px;
}

.vehicle-config-fields :deep(.el-form-item) {
  margin-bottom: 12px;
}
</style>
