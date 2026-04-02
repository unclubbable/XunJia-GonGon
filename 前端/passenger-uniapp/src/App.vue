<script setup>
import { onLaunch } from "@dcloudio/uni-app";
import { useStore } from "vuex";
import { ApiGetUserInfo } from "./api/user";
import { ShowToast } from "./utils";
const $store = useStore();

onLaunch(() => {
	console.log('App Launch');
  	getUserInfo();  // 没有token或者token过期都会到登录页面
});

/**
 * @Description: 获取用户信息
 * @return {*}
 */
const getUserInfo = async () => {
  const { error, result } = await ApiGetUserInfo();
  if (result !=null && !result.hasOwnProperty("code")) {  // 都会自动进入uniapp tabBar index页面
    $store.commit("setUserInfo", result);
  }
};


</script>

<style>
/*每个页面公共css */
    @import url("./static/icon/iconfont.css");
</style>
