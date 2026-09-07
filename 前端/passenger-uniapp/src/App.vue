<script setup>
import { onLaunch } from "@dcloudio/uni-app";
import { useStore } from "vuex";
import { ApiGetUserInfo } from "./api/user";
const $store = useStore();

onLaunch(() => {
	console.log('App Launch');
  	getUserInfo();
});

const getUserInfo = async () => {
  const { result } = await ApiGetUserInfo();
  if (result != null && typeof result === 'object' && !Object.prototype.hasOwnProperty.call(result, 'code')) {
    $store.commit("setUserInfo", result);
  }
};
</script>

<style>
@import url("./static/icon/iconfont.css");

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
