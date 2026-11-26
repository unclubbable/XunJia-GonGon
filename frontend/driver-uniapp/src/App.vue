<script setup>
import { watch } from 'vue'
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import {
	initDriverWsHub,
	startDriverWs,
	stopDriverWs,
	getWsStatus,
	retryDriverWs
} from './utils/wsHub'

const $store = useStore()

onLaunch(() => {
	initDriverWsHub(() => {
		const conf = $store.state.serverConf || {}
		return {
			userId: $store.state.userInfo?.driverId,
			token: $store.state.token || '',
			wsBase: conf.ws || conf.sse || ''
		}
	})
})

watch(
	() => [$store.state.token, $store.state.userInfo?.driverId, $store.state.serverConf?.ws, $store.state.serverConf?.sse],
	([token, driverId]) => {
		if (token && driverId) {
			startDriverWs()
		} else {
			stopDriverWs()
		}
	},
	{ immediate: true }
)

onShow(() => {
	if (getWsStatus()?.status === 'failed') {
		retryDriverWs()
	}
})
</script>

<style>
/*每个页面公共css */
@import url('./static/icon/iconfont.css');

page {
	font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, -apple-system, sans-serif;
	color: #1f2f3d;
	background-color: #f5f7fa;
}

:root,
page {
	--xj-primary: #318eff;
	--xj-primary-soft: #e8f3ff;
	--xj-text: #1f2f3d;
	--xj-muted: #8c8c8c;
}
</style>
