<template>
  <div class="city-stats-container">
    <!-- 顶部操作栏 -->
    <el-card class="action-card" shadow="never">
      <div class="action-bar">
        <div class="search-area">
          <!-- 省份选择器（从高德拉取） -->
          <el-select
            v-model="selectedProvince"
            filterable
            placeholder="选择要同步的省份"
            style="width: 240px"
            :loading="syncLoading"
          >
            <el-option
              v-for="province in provinceOptions"
              :key="province.adcode"
              :label="province.name"
              :value="province.name"
            />
          </el-select>
          <el-button
            type="primary"
            :icon="RefreshRight"
            :loading="syncLoading"
            @click="syncProvince"
          >
            同步省份
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :loading="deleteLoading"
            @click="deleteProvince"
          >
            删除省份
          </el-button>
          <el-button type="success" :icon="Refresh" @click="refreshData">
            刷新
          </el-button>
        </div>
        <div class="info-tip">
          <el-alert
            title="提示：同步操作会将选中省份及其下所有城市数据从高德地图同步到本地；删除操作会移除该省份及其所有下级城市"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon province-icon">
              <el-icon><Flag /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">省级行政区</div>
              <div class="stat-number">{{ provinceCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon city-icon">
              <el-icon><Location /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">市级行政区</div>
              <div class="stat-number">{{ cityCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 地区树形表格（省-市两级） -->
    <el-card shadow="never">
      <div class="tree-header">
        <span class="tree-title">地区字典树（点击节点自动填充省份名）</span>
        <div class="tree-actions">
          <el-button size="small" @click="expandAll">全部展开</el-button>
          <el-button size="small" @click="collapseAll">全部折叠</el-button>
          <el-input
            v-model="filterText"
            placeholder="搜索地区名称/编码"
            clearable
            style="width: 200px"
            @input="filterTree"
          />
        </div>
      </div>
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="treeProps"
        node-key="addressCode"
        :filter-node-method="filterNode"
        :expand-on-click-node="false"
        highlight-current
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span class="tree-node">
            <span>{{ data.addressName }}</span>
            <span class="tree-code">({{ data.addressCode }})</span>
            <el-tag v-if="data.level === 1" size="small" type="primary">省级</el-tag>
            <el-tag v-else size="small" type="success">市级</el-tag>
          </span>
        </template>
      </el-tree>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Flag,
  Location,
  RefreshRight,
  Delete,
  Refresh
} from '@element-plus/icons-vue'
import {
  getDicDistrictlist,           // 获取本地省/市数据
  initDicDistrict,               // 同步省份（关键词为省份名）
  deleteDicDistrict,             // 删除省份及其下级
  getDicDistrictlistprovince    // 获取高德全国省份列表
} from '../../api/city.js'

// 原始数据（扁平数组）
const rawDistrictList = ref([])

// 树形数据
const treeData = ref([])
const treeRef = ref(null)
const filterText = ref('')
const selectedProvince = ref('')        // 选中的省份名称
const syncLoading = ref(false)
const deleteLoading = ref(false)

// 高德省份选项
const provinceOptions = ref([])

// 树形控件配置
const treeProps = {
  children: 'children',
  label: 'addressName'
}

// 扁平化地区列表（用于搜索）
const flatDistrictList = computed(() => {
  const result = []
  const flatten = (nodes) => {
    nodes.forEach(node => {
      result.push({
        addressCode: node.addressCode,
        addressName: node.addressName,
        level: node.level
      })
      if (node.children && node.children.length) {
        flatten(node.children)
      }
    })
  }
  flatten(treeData.value)
  return result
})

// 统计
const provinceCount = computed(() => {
  return treeData.value.length  // 树根节点即为省级
})
const cityCount = computed(() => {
  let count = 0
  const countCities = (nodes) => {
    nodes.forEach(node => {
      if (node.level === 2) count++
      if (node.children) countCities(node.children)
    })
  }
  countCities(treeData.value)
  return count
})

// 构建树形结构（扁平数组转树，仅省-市两级）
const buildTree = (list) => {
  const map = new Map()
  const roots = []
  list.forEach(item => {
    map.set(item.addressCode, { ...item, children: [] })
  })
  list.forEach(item => {
    const node = map.get(item.addressCode)
    if (item.parentAddressCode && item.parentAddressCode !== '0' && map.has(item.parentAddressCode)) {
      const parent = map.get(item.parentAddressCode)
      parent.children.push(node)
    } else {
      // parentAddressCode 为 '0' 或无父节点时视为根节点（省级）
      roots.push(node)
    }
  })
  return roots
}

// 获取本地省/市数据
const fetchDistrictList = async () => {
  try {
    const res = await getDicDistrictlist()
    if (res.code === 1 && res.data) {
      rawDistrictList.value = res.data
      treeData.value = buildTree(rawDistrictList.value)
    } else {
      ElMessage.error(res.message || '获取地区字典失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  }
}

// 获取高德全国省份列表
const fetchProvinceList = async () => {
  try {
    const res = await getDicDistrictlistprovince()
    if (res.code === 1 && res.data) {
      provinceOptions.value = res.data
    } else {
      ElMessage.error(res.message || '获取省份列表失败')
    }
  } catch (error) {
    ElMessage.error('请求省份列表失败')
  }
}

// 同步省份（调用 initDicDistrict）
const syncProvince = async () => {
  if (!selectedProvince.value) {
    ElMessage.warning('请选择要同步的省份')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认同步省份“${selectedProvince.value}”及其下所有城市数据吗？此操作将从高德地图获取最新数据并更新本地。`,
      '确认同步',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    )
    syncLoading.value = true
    console.log(selectedProvince.value);
    
    const res = await initDicDistrict(selectedProvince.value)
    if (res.code === 1) {
      ElMessage.success('同步成功')
      await fetchDistrictList() // 刷新本地数据
    } else {
      ElMessage.error(res.message || '同步失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  } finally {
    syncLoading.value = false
  }
}

// 删除省份及其下级
const deleteProvince = async () => {
  if (!selectedProvince.value) {
    ElMessage.warning('请选择要删除的省份')
    return
  }
  // 检查本地是否存在该省份
  const exists = flatDistrictList.value.some(item =>
    item.addressName === selectedProvince.value && item.level === 1
  )
  if (!exists) {
    ElMessage.warning('本地不存在该省份数据，无法删除')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除省份“${selectedProvince.value}”及其下所有城市吗？此操作不可恢复！`,
      '警告',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    deleteLoading.value = true
    const res = await deleteDicDistrict(selectedProvince.value)
    if (res.code === 1) {
      ElMessage.success('删除成功')
      await fetchDistrictList()
      selectedProvince.value = '' // 清空选择
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  } finally {
    deleteLoading.value = false
  }
}

// 刷新数据（手动）
const refreshData = () => {
  fetchDistrictList()
  fetchProvinceList() // 同时刷新省份下拉列表
}

// 树节点点击，将省份名填入选择框
const handleNodeClick = (data) => {
  if (data.level === 1) {
    selectedProvince.value = data.addressName
  } else {
    // 如果是市级，可向上查找父级省份名称
    const parent = findParentProvince(data.addressCode)
    if (parent) {
      selectedProvince.value = parent.addressName
    }
  }
}

// 根据市级编码查找父级省份
const findParentProvince = (cityCode) => {
  for (const province of treeData.value) {
    if (province.children && province.children.some(city => city.addressCode === cityCode)) {
      return province
    }
  }
  return null
}

// 树形筛选
const filterNode = (value, data) => {
  if (!value) return true
  return data.addressName.includes(value) || data.addressCode.includes(value)
}
const filterTree = () => {
  treeRef.value?.filter(filterText.value)
}

// 展开/折叠全部
const expandAll = () => {
  if (!treeRef.value) return
  const nodes = treeRef.value.store.nodesMap
  for (const key in nodes) {
    if (nodes[key].level === 1) nodes[key].expand()
  }
}
const collapseAll = () => {
  if (!treeRef.value) return
  const nodes = treeRef.value.store.nodesMap
  for (const key in nodes) {
    if (nodes[key].level === 1) nodes[key].collapse()
  }
}

// 监听筛选文本变化
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

// 生命周期
onMounted(() => {
  fetchDistrictList()
  fetchProvinceList()
})
</script>

<style scoped>
.city-stats-container {
  padding: 0;
}

.action-card {
  margin-bottom: 20px;
}

.action-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-area {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.info-tip {
  margin-top: 8px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.province-icon {
  background-color: #e6f7ff;
  color: #1890ff;
}

.city-icon {
  background-color: #e1f3e1;
  color: #67c23a;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.tree-title {
  font-size: 16px;
  font-weight: 600;
}

.tree-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.tree-code {
  color: #8c8c8c;
  font-size: 12px;
}
</style>