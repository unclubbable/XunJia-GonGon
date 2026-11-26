<script setup>
import { watch } from 'vue'
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import { ApiGetUserInfo } from './api/user'
import {
	initPassengerWsHub,
	startPassengerWs,
	stopPassengerWs,
	getWsStatus,
	retryPassengerWs
} from './utils/wsHub'

const $store = useStore()

onLaunch(() => {
	console.log('App Launch')
	initPassengerWsHub(() => {
		const conf = $store.state.serverConf || {}
		return {
			userId: $store.state.userInfo?.id,
			token: $store.state.token || '',
			wsBase: conf.ws || conf.sse || ''
		}
	})
	getUserInfo()
})

const getUserInfo = async () => {
	const { result } = await ApiGetUserInfo()
	if (result != null && typeof result === 'object' && !Object.prototype.hasOwnProperty.call(result, 'code')) {
		$store.commit('setUserInfo', result)
	}
}

watch(
	() => [$store.state.token, $store.state.userInfo?.id, $store.state.serverConf?.ws, $store.state.serverConf?.sse],
	([token, userId]) => {
		if (token && userId) {
			startPassengerWs()
		} else {
			stopPassengerWs()
		}
	},
	{ immediate: true }
)

// 仅失败态回到前台时再试，避免与自动重连抢连导致 receiveTasks / 连接错误
onShow(() => {
	if (getWsStatus()?.status === 'failed') {
		retryPassengerWs()
	}
})
</script>

<style>
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
	--xj-card-radius: 28rpx;
	--xj-shadow: 0 -8rpx 32rpx rgba(15, 35, 52, 0.1);
}
</style>
