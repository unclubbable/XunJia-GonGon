<template>
	<view class="xj-map">
		<!-- 固定 id：uni-app + 高德 JSAPI 对动态 id / 自闭合 view 容易找不到容器 -->
		<view
			:id="mapDomId"
			class="xj-map__canvas"
			:eventBus="eventBus"
			:change:eventBus="renderScript.receiveEvent"
		></view>
		<view v-if="showTools" class="xj-map__tools">
			<view
				class="tool-btn"
				:class="{ active: viewMode === '3D' }"
				@click="toggleViewMode"
			>{{ viewMode === '3D' ? '3D' : '2D' }}</view>
			<view
				class="tool-btn"
				:class="{ active: followFocus }"
				@click="toggleFollow"
			>{{ followFocus ? '跟随中' : '跟随' }}</view>
		</view>
		<!-- 定位：右下角，与比例尺同高、在比例尺右侧；纯靶心图标 -->
		<view
			v-if="showTools"
			class="xj-map__locate"
			:style="{ bottom: locateBottomPx }"
			@click="handleLocate"
		>
			<view class="locate-crosshair" aria-hidden="true">
				<view class="locate-crosshair__ring" />
				<view class="locate-crosshair__dot" />
				<view class="locate-crosshair__h" />
				<view class="locate-crosshair__v" />
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		showTools: { type: Boolean, default: true },
		initialViewMode: { type: String, default: '2D' },
		pitch3D: { type: Number, default: 60 },
		bottomPadding: { type: Number, default: 160 },
		/**
		 * 定位按钮模式：
		 * auto  — 有起终点/轨迹则缩放到订单区域，否则回到我的位置
		 * self  — 始终回到当前位置
		 * order — 始终缩放到订单起终点/轨迹区域
		 */
		locateMode: { type: String, default: 'auto' }
	},
	data() {
		return {
			eventBus: {},
			searchFn: null,
			viewMode: this.initialViewMode === '3D' ? '3D' : '2D',
			followFocus: false,
			deviceHeading: null,
			/** 每页唯一，避免 H5 路由栈里多个 #map-container 抢同一实例 */
			mapDomId: `map-container-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
		}
	},
	computed: {
		city() {
			return this.$store.state.city
		},
		/** 与比例尺同一底边，贴在比例尺右侧（地图右下角） */
		locateBottomPx() {
			const bottom = Math.max(16, Number(this.bottomPadding) || 160)
			return `${bottom}px`
		}
	},
	mounted() {
		this.$nextTick(() => {
			this.pushEvent('bootstrap', {
				viewMode: this.viewMode,
				pitch3D: this.pitch3D,
				bottomPadding: this.bottomPadding,
				mapDomId: this.mapDomId
			})
		})
		this.startHeadingWatch()
	},
	watch: {
		bottomPadding(val) {
			this.pushEvent('setBottomPadding', { bottomPadding: Number(val) || 160 })
		}
	},
	beforeUnmount() {
		this.stopHeadingWatch()
	},
	// #ifdef VUE2
	beforeDestroy() {
		this.stopHeadingWatch()
	},
	// #endif
	methods: {
		pushEvent(name, payload) {
			this.eventBus = { name, args: [payload], city: this.city, _t: Date.now() }
		},
		startHeadingWatch() {
			try {
				uni.startCompass({
					success: () => {
						uni.onCompassChange((res) => {
							const heading = Number(res && res.direction)
							if (!Number.isFinite(heading)) return
							this.deviceHeading = heading
							this.pushEvent('setHeading', { heading })
						})
					}
				})
			} catch (e) {
				console.warn('罗盘不可用', e)
			}
		},
		stopHeadingWatch() {
			try {
				uni.offCompassChange()
				uni.stopCompass()
			} catch (_) { /* ignore */ }
		},
		setLocation(...args) {
			const loc = args[0] || {}
			if (loc && this.deviceHeading != null && loc.heading == null) {
				loc.heading = this.deviceHeading
			}
			this.eventBus = { name: 'setLocation', args: [loc, ...args.slice(1)], _t: Date.now() }
		},
		driving(...args) {
			this.eventBus = { name: 'driving', args, _t: Date.now() }
		},
		markerDepDestPosition(...args) {
			this.eventBus = { name: 'markerDepDestPosition', args, _t: Date.now() }
		},
		driverUpdatePosition(...args) {
			this.eventBus = {
				name: 'driverUpdatePosition',
				args,
				follow: this.followFocus,
				_t: Date.now()
			}
		},
		clearDriving(...args) {
			this.eventBus = { name: 'clearDriving', args, _t: Date.now() }
		},
		search(cb, ...args) {
			this.searchFn = cb
			this.eventBus = { name: 'search', args, city: this.city, _t: Date.now() }
		},
		searchResult(res) {
			if (typeof this.searchFn === 'function') {
				this.searchFn(res)
			}
		},
		updateLocationMarker(location) {
			const loc = location || {}
			if (loc.heading == null && this.deviceHeading != null) {
				loc.heading = this.deviceHeading
			}
			this.eventBus = {
				name: 'updateLocationMarker',
				args: [loc],
				follow: this.followFocus,
				_t: Date.now()
			}
		},
		toggleViewMode() {
			this.viewMode = this.viewMode === '3D' ? '2D' : '3D'
			this.pushEvent('setViewMode', {
				viewMode: this.viewMode,
				pitch3D: this.pitch3D
			})
		},
		toggleFollow() {
			this.followFocus = !this.followFocus
			this.pushEvent('setFollow', { follow: this.followFocus })
		},
		setFollow(enabled) {
			this.followFocus = !!enabled
			this.pushEvent('setFollow', { follow: this.followFocus })
		},
		handleLocate() {
			if (this.followFocus) {
				this.followFocus = false
			}
			// 单次事件：定位时同步关闭跟随（避免 eventBus 覆盖丢 setFollow）
			this.pushEvent('locate', {
				mode: this.locateMode || 'auto',
				bottomPadding: this.bottomPadding,
				clearFollow: true
			})
		},
		fitView() {
			this.pushEvent('fitView', { bottomPadding: this.bottomPadding })
		},
		resetNorth() {
			this.pushEvent('resetNorth', {})
		},
		setBottomPadding(px) {
			this.pushEvent('setBottomPadding', { bottomPadding: Number(px) || 160 })
		},
		recenterSelf(zoom) {
			this.pushEvent('recenterSelf', { zoom })
		},
		/** 完成后轨迹回放：points=[{longitude,latitude}]，可选 dep/dest */
		drawOrderTrack(payload) {
			this.eventBus = { name: 'drawOrderTrack', args: [payload || {}], _t: Date.now() }
		},
		onFollowOffByDrag() {
			this.followFocus = false
		}
	}
}
</script>

<script module="renderScript" lang="renderjs">
import AMapLoader from '@amap/amap-jsapi-loader'
import gdMapConf from '../config/gdMapConf.js'

window._AMapSecurityConfig = {
	securityJsCode: gdMapConf.securityJsCode
}

let AMap = null
let map = null
let driving = null
let driverMarker = null
let currentLocationMarker = null
let currentLocationCircle = null
let depMarkerRef = null
let destMarkerRef = null
let trackPolyline = null
let plannedPolyline = null
let scaleControl = null
let followEnabled = false
let bottomPadding = 160
let desiredViewMode = '2D'
let pitch3D = 60
let loadPromise = null
let creating = false
let deviceHeading = 0
let buildingLayer = null

const BRAND = '#318eff'
const MAP_DOM_ID = 'map-container'
/** 楼块通常要 zoom≥16 才看得见 */
const BUILDING_MIN_ZOOM = 17
/** 当前实例绑定的容器 id（bootstrap 注入） */
let mapDomId = MAP_DOM_ID
/** 最近一次驾车规划的路线点，供定位按钮再次框选 */
let lastRoutePoints = null

function safeParseCoord(v) {
	const n = parseFloat(v)
	return Number.isFinite(n) ? n : null
}

function resetMapState() {
	try {
		if (map && typeof map.destroy === 'function') map.destroy()
	} catch (_) { /* ignore */ }
	map = null
	driving = null
	driverMarker = null
	currentLocationMarker = null
	currentLocationCircle = null
	depMarkerRef = null
	destMarkerRef = null
	trackPolyline = null
	plannedPolyline = null
	scaleControl = null
	buildingLayer = null
	lastRoutePoints = null
	loadPromise = null
	creating = false
	followEnabled = false
}

function isCurrentMapBoundToContainer(expectedEl) {
	if (!map) return false
	try {
		const container = typeof map.getContainer === 'function' ? map.getContainer() : null
		if (!container) return false
		if (expectedEl && container !== expectedEl) return false
		if (typeof document !== 'undefined' && document.body && !document.body.contains(container)) {
			return false
		}
		return true
	} catch (_) {
		return false
	}
}

/**
 * 高德 setFitView / setBounds 的 avoid：上、下、左、右（不是上右下左）
 */
function getFitPadding(extraBottom) {
	const bottom = Math.max(Number(extraBottom != null ? extraBottom : bottomPadding) || 160, 100)
	return [48, bottom + 16, 20, 64]
}

function safeMapResize() {
	if (!map) return
	try {
		map.resize()
	} catch (_) { /* ignore */ }
}

function fitMapTo(overlays, extraBottom) {
	if (!map) return
	safeMapResize()
	const pad = getFitPadding(extraBottom)
	const list = (overlays || []).filter(Boolean)
	try {
		if (list.length) {
			map.setFitView(list, false, pad)
		} else {
			map.setFitView(null, false, pad)
		}
	} catch (_) { /* ignore */ }
}

/** 从 LngLat / [lng,lat] / {lng,lat} 取出数值坐标 */
function toLngLatPair(p) {
	if (!p) return null
	if (typeof p.getLng === 'function') {
		const lng = p.getLng()
		const lat = p.getLat()
		return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null
	}
	if (Array.isArray(p) && p.length >= 2) {
		const lng = safeParseCoord(p[0])
		const lat = safeParseCoord(p[1])
		return lng != null && lat != null ? [lng, lat] : null
	}
	if (p.lng != null && p.lat != null) {
		const lng = safeParseCoord(p.lng)
		const lat = safeParseCoord(p.lat)
		return lng != null && lat != null ? [lng, lat] : null
	}
	return null
}

/**
 * 按起终点 + 驾车路线点适配视野（避免 Driving 覆盖物尚未注册时 setFitView(null) 失效）
 */
function fitMapToRoutePoints(points, extraBottom) {
	if (!map || !AMap || !points || !points.length) return false
	safeMapResize()
	const pad = getFitPadding(extraBottom)
	const pairs = []
	points.forEach((p) => {
		const pair = toLngLatPair(p)
		if (pair) pairs.push(pair)
	})
	if (!pairs.length) return false

	try {
		const sw = [pairs[0][0], pairs[0][1]]
		const ne = [pairs[0][0], pairs[0][1]]
		pairs.forEach(([lng, lat]) => {
			if (lng < sw[0]) sw[0] = lng
			if (lat < sw[1]) sw[1] = lat
			if (lng > ne[0]) ne[0] = lng
			if (lat > ne[1]) ne[1] = lat
		})
		// 起终点几乎重合时略扩 bounds，避免 zoom 过大
		if (Math.abs(ne[0] - sw[0]) < 1e-6 && Math.abs(ne[1] - sw[1]) < 1e-6) {
			sw[0] -= 0.01
			sw[1] -= 0.01
			ne[0] += 0.01
			ne[1] += 0.01
		}
		const bounds = new AMap.Bounds(sw, ne)
		if (typeof map.setBounds === 'function') {
			map.setBounds(bounds, false, pad)
			return true
		}
	} catch (_) { /* fall through */ }

	try {
		if (plannedPolyline) {
			try { map.remove(plannedPolyline) } catch (__) { /* ignore */ }
			plannedPolyline = null
		}
		plannedPolyline = new AMap.Polyline({
			path: pairs,
			strokeOpacity: 0,
			strokeWeight: 1,
			zIndex: 1
		})
		plannedPolyline.setMap(map)
		fitMapTo([plannedPolyline], extraBottom)
		return true
	} catch (_) {
		return false
	}
}

function collectDrivingRoutePoints(result, start, end) {
	const points = []
	if (start) points.push(start)
	if (end) points.push(end)
	try {
		const route = result && result.routes && result.routes[0]
		const steps = route && route.steps
		if (Array.isArray(steps)) {
			steps.forEach((step) => {
				const path = step && step.path
				if (!path || !path.length) return
				for (let i = 0; i < path.length; i++) {
					points.push(path[i])
				}
			})
		}
	} catch (_) { /* ignore */ }
	return points
}

/** 单点居中：仅用 setFitView 留白（与订单页一致），不用 panBy */
function centerAtVisible(lngLat, zoom) {
	if (!map || !lngLat) return
	safeMapResize()
	try {
		if (zoom != null) map.setZoom(zoom)
		map.setCenter(lngLat)
	} catch (_) {
		try {
			map.panTo(lngLat)
		} catch (__) { /* ignore */ }
	}
}

function centerMarkerInVisibleArea(marker, zoom) {
	if (!map || !marker) return
	safeMapResize()
	const pad = getFitPadding()
	const maxZoom = zoom != null ? zoom : (map.getZoom() || 18)
	try {
		const fit = map.getFitZoomAndCenterByOverlays([marker], pad, maxZoom)
		if (fit && fit.length >= 2) {
			const z = zoom != null ? zoom : fit[0]
			map.setZoomAndCenter(z, fit[1], false)
			return
		}
	} catch (_) { /* ignore */ }
	centerAtVisible(marker.getPosition(), zoom)
}

function centerLngLatInVisibleArea(lngLat, zoom) {
	if (!map || !lngLat || !AMap) return
	safeMapResize()
	const pad = getFitPadding()
	const maxZoom = zoom != null ? zoom : (map.getZoom() || 18)
	try {
		const tmp = new AMap.Marker({ position: lngLat })
		const fit = map.getFitZoomAndCenterByOverlays([tmp], pad, maxZoom)
		if (fit && fit.length >= 2) {
			const z = zoom != null ? zoom : fit[0]
			map.setZoomAndCenter(z, fit[1], false)
			return
		}
	} catch (_) { /* ignore */ }
	centerAtVisible(lngLat, zoom)
}

/** 朝向箭头 DOM（尖端朝上=北，配合 Marker.angle 旋转） */
function buildHeadingArrowContent() {
	return `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;transform-origin:center center;">
		<svg width="36" height="36" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
			<circle cx="20" cy="20" r="18" fill="${BRAND}" fill-opacity="0.2"/>
			<path d="M20 4 L31 30 L20 24 L9 30 Z" fill="${BRAND}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
		</svg>
	</div>`
}

function normalizeHeading(v) {
	const n = Number(v)
	if (!Number.isFinite(n)) return deviceHeading || 0
	return ((n % 360) + 360) % 360
}

function enableBuildingVisual() {
	if (!map || !AMap) return
	try {
		map.setFeatures(['bg', 'road', 'building', 'point'])
	} catch (_) { /* ignore */ }
	try {
		map.setStatus({
			showBuildingBlock: true,
			pitchEnable: true,
			rotateEnable: true
		})
	} catch (_) { /* ignore */ }
	try {
		// 俯仰不够时楼块几乎看不出来
		const pitch = Math.max(map.getPitch() || 0, pitch3D || 60, 60)
		map.setPitch(pitch, true)
	} catch (_) { /* ignore */ }
	try {
		const z = map.getZoom()
		if (z < BUILDING_MIN_ZOOM) {
			map.setZoom(BUILDING_MIN_ZOOM)
		}
	} catch (_) { /* ignore */ }
	try {
		if (!buildingLayer) {
			buildingLayer = new AMap.Buildings({
				zIndex: 130,
				zooms: [15, 20],
				heightFactor: 1.2
			})
			if (typeof map.add === 'function') {
				map.add(buildingLayer)
			} else if (typeof map.addLayer === 'function') {
				map.addLayer(buildingLayer)
			}
		} else {
			if (typeof buildingLayer.show === 'function') buildingLayer.show()
			else if (typeof buildingLayer.setMap === 'function') buildingLayer.setMap(map)
			else if (typeof map.add === 'function') map.add(buildingLayer)
		}
	} catch (e) {
		console.warn('添加楼块图层失败（将依赖地图原生 building）', e)
	}
	// 强制刷新一帧，避免切换后楼块不重绘
	try {
		map.setZoom(map.getZoom())
	} catch (_) { /* ignore */ }
}

function disableBuildingVisual() {
	if (!map) return
	try {
		map.setFeatures(['bg', 'road', 'point'])
	} catch (_) { /* ignore */ }
	try {
		map.setStatus({ showBuildingBlock: false })
	} catch (_) { /* ignore */ }
	if (buildingLayer) {
		try {
			if (typeof buildingLayer.hide === 'function') buildingLayer.hide()
			else if (typeof buildingLayer.setMap === 'function') buildingLayer.setMap(null)
			else map.remove(buildingLayer)
		} catch (_) { /* ignore */ }
	}
}

function waitMap(ctx, fn, args, retry = 0) {
	if (map && AMap) {
		fn.apply(ctx, args)
		return
	}
	if (retry > 60) return
	setTimeout(() => {
		ctx.ensureMap().finally(() => waitMap(ctx, fn, args, retry + 1))
	}, 200)
}

function resolveMapContainer() {
	if (typeof document === 'undefined') return null
	const id = mapDomId || MAP_DOM_ID
	return document.getElementById(id)
		|| document.querySelector('#' + id)
		|| document.querySelector('.xj-map__canvas')
		|| null
}

export default {
	mounted() {
		setTimeout(() => {
			this.ensureMap()
		}, 50)
	},
	methods: {
		receiveEvent(newParams) {
			if (!newParams || !newParams.name) return
			const { name, args = [], city, follow } = newParams
			switch (name) {
				case 'bootstrap':
					this.handleBootstrap(args[0] || {})
					break
				case 'setLocation':
					waitMap(this, this.setInitLocation, [args[0]])
					break
				case 'search':
					waitMap(this, this.mapSearch, [city, ...args])
					break
				case 'driving':
					waitMap(this, this.mapDriving, args)
					break
				case 'markerDepDestPosition':
					waitMap(this, this.mapMarkerDepDestPosition, args)
					break
				case 'driverUpdatePosition':
					waitMap(this, this.mapDriverUpdatePosition, [...args, follow])
					break
				case 'clearDriving':
					waitMap(this, this.mapClearDriving, [])
					break
				case 'updateLocationMarker':
					waitMap(this, this.updateLocationMarker, [args[0], follow])
					break
				case 'setHeading':
					this.applyHeading(args[0])
					break
				case 'setViewMode':
					waitMap(this, this.applyViewMode, [args[0]])
					break
				case 'setFollow':
					followEnabled = !!(args[0] && args[0].follow)
					break
				case 'fitView':
					waitMap(this, this.doFitView, [args[0]])
					break
				case 'locate':
					waitMap(this, this.doLocate, [args[0]])
					break
				case 'resetNorth':
					waitMap(this, this.doResetNorth, [])
					break
				case 'setBottomPadding':
					if (args[0] && args[0].bottomPadding != null) {
						bottomPadding = args[0].bottomPadding
						this.repositionScale()
					}
					break
				case 'recenterSelf':
					waitMap(this, this.doRecenterSelf, [args[0]])
					break
				case 'drawOrderTrack':
					waitMap(this, this.mapDrawOrderTrack, [args[0]])
					break
			}
		},

		handleBootstrap(cfg) {
			desiredViewMode = cfg.viewMode === '3D' ? '3D' : '2D'
			pitch3D = cfg.pitch3D || 60
			bottomPadding = cfg.bottomPadding != null ? cfg.bottomPadding : 160
			const nextId = (cfg && cfg.mapDomId) || MAP_DOM_ID
			const expectedEl = (typeof document !== 'undefined') ? document.getElementById(nextId) : null
			if (nextId !== mapDomId || !isCurrentMapBoundToContainer(expectedEl)) {
				if (map) resetMapState()
				mapDomId = nextId
			} else {
				mapDomId = nextId
			}
			this.ensureMap()
		},

		repositionScale() {
			if (!map || !AMap) return
			try {
				if (scaleControl) {
					map.removeControl(scaleControl)
					scaleControl = null
				}
				const scaleBottom = Math.max(16, Number(bottomPadding) || 160)
				scaleControl = new AMap.Scale({
					position: {
						left: '12px',
						bottom: `${scaleBottom}px`
					}
				})
				map.addControl(scaleControl)
			} catch (e) {
				console.warn('比例尺重定位失败', e)
			}
		},

		ensureMap(retry = 0) {
			const el = resolveMapContainer()
			if (map && !isCurrentMapBoundToContainer(el)) {
				resetMapState()
			}
			if (map) {
				safeMapResize()
				return Promise.resolve(map)
			}
			if (loadPromise) return loadPromise
			if (creating) return Promise.resolve(null)

			if (!el) {
				if (retry < 40) {
					return new Promise((resolve) => {
						setTimeout(() => resolve(this.ensureMap(retry + 1)), 100)
					})
				}
				console.error('地图容器未找到: #' + mapDomId)
				return Promise.resolve(null)
			}

			creating = true
			loadPromise = AMapLoader.load({
				key: gdMapConf.key,
				version: '2.0',
				plugins: [
					'AMap.Driving',
					'AMap.PlaceSearch',
					'AMap.AutoComplete',
					'AMap.Geolocation',
					'AMap.MoveAnimation',
					'AMap.Scale'
				],
				AMapUI: {
					version: '1.1',
					plugins: ['overlay/SimpleMarker']
				},
				Loca: { version: '2.0' }
			})
				.then((Amap) => {
					AMap = Amap
					const container = resolveMapContainer()
					if (!container) {
						throw new Error('Map container div not exist')
					}
					const is3D = desiredViewMode === '3D'
					map = new AMap.Map(mapDomId || MAP_DOM_ID, {
						resizeEnable: true,
						zoom: is3D ? BUILDING_MIN_ZOOM : 13,
						viewMode: '3D',
						pitch: is3D ? pitch3D : 0,
						rotation: 0,
						pitchEnable: true,
						rotateEnable: true,
						showBuildingBlock: true,
						mapStyle: 'amap://styles/normal',
						features: is3D
							? ['bg', 'road', 'building', 'point']
							: ['bg', 'road', 'point']
					})
					if (is3D) {
						enableBuildingVisual()
					}

					try {
						// 比例尺贴在底部卡片上方（left-bottom）
						const scaleBottom = Math.max(16, Number(bottomPadding) || 160)
						scaleControl = new AMap.Scale({
							position: {
								left: '12px',
								bottom: `${scaleBottom}px`
							}
						})
						map.addControl(scaleControl)
					} catch (e) {
						console.warn('Scale 控件失败', e)
					}

					map.on('dragstart', () => {
						if (followEnabled) {
							followEnabled = false
							try {
								this.$ownerInstance.callMethod('onFollowOffByDrag')
							} catch (_) { /* ignore */ }
						}
					})
					return map
				})
				.catch((e) => {
					console.error('地图加载失败', e)
					loadPromise = null
					map = null
					return null
				})
				.finally(() => {
					creating = false
				})
			return loadPromise
		},

		applyViewMode(cfg = {}) {
			if (!map) return
			desiredViewMode = cfg.viewMode === '3D' ? '3D' : '2D'
			pitch3D = cfg.pitch3D || pitch3D || 60
			try {
				if (desiredViewMode === '3D') {
					map.setPitch(Math.max(pitch3D, 60), true)
					enableBuildingVisual()
				} else {
					map.setPitch(0, false)
					disableBuildingVisual()
				}
			} catch (e) {
				console.warn('视角切换失败', e)
			}
		},

		applyHeading(cfg = {}) {
			deviceHeading = normalizeHeading(cfg && cfg.heading)
			if (currentLocationMarker && typeof currentLocationMarker.setAngle === 'function') {
				try {
					currentLocationMarker.setAngle(deviceHeading)
				} catch (_) { /* ignore */ }
			}
		},

		upsertSelfMarker(center, accuracy, heading) {
			if (!map || !AMap || !center) return
			const angle = normalizeHeading(heading != null ? heading : deviceHeading)
			if (currentLocationMarker) {
				try {
					currentLocationMarker.setPosition(center)
					currentLocationMarker.setAngle(angle)
				} catch (_) {
					map.remove(currentLocationMarker)
					currentLocationMarker = null
				}
			}
			if (!currentLocationMarker) {
				currentLocationMarker = new AMap.Marker({
					position: center,
					content: buildHeadingArrowContent(),
					offset: new AMap.Pixel(-20, -20),
					angle,
					zIndex: 130
				})
				currentLocationMarker.setMap(map)
			}
			if (accuracy && typeof accuracy === 'number') {
				if (currentLocationCircle) {
					try {
						currentLocationCircle.setCenter(center)
						currentLocationCircle.setRadius(accuracy)
					} catch (_) {
						map.remove(currentLocationCircle)
						currentLocationCircle = null
					}
				}
				if (!currentLocationCircle) {
					currentLocationCircle = new AMap.Circle({
						center,
						radius: accuracy,
						strokeColor: BRAND,
						strokeWeight: 1,
						strokeOpacity: 0.55,
						fillColor: BRAND,
						fillOpacity: 0.15
					})
					currentLocationCircle.setMap(map)
				}
			}
		},

		doResetNorth() {
			if (!map) return
			try {
				map.setRotation(0, true)
				if (desiredViewMode === '3D') {
					map.setPitch(pitch3D, true)
				} else {
					map.setPitch(0, false)
				}
			} catch (_) { /* ignore */ }
		},

		doFitView(cfg = {}) {
			if (!map) return
			const padBottom = (cfg && cfg.bottomPadding != null) ? cfg.bottomPadding : bottomPadding
			const targets = []
			if (trackPolyline) targets.push(trackPolyline)
			if (plannedPolyline) targets.push(plannedPolyline)
			if (driverMarker) targets.push(driverMarker)
			if (currentLocationMarker) targets.push(currentLocationMarker)
			if (depMarkerRef) targets.push(depMarkerRef)
			if (destMarkerRef) targets.push(destMarkerRef)
			fitMapTo(targets.length ? targets : null, padBottom)
		},

		/**
		 * 定位按钮：
		 * - order / auto(有订单覆盖物)：缩放到起终点/轨迹区域
		 * - self / auto(无订单覆盖物)：回到我的当前位置（或司机车标）
		 */
		doLocate(cfg = {}) {
			if (!map) return
			followEnabled = false
			const mode = (cfg && cfg.mode) || 'auto'
			const padBottom = (cfg && cfg.bottomPadding != null) ? cfg.bottomPadding : bottomPadding

			const orderTargets = []
			if (trackPolyline) orderTargets.push(trackPolyline)
			if (plannedPolyline) orderTargets.push(plannedPolyline)
			if (depMarkerRef) orderTargets.push(depMarkerRef)
			if (destMarkerRef) orderTargets.push(destMarkerRef)
			const hasOrder = orderTargets.length > 0 || !!driving

			const wantOrder = mode === 'order' || (mode === 'auto' && hasOrder)
			if (wantOrder) {
				const targets = [...orderTargets]
				if (driverMarker) targets.push(driverMarker)
				if (targets.length) {
					fitMapTo(targets, padBottom)
				} else if (lastRoutePoints && lastRoutePoints.length) {
					fitMapToRoutePoints(lastRoutePoints, padBottom)
				} else {
					// Driving 路线在地图上，用全量覆盖物适配
					fitMapTo(null, padBottom)
				}
				return
			}

			if (currentLocationMarker) {
				centerMarkerInVisibleArea(currentLocationMarker, 16)
				return
			}
			if (driverMarker) {
				centerMarkerInVisibleArea(driverMarker, 16)
			}
		},

		doRecenterSelf(cfg = {}) {
			if (!map) return
			const zoom = cfg && cfg.zoom != null ? cfg.zoom : 16
			if (currentLocationMarker) {
				centerMarkerInVisibleArea(currentLocationMarker, zoom)
			}
		},

		setInitLocation(location) {
			if (!map || !AMap) {
				setTimeout(() => this.setInitLocation(location), 400)
				return
			}
			if (location && location.heading != null) {
				deviceHeading = normalizeHeading(location.heading)
			}
			const center = location && location.center
			if (!center || center.length < 2) return

			const lng = parseFloat(center[0])
			const lat = parseFloat(center[1])
			if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
			const lngLat = [lng, lat]

			if (location.locationRes) {
				this.upsertSelfMarker(lngLat, location.accuracy, location.heading)
				setTimeout(() => {
					if (currentLocationMarker) {
						centerMarkerInVisibleArea(currentLocationMarker, 16)
					}
				}, 120)
			} else {
				centerLngLatInVisibleArea(lngLat, 13)
			}
		},

		updateLocationMarker(location, follow) {
			if (!map || !AMap) {
				setTimeout(() => this.updateLocationMarker(location, follow), 400)
				return
			}
			if (!(location && location.center && location.center.length === 2)) return
			if (location.heading != null) {
				deviceHeading = normalizeHeading(location.heading)
			}
			this.upsertSelfMarker(location.center, location.accuracy, location.heading)
			const shouldFollow = follow === true || followEnabled
			if (shouldFollow && currentLocationMarker) {
				centerMarkerInVisibleArea(currentLocationMarker, null)
			}
		},

		mapSearch(city, str) {
			if (!AMap) return
			AMap.plugin(['AMap.PlaceSearch'], () => {
				const placeSearch = new AMap.PlaceSearch({
					pageSize: 5,
					pageIndex: 1,
					city: (city && (city.cityCode || city.citycode)) || '',
					citylimit: true
				})
				placeSearch.search(str, (status, result) => {
					if (result && result.info === 'OK') {
						this.$ownerInstance.callMethod('searchResult', result.poiList)
					}
				})
			})
		},

		mapClearDriving() {
			if (driving) {
				try {
					driving.clear()
				} catch (_) { /* ignore */ }
			}
			driving = null
			lastRoutePoints = null
			if (trackPolyline) {
				try {
					map.remove(trackPolyline)
				} catch (_) { /* ignore */ }
				trackPolyline = null
			}
			if (plannedPolyline) {
				try {
					map.remove(plannedPolyline)
				} catch (_) { /* ignore */ }
				plannedPolyline = null
			}
		},

		mapDrawOrderTrack(cfg = {}) {
			if (!AMap || !map) {
				setTimeout(() => this.mapDrawOrderTrack(cfg), 400)
				return
			}
			this.mapClearDriving()
			if (driverMarker) {
				try { map.remove(driverMarker) } catch (_) { /* ignore */ }
				driverMarker = null
			}
			if (depMarkerRef) {
				try { map.remove(depMarkerRef) } catch (_) { /* ignore */ }
				depMarkerRef = null
			}
			if (destMarkerRef) {
				try { map.remove(destMarkerRef) } catch (_) { /* ignore */ }
				destMarkerRef = null
			}
			if (plannedPolyline) {
				try { map.remove(plannedPolyline) } catch (_) { /* ignore */ }
				plannedPolyline = null
			}

			const trip = cfg.trip || {}
			const trackPoints = Array.isArray(cfg.trackPoints) ? cfg.trackPoints
				: (Array.isArray(cfg.points) ? cfg.points : [])

			const parseLL = (lng, lat) => {
				const a = safeParseCoord(lng)
				const b = safeParseCoord(lat)
				return (a != null && b != null) ? [a, b] : null
			}

			const fitTargets = []

			// 实际上车 / 实际下车（中途下车时下车点 ≠ 预计目的地）
			const pickUpPos = parseLL(trip.pickUpPassengerLongitude, trip.pickUpPassengerLatitude)
			const getoffPos = parseLL(trip.passengerGetoffLongitude, trip.passengerGetoffLatitude)
			const depPos = parseLL(trip.depLongitude, trip.depLatitude)
			const destPos = parseLL(trip.destLongitude, trip.destLatitude)

			const startPos = pickUpPos || depPos
			const endPos = getoffPos || destPos

			if (startPos) {
				depMarkerRef = new AMap.Marker({
					map,
					position: startPos,
					icon: new AMap.Icon({
						image: 'https://a.amap.com/jsapi/static/image/plugin/marker/start.png',
						size: new AMap.Size(25, 30),
						imageSize: new AMap.Size(25, 30)
					}),
					offset: new AMap.Pixel(-12.5, -15),
					title: '上车点'
				})
				fitTargets.push(depMarkerRef)
			}
			if (endPos) {
				destMarkerRef = new AMap.Marker({
					map,
					position: endPos,
					icon: new AMap.Icon({
						image: 'https://a.amap.com/jsapi/static/image/plugin/marker/end.png',
						size: new AMap.Size(25, 30),
						imageSize: new AMap.Size(25, 30)
					}),
					offset: new AMap.Pixel(-12.5, -15),
					title: '下车点'
				})
				fitTargets.push(destMarkerRef)
			}

			// 预计起终点虚线（便于对比中途下车）
			if (depPos && destPos) {
				plannedPolyline = new AMap.Polyline({
					path: [depPos, destPos],
					strokeColor: '#faad14',
					strokeWeight: 3,
					strokeOpacity: 0.55,
					strokeStyle: 'dashed',
					zIndex: 50
				})
				plannedPolyline.setMap(map)
				fitTargets.push(plannedPolyline)
			}

			// 蓝色实线：仅实际上报轨迹点。勿把接单/上车/下车等关键节点拼进折线，
			// 否则节点间直线会再连一次起终点，与真实轨迹围成闭合圈。
			const gpsPath = []
			trackPoints.forEach((p) => {
				if (!p) return
				const pos = Array.isArray(p) ? parseLL(p[0], p[1]) : parseLL(p.longitude, p.latitude)
				if (!pos) return
				const last = gpsPath[gpsPath.length - 1]
				if (!last || last[0] !== pos[0] || last[1] !== pos[1]) {
					gpsPath.push(pos)
				}
			})

			if (gpsPath.length >= 2) {
				trackPolyline = new AMap.Polyline({
					path: gpsPath,
					strokeColor: BRAND,
					strokeWeight: 6,
					strokeOpacity: 0.9,
					lineJoin: 'round',
					lineCap: 'round',
					zIndex: 200
				})
				trackPolyline.setMap(map)
				fitTargets.push(trackPolyline)
			}

			setTimeout(() => {
				if (fitTargets.length) {
					fitMapTo(fitTargets)
				}
			}, 80)
		},

		mapDriving(startLngLat, endLngLat, driverLon = null, driverLat = null) {
			if (!AMap || !map) {
				setTimeout(() => this.mapDriving(startLngLat, endLngLat, driverLon, driverLat), 400)
				return
			}
			const startLng = safeParseCoord(startLngLat && startLngLat[0])
			const startLat = safeParseCoord(startLngLat && startLngLat[1])
			const endLng = safeParseCoord(endLngLat && endLngLat[0])
			const endLat = safeParseCoord(endLngLat && endLngLat[1])
			if (startLng == null || startLat == null || endLng == null || endLat == null) return
			const start = [startLng, startLat]
			const end = [endLng, endLat]

			if (driving) {
				try { driving.clear() } catch (_) { /* ignore */ }
				driving = null
			}
			// 关闭默认 autoFitView，改用路线点 + 底部面板留白做 setBounds
			driving = new AMap.Driving({
				map,
				autoFitView: false
			})

			const applyRouteFit = (result) => {
				const points = collectDrivingRoutePoints(result, start, end)
				lastRoutePoints = points
				if (!fitMapToRoutePoints(points, bottomPadding)) {
					fitMapTo(null, bottomPadding)
				}
			}

			driving.search(
				new AMap.LngLat(startLng, startLat),
				new AMap.LngLat(endLng, endLat),
				(status, result) => {
					if (status !== 'complete') return
					// 路线覆盖物绘制稍有延迟，短间隔再适配一次，避免仍停在起点附近
					setTimeout(() => applyRouteFit(result), 80)
					setTimeout(() => applyRouteFit(result), 320)
				}
			)

			if (driverLon == null || driverLat == null) return
			const lon = safeParseCoord(driverLon)
			const lat = safeParseCoord(driverLat)
			if (lon == null || lat == null) return

			if (driverMarker) {
				map.remove(driverMarker)
			}
			driverMarker = new AMap.Marker({
				map,
				position: [lon, lat],
				icon: new AMap.Icon({
					image: 'https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png',
					size: new AMap.Size(15, 30),
					imageSize: new AMap.Size(15, 30)
				}),
				offset: new AMap.Pixel(-7.5, -15),
				autoRotation: true
			})
		},

		mapDriverUpdatePosition(newDriverLon, newDriverLat, follow) {
			if (!map || !AMap) {
				setTimeout(() => this.mapDriverUpdatePosition(newDriverLon, newDriverLat, follow), 400)
				return
			}
			const lon = safeParseCoord(newDriverLon)
			const lat = safeParseCoord(newDriverLat)
			if (lon == null || lat == null) return
			const pos = [lon, lat]

			if (driverMarker) {
				try {
					driverMarker.moveTo(pos, {
						duration: 5000,
						delay: 0,
						autoRotation: true
					})
				} catch (_) {
					driverMarker.setPosition(pos)
				}
			} else {
				driverMarker = new AMap.Marker({
					map,
					position: pos,
					icon: new AMap.Icon({
						image: 'https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png',
						size: new AMap.Size(15, 30),
						imageSize: new AMap.Size(15, 30)
					}),
					offset: new AMap.Pixel(-7.5, -15),
					autoRotation: true
				})
			}

			const shouldFollow = follow === true || followEnabled
			if (shouldFollow) {
				if (driverMarker) {
					centerMarkerInVisibleArea(driverMarker, 17)
				} else {
					centerAtVisible(pos, 17)
				}
			}
		},

		mapMarkerDepDestPosition(dep, dest) {
			if (!AMap || !map) {
				setTimeout(() => this.mapMarkerDepDestPosition(dep, dest), 400)
				return
			}
			if (depMarkerRef) {
				map.remove(depMarkerRef)
				depMarkerRef = null
			}
			if (destMarkerRef) {
				map.remove(destMarkerRef)
				destMarkerRef = null
			}
			depMarkerRef = new AMap.Marker({
				map,
				position: dep,
				icon: new AMap.Icon({
					image: 'https://a.amap.com/jsapi/static/image/plugin/marker/start.png',
					size: new AMap.Size(25, 30),
					imageSize: new AMap.Size(25, 30)
				}),
				offset: new AMap.Pixel(-12.5, -15)
			})
			destMarkerRef = new AMap.Marker({
				map,
				position: dest,
				icon: new AMap.Icon({
					image: 'https://a.amap.com/jsapi/static/image/plugin/marker/end.png',
					size: new AMap.Size(25, 30),
					imageSize: new AMap.Size(25, 30)
				}),
				offset: new AMap.Pixel(-12.5, -15)
			})
			setTimeout(() => fitMapTo([depMarkerRef, destMarkerRef]), 60)
		}
	}
}
</script>

<style scoped lang="scss">
.xj-map {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: #e8eef5;
}

.xj-map__canvas {
	width: 100%;
	height: 100%;
	min-height: 200px;
}

.xj-map__tools {
	position: absolute;
	right: 24rpx;
	/* custom 导航时 window-top 为 0，需避开系统状态栏 */
	top: calc(var(--status-bar-height, 20px) + 12px);
	z-index: 20;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.tool-btn {
	min-width: 88rpx;
	height: 64rpx;
	padding: 0 18rpx;
	background: rgba(255, 255, 255, 0.94);
	border-radius: 14rpx;
	box-shadow: 0 4rpx 16rpx rgba(15, 35, 52, 0.12);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	font-weight: 600;
	color: #1f2f3d;
	border: 1px solid rgba(232, 236, 240, 0.95);
}

.tool-btn.active {
	background: $uni-color-primary;
	color: #fff;
	border-color: $uni-color-primary;
}

/* 右下角定位：与左侧比例尺同高，在比例尺右方 */
.xj-map__locate {
	position: absolute;
	right: 24rpx;
	z-index: 20;
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.96);
	box-shadow: 0 4rpx 16rpx rgba(15, 35, 52, 0.14);
	border: 1px solid rgba(232, 236, 240, 0.95);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #1f2f3d;
}

.locate-crosshair {
	position: relative;
	width: 40rpx;
	height: 40rpx;
}

.locate-crosshair__ring {
	position: absolute;
	inset: 2rpx;
	border: 3rpx solid currentColor;
	border-radius: 50%;
	box-sizing: border-box;
}

.locate-crosshair__dot {
	position: absolute;
	left: 50%;
	top: 50%;
	width: 8rpx;
	height: 8rpx;
	margin: -4rpx 0 0 -4rpx;
	border-radius: 50%;
	background: currentColor;
}

.locate-crosshair__h,
.locate-crosshair__v {
	position: absolute;
	background: currentColor;
}

.locate-crosshair__h {
	left: 0;
	right: 0;
	top: 50%;
	height: 2rpx;
	margin-top: -1rpx;
}

.locate-crosshair__v {
	top: 0;
	bottom: 0;
	left: 50%;
	width: 2rpx;
	margin-left: -1rpx;
}

:deep(.amap-logo),
:deep(.amap-copyright) {
	display: none !important;
}

:deep(.amap-scalecontrol) {
	left: 12px !important;
	z-index: 15 !important;
	background: rgba(255, 255, 255, 0.9) !important;
	padding: 2px 6px !important;
	border-radius: 4px !important;
}
</style>
