<template>
  <div class="amap-wrap">
    <div :id="containerId" class="amap-container"></div>

    <div v-if="showToolbar" class="amap-toolbar" @mousedown.stop @touchstart.stop>
      <div class="toolbar-group">
        <button
          type="button"
          class="tb-btn"
          :class="{ active: viewMode === '3D' }"
          title="切换 2D / 3D"
          @click="toggleViewMode"
        >
          {{ viewMode === '3D' ? '3D' : '2D' }}
        </button>
        <button
          type="button"
          class="tb-btn"
          title="俯仰 +10°"
          :disabled="viewMode !== '3D'"
          @click="nudgePitch(10)"
        >
          仰
        </button>
        <button
          type="button"
          class="tb-btn"
          title="俯仰 -10°"
          :disabled="viewMode !== '3D'"
          @click="nudgePitch(-10)"
        >
          俯
        </button>
        <button type="button" class="tb-btn" title="向左旋转" @click="nudgeRotation(-30)">
          ↺
        </button>
        <button type="button" class="tb-btn" title="向右旋转" @click="nudgeRotation(30)">
          ↻
        </button>
        <button type="button" class="tb-btn" title="重置视角" @click="resetCamera">
          正北
        </button>
      </div>
      <div class="toolbar-group">
        <button
          type="button"
          class="tb-btn"
          :class="{ active: followFocus }"
          title="追踪当前焦点"
          @click="toggleFollowFocus"
        >
          {{ followFocus ? '跟随中' : '跟随' }}
        </button>
        <button type="button" class="tb-btn" title="缩放到全部覆盖物" @click="fitAll">
          全览
        </button>
        <button
          type="button"
          class="tb-btn"
          :class="{ active: showBuildings }"
          title="三维建筑物（需 3D）"
          :disabled="viewMode !== '3D'"
          @click="toggleBuildings"
        >
          楼块
        </button>
      </div>
      <div v-if="statusText" class="toolbar-status">{{ statusText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import AMapLoader from '@amap/amap-jsapi-loader'
import amapConf from '@/config/amap.js'

const props = defineProps({
  showToolbar: { type: Boolean, default: true },
  // 轨迹页用 3D
  initialViewMode: { type: String, default: '3D' },
  initialPitch: { type: Number, default: 48 },
  center: {
    type: Array,
    default: () => [116.397428, 39.90923]
  },
  zoom: { type: Number, default: 12 }
})

const emit = defineEmits(['ready', 'view-change', 'follow-change'])

const containerId = `amap-${Math.random().toString(36).slice(2, 10)}`
const viewMode = ref(props.initialViewMode === '2D' ? '2D' : '3D')
const followFocus = ref(false)
const showBuildings = ref(true)
const pitch = ref(props.initialPitch)
const rotation = ref(0)

let map = null
let AMap = null
let markers = []
let polylines = []
let controlBar = null
let focusTarget = null
let mapReadyPromise = null
let destroyed = false
let dragOffFollowBound = false

const statusText = computed(() => {
  const parts = [viewMode.value]
  if (viewMode.value === '3D') parts.push(`俯仰 ${Math.round(pitch.value)}°`)
  if (rotation.value) parts.push(`朝向 ${Math.round(((rotation.value % 360) + 360) % 360)}°`)
  if (followFocus.value) parts.push('跟随焦点')
  return parts.join(' · ')
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  destroyed = true
  teardownMap()
})

const teardownMap = () => {
  try {
    if (map && dragOffFollowBound) {
      map.off('dragstart', onUserDrag)
      dragOffFollowBound = false
    }
  } catch (_) { /* ignore */ }
  clearOverlays()
  if (map) {
    try {
      map.destroy()
    } catch (_) { /* ignore */ }
  }
  map = null
  AMap = null
  controlBar = null
  focusTarget = null
  mapReadyPromise = null
}

const onUserDrag = () => {
  if (followFocus.value) {
    followFocus.value = false
    emit('follow-change', false)
  }
}

const ensureSecurityConfig = () => {
  window._AMapSecurityConfig = {
    securityJsCode: amapConf.securityJsCode
  }
}

const initMap = () => {
  if (mapReadyPromise) return mapReadyPromise
  mapReadyPromise = (async () => {
    if (destroyed) return null
    try {
      ensureSecurityConfig()
      await nextTick()
      AMap = await AMapLoader.load({
        key: amapConf.key,
        version: '2.0',
        plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.ControlBar']
      })
      if (destroyed) return null

      // 3D 引擎 pitch=0 当 2D，别重建 map
      const want3D = viewMode.value === '3D'
      const initPitch = want3D ? (pitch.value || props.initialPitch || 48) : 0
      pitch.value = initPitch

      map = new AMap.Map(containerId, {
        zoom: props.zoom,
        center: props.center,
        viewMode: '3D',
        pitch: initPitch,
        rotation: rotation.value,
        mapStyle: 'amap://styles/normal',
        features: showBuildings.value && want3D
          ? ['bg', 'road', 'building', 'point']
          : ['bg', 'road', 'point'],
        resizeEnable: true
      })

      map.addControl(new AMap.Scale({ position: 'LB' }))
      map.addControl(new AMap.ToolBar({ position: 'RB' }))

      try {
        controlBar = new AMap.ControlBar({
          position: { right: '12px', top: '12px' },
          showZoomBar: false,
          showControlButton: true
        })
        map.addControl(controlBar)
      } catch (e) {
        console.warn('ControlBar 加载失败', e)
      }

      map.on('dragstart', onUserDrag)
      dragOffFollowBound = true
      map.on('mapmove', syncCameraFromMap)
      map.on('zoomchange', syncCameraFromMap)
      map.on('rotatechange', syncCameraFromMap)
      map.on('pitchchange', syncCameraFromMap)

      emit('ready', { map, AMap })
      return map
    } catch (error) {
      console.error('地图加载失败', error)
      mapReadyPromise = null
      ElMessage.error('地图加载失败，请检查网络或 Key 配置')
      return null
    }
  })()
  return mapReadyPromise
}

const syncCameraFromMap = () => {
  if (!map) return
  try {
    pitch.value = map.getPitch?.() ?? pitch.value
    rotation.value = map.getRotation?.() ?? rotation.value
  } catch (_) { /* ignore */ }
}

const waitReady = async () => {
  await initMap()
  return !!(map && AMap)
}

const clearOverlays = () => {
  if (markers.length) {
    markers.forEach(marker => {
      try {
        marker.setMap(null)
      } catch (_) { /* ignore */ }
    })
    markers = []
  }
  if (polylines.length) {
    polylines.forEach(line => {
      try {
        line.setMap(null)
      } catch (_) { /* ignore */ }
    })
    polylines = []
  }
}

const parseCoord = (val) => {
  if (val === null || val === undefined || val === '') return null
  const num = parseFloat(String(val).trim())
  if (Number.isNaN(num) || !Number.isFinite(num)) return null
  return num
}

const parseLngLat = (lng, lat) => {
  const lngNum = parseCoord(lng)
  const latNum = parseCoord(lat)
  if (lngNum === null || latNum === null) return null
  if (lngNum < -180 || lngNum > 180 || latNum < -90 || latNum > 90) return null
  return [lngNum, latNum]
}

const getMarkerContent = (label, type) => {
  const colorMap = {
    start: '#52c41a',
    end: '#f5222d',
    waypoint: '#1890ff',
    planned: '#faad14',
    vehicle: '#1890ff'
  }
  const color = colorMap[type] || colorMap.waypoint
  const icon = type === 'start' ? '起' : type === 'end' ? '终' : type === 'vehicle' ? '车' : '●'
  const safeLabel = String(label || '').replace(/[<>&"']/g, '')
  return `<div title="${safeLabel}" style="background:${color};min-width:26px;height:26px;padding:0 4px;border-radius:13px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);white-space:nowrap;">
    ${icon}
  </div>`
}

const addMarker = (lngLat, label, type) => {
  if (!map || !AMap) return null
  const marker = new AMap.Marker({
    position: lngLat,
    title: label,
    content: getMarkerContent(label, type),
    zIndex: type === 'waypoint' ? 110 : 120
  })
  marker.setMap(map)
  markers.push(marker)
  return marker
}

const addPolyline = (path, options = {}) => {
  if (!map || !AMap || !path || path.length < 2) return null
  const line = new AMap.Polyline({
    path,
    strokeColor: options.strokeColor || '#1890ff',
    strokeWeight: options.strokeWeight || 5,
    strokeOpacity: options.strokeOpacity ?? 0.85,
    strokeStyle: options.strokeStyle || 'solid',
    lineJoin: 'round',
    lineCap: 'round',
    zIndex: options.zIndex || 100
  })
  line.setMap(map)
  polylines.push(line)
  return line
}

const setFocus = (lngLat, meta = {}) => {
  if (!lngLat || lngLat.length < 2) {
    focusTarget = null
    return
  }
  focusTarget = { lngLat: [...lngLat], ...meta }
  if (followFocus.value && map) {
    try {
      map.setCenter(focusTarget.lngLat)
    } catch (_) { /* ignore */ }
  }
}

const applyFollowIfNeeded = () => {
  if (!followFocus.value || !map || !focusTarget?.lngLat) return
  try {
    map.panTo(focusTarget.lngLat)
  } catch (_) {
    try {
      map.setCenter(focusTarget.lngLat)
    } catch (__) { /* ignore */ }
  }
}

const buildActualPath = (trip = {}, trackPoints = []) => {
  // 蓝色实线只使用实际上报轨迹点；关键节点用 Marker 展示，勿拼进折线，
  // 否则节点间直线会把「出发地-目的地」再连一遍，与真实轨迹围成闭合圈。
  const path = []
  ;(trackPoints || []).forEach((p) => {
    const pos = parseLngLat(p.longitude, p.latitude)
    if (!pos) return
    const last = path[path.length - 1]
    if (!last || last[0] !== pos[0] || last[1] !== pos[1]) {
      path.push(pos)
    }
  })
  return path
}

const drawOrderTrack = async (payload) => {
  const ready = await waitReady()
  if (!ready) {
    ElMessage.error('地图未初始化')
    return
  }

  const { trip = {}, trackPoints = [], trackMeta = {}, silentNoTrack = false } = payload || {}
  clearOverlays()

  const fitTargets = []

  const waypointDefs = [
    { lng: trip.receiveOrderCarLongitude, lat: trip.receiveOrderCarLatitude, label: '接单位置', type: 'waypoint' },
    { lng: trip.toPickUpPassengerLongitude, lat: trip.toPickUpPassengerLatitude, label: '去接乘客', type: 'waypoint' },
    { lng: trip.depLongitude, lat: trip.depLatitude, label: '预计出发地', type: 'planned' },
    { lng: trip.pickUpPassengerLongitude, lat: trip.pickUpPassengerLatitude, label: '乘客上车', type: 'start' },
    { lng: trip.passengerGetoffLongitude, lat: trip.passengerGetoffLatitude, label: '乘客下车', type: 'end' },
    { lng: trip.destLongitude, lat: trip.destLatitude, label: '预计目的地', type: 'planned' }
  ]

  waypointDefs.forEach(item => {
    const pos = parseLngLat(item.lng, item.lat)
    if (!pos) return
    const marker = addMarker(pos, item.label, item.type)
    if (marker) fitTargets.push(marker)
  })

  const depPos = parseLngLat(trip.depLongitude, trip.depLatitude)
  const destPos = parseLngLat(trip.destLongitude, trip.destLatitude)
  if (depPos && destPos) {
    const plannedLine = addPolyline([depPos, destPos], {
      strokeColor: '#faad14',
      strokeWeight: 3,
      strokeOpacity: 0.6,
      strokeStyle: 'dashed',
      zIndex: 50
    })
    if (plannedLine) fitTargets.push(plannedLine)
  }

  const gpsPath = buildActualPath(trip, trackPoints)

  if (gpsPath.length >= 2) {
    const trackLine = addPolyline(gpsPath, {
      strokeColor: '#1890ff',
      strokeWeight: 6,
      strokeOpacity: 0.9,
      zIndex: 200
    })
    if (trackLine) fitTargets.push(trackLine)
    setFocus(gpsPath[Math.floor(gpsPath.length / 2)])
  } else if (gpsPath.length === 1) {
    const m = addMarker(gpsPath[0], '轨迹点', 'waypoint')
    if (m) fitTargets.push(m)
    setFocus(gpsPath[0])
  } else if (depPos) {
    setFocus(depPos)
  }

  if (fitTargets.length === 0) {
    if (!silentNoTrack) {
      ElMessage.warning('该订单无有效坐标，无法绘制轨迹')
    }
    return
  }

  try {
    map.setFitView(fitTargets, false, [80, 80, 80, 80])
  } catch (e) {
    // ignore
  }

  const rawCount = trackMeta?.rawPointCount ?? trackPoints.length
  const outCount = trackMeta?.pointCount ?? trackPoints.length
  if (gpsPath.length >= 2) {
    ElMessage.success(
      `轨迹已绘制：折线 ${gpsPath.length} 点` +
      (trackPoints.length ? `（上报 ${outCount} 点${rawCount !== outCount ? `，原始 ${rawCount}` : ''}）` : '')
    )
  } else if (!silentNoTrack) {
    ElMessage.info('暂无实际上报轨迹，已展示订单关键节点与预计起终点')
  }
}

const resetMap = async () => {
  const ready = await waitReady()
  if (!ready) return
  clearOverlays()
  focusTarget = null
  followFocus.value = false
  try {
    map.setZoomAndCenter(props.zoom, props.center)
    resetCamera()
  } catch (_) { /* ignore */ }
}

const drawVehiclePositions = async (vehicles) => {
  const ready = await waitReady()
  if (!ready) {
    ElMessage.error('地图未初始化')
    return
  }
  clearOverlays()
  if (!vehicles || vehicles.length === 0) {
    ElMessage.warning('暂无车辆位置数据')
    return
  }

  const prevFocusPlate = focusTarget?.vehicleNo || null
  let restoredFocus = null
  let firstPos = null

  vehicles.forEach(vehicle => {
    if (!vehicle?.location?.longitude || !vehicle?.location?.latitude) return
    const pos = parseLngLat(vehicle.location.longitude, vehicle.location.latitude)
    if (!pos) return
    if (!firstPos) firstPos = pos
    if (prevFocusPlate && vehicle.vehicleNo === prevFocusPlate) {
      restoredFocus = pos
    }

    const plate = String(vehicle.vehicleNo || '').replace(/[<>&"']/g, '')
    const content = `
      <div style="background:linear-gradient(135deg,#1890ff,#40a9ff);min-width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(24,144,255,0.45);">
        车
      </div>
    `
    const marker = new AMap.Marker({
      position: pos,
      title: plate,
      content,
      extData: vehicle,
      zIndex: 130
    })

    const infoWindow = new AMap.InfoWindow({
      content: `
        <div style="padding:10px 12px;line-height:1.6;min-width:180px;font-size:13px;color:#1f2f3d;">
          <div style="font-weight:600;margin-bottom:6px;color:#1890ff;">${plate || '未知车牌'}</div>
          <div><span style="color:#8c8c8c;">定位时间</span> ${vehicle.locatetime || '未知'}</div>
          <div><span style="color:#8c8c8c;">终端 ID</span> ${vehicle.tid || '无'}</div>
        </div>
      `,
      offset: new AMap.Pixel(0, -30)
    })
    marker.on('click', () => {
      infoWindow.open(map, marker.getPosition())
      focusTarget = { lngLat: pos, vehicleNo: vehicle.vehicleNo }
      if (followFocus.value) applyFollowIfNeeded()
    })

    marker.setMap(map)
    markers.push(marker)
  })

  if (restoredFocus) {
    focusTarget = { lngLat: restoredFocus, vehicleNo: prevFocusPlate }
  } else if (!focusTarget && firstPos) {
    focusTarget = { lngLat: firstPos }
  }

  if (markers.length) {
    if (followFocus.value && focusTarget?.lngLat) {
      applyFollowIfNeeded()
    } else {
      try {
        map.setFitView(markers, false, [60, 60, 60, 60])
      } catch (_) { /* ignore */ }
    }
  }
}

const searchVehicleByPlate = async (plate, vehicles) => {
  if (!plate) {
    ElMessage.warning('请输入车牌号')
    return
  }
  const ready = await waitReady()
  if (!ready) return

  const target = vehicles?.find(v => v.vehicleNo === plate)
  if (target?.location?.longitude && target?.location?.latitude) {
    const pos = parseLngLat(target.location.longitude, target.location.latitude)
    if (pos) {
      map.setZoomAndCenter(16, pos)
      setFocus(pos, { vehicleNo: plate })
      followFocus.value = true
      emit('follow-change', true)
      return
    }
  }
  try {
    const { getTerminalByVehicleNo } = await import('@/api/user')
    const res = await getTerminalByVehicleNo(plate)
    if (res.code === 1 && res.data?.location) {
      const pos = parseLngLat(res.data.location.longitude, res.data.location.latitude)
      if (pos) {
        map.setZoomAndCenter(16, pos)
        setFocus(pos, { vehicleNo: plate })
        followFocus.value = true
        emit('follow-change', true)
        return
      }
    }
    ElMessage.info('未找到该车辆的位置信息')
  } catch (error) {
    ElMessage.error('查询失败')
  }
}

const toggleViewMode = () => {
  if (!map) return
  if (viewMode.value === '3D') {
    viewMode.value = '2D'
    try {
      map.setPitch(0, false)
      pitch.value = 0
      map.setFeatures(['bg', 'road', 'point'])
    } catch (e) {
      console.warn(e)
    }
  } else {
    viewMode.value = '3D'
    const nextPitch = props.initialPitch || 48
    try {
      map.setPitch(nextPitch, true)
      pitch.value = nextPitch
      if (showBuildings.value) {
        map.setFeatures(['bg', 'road', 'building', 'point'])
      }
    } catch (e) {
      console.warn(e)
      ElMessage.warning('当前环境可能不支持 3D 视角，请确认 Key 已开通 JSAPI 3D')
    }
  }
  emit('view-change', { viewMode: viewMode.value, pitch: pitch.value, rotation: rotation.value })
}

const nudgePitch = (delta) => {
  if (!map || viewMode.value !== '3D') return
  const next = Math.min(83, Math.max(0, (map.getPitch?.() ?? pitch.value) + delta))
  try {
    map.setPitch(next, true)
    pitch.value = next
  } catch (_) { /* ignore */ }
}

const nudgeRotation = (delta) => {
  if (!map) return
  const cur = map.getRotation?.() ?? rotation.value
  const next = cur + delta
  try {
    map.setRotation(next, true)
    rotation.value = next
  } catch (_) { /* ignore */ }
}

const resetCamera = () => {
  if (!map) return
  try {
    map.setRotation(0, true)
    rotation.value = 0
    if (viewMode.value === '3D') {
      const p = props.initialPitch || 48
      map.setPitch(p, true)
      pitch.value = p
    } else {
      map.setPitch(0, false)
      pitch.value = 0
    }
  } catch (_) { /* ignore */ }
}

const toggleFollowFocus = () => {
  followFocus.value = !followFocus.value
  emit('follow-change', followFocus.value)
  if (followFocus.value) applyFollowIfNeeded()
}

const setFollowFocus = (enabled) => {
  followFocus.value = !!enabled
  emit('follow-change', followFocus.value)
  if (followFocus.value) applyFollowIfNeeded()
}

const toggleBuildings = () => {
  if (!map || viewMode.value !== '3D') return
  showBuildings.value = !showBuildings.value
  try {
    map.setFeatures(
      showBuildings.value
        ? ['bg', 'road', 'building', 'point']
        : ['bg', 'road', 'point']
    )
  } catch (_) { /* ignore */ }
}

const fitAll = () => {
  if (!map) return
  const targets = [...markers, ...polylines]
  if (!targets.length) {
    ElMessage.info('暂无覆盖物可全览')
    return
  }
  try {
    map.setFitView(targets, false, [80, 80, 80, 80])
  } catch (_) { /* ignore */ }
}

defineExpose({
  initMap,
  drawOrderTrack,
  resetMap,
  drawVehiclePositions,
  searchVehicleByPlate,
  setFocus,
  setFollowFocus,
  toggleViewMode,
  fitAll,
  getMap: () => map
})
</script>

<style scoped>
.amap-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  border-radius: 12px;
  overflow: hidden;
  background: #e8eef5;
}

.amap-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.amap-toolbar {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: calc(100% - 24px);
  pointer-events: none;
}

.toolbar-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  pointer-events: auto;
  padding: 6px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(15, 35, 52, 0.08);
  border: 1px solid rgba(232, 236, 240, 0.9);
}

.tb-btn {
  appearance: none;
  border: 1px solid #e8ecf0;
  background: #fff;
  color: #1f2f3d;
  font-size: 12px;
  font-weight: 600;
  height: 30px;
  min-width: 36px;
  padding: 0 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.tb-btn:hover:not(:disabled) {
  border-color: #91d5ff;
  color: #1890ff;
  background: #e6f7ff;
}

.tb-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.tb-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar-status {
  pointer-events: none;
  align-self: flex-start;
  font-size: 11px;
  color: #595959;
  background: rgba(255, 255, 255, 0.88);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #e8ecf0;
}
</style>
