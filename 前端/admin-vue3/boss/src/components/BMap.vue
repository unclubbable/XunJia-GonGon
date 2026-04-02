<template>
  <div id="amap-container" class="amap-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import AMapLoader from '@amap/amap-jsapi-loader'

// 地图实例
let map = null
let AMap = null
let markers = [] // 存储所有标记对象
let polyline = null // 路线对象

// 组件挂载时初始化地图
onMounted(() => {
  initMap()
})

// 组件销毁时清理地图实例
onUnmounted(() => {
  if (map) {
    map.destroy()
    map = null
    AMap = null
  }
})
// 初始化地图
const initMap = async () => {
  if (map&&AMap) return // 避免重复初始化
  try {
    window._AMapSecurityConfig = {
      securityJsCode: "4d731e5955206b5a4f13202e4b650cf5",
    };
    AMap = await AMapLoader.load({
      key: '0edaa4cd99fa0698f5ed111ae9716582',
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar']
    })
    map = new AMap.Map('amap-container', {
      zoom: 12,
      center: [116.397428, 39.90923], // 默认北京
      viewMode: '2D'
    })
    // 添加控件
    map.addControl(new AMap.Scale())
    map.addControl(new AMap.ToolBar())
    console.log('地图加载成功');
  } catch (error) {
    console.error('地图加载失败', error)
    ElMessage.error('地图加载失败，请检查网络或Key配置')
  }
}

// 清除地图上的所有覆盖物（标记和路线）
const clearOverlays = () => {
  if (markers.length) {
    markers.forEach(marker => marker.setMap(null))
    markers = []
  }
  if (polyline) {
    polyline.setMap(null)
    polyline = null
  }
}

// 自定义标记内容
const getMarkerContent = (name, type) => {
  const color = type === 'start' ? '#52c41a' : type === 'end' ? '#f5222d' : '#1890ff'
  return `<div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          ${type === 'start' ? 'S' : type === 'end' ? 'E' : '●'}
          </div>`
}

// 安全解析经纬度
const parseLngLat = (val) => {
  if (!val && val !== 0) return null
  const str = String(val).trim() // 去除空格
  const num = parseFloat(str)
  // 严格校验：必须是数字 + 经纬度合法范围
  const isValid = !isNaN(num) && isFinite(num) && num >= -180 && num <= 180
  return isValid ? num : null
}
// 绘制订单轨迹
const drawOrderTrack = async (order) => {
  
  //强制等待地图初始化完成
  await initMap()
  if (!map || !AMap) {
    ElMessage.error('地图未初始化')
    return
  }
  // 清除旧数据
  clearOverlays()

  // 收集轨迹点（按时间顺序）
  const points = []
  console.log(order);
  
  // 工具：批量添加有效坐标
  const addPoint = (lng, lat, name, icon) => {
    const la = parseLngLat(lng)
    const lo = parseLngLat(lat)
    if (la && lo) points.push({ lng: la, lat: lo, name, icon })
  }

  // 安全解析所有坐标
  addPoint(order.receiveOrderCarLongitude, order.receiveOrderCarLatitude, '接单位置', 'waypoint')
  addPoint(order.toPickUpPassengerLongitude, order.toPickUpPassengerLatitude, '去接乘客位置', 'waypoint')
  addPoint(order.depLongitude, order.depLatitude, '出发地', 'start')
  addPoint(order.pickUpPassengerLongitude, order.pickUpPassengerLatitude, '上车点', 'start')
  addPoint(order.passengerGetoffLongitude, order.passengerGetoffLatitude, '下车点', 'end')
  addPoint(order.destLongitude, order.destLatitude, '目的地', 'end')
  



  if (points.length === 0) {
    ElMessage.warning('该订单无有效坐标信息')
    return
  }


  // 添加标记
  points.forEach((point, index) => {
    let iconType = 'waypoint'
    if (index === 0) iconType = 'start'
    if (index === points.length - 1) iconType = 'end'
    const marker = new AMap.Marker({
      position: [point.lng, point.lat],
      title: point.name,
      content: getMarkerContent(point.name, iconType),
    })
    marker.setMap(map)
    markers.push(marker)
  })

  // 绘制路线
  if (points.length >= 2) {
    const path = points.map(p => [p.lng, p.lat])
    console.log(path);
    polyline = new AMap.Polyline({
      path: path,
      strokeColor: '#409eff',
      strokeWeight: 4,
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round'
    })
    polyline.setMap(map)
  }

  // 安全调整视野
  try {
    map.setFitView([...markers, polyline])
  } catch (e) {}
}

// 重置地图（清空所有覆盖物，回到默认视野）
const resetMap = () => {
  if (map) {
    clearOverlays()
    map.setZoomAndCenter(12, [116.397428, 39.90923])
  }
}
/////////////////////////////////////////////////////////实时司机位置绘制
// 车辆标记单独存储（方便后续单独清除，但可与 markers 共用）
let vehicleMarkers = []   // 可选，用于单独管理车辆标记，但这里我们复用 markers

// 绘制车辆位置
const drawVehiclePositions = (vehicles) => {
  if (!map || !AMap) {
    ElMessage.error('地图未初始化')
    return
  }
  // 清除所有已有覆盖物（包括订单轨迹）
  clearOverlays()
  if (!vehicles || vehicles.length === 0) {
    ElMessage.warning('暂无车辆位置数据')
    return
  }

  vehicles.forEach(vehicle => {
    // 只处理有位置数据的车辆
    if (vehicle.location && vehicle.location.longitude && vehicle.location.latitude) {
      const lng = parseFloat(vehicle.location.longitude)
      const lat = parseFloat(vehicle.location.latitude)
      if (isNaN(lng) || isNaN(lat)) return

      // 自定义标记内容（显示车牌号）
      const content = `
        <div style="background-color: #1890ff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          🚗
        </div>
      `
      const marker = new AMap.Marker({
        position: [lng, lat],
        title: vehicle.vehicleNo,
        content: content,
        extData: vehicle   // 存储原始数据，用于信息窗
      })

      // 点击标记时显示信息窗
      const infoWindow = new AMap.InfoWindow({
        content: `
          <div style="padding: 8px; line-height: 1.5;">
            <strong>车牌号：</strong>${vehicle.vehicleNo}<br>
            <strong>最后位置时间：</strong>${vehicle.locatetime || '未知'}<br>
            <strong>终端ID：</strong>${vehicle.tid || '无'}
          </div>
        `,
        offset: new AMap.Pixel(0, -30)
      })
      marker.on('click', () => {
        infoWindow.open(map, marker.getPosition())
      })

      marker.setMap(map)
      markers.push(marker)
    }
  })

  // 如果有标记，自动调整视野使其全部可见
  if (markers.length) {
    map.setFitView(markers)
  }
}

// 根据车牌号定位车辆（使用传入的车辆列表或单独接口）
const searchVehicleByPlate = async (plate, vehicles) => {
  if (!plate) {
    ElMessage.warning('请输入车牌号')
    return
  }
  // 方式一：从已有的 vehicles 中查找
  const target = vehicles?.find(v => v.vehicleNo === plate)
  if (target && target.location && target.location.longitude && target.location.latitude) {
    const lng = parseFloat(target.location.longitude)
    const lat = parseFloat(target.location.latitude)
    if (!isNaN(lng) && !isNaN(lat)) {
      map.setZoomAndCenter(15, [lng, lat])
      // 可选：高亮标记（清除所有标记后重新绘制，或单独修改样式）
      // 简单做法：先清除所有，再重新绘制，并高亮目标车辆
      // 但为了简洁，我们直接调整视野即可，用户可配合信息窗查看
      return
    }
  }
  // 方式二：调用后端接口按车牌查询（如果 vehicles 中没有）
  // 需要引入 getTerminalByVehicleNo
  try {
    const { getTerminalByVehicleNo } = await import('@/api/user')
    const res = await getTerminalByVehicleNo(plate)
    if (res.code === 1 && res.data && res.data.location) {
      const lng = parseFloat(res.data.location.longitude)
      const lat = parseFloat(res.data.location.latitude)
      map.setZoomAndCenter(15, [lng, lat])
      // 可额外在地图上添加一个临时标记高亮（但为了简单，只调整视野）
    } else {
      ElMessage.info('未找到该车辆的位置信息')
    }
  } catch (error) {
    ElMessage.error('查询失败')
  }
}


//////////////////////////////////////////////////////////////////////////////////////
// 暴露方法给父组件
defineExpose({
  initMap,                  // 初始化地图
  drawOrderTrack,           // 绘制订单轨迹
  resetMap,                // 重置地图
  drawVehiclePositions,     // 绘制司机实时位置车辆位置
  searchVehicleByPlate,     // 根据车牌号定位车辆
})


</script>

<style scoped>
.amap-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border-radius: 8px;
  overflow: hidden;
}
</style>